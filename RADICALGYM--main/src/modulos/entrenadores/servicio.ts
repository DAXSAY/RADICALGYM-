import { api } from '../../nucleo/api/clienteHttp';
import type { Trainer } from '../../nucleo/tipos/gym';
import { Fila, num, txt } from '../../nucleo/utilidades/mapeo';

/** Los entrenadores son empleados con cargo "entrenador". */
export function adaptarEntrenador(e: Fila): Trainer {
  return {
    id: String(e.idempleado),
    name: `${txt(e.nombres)} ${txt(e.apellidos)}`.trim(),
    specialization: txt(e.especialidad || e.titulo_cargo),
    phone: txt(e.telefono),
    email: txt(e.correo),
    photoUrl: txt(e.foto_url),
    bio: txt(e.biografia),
    rating: num(e.calificacion) || 5,
    availableSchedule: txt(e.horario_disponible),
  };
}

const haciaApi = (t: Partial<Trainer>) => ({
  nombre: t.name,
  especialidad: t.specialization,
  telefono: t.phone,
  correo: t.email,
  biografia: t.bio,
  calificacion: t.rating,
  horario_disponible: t.availableSchedule,
  foto: t.photoUrl && /^https?:/.test(t.photoUrl) ? t.photoUrl : undefined,
});

export const servicioEntrenadores = {
  crear: (t: Omit<Trainer, 'id'>) => api.post('/entrenadores', haciaApi(t)),
  actualizar: (t: Trainer) => api.put(`/entrenadores/${t.id}`, haciaApi(t)),
  eliminar: (id: string) => api.delete(`/entrenadores/${id}`),
};
