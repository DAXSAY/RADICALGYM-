import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'attendances', titulo: 'Asistencias', codigo: 'AS', grupo: 'operativo', orden: 1,
  roles: ['admin', 'staff'],
  componente: lazy(() => import('./ui/AttendanceModule').then(m => ({ default: m.AttendanceModule }))),
};
