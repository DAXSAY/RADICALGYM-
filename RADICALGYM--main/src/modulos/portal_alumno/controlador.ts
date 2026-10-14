import { useEffect, useMemo, useState } from 'react';
import { useGym } from '../../nucleo/contexto/GymContext';
import { hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioPortal, type ResumenPortal } from './servicio';

/** Datos del alumno que inició sesión (el backend solo envía los suyos). */
export function usePortalAlumno() {
  const g = useGym();
  const [resumen, setResumen] = useState<ResumenPortal | null>(null);
  useEffect(() => { servicioPortal.resumen().then(setResumen).catch(() => setResumen(null)); }, []);

  const yo = g.members.find(m => m.id === g.currentUser.memberId) ?? g.members[0];
  return useMemo(() => {
    const hoy = hoyISO();
    const dietaActiva = g.nutritionPlans.find(p => p.active) ?? g.nutritionPlans[0];
    const medidas = [...g.bodyAssessments].sort((a, b) => a.date.localeCompare(b.date));
    return {
      yo,
      resumen,
      entrenador: yo?.assignedTrainerId ? g.getTrainerById(yo.assignedTrainerId) : undefined,
      rutina: yo?.assignedRoutineId ? g.getRoutineById(yo.assignedRoutineId) : undefined,
      proximasCitas: g.appointments.filter(a => a.date >= hoy && !['cancelled', 'falta', 'atendido'].includes(a.status)),
      reservasSpinning: g.spinningReservations.filter(r => r.memberId === yo?.id && r.status !== 'cancelled'),
      sesionesSpinning: g.spinningSessions,
      avisos: g.notificationLogs.slice(0, 6),
      dietaActiva,
      medidas,
      ultimaMedida: medidas[medidas.length - 1],
      fisioterapia: [...g.physioRecords].sort((a, b) => b.date.localeCompare(a.date)),
      marcarLeido: (id: string) => { void servicioPortal.marcarAvisoLeido(id); },
    };
  }, [g, yo, resumen]);
}
