import { api } from '../api/clienteHttp';
import type { Fila } from '../utilidades/mapeo';
import { num, txt } from '../utilidades/mapeo';
import type { DatosGym } from './tipos';
import { adaptarAlumno } from '../../modulos/alumnos/servicio';
import { adaptarPlan } from '../../modulos/planes/servicio';
import { adaptarEntrenador } from '../../modulos/entrenadores/servicio';
import { adaptarEjercicio, adaptarRutina } from '../../modulos/rutinas/servicio';
import { adaptarProducto } from '../../modulos/ventas/servicio';
import { adaptarMovimiento, adaptarPlanilla } from '../../modulos/finanzas/servicio';
import { adaptarClase, adaptarNotificacion, adaptarRegla } from '../../modulos/notificaciones/servicio';
import { adaptarDieta, adaptarMedida } from '../../modulos/nutricion/servicio';
import { adaptarBicicleta, adaptarCodigo, adaptarReserva, adaptarSesionSpinning } from '../../modulos/spinning/servicio';
import { adaptarUsuario } from '../../modulos/autenticacion/servicio';
import { adaptarAsistencias } from '../../modulos/asistencia/servicio';
import { adaptarContrato } from '../../modulos/personal/servicio';
import { adaptarSesionFisio, adaptarTecnica } from '../../modulos/fisioterapia/servicio';
import { adaptarCita } from '../../modulos/citas/servicio';

/** Carga inicial: una sola petición a la API (en caché Redis) y adaptación por módulo. */
export async function cargarDatos(): Promise<DatosGym> {
  const r = await api.get<Record<string, any>>('/datos', undefined, false);
  const lista = (k: string): Fila[] => r[k] ?? [];
  const spinningSessions = lista('sesiones_spinning').map(adaptarSesionSpinning);
  return {
    members: lista('alumnos').map(adaptarAlumno),
    plans: lista('planes').map(adaptarPlan),
    trainers: lista('empleados').filter(e => e.cargo === 'entrenador').map(adaptarEntrenador),
    exercises: lista('ejercicios').map(adaptarEjercicio),
    routines: lista('rutinas').map(adaptarRutina),
    products: lista('productos').map(adaptarProducto),
    transactions: lista('movimientos').map(adaptarMovimiento),
    notificationRules: lista('reglas').map(adaptarRegla),
    notificationLogs: lista('notificaciones').map(adaptarNotificacion),
    classes: lista('clases').map(adaptarClase),
    nutritionPlans: lista('dietas').map(adaptarDieta),
    bodyAssessments: lista('medidas').map(adaptarMedida),
    spinningBikes: lista('bicicletas').map(adaptarBicicleta),
    spinningSessions,
    spinningReservations: lista('reservas_spinning').map(adaptarReserva),
    users: lista('usuarios').map(adaptarUsuario),
    spinningAccessCodes: lista('codigos_spinning').map(c => adaptarCodigo(c, spinningSessions)),
    attendances: adaptarAsistencias(r.asistencias),
    staffContracts: lista('contratos').map(adaptarContrato),
    physioRecords: lista('fisioterapia').map(adaptarSesionFisio),
    appointments: lista('citas').map(adaptarCita),
    payrollEntries: lista('planilla').map(adaptarPlanilla),
    physioTechniques: lista('tecnicas').map(adaptarTecnica),
    foodCatalog: lista('alimentos').map(a => ({ name: txt(a.nombre), kcalPer100g: num(a.kcal_100g) })),
    staff: lista('empleados').map(e => ({ id: String(e.idempleado), fullName: `${txt(e.nombres)} ${txt(e.apellidos)}`.trim(), role: txt(e.cargo) })),
  };
}
