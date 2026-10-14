import type { RutaModulo } from '../nucleo/router/enrutador';
import { rutas as rutasPortalAlumno } from './portal_alumno/router';
import { ruta as miEspacio } from './mi_espacio/router';
import { ruta as panel } from './panel/router';
import { ruta as alumnos } from './alumnos/router';
import { ruta as personal } from './personal/router';
import { ruta as planes } from './planes/router';
import { ruta as entrenadores } from './entrenadores/router';
import { ruta as rutinas } from './rutinas/router';
import { ruta as nutricion } from './nutricion/router';
import { ruta as fisioterapia } from './fisioterapia/router';
import { ruta as citas } from './citas/router';
import { ruta as asistencia } from './asistencia/router';
import { ruta as ventas } from './ventas/router';
import { ruta as finanzas } from './finanzas/router';
import { ruta as notificaciones } from './notificaciones/router';
import { ruta as spinning } from './spinning/router';

/** Registro de rutas: cada módulo aporta la suya desde su propio router. */
export const RUTAS: RutaModulo[] = [
  ...rutasPortalAlumno, miEspacio,
  panel, alumnos, personal, planes, entrenadores, rutinas,
  nutricion, fisioterapia, citas,
  asistencia, ventas, finanzas, notificaciones, spinning,
];
