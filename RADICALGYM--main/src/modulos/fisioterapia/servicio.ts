import { api } from '../../nucleo/api/clienteHttp';
import type { BodyPainZone, PhysioTechnique, PhysiotherapySessionRecord } from '../../nucleo/tipos/gym';
import { Fila, hora12, hora24, idNum, num, opc, txt } from '../../nucleo/utilidades/mapeo';

export function adaptarSesionFisio(s: Fila): PhysiotherapySessionRecord {
  return {
    id: String(s.idsesion_fisioterapia),
    memberId: String(s.idalumno),
    memberName: txt(s.alumno),
    memberDni: txt(s.dni),
    memberPhone: opc(s.telefono),
    date: txt(s.fecha),
    time: s.hora ? hora12(s.hora) : '',
    physiotherapistId: String(s.idfisioterapeuta),
    physiotherapistName: txt(s.fisioterapeuta),
    initialMedicalRestrictions: txt(s.restricciones_medicas),
    consultationReason: txt(s.motivo_consulta),
    affectedZones: (s.zonas ?? []).map((z: Fila) => ({ zone: z.zona as BodyPainZone, painLevel: num(z.nivel_dolor) })),
    posturalEvaluation: txt(s.evaluacion),
    rangeOfMotion: txt(s.rango_movimiento),
    functionalTests: txt(s.pruebas_funcionales),
    treatmentsApplied: s.tecnicas ?? [],
    gymWorkoutRestrictions: txt(s.restricciones_gym),
    homeIndications: txt(s.indicaciones_casa),
    evolutionNotes: txt(s.evolucion),
    sessionNumber: num(s.numero_sesion),
    nextAppointmentDate: opc(s.proxima_cita),
  };
}

export const adaptarTecnica = (t: Fila): PhysioTechnique => ({ id: String(t.idtecnica), name: txt(t.nombre), description: opc(t.descripcion) });

export const servicioFisioterapia = {
  crear: (r: Omit<PhysiotherapySessionRecord, 'id' | 'sessionNumber'>) =>
    api.post('/fisioterapia/sesiones', {
      idalumno: idNum(r.memberId),
      idfisioterapeuta: idNum(r.physiotherapistId) || undefined,
      fecha: r.date,
      hora: hora24(r.time) || undefined,
      motivo_consulta: r.consultationReason,
      evaluacion: r.posturalEvaluation,
      rango_movimiento: r.rangeOfMotion,
      pruebas_funcionales: r.functionalTests,
      restricciones_gym: r.gymWorkoutRestrictions,
      indicaciones_casa: r.homeIndications,
      evolucion: r.evolutionNotes,
      proxima_cita: r.nextAppointmentDate || null,
      zonas: r.affectedZones.map(z => ({ zona: z.zone, nivel_dolor: z.painLevel })),
      tecnicas: r.treatmentsApplied,
    }),
  eliminar: (id: string) => api.delete(`/fisioterapia/sesiones/${id}`),
  crearTecnica: (t: Omit<PhysioTechnique, 'id'>) => api.post('/tecnicas', { nombre: t.name, descripcion: t.description }),
  actualizarTecnica: (t: PhysioTechnique) => api.put(`/tecnicas/${t.id}`, { nombre: t.name, descripcion: t.description }),
  eliminarTecnica: (id: string) => api.delete<{ mensaje: string }>(`/tecnicas/${id}`),
};
