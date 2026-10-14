import type {
  AppointmentBooking, AppUser, AttendanceRecord, BodyAssessment, Exercise, GymClassNotice, Member, MembershipPlan,
  NotificationLog, NotificationRule, NutritionPlan, PhysioTechnique, PhysiotherapySessionRecord, Product, Routine,
  SpinningAccessCode, SpinningBike, SpinningReservation, SpinningSession, StaffContract, StaffPayrollEntry, Trainer, Transaction,
} from '../tipos/gym';

/** Todas las colecciones que consumen las pantallas, ya adaptadas desde la API. */
export interface DatosGym {
  members: Member[];
  plans: MembershipPlan[];
  trainers: Trainer[];
  exercises: Exercise[];
  routines: Routine[];
  products: Product[];
  transactions: Transaction[];
  notificationRules: NotificationRule[];
  notificationLogs: NotificationLog[];
  classes: GymClassNotice[];
  nutritionPlans: NutritionPlan[];
  bodyAssessments: BodyAssessment[];
  spinningBikes: SpinningBike[];
  spinningSessions: SpinningSession[];
  spinningReservations: SpinningReservation[];
  users: AppUser[];
  spinningAccessCodes: SpinningAccessCode[];
  attendances: AttendanceRecord[];
  staffContracts: StaffContract[];
  physioRecords: PhysiotherapySessionRecord[];
  appointments: AppointmentBooking[];
  payrollEntries: StaffPayrollEntry[];
  physioTechniques: PhysioTechnique[];
  foodCatalog: { name: string; kcalPer100g: number }[];
  /** Personal activo (para resolver nombres e ids de nutricionistas, fisioterapeutas, instructores) */
  staff: { id: string; fullName: string; role: string }[];
}

export const DATOS_VACIOS: DatosGym = {
  members: [], plans: [], trainers: [], exercises: [], routines: [], products: [], transactions: [], notificationRules: [],
  notificationLogs: [], classes: [], nutritionPlans: [], bodyAssessments: [], spinningBikes: [], spinningSessions: [],
  spinningReservations: [], users: [], spinningAccessCodes: [], attendances: [], staffContracts: [], physioRecords: [],
  appointments: [], payrollEntries: [], physioTechniques: [], foodCatalog: [], staff: [],
};

/**
 * Lo que recibe el controlador de cada módulo: el estado actual, un actualizador por colección
 * y `persistir`, que envía el cambio a la API y luego recarga los datos reales del servidor.
 */
export interface ContextoModulo {
  d: DatosGym;
  usuario: AppUser;
  actualizar: <K extends keyof DatosGym>(clave: K, fn: (previo: DatosGym[K]) => DatosGym[K]) => void;
  persistir: (operacion: () => Promise<unknown>, exito?: string) => void;
  avisar: (texto: string, tipo?: 'exito' | 'error') => void;
}

export const idTemporal = (prefijo: string) => `${prefijo}-tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
