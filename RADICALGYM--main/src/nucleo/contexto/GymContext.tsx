import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppUser, Member, Product, RenewalAlert } from '../tipos/gym';
import { useSesion } from '../sesion/SesionContexto';
import { useAvisos } from '../ui/Avisos';
import { estadoMembresia, hoyISO } from '../utilidades/mapeo';
import { cargarDatos } from './servicioDatos';
import { DATOS_VACIOS, type ContextoModulo, type DatosGym } from './tipos';
import { usuarioActual } from '../../modulos/autenticacion/servicio';
import { accionesUsuarios } from '../../modulos/autenticacion/controlador';
import { accionesAlumnos } from '../../modulos/alumnos/controlador';
import { accionesPlanes } from '../../modulos/planes/controlador';
import { accionesEntrenadores } from '../../modulos/entrenadores/controlador';
import { accionesRutinas } from '../../modulos/rutinas/controlador';
import { accionesVentas } from '../../modulos/ventas/controlador';
import { accionesFinanzas } from '../../modulos/finanzas/controlador';
import { accionesNotificaciones } from '../../modulos/notificaciones/controlador';
import { accionesNutricion } from '../../modulos/nutricion/controlador';
import { accionesSpinning } from '../../modulos/spinning/controlador';
import { accionesAsistencia } from '../../modulos/asistencia/controlador';
import { accionesPersonal } from '../../modulos/personal/controlador';
import { accionesFisioterapia } from '../../modulos/fisioterapia/controlador';
import { accionesCitas } from '../../modulos/citas/controlador';

/**
 * Estado global de las pantallas. Los datos vienen de la API PHP (MySQL + Redis) y cada
 * módulo aporta sus acciones desde su propio controlador. Las pantallas siguen usando useGym().
 */
function crearAcciones(c: ContextoModulo) {
  return {
    ...accionesUsuarios(c), ...accionesAlumnos(c), ...accionesPlanes(c), ...accionesEntrenadores(c), ...accionesRutinas(c),
    ...accionesVentas(c), ...accionesFinanzas(c), ...accionesNotificaciones(c), ...accionesNutricion(c), ...accionesSpinning(c),
    ...accionesAsistencia(c), ...accionesPersonal(c), ...accionesFisioterapia(c), ...accionesCitas(c),
  };
}

const diasHasta = (fecha: string) => Math.ceil((new Date(fecha).getTime() - new Date(hoyISO()).getTime()) / 86400000);

