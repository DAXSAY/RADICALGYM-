import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { Member, PaymentMethod, Transaction } from '../../nucleo/tipos/gym';
import { estadoMembresia, hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioAlumnos } from './servicio';

/** Acciones del módulo Alumnos: actualizan la pantalla al instante y guardan en la API. */
export function accionesAlumnos(c: ContextoModulo) {
  const addMember = (datos: Omit<Member, 'id' | 'registrationDate' | 'status'>) => {
    const nuevo: Member = { ...datos, id: idTemporal('mem'), registrationDate: hoyISO(), status: estadoMembresia(datos.membershipEndDate) };
    c.actualizar('members', prev => [nuevo, ...prev]);
    c.persistir(() => servicioAlumnos.crear(datos), `Alumno ${datos.fullName} registrado. Su usuario y clave inicial es su DNI.`);
  };

  const updateMember = (id: string, datos: Partial<Member>) => {
    c.actualizar('members', prev => prev.map(m => (m.id === id ? { ...m, ...datos } : m)));
    c.persistir(() => servicioAlumnos.actualizar(id, datos));
  };

  const deleteMember = (id: string) => {
    c.actualizar('members', prev => prev.filter(m => m.id !== id));
    c.persistir(() => servicioAlumnos.eliminar(id), 'Alumno dado de baja');
  };

  const renewMembership = (memberId: string, planId: string, paymentMethod: PaymentMethod, discount = 0) => {
    const member = c.d.members.find(m => m.id === memberId);
    const plan = c.d.plans.find(p => p.id === planId);
    if (!member || !plan) return;
    const hoy = hoyISO();
    const base = member.membershipEndDate > hoy ? new Date(member.membershipEndDate) : new Date(hoy);
    const fin = new Date(base);
    fin.setDate(fin.getDate() + plan.durationDays);
    const monto = Math.max(0, plan.price - discount);
    c.actualizar('members', prev => prev.map(m => (m.id === memberId ? {
      ...m, planId: plan.id, planName: plan.name, membershipStartDate: hoy, membershipEndDate: fin.toISOString().slice(0, 10),
      status: 'active', lastPaymentAmount: monto, lastPaymentDate: hoy,
    } : m)));
    const tx: Transaction = {
      id: idTemporal('tx'), type: 'income', category: 'membership', amount: monto, date: hoy, paymentMethod,
      description: `Renovación Membresía ${plan.name} - ${member.fullName}`, relatedMemberId: memberId,
      relatedMemberName: member.fullName, receiptNumber: 'REC-…',
    };
    c.actualizar('transactions', prev => [tx, ...prev]);
    c.persistir(() => servicioAlumnos.renovar(memberId, planId, paymentMethod, discount), `Membresía de ${member.fullName} renovada`);
  };

  const assignTrainerToMember = (memberId: string, trainerId: string) => {
    c.actualizar('members', prev => prev.map(m => (m.id === memberId ? { ...m, assignedTrainerId: trainerId } : m)));
    c.persistir(() => servicioAlumnos.asignarEntrenador(memberId, trainerId), 'Entrenador asignado');
  };

  const assignRoutineToMember = (memberId: string, routineId: string) => {
    const member = c.d.members.find(m => m.id === memberId);
    c.actualizar('members', prev => prev.map(m => (m.id === memberId ? { ...m, assignedRoutineId: routineId } : m)));
    if (member) {
      c.actualizar('routines', prev => prev.map(r => (r.id === routineId ? { ...r, targetStudentId: member.id, targetStudentName: member.fullName } : r)));
    }
    c.persistir(() => servicioAlumnos.asignarRutina(memberId, routineId), 'Rutina asignada');
  };

  return { addMember, updateMember, deleteMember, renewMembership, assignTrainerToMember, assignRoutineToMember };
}
