import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

export const ruta: RutaModulo = {
  id: 'appointments', titulo: 'Horarios & Citas', codigo: 'HC', grupo: 'salud', orden: 3,
  roles: ['admin', 'staff', 'nutritionist', 'physiotherapist'],
  componente: lazy(() => import('./ui/AppointmentsScheduleModule').then(m => ({ default: m.AppointmentsScheduleModule }))),
  insignia: ctx => ctx.appointments.filter(a => a.status === 'por_atender' && a.date === new Date().toISOString().slice(0, 10)).length,
};
