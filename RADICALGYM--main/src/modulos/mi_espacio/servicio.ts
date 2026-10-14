import { api } from '../../nucleo/api/clienteHttp';
export interface BloqueHorario { idhorario?: number; dia_semana: number; hora_inicio: string; hora_fin: string }
export const TIPOS_CONTRATO: Record<string, string> = { '3_meses': '3 meses', '6_meses': '6 meses', '1_anio': '1 año', indefinido: 'Indefinido' };
export const TIPOS_PERMISO: Record<string, string> = { personal: 'Personal', salud: 'Salud', vacaciones: 'Vacaciones', capacitacion: 'Capacitación' };

export interface ResumenTrabajador {
  idempleado: number; empleado: string; cargo: string; idcontrato: number | null; tipo_contrato: string | null;
  fin_contrato: string | null; estado_contrato: string | null; horas_semanales: number | null; sueldo_mensual: string | null;
  tarifa_hora: string | null; horas_asignadas_mes: string; horas_trabajadas: string; dias_puntual: number;
  tardanzas: number; faltas: number; dias_permiso: number;
  horario: BloqueHorario[];
  asistencias: { fecha: string; hora_entrada: string | null; hora_salida: string | null; estado: string; horas_trabajadas: string; observacion: string | null }[];
  permisos: { idpermiso: number; tipo: string; fecha_inicio: string; fecha_fin: string; motivo: string; estado: string }[];
}

export const servicioMiEspacio = {
  resumen: (idempleado: number, anio: number, mes: number) =>
    api.get<ResumenTrabajador>(`/empleados/${idempleado}/resumen`, { anio, mes }, false),
  marcar: () => api.post<{ hora_entrada: string; hora_salida: string | null }>('/asistencias/personal'),
  solicitarPermiso: (d: Record<string, string>) => api.post('/permisos', d),
  subirSustento: (idpermiso: number, archivo: File) => api.subir(`/permisos/${idpermiso}/sustento`, archivo),
};
