import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { Exercise, Routine } from '../../nucleo/tipos/gym';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioRutinas } from './servicio';

export function accionesRutinas(c: ContextoModulo) {
  return {
    addExercise: (datos: Omit<Exercise, 'id'>) => {
      c.actualizar('exercises', prev => [{ ...datos, id: idTemporal('ex') }, ...prev]);
      c.persistir(() => servicioRutinas.crearEjercicio(datos), `Ejercicio ${datos.name} agregado`);
    },
    updateExercise: (id: string, datos: Partial<Exercise>) => {
      const actual = c.d.exercises.find(e => e.id === id);
      if (!actual) return;
      const nuevo = { ...actual, ...datos };
      c.actualizar('exercises', prev => prev.map(e => (e.id === id ? nuevo : e)));
      c.persistir(() => servicioRutinas.actualizarEjercicio(nuevo), 'Ejercicio actualizado');
    },
    deleteExercise: (id: string) => {
      c.actualizar('exercises', prev => prev.filter(e => e.id !== id));
      c.persistir(() => servicioRutinas.eliminarEjercicio(id), 'Ejercicio eliminado');
    },
    addRoutine: (datos: Omit<Routine, 'id' | 'createdDate'>) => {
      c.actualizar('routines', prev => [{ ...datos, id: idTemporal('routine'), createdDate: hoyISO() }, ...prev]);
      c.persistir(() => servicioRutinas.crearRutina(datos), `Rutina ${datos.title} guardada`);
    },
    updateRoutine: (id: string, datos: Partial<Routine>) => {
      const actual = c.d.routines.find(r => r.id === id);
      if (!actual) return;
      const nueva = { ...actual, ...datos };
      c.actualizar('routines', prev => prev.map(r => (r.id === id ? nueva : r)));
      c.persistir(() => servicioRutinas.actualizarRutina(nueva), 'Rutina actualizada');
    },
    deleteRoutine: (id: string) => {
      c.actualizar('routines', prev => prev.filter(r => r.id !== id));
      c.persistir(() => servicioRutinas.eliminarRutina(id), 'Rutina eliminada');
    },
  };
}
