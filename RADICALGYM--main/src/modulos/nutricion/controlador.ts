import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { BodyAssessment, NutritionPlan } from '../../nucleo/tipos/gym';
import { hoyISO, idNum } from '../../nucleo/utilidades/mapeo';
import { servicioNutricion } from './servicio';

export function accionesNutricion(c: ContextoModulo) {
  /** La pantalla elige al responsable por nombre; se busca su idempleado (o se usa el usuario actual). */
  const idResponsable = (nombre?: string) =>
    idNum(c.d.staff.find(s => s.fullName === nombre)?.id) || idNum(c.usuario.staffId ?? c.usuario.trainerId) || undefined;

  return {
    addNutritionPlan: (datos: Omit<NutritionPlan, 'id' | 'createdDate'>) => {
      c.actualizar('nutritionPlans', prev => [{ ...datos, id: idTemporal('nutri'), createdDate: hoyISO() },
        ...prev.map(p => (p.targetStudentId === datos.targetStudentId ? { ...p, active: false } : p))]);
      c.persistir(() => servicioNutricion.crearDieta(datos, idResponsable(datos.trainerName)), `Dieta asignada a ${datos.targetStudentName ?? 'el alumno'}`);
    },
    updateNutritionPlan: (id: string, datos: Partial<NutritionPlan>) => {
      c.actualizar('nutritionPlans', prev => prev.map(p => (p.id === id ? { ...p, ...datos } : p)));
      c.persistir(() => servicioNutricion.actualizarDieta(id, datos), 'Dieta actualizada');
    },
    deleteNutritionPlan: (id: string) => {
      c.actualizar('nutritionPlans', prev => prev.filter(p => p.id !== id));
      c.persistir(() => servicioNutricion.eliminarDieta(id), 'Dieta eliminada');
    },
    addBodyAssessment: (datos: Omit<BodyAssessment, 'id'>) => {
      c.actualizar('bodyAssessments', prev => [...prev, { ...datos, id: idTemporal('eval') }]);
      c.persistir(() => servicioNutricion.crearMedida(datos, idResponsable(datos.evaluatorTrainerName)), `Medidas de ${datos.memberName} registradas`);
    },
    updateBodyAssessment: (id: string, datos: Partial<BodyAssessment>) => {
      c.actualizar('bodyAssessments', prev => prev.map(a => (a.id === id ? { ...a, ...datos } : a)));
    },
    deleteBodyAssessment: (id: string) => {
      c.actualizar('bodyAssessments', prev => prev.filter(a => a.id !== id));
      c.persistir(() => servicioNutricion.eliminarMedida(id), 'Evaluación eliminada');
    },
  };
}
