import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { MembershipPlan } from '../../nucleo/tipos/gym';
import { servicioPlanes } from './servicio';

export function accionesPlanes(c: ContextoModulo) {
  return {
    addPlan: (datos: Omit<MembershipPlan, 'id'>) => {
      c.actualizar('plans', prev => [...prev, { ...datos, id: idTemporal('plan') }]);
      c.persistir(() => servicioPlanes.crear(datos), `Plan ${datos.name} creado`);
    },
    updatePlan: (id: string, datos: Partial<MembershipPlan>) => {
      const actual = c.d.plans.find(p => p.id === id);
      if (!actual) return;
      const nuevo = { ...actual, ...datos };
      c.actualizar('plans', prev => prev.map(p => (p.id === id ? nuevo : p)));
      c.persistir(() => servicioPlanes.actualizar(nuevo), 'Plan actualizado');
    },
    deletePlan: (id: string) => {
      c.actualizar('plans', prev => prev.filter(p => p.id !== id));
      c.persistir(() => servicioPlanes.eliminar(id), 'Plan retirado');
    },
  };
}
