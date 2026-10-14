import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { PaymentMethod, SpinningAccessCode, SpinningReservation, SpinningSession } from '../../nucleo/tipos/gym';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioSpinning } from './servicio';

type DatosReserva = {
  sessionId: string; bikeNumber: number; memberId: string; memberName: string; memberPhone?: string; memberEmail?: string;
  shoesRequirement?: 'calas_spd' | 'zapatilla_comun'; specialNotes?: string; isExternalGuest?: boolean; paidAmount?: number; paymentMethod?: PaymentMethod;
};

const ahora = () => `${hoyISO()} ${new Date().toTimeString().slice(0, 5)}`;

/**
 * Spinning: las validaciones se hacen primero en pantalla (respuesta inmediata, como en el original)
 * y luego en la base de datos mediante triggers al guardar.
 */
export function accionesSpinning(c: ContextoModulo) {
  const ocupada = (sesion: string, bici: number) =>
    c.d.spinningReservations.find(r => r.sessionId === sesion && r.bikeNumber === bici && r.status !== 'cancelled');

  const reserveSpinningBike = (data: DatosReserva) => {
    const existente = ocupada(data.sessionId, data.bikeNumber);
    if (existente) return { success: false, message: `La bicicleta #${data.bikeNumber} ya se encuentra reservada por ${existente.memberName}.` };
    if (!data.isExternalGuest) {
      const ya = c.d.spinningReservations.find(r => r.sessionId === data.sessionId && r.memberId === data.memberId && r.status !== 'cancelled');
      if (ya) return { success: false, message: `${data.memberName} ya tiene asignada la bicicleta #${ya.bikeNumber} en esta sesión.` };
    }
    const bici = c.d.spinningBikes.find(b => b.bikeNumber === data.bikeNumber);
    if (bici?.notes) return { success: false, message: `La bicicleta #${data.bikeNumber} está en mantenimiento.` };
    const reserva: SpinningReservation = {
      id: idTemporal('res'), sessionId: data.sessionId, bikeNumber: data.bikeNumber, memberId: data.memberId, memberName: data.memberName,
      memberPhone: data.memberPhone, memberEmail: data.memberEmail, status: 'confirmed', reservedAt: ahora(),
      shoesRequirement: data.shoesRequirement || 'zapatilla_comun', specialNotes: data.specialNotes, isExternalGuest: data.isExternalGuest,
      paidAmount: data.paidAmount, paymentMethod: data.paymentMethod, receiptNumber: data.paidAmount ? 'REC-SPIN-…' : undefined,
    };
    c.actualizar('spinningReservations', prev => [...prev, reserva]);
    c.persistir(() => servicioSpinning.reservar(data));
    return {
      success: true,
      message: data.isExternalGuest
        ? `¡Pago y reserva exitosa para ${data.memberName}! Bici #${data.bikeNumber} asignada.`
        : `¡Bicicleta #${data.bikeNumber} reservada exitosamente para ${data.memberName}!`,
      reservation: reserva,
    };
  };

  const generateSpinningAccessCode = (data: Omit<SpinningAccessCode, 'id' | 'code' | 'status' | 'issuedAt'>): SpinningAccessCode => {
    let codigo: string;
    do {
      codigo = `${data.paymentMethod === 'yape_plin' ? 'YAPE' : 'SPIN'}-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (c.d.spinningAccessCodes.some(x => x.code === codigo));
    const nuevo: SpinningAccessCode = { ...data, id: idTemporal('code'), code: codigo, status: 'active', issuedAt: ahora() };
    c.actualizar('spinningAccessCodes', prev => [nuevo, ...prev]);
    c.persistir(() => servicioSpinning.generarCodigo(nuevo), `Código ${codigo} generado`);
    return nuevo;
  };

  const redeemSpinningAccessCode = (codeStr: string, bikeNumber: number, nombre?: string, telefono?: string) => {
    const limpio = codeStr.trim().toUpperCase();
    const codigo = c.d.spinningAccessCodes.find(x => x.code.toUpperCase() === limpio);
    if (!codigo) return { success: false, message: `El código "${limpio}" no existe o es inválido. Verifica con tu entrenador o recepción.` };
    if (codigo.status === 'redeemed') return { success: false, message: `El código "${limpio}" ya fue canjeado el ${codigo.redeemedAt || 'anteriormente'}.` };
    if (codigo.status === 'expired') return { success: false, message: `El código "${limpio}" ha expirado.` };
    const sesion = codigo.sessionId || c.d.spinningSessions.find(s => s.date >= hoyISO())?.id;
    if (!sesion) return { success: false, message: 'No hay sesiones de spinning disponibles actualmente para canjear este pase.' };
    if (ocupada(sesion, bikeNumber)) return { success: false, message: `La bicicleta #${bikeNumber} ya está reservada para esta sesión. Selecciona otro sitio en el croquis.` };
    const ocupante = nombre || codigo.issuedToName;
    const reserva: SpinningReservation = {
      id: idTemporal('res'), sessionId: sesion, bikeNumber, memberId: codigo.memberId || `guest-${Date.now()}`, memberName: ocupante,
      memberPhone: telefono || codigo.issuedToPhone, memberEmail: codigo.issuedToEmail, status: 'confirmed', reservedAt: ahora(),
      shoesRequirement: 'zapatilla_comun', isExternalGuest: codigo.isExternal, paidAmount: codigo.amountPaid, paymentMethod: codigo.paymentMethod,
      receiptNumber: `REC-${limpio}`, accessCodeUsed: limpio, specialNotes: `Canjeado vía código ${limpio}. Verificado por ${codigo.issuedByTrainerName}.`,
    };
    c.actualizar('spinningAccessCodes', prev => prev.map(x => (x.id === codigo.id ? { ...x, status: 'redeemed', redeemedAt: ahora(), redeemedBikeNumber: bikeNumber } : x)));
    c.actualizar('spinningReservations', prev => [...prev, reserva]);
    c.persistir(() => servicioSpinning.canjear(limpio, bikeNumber, nombre, telefono));
    return { success: true, message: `¡Código ${limpio} canjeado con éxito! Bicicleta #${bikeNumber} reservada para ${ocupante}.`, reservation: reserva };
  };

  return {
    addSpinningSession: (datos: Omit<SpinningSession, 'id'>) => {
      c.actualizar('spinningSessions', prev => [...prev, { ...datos, id: idTemporal('spin') }]);
      c.persistir(() => servicioSpinning.crearSesion(datos), `Sesión "${datos.title}" creada`);
    },
    deleteSpinningSession: (id: string) => {
      c.actualizar('spinningSessions', prev => prev.filter(s => s.id !== id));
      c.actualizar('spinningReservations', prev => prev.filter(r => r.sessionId !== id));
      c.persistir(() => servicioSpinning.eliminarSesion(id), 'Sesión eliminada');
    },
    reserveSpinningBike,
    cancelSpinningReservation: (id: string) => {
      c.actualizar('spinningReservations', prev => prev.filter(r => r.id !== id));
      c.persistir(() => servicioSpinning.cancelar(id), 'Reserva cancelada');
    },
    checkInSpinningReservation: (id: string) => {
      c.actualizar('spinningReservations', prev => prev.map(r => (r.id === id ? { ...r, status: 'checked_in', checkInTime: ahora() } : r)));
      c.persistir(() => servicioSpinning.checkin(id));
    },
    toggleBikeMaintenance: (bikeId: string, notes?: string) => {
      const bici = c.d.spinningBikes.find(b => b.id === bikeId);
      const nuevaNota = notes !== undefined ? notes : bici?.notes ? undefined : 'En revisión técnica / ajuste de resistencia';
      c.actualizar('spinningBikes', prev => prev.map(b => (b.id === bikeId ? { ...b, notes: nuevaNota } : b)));
      c.persistir(() => servicioSpinning.mantenimiento(bikeId, nuevaNota));
    },
    generateSpinningAccessCode,
    redeemSpinningAccessCode,
  };
}
