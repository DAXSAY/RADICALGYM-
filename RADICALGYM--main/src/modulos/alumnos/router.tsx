import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'members', titulo: 'Alumnos', codigo: 'AL', grupo: 'gestion', orden: 2,
  roles: ['admin', 'staff', 'trainer'],
  componente: lazy(() => import('./ui/MembersManagement').then(m => ({ default: m.MembersManagement }))),
};
