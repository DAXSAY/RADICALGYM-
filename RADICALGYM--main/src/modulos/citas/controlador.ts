import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { AppointmentBooking, AppointmentStatus } from '../../nucleo/tipos/gym';
import { idNum } from '../../nucleo/utilidades/mapeo';
import { servicioCitas } from './servicio';

export function accionesCitas(c: ContextoModulo) {
  /** Resuelve el profesional por id o por nombre (la pantalla trabaja con nombres). */
  const idProfesional = (cita: Omit<AppointmentBooking, 'id'>) => {
    const porId = idNum(cita.staffId);
    if (porId) return porId;
    const porNombre = c.d.staff.find(s => s.fullName === cita.staffName);
    if (porNombre) return idNum(porNombre.id);
    if (c.usuario.staffId && (c.usuario.role === 'nutritionist' || c.usuario.role === 'physiotherapist')) return idNum(c.usuario.staffId);
    const rol = cita.serviceType === 'nutrition' ? 'nutricionista' : 'fisioterapeuta';
    return idNum(c.d.staff.find(s => s.role === rol)?.id);
  };

  return {
    addAppointment: (datos: Omit<AppointmentBooking, 'id'>) => {
      c.actualizar('appointments', prev => [{ ...datos, id: idTemporal('apt') }, ...prev]);
      c.persistir(() => servicioCitas.crear(datos, idProfesional(datos)), `Cita agendada para ${datos.memberName}`);
    },
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => {
      c.actualizar('appointments', prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
      c.persistir(() => servicioCitas.estado(id, status));
    },
    deleteAppointment: (id: string) => {
      c.actualizar('appointments', prev => prev.filter(a => a.id !== id));
      c.persistir(() => servicioCitas.eliminar(id), 'Cita eliminada');
    },
  };
}
