import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { PhysioTechnique, PhysiotherapySessionRecord } from '../../nucleo/tipos/gym';
import { servicioFisioterapia } from './servicio';

export function accionesFisioterapia(c: ContextoModulo) {
  return {
    addPhysioRecord: (datos: Omit<PhysiotherapySessionRecord, 'id' | 'sessionNumber'>) => {
      const previas = c.d.physioRecords.filter(r => r.memberId === datos.memberId).length;
      c.actualizar('physioRecords', prev => [{ ...datos, id: idTemporal('phy'), sessionNumber: previas + 1 }, ...prev]);
      c.persistir(() => servicioFisioterapia.crear(datos), `Sesión de ${datos.memberName} registrada`);
    },
    updatePhysioRecord: (id: string, datos: Partial<PhysiotherapySessionRecord>) => {
      c.actualizar('physioRecords', prev => prev.map(r => (r.id === id ? { ...r, ...datos } : r)));
    },
    deletePhysioRecord: (id: string) => {
      c.actualizar('physioRecords', prev => prev.filter(r => r.id !== id));
      c.persistir(() => servicioFisioterapia.eliminar(id), 'Sesión eliminada');
    },
    // Catálogo de técnicas y procedimientos (buscar, agregar, editar, eliminar)
    addPhysioTechnique: (datos: Omit<PhysioTechnique, 'id'>) => {
      c.actualizar('physioTechniques', prev => [...prev, { ...datos, id: idTemporal('tec') }].sort((a, b) => a.name.localeCompare(b.name)));
      c.persistir(() => servicioFisioterapia.crearTecnica(datos), `Técnica "${datos.name}" agregada`);
    },
    updatePhysioTechnique: (id: string, datos: Partial<PhysioTechnique>) => {
      const actual = c.d.physioTechniques.find(t => t.id === id);
      if (!actual) return;
      const nueva = { ...actual, ...datos };
      c.actualizar('physioTechniques', prev => prev.map(t => (t.id === id ? nueva : t)));
      c.persistir(() => servicioFisioterapia.actualizarTecnica(nueva), 'Técnica actualizada');
    },
    deletePhysioTechnique: (id: string) => {
      c.actualizar('physioTechniques', prev => prev.filter(t => t.id !== id));
      c.persistir(() => servicioFisioterapia.eliminarTecnica(id), 'Técnica eliminada');
    },
  };
}
