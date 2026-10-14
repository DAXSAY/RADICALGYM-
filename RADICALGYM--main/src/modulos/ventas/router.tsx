import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'store', titulo: 'Ventas / POS', codigo: 'SL', grupo: 'operativo', orden: 2,
  roles: ['admin', 'staff'],
  componente: lazy(() => import('./ui/StorePOS').then(m => ({ default: m.StorePOS }))),
  insignia: ctx => ctx.lowStockProducts.length,
};
