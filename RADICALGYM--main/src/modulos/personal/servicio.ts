import { api } from '../../nucleo/api/clienteHttp';
import type { StaffContract, StaffRole } from '../../nucleo/tipos/gym';
import { Fila, num, opc, txt } from '../../nucleo/utilidades/mapeo';

const ROL: Record<string, StaffRole> = {
  entrenador: 'trainer', fisioterapeuta: 'physiotherapist', nutricionista: 'nutritionist', recepcion: 'receptionist',
  mantenimiento: 'maintenance', administrador: 'manager',
};
const CARGO: Record<StaffRole, string> = {
  trainer: 'entrenador', physiotherapist: 'fisioterapeuta', nutritionist: 'nutricionista', receptionist: 'recepcion',
  maintenance: 'mantenimiento', manager: 'administrador',
};
const DEPARTAMENTO: Record<StaffRole, StaffContract['department']> = {
  trainer: 'Entrenamiento', physiotherapist: 'Fisioterapia', nutritionist: 'Nutrición', receptionist: 'Recepción',
  maintenance: 'Operaciones', manager: 'Operaciones',
};
const TIPO: Record<string, StaffContract['contractType']> = { '3_meses': '3_months', '6_meses': '6_months', '1_anio': '1_year', indefinido: 'indefinite' };
const TIPO_API: Record<string, string> = { '3_months': '3_meses', '6_months': '6_meses', '1_year': '1_anio', indefinite: 'indefinido' };
const ETIQUETA: Record<string, string> = { '3_months': 'Contrato 3 Meses', '6_months': 'Contrato 6 Meses', '1_year': 'Contrato 1 Año', indefinite: 'Contrato Indefinido' };
const ESTADO: Record<string, StaffContract['status']> = { vigente: 'active', por_vencer: 'expiring_soon', vencido: 'expired', renovado: 'renewed' };
const ESTADO_API: Record<string, string> = { active: 'vigente', expiring_soon: 'por_vencer', expired: 'vencido', renewed: 'renovado' };
const MODALIDAD: Record<string, StaffContract['workModality']> = { tiempo_completo: 'full_time', medio_tiempo: 'part_time', por_horas: 'hourly' };
const MODALIDAD_API: Record<string, string> = { full_time: 'tiempo_completo', part_time: 'medio_tiempo', hourly: 'por_horas' };

export const cargoDesdeRol = (r: StaffRole) => CARGO[r];

export function adaptarContrato(c: Fila): StaffContract {
  const role = ROL[c.cargo] ?? 'manager';
  const tipo = TIPO[c.tipo] ?? 'indefinite';
  return {
    id: String(c.idcontrato),
    staffId: String(c.idempleado),
    fullName: `${txt(c.nombres)} ${txt(c.apellidos)}`.trim(),
    dni: txt(c.dni),
    role,
    roleTitle: txt(c.titulo_cargo) || DEPARTAMENTO[role],
    phone: txt(c.telefono),
    email: txt(c.correo),
    photoUrl: opc(c.foto_url),
    contractType: tipo,
    contractDurationLabel: ETIQUETA[tipo],
    startDate: txt(c.fecha_inicio),
    endDate: txt(c.fecha_fin) || '2099-12-31',
    status: ESTADO[c.estado] ?? 'active',
    monthlySalary: num(c.sueldo_mensual),
    hourlyRate: num(c.tarifa_hora),
    assignedWeeklyHours: num(c.horas_semanales),
    workedHoursThisMonth: num(c.horas_mes),
    workModality: MODALIDAD[c.modalidad] ?? 'full_time',
    department: DEPARTAMENTO[role],
    notes: opc(c.notas),
    bankAccount: opc(c.cuenta_bancaria),
    lastPaymentDate: opc(c.ultimo_pago),
    paymentStatus: num(c.pagos_atrasados) > 0 ? 'pendiente_mes' : 'al_dia',
    signedDocumentUrl: opc(c.documento_url),
  };
}

function haciaApi(c: Partial<StaffContract>) {
  const d: Record<string, unknown> = {};
  if (c.fullName !== undefined) d.nombre = c.fullName;
  if (c.dni !== undefined) d.dni = c.dni;
  if (c.role !== undefined) d.cargo = CARGO[c.role];
  if (c.roleTitle !== undefined) d.titulo_cargo = c.roleTitle;
  if (c.phone !== undefined) d.telefono = c.phone;
  if (c.email !== undefined) d.correo = c.email;
  if (c.photoUrl && /^https?:/.test(c.photoUrl)) d.foto = c.photoUrl;
  if (c.contractType !== undefined) d.tipo = TIPO_API[c.contractType];
  if (c.workModality !== undefined) d.modalidad = MODALIDAD_API[c.workModality];
  if (c.startDate !== undefined) d.fecha_inicio = c.startDate;
  if (c.endDate !== undefined) d.fecha_fin = c.contractType === 'indefinite' ? '' : c.endDate;
  if (c.monthlySalary !== undefined) d.sueldo_mensual = c.monthlySalary;
  if (c.hourlyRate !== undefined) d.tarifa_hora = c.hourlyRate;
  if (c.assignedWeeklyHours !== undefined) d.horas_semanales = c.assignedWeeklyHours;
  if (c.notes !== undefined) d.notas = c.notes ?? '';
  if (c.bankAccount !== undefined) d.cuenta_bancaria = c.bankAccount ?? '';
  if (c.status !== undefined) d.estado = ESTADO_API[c.status];
  return d;
}

export const servicioPersonal = {
  crear: (c: Omit<StaffContract, 'id'>) => api.post<{ idcontrato: number }>('/contratos/completo', haciaApi(c)),
  actualizar: (id: string, c: Partial<StaffContract>) => api.put(`/contratos/${id}`, haciaApi(c)),
  renovar: (id: string, duracion: '3_months' | '6_months' | '1_year', sueldo?: number) =>
    api.post(`/contratos/${id}/renovar`, { tipo: TIPO_API[duracion], sueldo_mensual: sueldo }),
  eliminar: (id: string) => api.delete(`/contratos/${id}`),
  /** Contrato firmado: uploads/contratos/{idcontrato}_contratos_documento.pdf */
  subirDocumento: (id: string | number, archivo: File) => api.subir(`/contratos/${id}/documento`, archivo),
};
