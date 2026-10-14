import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'spinning', titulo: 'Spinning', codigo: 'SP', grupo: 'operativo', orden: 5,
  roles: ['admin', 'staff', 'trainer', 'student'],
  componente: lazy(() => import('./ui/SpinningModule').then(m => ({ default: m.SpinningModule }))),
};
