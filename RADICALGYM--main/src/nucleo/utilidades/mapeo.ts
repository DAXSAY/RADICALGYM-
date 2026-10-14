/** Utilidades para traducir los datos de la API (español) al formato que usan las pantallas. */
import type { FitnessObjective, MembershipStatus, PaymentMethod, TransactionCategory, UserRole } from '../tipos/gym';

export type Fila = Record<string, any>;

/** Fecha local de hoy en formato AAAA-MM-DD (reemplaza la fecha fija de los datos de ejemplo). */
export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const ahoraHHMM = () => new Date().toTimeString().slice(0, 5);

export const txt = (v: unknown) => (v === null || v === undefined ? '' : String(v));
export const num = (v: unknown) => (v === null || v === undefined || v === '' ? 0 : Number(v));
export const opc = (v: unknown) => (v === null || v === undefined || v === '' ? undefined : String(v));
export const idNum = (v: string | number | undefined | null) => {
  const n = Number(String(v ?? '').replace(/\D/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function estadoMembresia(fin?: string | null): MembershipStatus {
  if (!fin) return 'expired';
  const dias = Math.ceil((new Date(fin.slice(0, 10)).getTime() - new Date(hoyISO()).getTime()) / 86400000);
  if (dias < 0) return 'expired';
  if (dias <= 7) return 'expiring_soon';
  return 'active';
}

/** "13:30:00" -> "01:30 PM" (formato que muestran las pantallas originales) */
export function hora12(h?: string | null) {
  if (!h) return '';
  const [hh, mm] = h.split(':').map(Number);
  const sufijo = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${sufijo}`;
}

/** "01:30 PM" | "13:30" -> "13:30" */
export function hora24(h?: string | null) {
  if (!h) return '';
  const m = h.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM|a\.?\s?m\.?|p\.?\s?m\.?)?/i);
  if (!m) return '';
  let hh = Number(m[1]);
  const suf = (m[3] || '').toLowerCase().replace(/[.\s]/g, '');
  if (suf.startsWith('p') && hh < 12) hh += 12;
  if (suf.startsWith('a') && hh === 12) hh = 0;
  return `${String(hh).padStart(2, '0')}:${m[2]}`;
}

export const separarNombre = (completo: string) => {
  const partes = completo.trim().split(/\s+/);
  const n = partes.length >= 4 ? 2 : 1;
  return { nombres: partes.slice(0, n).join(' '), apellidos: partes.slice(n).join(' ') || '-' };
};

// ---------------- Roles ----------------
export const ROL_DESDE_API: Record<string, UserRole> = {
  administrador: 'admin', recepcion: 'staff', entrenador: 'trainer',
  nutricionista: 'nutritionist', fisioterapeuta: 'physiotherapist', alumno: 'student',
};
export const ROL_HACIA_API: Record<UserRole, string> = {
  admin: 'administrador', staff: 'recepcion', trainer: 'entrenador',
  nutritionist: 'nutricionista', physiotherapist: 'fisioterapeuta', student: 'alumno',
};

// ---------------- Objetivos ----------------
export const objetivoDesdeApi = (o: string): FitnessObjective => (o === 'rehabilitacion' ? 'salud_rehabilitacion' : (o as FitnessObjective));
export const objetivoHaciaApi = (o: string) => (o === 'salud_rehabilitacion' ? 'rehabilitacion' : o);

export const metodoPago = (m?: string | null): PaymentMethod => (m as PaymentMethod) || 'efectivo';

// ---------------- Caja ----------------
export const CATEGORIA_DESDE_API: Record<string, TransactionCategory> = {
  matricula: 'membership', venta: 'pos_sale', spinning: 'pos_sale', entrenamiento_personal: 'personal_training',
  insumos: 'supplies', sueldo: 'salary', planilla: 'staff_payroll', mantenimiento: 'maintenance', servicios: 'utilities',
  alquiler: 'rent', marketing: 'marketing', averia_equipo: 'equipment_breakdown', gasto_libre: 'free_expense', otros: 'other',
};
export const CATEGORIA_HACIA_API: Record<TransactionCategory, string> = {
  membership: 'matricula', pos_sale: 'venta', personal_training: 'entrenamiento_personal', supplies: 'insumos',
  salary: 'sueldo', staff_payroll: 'planilla', maintenance: 'mantenimiento', utilities: 'servicios', rent: 'alquiler',
  marketing: 'marketing', equipment_breakdown: 'averia_equipo', free_expense: 'gasto_libre', other: 'otros',
};
