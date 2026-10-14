import { api } from '../../nucleo/api/clienteHttp';

/**
 * El portal del alumno usa la carga inicial (/api/datos), que para un alumno ya llega
 * filtrada a sus propios registros. Aquí solo queda lo que no está en esa carga.
 */
export interface ResumenPortal {
  plan: { dias_restantes: number | null; programa: string | null; entrenador: string | null } | null;
  asistencias_mes: number;
}

export const servicioPortal = {
  resumen: () => api.get<ResumenPortal>('/portal/alumno'),
  marcarAvisoLeido: (id: string) => api.put(`/notificaciones/${id}/leida`),
};
