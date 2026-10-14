import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

/** Horario, contrato, horas trabajadas, faltas y permisos del trabajador que inició sesión. */
export const ruta: RutaModulo = {
  id: 'my_space', titulo: 'Mi Horario & Contrato', codigo: 'ME', grupo: 'cuenta', orden: 1,
  roles: ['trainer', 'nutritionist', 'physiotherapist', 'staff'],
  componente: lazy(() => import('./ui/PaginaMiEspacio')),
};
