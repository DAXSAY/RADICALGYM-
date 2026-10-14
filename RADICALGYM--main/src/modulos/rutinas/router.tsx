import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'routines', titulo: 'Rutinas & Ejercicios', codigo: 'RE', grupo: 'gestion', orden: 6,
  roles: ['admin', 'trainer'],
  componente: lazy(() => import('./ui/RoutinesAndExercises').then(m => ({ default: m.RoutinesAndExercises }))),
};
