import { api } from '../../nucleo/api/clienteHttp';
import type { MembershipPlan } from '../../nucleo/tipos/gym';
import { Fila, num, txt } from '../../nucleo/utilidades/mapeo';

export function adaptarPlan(p: Fila): MembershipPlan {
  const meses = num(p.duracion_meses);
  return {
    id: String(p.idplan),
    name: txt(p.nombre),
    durationMonths: meses,
    durationDays: meses > 0 ? meses * 30 : num(p.duracion_dias),
    price: num(p.precio),
    description: txt(p.descripcion),
    includesTrainer: !!Number(p.incluye_entrenador),
    features: txt(p.caracteristicas).split('|').filter(Boolean),
    popular: !!Number(p.destacado),
  };
}

const haciaApi = (p: Partial<MembershipPlan>) => ({
  nombre: p.name,
  duracion_meses: p.durationMonths ?? 0,
  duracion_dias: p.durationMonths ? 0 : p.durationDays ?? 0,
  precio: p.price,
  descripcion: p.description,
  incluye_entrenador: p.includesTrainer ? 1 : 0,
  caracteristicas: p.features ?? [],
  destacado: p.popular ? 1 : 0,
});

export const servicioPlanes = {
  crear: (p: Omit<MembershipPlan, 'id'>) => api.post('/planes', haciaApi(p)),
  actualizar: (p: MembershipPlan) => api.put(`/planes/${p.id}`, haciaApi(p)),
  eliminar: (id: string) => api.delete(`/planes/${id}`),
};
