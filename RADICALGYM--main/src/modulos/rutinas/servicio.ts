import { api } from '../../nucleo/api/clienteHttp';
import type { Exercise, Routine } from '../../nucleo/tipos/gym';
import { Fila, idNum, num, objetivoDesdeApi, objetivoHaciaApi, opc, txt } from '../../nucleo/utilidades/mapeo';

export function adaptarEjercicio(e: Fila): Exercise {
  return {
    id: String(e.idejercicio),
    name: txt(e.nombre),
    muscleGroup: e.grupo_muscular,
    secondaryMuscles: txt(e.musculos_secundarios).split('|').filter(Boolean),
    equipment: e.equipo,
    difficulty: e.dificultad,
    instructions: txt(e.instrucciones),
    tips: txt(e.consejos),
    targetSetsRepsDefault: txt(e.series_repeticiones),
    videoUrl: opc(e.video_url),
    thumbnailUrl: opc(e.miniatura_url),
  };
}

export function adaptarRutina(r: Fila): Routine {
  return {
    id: String(r.idrutina),
    title: txt(r.titulo),
    description: txt(r.descripcion),
    level: r.nivel,
    objective: objetivoDesdeApi(r.objetivo),
    trainerId: r.identrenador ? String(r.identrenador) : undefined,
    trainerName: opc(r.entrenador),
    targetStudentId: r.idalumno ? String(r.idalumno) : undefined,
    targetStudentName: opc(r.alumno),
    createdDate: txt(r.fecha),
    days: (r.dias ?? []).map((d: Fila) => ({
      dayName: txt(d.nombre),
      focus: txt(d.enfoque),
      notes: opc(d.notas),
      exercises: (d.ejercicios ?? []).map((e: Fila) => ({
        exerciseId: String(e.idejercicio),
        exerciseName: txt(e.nombre),
        muscleGroup: e.grupo_muscular,
        sets: num(e.series),
        reps: txt(e.repeticiones),
        rir: opc(e.rir),
        restSeconds: num(e.descanso_seg),
        notes: opc(e.notas),
        videoUrl: opc(e.video_url),
      })),
    })),
  };
}

const ejercicioHaciaApi = (e: Partial<Exercise>) => ({
  nombre: e.name,
  grupo_muscular: e.muscleGroup,
  musculos_secundarios: (e.secondaryMuscles ?? []).join('|'),
  equipo: e.equipment,
  dificultad: e.difficulty,
  instrucciones: e.instructions,
  consejos: e.tips,
  series_repeticiones: e.targetSetsRepsDefault,
  video_url: e.videoUrl,
  miniatura_url: e.thumbnailUrl,
});

const rutinaHaciaApi = (r: Partial<Routine>) => ({
  titulo: r.title,
  descripcion: r.description,
  nivel: r.level,
  objetivo: objetivoHaciaApi(r.objective ?? 'hipertrofia'),
  identrenador: idNum(r.trainerId) || null,
  idalumno: idNum(r.targetStudentId) || null,
  dias: (r.days ?? []).map(d => ({
    nombre: d.dayName,
    enfoque: d.focus,
    notas: d.notes,
    ejercicios: d.exercises.filter(e => idNum(e.exerciseId)).map(e => ({
      idejercicio: idNum(e.exerciseId), series: e.sets, repeticiones: e.reps, rir: e.rir, descanso_seg: e.restSeconds, notas: e.notes,
    })),
  })),
});

export const servicioRutinas = {
  crearEjercicio: (e: Omit<Exercise, 'id'>) => api.post('/ejercicios', ejercicioHaciaApi(e)),
  actualizarEjercicio: (e: Exercise) => api.put(`/ejercicios/${e.id}`, ejercicioHaciaApi(e)),
  eliminarEjercicio: (id: string) => api.delete(`/ejercicios/${id}`),
  crearRutina: (r: Omit<Routine, 'id' | 'createdDate'>) => api.post('/rutinas', rutinaHaciaApi(r)),
  actualizarRutina: (r: Routine) => api.put(`/rutinas/${r.id}`, rutinaHaciaApi(r)),
  eliminarRutina: (id: string) => api.delete(`/rutinas/${id}`),
};
