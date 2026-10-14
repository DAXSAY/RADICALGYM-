import { api } from '../../nucleo/api/clienteHttp';
import type { AttendanceRecord } from '../../nucleo/tipos/gym';
import { Fila, hora12, idNum, num, opc, txt } from '../../nucleo/utilidades/mapeo';

const METODO: Record<string, AttendanceRecord['checkInMethod']> = { qr_app: 'qr_app', dni_manual: 'dni_manual', codigo_barras: 'barcode', pase_rapido: 'quick_pass' };
const METODO_API: Record<string, string> = { qr_app: 'qr_app', dni_manual: 'dni_manual', barcode: 'codigo_barras', quick_pass: 'pase_rapido' };

/** Une las marcas de alumnos (una fila por marca) y del personal (entrada y salida en una fila por día). */
export function adaptarAsistencias(raw: { alumnos?: Fila[]; empleados?: Fila[] } | undefined): AttendanceRecord[] {
  const lista: AttendanceRecord[] = [];
  for (const a of raw?.alumnos ?? []) {
    lista.push({
      id: `a-${a.idasistencia_alumno}`, userId: String(a.idalumno), userName: txt(a.nombre), userRole: 'student', userDni: txt(a.dni),
      date: txt(a.fecha), time: hora12(a.hora_entrada), type: a.tipo === 'salida' ? 'out' : 'in', status: 'puntual',
      checkInMethod: METODO[a.metodo] ?? 'dni_manual', notes: opc(a.notas), membershipPlan: opc(a.plan), category: 'student',
    });
  }
  for (const e of raw?.empleados ?? []) {
    const base = {
      userId: String(e.idempleado), userName: txt(e.nombre), userRole: (e.cargo === 'entrenador' ? 'trainer' : 'staff') as AttendanceRecord['userRole'],
      userDni: txt(e.dni), date: txt(e.fecha), status: e.estado as AttendanceRecord['status'], checkInMethod: METODO[e.metodo] ?? 'dni_manual',
      category: 'staff' as const, contractId: e.idcontrato ? String(e.idcontrato) : undefined,
      scheduledTime: e.hora_programada ? `${hora12(e.hora_programada)} - Jornada asignada` : undefined,
      reason: opc(e.observacion), hoursWorked: num(e.horas_trabajadas),
    };
    lista.push({ ...base, id: `e-${e.idasistencia_empleado}-entrada`, time: e.hora_entrada ? hora12(e.hora_entrada) : '—', type: 'in' });
    if (e.hora_salida) lista.push({ ...base, id: `e-${e.idasistencia_empleado}-salida`, time: hora12(e.hora_salida), type: 'out' });
  }
  return lista.sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time));
}

export const servicioAsistencia = {
  registrar: (r: Omit<AttendanceRecord, 'id' | 'date' | 'time'>) =>
    api.post<{ clave: string }>('/asistencias', {
      categoria: r.category === 'staff' || r.userRole !== 'student' ? 'empleado' : 'alumno',
      id: idNum(r.userId),
      tipo: r.type === 'out' ? 'salida' : 'entrada',
      estado: r.status,
      metodo: METODO_API[r.checkInMethod] ?? 'dni_manual',
      notas: [r.reason, r.notes].filter(Boolean).join(' · '),
    }),
  eliminar: (id: string) => api.delete(`/asistencias/${id}`),
};
