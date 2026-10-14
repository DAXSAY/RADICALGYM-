import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { StaffContract } from '../../nucleo/tipos/gym';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioPersonal } from './servicio';

export type NuevoContrato = Omit<StaffContract, 'id'> & { documentFile?: File };

export function accionesPersonal(c: ContextoModulo) {
  return {
    addStaffContract: ({ documentFile, ...datos }: NuevoContrato) => {
      c.actualizar('staffContracts', prev => [{ ...datos, id: idTemporal('cnt') }, ...prev]);
      c.persistir(async () => {
        const r = await servicioPersonal.crear(datos);
        if (documentFile) await servicioPersonal.subirDocumento(r.idcontrato, documentFile);
      }, `Contrato de ${datos.fullName} registrado. Su usuario y clave inicial es su DNI.`);
    },
    updateStaffContract: (id: string, datos: Partial<StaffContract> & { documentFile?: File }) => {
      const { documentFile, ...resto } = datos;
      c.actualizar('staffContracts', prev => prev.map(k => (k.id === id ? { ...k, ...resto } : k)));
      c.persistir(async () => {
        await servicioPersonal.actualizar(id, resto);
        if (documentFile) await servicioPersonal.subirDocumento(id, documentFile);
      }, 'Contrato actualizado');
    },
    renewStaffContract: (id: string, duration: '3_months' | '6_months' | '1_year', newSalary?: number) => {
      const meses = duration === '3_months' ? 3 : duration === '6_months' ? 6 : 12;
      const fin = new Date(hoyISO());
      fin.setMonth(fin.getMonth() + meses);
      c.actualizar('staffContracts', prev => prev.map(k => (k.id === id ? {
        ...k, contractType: duration, startDate: hoyISO(), endDate: fin.toISOString().slice(0, 10), status: 'active',
        monthlySalary: newSalary || k.monthlySalary,
        contractDurationLabel: duration === '3_months' ? 'Contrato 3 Meses' : duration === '6_months' ? 'Contrato 6 Meses' : 'Contrato 1 Año',
      } : k)));
      c.persistir(() => servicioPersonal.renovar(id, duration, newSalary), 'Contrato renovado');
    },
    deleteStaffContract: (id: string) => {
      c.actualizar('staffContracts', prev => prev.filter(k => k.id !== id));
      c.persistir(() => servicioPersonal.eliminar(id), 'Contrato eliminado');
    },
  };
}
