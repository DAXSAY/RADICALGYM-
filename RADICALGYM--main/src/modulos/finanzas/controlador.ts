import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { PaymentMethod, StaffPayrollEntry, Transaction } from '../../nucleo/tipos/gym';
import { hoyISO, idNum } from '../../nucleo/utilidades/mapeo';
import { servicioFinanzas } from './servicio';

export type NuevoMovimiento = Omit<Transaction, 'id' | 'receiptNumber'> & { attachmentFile?: File };

export function accionesFinanzas(c: ContextoModulo) {
  const addTransaction = ({ attachmentFile, ...datos }: NuevoMovimiento) => {
    c.actualizar('transactions', prev => [{ ...datos, id: idTemporal('tx'), receiptNumber: datos.type === 'income' ? 'REC-…' : 'EGR-…' }, ...prev]);
    // staffId llega como id de contrato desde la pantalla de finanzas
    const contrato = datos.staffId ? c.d.staffContracts.find(k => k.id === datos.staffId) : undefined;
    const idempleado = idNum(contrato?.staffId ?? datos.staffId) || undefined;
    c.persistir(async () => {
      const mov = await servicioFinanzas.crearMovimiento(datos, idempleado);
      if (attachmentFile) await servicioFinanzas.subirAdjunto(mov.idmovimiento, attachmentFile);
    }, datos.type === 'income' ? 'Ingreso registrado' : 'Egreso registrado');
  };

  const deleteTransaction = (id: string) => {
    c.actualizar('transactions', prev => prev.filter(t => t.id !== id));
    c.persistir(() => servicioFinanzas.eliminarMovimiento(id), 'Movimiento eliminado');
  };

  const payStaffSalary = (payrollId: string, paymentMethod: PaymentMethod, receiptNumber?: string) => {
    const item = c.d.payrollEntries.find(p => p.id === payrollId);
    if (!item) return;
    const hoy = hoyISO();
    c.actualizar('payrollEntries', prev => prev.map(p => (p.id === payrollId ? { ...p, status: 'paid', paymentDate: hoy, paymentMethod, receiptNumber } : p)));
    c.actualizar('transactions', prev => [{
      id: idTemporal('tx'), type: 'expense', category: 'salary', amount: item.netPay, date: hoy, paymentMethod,
      description: `Pago de Sueldo/Nómina: ${item.staffName} (${item.department} - ${item.month})`, receiptNumber: receiptNumber ?? 'REC-RH-…',
    }, ...prev]);
    c.actualizar('staffContracts', prev => prev.map(k => (k.id === item.contractId ? { ...k, paymentStatus: 'al_dia' as const, lastPaymentDate: hoy } : k)));
    c.persistir(() => servicioFinanzas.pagarPlanilla(payrollId, paymentMethod, receiptNumber), `Sueldo de ${item.staffName} pagado`);
  };

  const addPayrollEntry = (datos: Omit<StaffPayrollEntry, 'id'>) => {
    c.actualizar('payrollEntries', prev => [{ ...datos, id: idTemporal('pyr') }, ...prev]);
    c.persistir(() => servicioFinanzas.crearPlanilla(datos, hoyISO().slice(0, 7)));
  };

  return { addTransaction, deleteTransaction, payStaffSalary, addPayrollEntry };
}
