import { api } from '../../nucleo/api/clienteHttp';
import type { PaymentMethod, SpinningAccessCode, SpinningBike, SpinningReservation, SpinningSession } from '../../nucleo/tipos/gym';
import { Fila, hora12, hora24, idNum, num, opc, txt } from '../../nucleo/utilidades/mapeo';

const ZONA: Record<string, SpinningBike['zone']> = { frontal: 'front_stage', central: 'center_mid', trasera_elevada: 'elevated_back', lateral: 'side_wing' };
const ESTADO_RESERVA: Record<string, SpinningReservation['status']> = { confirmada: 'confirmed', asistio: 'checked_in', cancelada: 'cancelled' };
const ESTADO_CODIGO: Record<string, SpinningAccessCode['status']> = { activo: 'active', canjeado: 'redeemed', vencido: 'expired' };
const fechaHora = (v?: string | null) => (v ? `${v.slice(0, 10)} ${v.slice(11, 16)}` : undefined);

export const adaptarBicicleta = (b: Fila): SpinningBike => ({
  id: String(b.numero), bikeNumber: num(b.numero), row: num(b.fila), col: num(b.columna), zone: ZONA[b.zona] ?? 'center_mid',
  model: txt(b.modelo), hasPedalStraps: !!Number(b.correas), hasSpdClipless: !!Number(b.calas_spd), notes: opc(b.notas),
});

export function adaptarSesionSpinning(s: Fila): SpinningSession {
  const ini = txt(s.hora_inicio), fin = txt(s.hora_fin);
  const minutos = (Number(fin.slice(0, 2)) * 60 + Number(fin.slice(3, 5))) - (Number(ini.slice(0, 2)) * 60 + Number(ini.slice(3, 5)));
  return {
    id: String(s.idsesion_spinning), title: txt(s.titulo), instructorId: String(s.idinstructor), instructorName: txt(s.instructor),
    instructorPhoto: opc(s.foto_instructor), date: txt(s.fecha), startTime: hora12(ini), endTime: hora12(fin), durationMinutes: minutos,
    intensity: s.intensidad, playlistGenre: txt(s.genero_musical), maxCapacity: num(s.capacidad), roomName: txt(s.sala),
    externalSessionPrice: s.precio_externo !== null && s.precio_externo !== undefined ? num(s.precio_externo) : undefined,
  };
}

export const adaptarReserva = (r: Fila): SpinningReservation => ({
  id: String(r.idreserva_spinning), sessionId: String(r.idsesion_spinning), bikeNumber: num(r.numero_bicicleta),
  memberId: r.idalumno ? String(r.idalumno) : `guest-${r.idreserva_spinning}`, memberName: txt(r.nombre), memberPhone: opc(r.telefono),
  memberEmail: opc(r.correo), status: ESTADO_RESERVA[r.estado] ?? 'confirmed', reservedAt: fechaHora(r.fecha_reserva) ?? '',
  checkInTime: fechaHora(r.hora_checkin), shoesRequirement: r.calzado, specialNotes: opc(r.notas), isExternalGuest: !!Number(r.es_externo),
  paidAmount: num(r.monto) || undefined, paymentMethod: (opc(r.metodo_pago) as PaymentMethod) ?? undefined, receiptNumber: opc(r.comprobante),
  accessCodeUsed: opc(r.codigo_usado),
});

export const adaptarCodigo = (c: Fila, sesiones: SpinningSession[]): SpinningAccessCode => ({
  id: String(c.idcodigo_spinning), code: txt(c.codigo), sessionId: c.idsesion_spinning ? String(c.idsesion_spinning) : undefined,
  sessionTitle: sesiones.find(s => s.id === String(c.idsesion_spinning))?.title, issuedToName: txt(c.nombre), issuedToPhone: opc(c.telefono),
  issuedToEmail: opc(c.correo), memberId: c.idalumno ? String(c.idalumno) : undefined, isExternal: !!Number(c.es_externo),
  amountPaid: num(c.monto), paymentMethod: c.metodo_pago, status: ESTADO_CODIGO[c.estado] ?? 'active', issuedAt: fechaHora(c.fecha_emision) ?? '',
  redeemedAt: fechaHora(c.fecha_canje), redeemedBikeNumber: c.bicicleta_canje ? num(c.bicicleta_canje) : undefined,
  issuedByTrainerName: txt(c.emitido_por), notes: opc(c.notas),
});

export const servicioSpinning = {
  crearSesion: (s: Omit<SpinningSession, 'id'>) => api.post('/spinning/sesiones', {
    titulo: s.title, idinstructor: idNum(s.instructorId), fecha: s.date, hora_inicio: hora24(s.startTime), hora_fin: hora24(s.endTime),
    intensidad: s.intensity, genero_musical: s.playlistGenre, capacidad: s.maxCapacity, sala: s.roomName, precio_externo: s.externalSessionPrice ?? '',
  }),
  eliminarSesion: (id: string) => api.delete(`/spinning/sesiones/${id}`),
  reservar: (r: { sessionId: string; bikeNumber: number; memberId: string; memberName: string; memberPhone?: string; memberEmail?: string;
    shoesRequirement?: string; specialNotes?: string; isExternalGuest?: boolean; paidAmount?: number; paymentMethod?: PaymentMethod }) =>
    api.post('/spinning/reservas', {
      idsesion_spinning: idNum(r.sessionId), numero_bicicleta: r.bikeNumber, idalumno: r.isExternalGuest ? undefined : idNum(r.memberId) || undefined,
      nombre: r.memberName, telefono: r.memberPhone, correo: r.memberEmail, calzado: r.shoesRequirement, notas: r.specialNotes,
      es_externo: r.isExternalGuest ? 1 : 0, monto: r.paidAmount ?? 0, metodo_pago: r.paymentMethod,
    }),
  cancelar: (id: string) => api.delete(`/spinning/reservas/${id}`),
  checkin: (id: string) => api.put(`/spinning/reservas/${id}/checkin`),
  mantenimiento: (numero: string, notas?: string) => api.put(`/spinning/bicicletas/${idNum(numero)}/mantenimiento`, { notas: notas ?? '' }),
  generarCodigo: (c: SpinningAccessCode) => api.post('/spinning/codigos', {
    codigo: c.code, idsesion_spinning: idNum(c.sessionId) || undefined, nombre: c.issuedToName, telefono: c.issuedToPhone, correo: c.issuedToEmail,
    idalumno: idNum(c.memberId) || undefined, es_externo: c.isExternal ? 1 : 0, monto: c.amountPaid, metodo_pago: c.paymentMethod,
    emitido_por: c.issuedByTrainerName, notas: c.notes,
  }),
  canjear: (codigo: string, bici: number, nombre?: string, telefono?: string) =>
    api.post('/spinning/codigos/canjear', { codigo, numero_bicicleta: bici, nombre, telefono }),
};
