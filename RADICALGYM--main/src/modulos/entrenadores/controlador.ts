import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { Trainer } from '../../nucleo/tipos/gym';
import { servicioEntrenadores } from './servicio';

export function accionesEntrenadores(c: ContextoModulo) {
  return {
    addTrainer: (datos: Omit<Trainer, 'id'>) => {
      c.actualizar('trainers', prev => [...prev, { ...datos, id: idTemporal('trainer') }]);
      c.persistir(() => servicioEntrenadores.crear(datos), `Entrenador ${datos.name} registrado`);
    },
    updateTrainer: (id: string, datos: Partial<Trainer>) => {
      const actual = c.d.trainers.find(t => t.id === id);
      if (!actual) return;
      const nuevo = { ...actual, ...datos };
      c.actualizar('trainers', prev => prev.map(t => (t.id === id ? nuevo : t)));
      c.persistir(() => servicioEntrenadores.actualizar(nuevo), 'Entrenador actualizado');
    },
    deleteTrainer: (id: string) => {
      c.actualizar('trainers', prev => prev.filter(t => t.id !== id));
      c.persistir(() => servicioEntrenadores.eliminar(id), 'Entrenador retirado');
    },
  };
}
