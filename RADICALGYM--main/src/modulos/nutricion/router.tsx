import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'nutrition', titulo: 'Nutrición & Medidas', codigo: 'NM', grupo: 'salud', orden: 1,
  roles: ['admin', 'nutritionist'],
  componente: lazy(() => import('./ui/NutritionMeasurementsModule').then(m => ({ default: m.NutritionMeasurementsModule }))),
};
