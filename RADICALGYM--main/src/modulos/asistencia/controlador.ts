import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { AttendanceRecord } from '../../nucleo/tipos/gym';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioAsistencia } from './servicio';

export function accionesAsistencia(c: ContextoModulo) {
  const recordAttendance = (datos: Omit<AttendanceRecord, 'id' | 'date' | 'time'>) => {
    const registro: AttendanceRecord = {
      ...datos, id: idTemporal('att'), date: hoyISO(),
      time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
    c.actualizar('attendances', prev => [registro, ...prev]);
    c.persistir(() => servicioAsistencia.registrar(datos));
    return { success: true, record: registro, message: `¡Asistencia registrada para ${datos.userName}!` };
  };

  const deleteAttendance = (id: string) => {
    c.actualizar('attendances', prev => prev.filter(a => a.id !== id));
    c.persistir(() => servicioAsistencia.eliminar(id), 'Registro eliminado');
  };

  return { recordAttendance, deleteAttendance };
}
