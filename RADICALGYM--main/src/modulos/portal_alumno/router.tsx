import { lazy } from 'react';
import type { RutaModulo } from '../../nucleo/router/enrutador';

const paginas = () => import('./ui/PaginasPortal');

/** Vistas del alumno: plan matriculado, dieta, reportes de nutrición y fisioterapia. */
export const rutas: RutaModulo[] = [
  { id: 'my_plan', titulo: 'Mi Plan Matriculado', codigo: 'MP', grupo: 'cuenta', orden: 1, roles: ['student'],
    componente: lazy(() => paginas().then(m => ({ default: m.PaginaMiPlan }))) },
  { id: 'my_diet', titulo: 'Mi Dieta', codigo: 'DI', grupo: 'cuenta', orden: 2, roles: ['student'],
    componente: lazy(() => paginas().then(m => ({ default: m.PaginaMiDieta }))) },
  { id: 'my_reports', titulo: 'Reportes de Nutrición', codigo: 'RN', grupo: 'cuenta', orden: 3, roles: ['student'],
    componente: lazy(() => paginas().then(m => ({ default: m.PaginaMisReportes }))) },
  { id: 'my_physio', titulo: 'Mi Fisioterapia', codigo: 'MF', grupo: 'cuenta', orden: 4, roles: ['student'],
    componente: lazy(() => paginas().then(m => ({ default: m.PaginaMiFisioterapia }))) },
];
