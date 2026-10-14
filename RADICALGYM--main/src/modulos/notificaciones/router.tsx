import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'alerts', titulo: 'Notificaciones', codigo: 'NT', grupo: 'operativo', orden: 4,
  roles: ['admin', 'staff'],
  componente: lazy(() => import('./ui/NotificationCenter').then(m => ({ default: m.NotificationCenter }))),
  insignia: ctx => ctx.renewalAlerts.length,
};