function construirContexto(d: DatosGym, currentUser: AppUser, acciones: ReturnType<typeof crearAcciones>, recargar: () => Promise<void>, cargando: boolean) {
  const renewalAlerts: RenewalAlert[] = d.members
    .map(m => ({ m, dias: diasHasta(m.membershipEndDate) }))
    .filter(x => x.dias <= 7 && x.m.planId)
    .map(({ m, dias }) => ({
      memberId: m.id, memberName: m.fullName, phone: m.phone, email: m.email, planName: m.planName,
      endDate: m.membershipEndDate, daysLeft: dias, isExpired: dias < 0,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const lowStockProducts: Product[] = d.products.filter(p => p.stock <= p.minStockAlert);

  let totalIncome = 0, totalExpense = 0, posSalesTotal = 0, membershipsRevenue = 0;
  d.transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (t.category === 'pos_sale') posSalesTotal += t.amount;
      if (t.category === 'membership') membershipsRevenue += t.amount;
    } else totalExpense += t.amount;
  });
  const conPlan = d.members.filter(m => m.planId);
  const metrics = {
    totalActiveMembers: conPlan.filter(m => estadoMembresia(m.membershipEndDate) === 'active').length,
    expiringMembersCount: conPlan.filter(m => estadoMembresia(m.membershipEndDate) === 'expiring_soon').length,
    expiredMembersCount: conPlan.filter(m => estadoMembresia(m.membershipEndDate) === 'expired').length,
    totalIncome, totalExpense, netProfit: totalIncome - totalExpense, posSalesTotal, membershipsRevenue,
    activeNotificationRulesCount: d.notificationRules.filter(r => r.enabled).length,
    totalSentNotifications: d.notificationLogs.length,
  };

  const generateWhatsAppLink = (member: Member, customNote?: string) => {
    const dias = diasHasta(member.membershipEndDate);
    let tel = member.phone.replace(/\D/g, '');
    if (!tel.startsWith('51') && tel.length === 9) tel = '51' + tel;
    const nombre = member.fullName.split(' ')[0];
    const nota = customNote ? `\n\nNota: ${customNote}` : '';
    const msg = dias < 0
      ? `¡Hola ${nombre}! 💪 Te saludamos de Radical Gym. Tu membresía (${member.planName}) venció el ${member.membershipEndDate}. ¡Renueva hoy y no pierdas tu progreso!${nota}`
      : dias === 0
        ? `¡Hola ${nombre}! 🏋️‍♂️ Te saludamos de Radical Gym. Tu membresía (${member.planName}) vence HOY. Puedes renovar en recepción o por transferencia/Yape.${nota}`
        : `¡Hola ${nombre}! ⚡ Te saludamos de Radical Gym. A tu membresía (${member.planName}) le quedan ${dias} días (vence el ${member.membershipEndDate}). ¡Renueva con anticipación!${nota}`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  };

  return {
    ...d,
    currentUser,
    cargando,
    ...acciones,
    renewalAlerts,
    lowStockProducts,
    metrics,
    getMemberById: (id: string) => d.members.find(m => m.id === id),
    getTrainerById: (id: string) => d.trainers.find(t => t.id === id),
    getRoutineById: (id: string) => d.routines.find(r => r.id === id),
    getPlanById: (id: string) => d.plans.find(p => p.id === id),
    getProductById: (id: string) => d.products.find(p => p.id === id),
    getAssessmentsByMemberId: (id: string) => d.bodyAssessments.filter(a => a.memberId === id).sort((a, b) => a.date.localeCompare(b.date)),
    getPhysioRecordsByMemberId: (id: string) => d.physioRecords.filter(r => r.memberId === id).sort((a, b) => b.sessionNumber - a.sessionNumber),
    generateWhatsAppLink,
    // En esta versión la sesión real viene del inicio de sesión; cambiar de usuario = cerrar sesión e ingresar con otra cuenta
    setCurrentUser: (_u: AppUser) => {},
    loginAsUser: (_id: string) => {},
    /** Vuelve a cargar los datos reales desde el servidor */
    resetToDefaults: () => { void recargar(); },
    recargarDatos: recargar,
    exportDataJSON: () => {
      const blob = new Blob([JSON.stringify({ version: 'radicalgym-api', exportDate: new Date().toISOString(), ...d }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `radicalgym_respaldo_${hoyISO()}.json`;
      a.click();
    },
    importDataJSON: (_json: string) => false,
  };
}

export type GymContextType = ReturnType<typeof construirContexto>;
const GymContext = createContext<GymContextType | null>(null);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useSesion();
  const avisar = useAvisos();
  const [datos, setDatos] = useState<DatosGym>(DATOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const datosRef = useRef(datos);
  datosRef.current = datos;
  const pendientes = useRef(0);

  const recargar = useCallback(async () => {
    try {
      const nuevos = await cargarDatos();
      // Si hay guardados en curso se espera a que terminen para no pisar los cambios en pantalla
      if (pendientes.current === 0) setDatos(nuevos);
    } catch (e) {
      avisar((e as Error).message, 'error');
    } finally {
      setCargando(false);
    }
  }, [avisar]);

  useEffect(() => {
    if (usuario) { setCargando(true); void recargar(); } else setDatos(DATOS_VACIOS);
  }, [usuario, recargar]);

  const currentUser = useMemo(() => (usuario ? usuarioActual(usuario) : {
    id: '', username: '', fullName: 'Invitado', email: '', role: 'student' as const, active: false,
  }), [usuario]);

  const contextoModulo: ContextoModulo = {
    d: datos,
    usuario: currentUser,
    actualizar: (clave, fn) => setDatos(prev => ({ ...prev, [clave]: fn(prev[clave]) })),
    persistir: (operacion, exito) => {
      pendientes.current += 1;
      operacion()
        .then(() => { if (exito) avisar(exito); })
        .catch(e => avisar((e as Error).message, 'error'))
        .finally(() => { pendientes.current -= 1; if (pendientes.current === 0) void recargar(); });
    },
    avisar,
  };

  const valor = construirContexto(datos, currentUser, crearAcciones(contextoModulo), recargar, cargando);
  return <GymContext.Provider value={valor}>{children}</GymContext.Provider>;
};

export const useGym = () => {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error('useGym debe usarse dentro de GymProvider');
  return ctx;
};
