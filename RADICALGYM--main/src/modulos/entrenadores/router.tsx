import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'trainers', titulo: 'Entrenadores', codigo: 'EN', grupo: 'gestion', orden: 5,
  roles: ['admin'],
  componente: lazy(() => import('./ui/TrainersManagement').then(m => ({ default: m.TrainersManagement }))),
};
