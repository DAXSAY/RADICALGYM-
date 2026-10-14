import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'dashboard', titulo: 'Dashboard', codigo: 'DB', grupo: 'gestion', orden: 1,
  roles: ['admin', 'staff'],
  componente: lazy(() => import('./ui/DashboardOverview').then(m => ({ default: m.DashboardOverview }))),
};
