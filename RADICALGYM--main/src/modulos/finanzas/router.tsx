import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'finance', titulo: 'Finanzas & Caja', codigo: 'FN', grupo: 'operativo', orden: 3,
  roles: ['admin'],
  componente: lazy(() => import('./ui/FinanceModule').then(m => ({ default: m.FinanceModule }))),
};
