import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'physiotherapy', titulo: 'Fisioterapia', codigo: 'FT', grupo: 'salud', orden: 2,
  roles: ['admin', 'physiotherapist'],
  componente: lazy(() => import('./ui/PhysiotherapyModule').then(m => ({ default: m.PhysiotherapyModule }))),
};
