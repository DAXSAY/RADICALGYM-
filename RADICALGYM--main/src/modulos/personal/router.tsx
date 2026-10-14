import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'staff', titulo: 'Contratos de Personal', codigo: 'CP', grupo: 'gestion', orden: 3,
  roles: ['admin'],
  componente: lazy(() => import('./ui/StaffContractsModule').then(m => ({ default: m.StaffContractsModule }))),
  insignia: ctx => ctx.staffContracts.filter(c => c.status === 'expiring_soon').length,
};
