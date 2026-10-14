import { api } from '../../nucleo/api/clienteHttp';
import type { AppointmentBooking, AppointmentStatus } from '../../nucleo/tipos/gym';
import { Fila, hora12, hora24, idNum, opc, txt } from '../../nucleo/utilidades/mapeo';

const ESTADO: Record<string, AppointmentStatus> = {
  programada: 'por_atender', confirmada: 'confirmed', atendiendo: 'atendiendo', atendida: 'atendido',
  pospuesta: 'pospuesto', falta: 'falta', cancelada: 'cancelled',
};
const ESTADO_API: Record<string, string> = {
  por_atender: 'programada', scheduled: 'programada', confirmed: 'confirmada', atendiendo: 'atendiendo', atendido: 'atendida',
  completed: 'atendida', pospuesto: 'pospuesta', falta: 'falta', cancelled: 'cancelada',
};
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function adaptarCita(c: Fila): AppointmentBooking {
  const inicio = txt(c.hora_inicio);
  const fin = txt(c.hora_fin);
  const minutos = (Number(fin.slice(0, 2)) * 60 + Number(fin.slice(3, 5))) - (Number(inicio.slice(0, 2)) * 60 + Number(inicio.slice(3, 5)));
  return {
    id: String(c.idcita),
    serviceType: c.servicio === 'nutricion' ? 'nutrition' : 'physiotherapy',
    memberId: String(c.idalumno),
    memberName: txt(c.alumno),
    memberDni: txt(c.dni),
    memberPhone: opc(c.telefono),
    staffId: String(c.idempleado),
    staffName: txt(c.profesional),
    date: txt(c.fecha),
    timeSlot: `${hora12(inicio)} - ${hora12(fin)}`,
    durationMinutes: minutos > 0 ? minutos : 45,
    status: ESTADO[c.estado] ?? 'por_atender',
    reason: txt(c.motivo),
    roomOrDesk: txt(c.consultorio) || (c.servicio === 'nutricion' ? 'Consultorio de Nutrición' : 'Consultorio de Fisioterapia'),
    notes: opc(c.notas),
    reminderSent: !!Number(c.recordatorio_enviado),
    dayOfWeek: DIAS[new Date(`${txt(c.fecha)}T12:00:00`).getDay()],
  };
}

export const servicioCitas = {
  crear: (a: Omit<AppointmentBooking, 'id'>, idempleado: number) => {
    const [inicio, fin] = a.timeSlot.split('-').map(s => hora24(s));
    return api.post('/citas', {
      servicio: a.serviceType === 'nutrition' ? 'nutricion' : 'fisioterapia',
      idalumno: idNum(a.memberId),
      idempleado,
      fecha: a.date,
      hora_inicio: inicio,
      hora_fin: fin && fin > inicio ? fin : undefined,
      duracion: a.durationMinutes,
      motivo: a.reason,
      consultorio: a.roomOrDesk,
      notas: a.notes,
      estado: ESTADO_API[a.status],
    });
  },
  estado: (id: string, estado: string) => api.put(`/citas/${id}/estado`, { estado: ESTADO_API[estado] ?? 'programada' }),
  eliminar: (id: string) => api.delete(`/citas/${id}`),
};
