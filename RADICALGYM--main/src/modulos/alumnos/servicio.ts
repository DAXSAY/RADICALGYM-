import { api } from '../../nucleo/api/clienteHttp';
import type { Member, PaymentMethod } from '../../nucleo/tipos/gym';
import { estadoMembresia, Fila, hoyISO, idNum, num, objetivoDesdeApi, objetivoHaciaApi, opc, separarNombre, txt } from '../../nucleo/utilidades/mapeo';

/** Fila de la API (alumno + matrícula vigente) -> Member del frontend */
export function adaptarAlumno(a: Fila): Member {
  const fin = opc(a.fecha_fin) ?? opc(a.fecha_registro) ?? hoyISO();
  return {
    id: String(a.idalumno),
    dni: txt(a.dni),
    fullName: `${txt(a.nombres)} ${txt(a.apellidos)}`.trim(),
    email: txt(a.correo),
    phone: txt(a.telefono),
    photoUrl: opc(a.foto_url),
    gender: a.sexo === 'O' ? 'Otro' : a.sexo,
    birthDate: txt(a.fecha_nacimiento),
    emergencyContact: { name: txt(a.contacto_emergencia), phone: txt(a.telefono_emergencia), relationship: txt(a.parentesco_emergencia) },
    medicalNotes: opc(a.restricciones_medicas),
    objective: objetivoDesdeApi(a.objetivo),
    planId: a.idplan ? String(a.idplan) : '',
    planName: txt(a.plan) || 'Sin plan',
    membershipStartDate: opc(a.fecha_inicio) ?? txt(a.fecha_registro),
    membershipEndDate: fin,
    status: a.estado_matricula === 'congelada' ? 'frozen' : a.idmatricula ? estadoMembresia(fin) : 'expired',
    assignedTrainerId: a.identrenador ? String(a.identrenador) : undefined,
    assignedRoutineId: a.idrutina ? String(a.idrutina) : undefined,
    registrationDate: txt(a.fecha_registro),
    notes: opc(a.notas),
    lastPaymentAmount: a.monto !== null && a.monto !== undefined ? num(a.monto) : undefined,
    lastPaymentDate: opc(a.fecha_pago),
  };
}

function haciaApi(m: Partial<Member>) {
  const d: Record<string, unknown> = {};
  if (m.dni !== undefined) d.dni = m.dni;
  if (m.fullName !== undefined) Object.assign(d, separarNombre(m.fullName));
  if (m.email !== undefined) d.correo = m.email;
  if (m.phone !== undefined) d.telefono = m.phone;
  if (m.gender !== undefined) d.sexo = m.gender === 'Otro' ? 'O' : m.gender;
  if (m.birthDate !== undefined) d.fecha_nacimiento = m.birthDate;
  if (m.emergencyContact) {
    d.contacto_emergencia = m.emergencyContact.name;
    d.telefono_emergencia = m.emergencyContact.phone;
    d.parentesco_emergencia = m.emergencyContact.relationship;
  }
  if (m.medicalNotes !== undefined) d.restricciones_medicas = m.medicalNotes ?? '';
  if (m.objective !== undefined) d.objetivo = objetivoHaciaApi(m.objective);
  if (m.notes !== undefined) d.notas = m.notes ?? '';
  if (m.assignedRoutineId !== undefined) d.idrutina = idNum(m.assignedRoutineId) || '';
  if (m.photoUrl && /^https?:/.test(m.photoUrl)) d.foto = m.photoUrl;
  return d;
}

export const servicioAlumnos = {
  crear: (m: Omit<Member, 'id' | 'registrationDate' | 'status'>) =>
    api.post<{ idalumno: number }>('/alumnos', {
      ...haciaApi(m),
      idplan: idNum(m.planId) || undefined,
      identrenador: idNum(m.assignedTrainerId) || undefined,
      fecha_inicio: m.membershipStartDate,
      monto: m.lastPaymentAmount ?? 0,
      metodo_pago: 'efectivo',
    }),
  actualizar: (id: string, m: Partial<Member>) => api.put(`/alumnos/${id}`, haciaApi(m)),
  eliminar: (id: string) => api.delete(`/alumnos/${id}`),
  renovar: (id: string, planId: string, metodo: PaymentMethod, descuento = 0) =>
    api.post('/matriculas', { idalumno: idNum(id), idplan: idNum(planId), metodo_pago: metodo, descuento }),
  asignarEntrenador: (id: string, trainerId: string) => api.put(`/alumnos/${id}/entrenador`, { identrenador: idNum(trainerId) }),
  asignarRutina: (id: string, routineId: string) => api.put(`/alumnos/${id}`, { idrutina: idNum(routineId) || '' }),
  subirFoto: (id: string, archivo: File) => api.subir<{ foto_url: string }>(`/alumnos/${id}/foto`, archivo),
};
