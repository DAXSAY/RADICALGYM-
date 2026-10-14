import { api } from '../../nucleo/api/clienteHttp';
import type { PaymentMethod, StaffPayrollEntry, Transaction } from '../../nucleo/tipos/gym';
import { CATEGORIA_DESDE_API, CATEGORIA_HACIA_API, Fila, idNum, metodoPago, num, opc, txt } from '../../nucleo/utilidades/mapeo';

const DEPARTAMENTO: Record<string, string> = {
  entrenador: 'Entrenamiento', fisioterapeuta: 'Fisioterapia', nutricionista: 'Nutrición', recepcion: 'Recepción',
  administrador: 'Operaciones', mantenimiento: 'Operaciones',
};
const ROL_PERSONAL: Record<string, StaffPayrollEntry['role']> = {
  entrenador: 'trainer', fisioterapeuta: 'physiotherapist', nutricionista: 'nutritionist', recepcion: 'receptionist',
  mantenimiento: 'maintenance', administrador: 'manager',
};
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const nombrePeriodo = (periodo: string) => `${MESES[Number(periodo.slice(5, 7)) - 1]} ${periodo.slice(0, 4)}`;

export function adaptarMovimiento(m: Fila): Transaction {
  return {
    id: String(m.idmovimiento),
    type: m.tipo === 'ingreso' ? 'income' : 'expense',
    category: CATEGORIA_DESDE_API[m.categoria] ?? 'other',
    amount: num(m.monto),
    date: txt(m.fecha).slice(0, 10),
    paymentMethod: metodoPago(m.metodo_pago),
    description: txt(m.descripcion),
    relatedMemberId: m.idalumno ? String(m.idalumno) : undefined,
    relatedMemberName: opc(m.nombre_relacionado),
    items: (m.items ?? []).map((i: Fila) => ({
      productId: String(i.idproducto), productName: txt(i.nombre), quantity: num(i.cantidad), unitPrice: num(i.precio_unitario), total: num(i.subtotal),
    })),
    receiptNumber: txt(m.comprobante),
    staffId: m.idempleado ? String(m.idempleado) : undefined,
    staffName: m.idempleado ? opc(m.nombre_relacionado) : undefined,
    hasTardinessDiscount: m.descuento_tardanza !== null && m.descuento_tardanza !== undefined && num(m.descuento_tardanza) > 0,
    tardinessDiscountAmount: m.descuento_tardanza ? num(m.descuento_tardanza) : undefined,
    equipmentName: opc(m.equipo),
    breakdownDescription: opc(m.detalle_averia),
    attachmentUrl: opc(m.adjunto_url),
    attachmentName: opc(m.adjunto_nombre),
    expenseComment: opc(m.comentario),
  };
}

export function adaptarPlanilla(p: Fila): StaffPayrollEntry {
  return {
    id: String(p.idplanilla),
    contractId: String(p.idcontrato),
    staffName: txt(p.empleado),
    role: ROL_PERSONAL[p.cargo] ?? 'manager',
    department: DEPARTAMENTO[p.cargo] ?? 'Operaciones',
    month: nombrePeriodo(txt(p.periodo)),
    baseSalary: num(p.sueldo_base),
    workedHours: num(p.horas_trabajadas),
    hourlyRate: num(p.tarifa_hora),
    bonusAmount: num(p.bonificacion),
    deductions: num(p.descuentos),
    netPay: num(p.neto),
    status: p.estado === 'pagado' ? 'paid' : 'pending',
    paymentDate: opc(p.fecha_pago),
    paymentMethod: (opc(p.metodo_pago) as PaymentMethod) ?? undefined,
    receiptNumber: opc(p.comprobante),
  };
}

export const servicioFinanzas = {
  crearMovimiento: (t: Omit<Transaction, 'id' | 'receiptNumber'>, idempleado?: number) =>
    api.post<{ idmovimiento: number }>('/caja/movimientos', {
      tipo: t.type === 'income' ? 'ingreso' : 'egreso',
      categoria: CATEGORIA_HACIA_API[t.category] ?? 'otros',
      monto: t.amount,
      descripcion: t.description,
      metodo_pago: t.paymentMethod,
      fecha: t.date,
      idalumno: idNum(t.relatedMemberId) || undefined,
      nombre_relacionado: t.relatedMemberName ?? t.staffName,
      idempleado,
      descuento_tardanza: t.hasTardinessDiscount ? t.tardinessDiscountAmount : undefined,
      equipo: t.equipmentName,
      detalle_averia: t.breakdownDescription,
      comentario: t.expenseComment,
    }),
  /** Comprobante adjunto: uploads/movimientos_caja/{idmovimiento}_movimientos_caja_adjunto.ext */
  subirAdjunto: (idmovimiento: number, archivo: File) => api.subir(`/caja/movimientos/${idmovimiento}/adjunto`, archivo),
  eliminarMovimiento: (id: string) => api.delete(`/caja/movimientos/${id}`),
  pagarPlanilla: (id: string, metodo: PaymentMethod, comprobante?: string) => api.post(`/planilla/${id}/pagar`, { metodo_pago: metodo, comprobante }),
  crearPlanilla: (e: Omit<StaffPayrollEntry, 'id'>, periodo: string) =>
    api.post('/planilla', {
      idcontrato: idNum(e.contractId), periodo, sueldo_base: e.baseSalary, horas_trabajadas: e.workedHours,
      tarifa_hora: e.hourlyRate, bonificacion: e.bonusAmount, descuentos: e.deductions,
    }),
};
