import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'memberships', titulo: 'Planes & Tarifas', codigo: 'MB', grupo: 'gestion', orden: 4,
  roles: ['admin', 'staff'],
  componente: lazy(() => import('./ui/MembershipsPlans').then(m => ({ default: m.MembershipsPlans }))),
};
