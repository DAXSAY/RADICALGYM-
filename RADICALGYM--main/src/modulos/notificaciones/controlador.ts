import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import type { GymClassNotice, Member, NotificationCategory, NotificationChannel, NotificationLog, NotificationRule } from '../../nucleo/tipos/gym';
import { estadoMembresia, hoyISO } from '../../nucleo/utilidades/mapeo';
import { servicioNotificaciones } from './servicio';

const marcaTiempo = () => `${hoyISO()} ${new Date().toTimeString().slice(0, 5)}`;

/** Notificación nativa del navegador (canal push). */
export async function triggerRealWebNotification(title: string, body: string): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const mostrar = () => { try { new Notification(title, { body, icon: '/logo-emblema.png' }); } catch { /* entorno sin soporte */ } return true; };
  if (Notification.permission === 'granted') return mostrar();
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted' ? mostrar() : false;
}

export function accionesNotificaciones(c: ContextoModulo) {
  const updateNotificationRule = (id: string, datos: Partial<NotificationRule>) => {
    const actual = c.d.notificationRules.find(r => r.id === id);
    if (!actual) return;
    const nueva = { ...actual, ...datos };
    c.actualizar('notificationRules', prev => prev.map(r => (r.id === id ? nueva : r)));
    c.persistir(() => servicioNotificaciones.actualizarRegla(nueva), 'Regla actualizada');
  };

  const addNotificationLog = (log: Omit<NotificationLog, 'id' | 'timestamp'>) => {
    c.actualizar('notificationLogs', prev => [{ ...log, id: idTemporal('log'), timestamp: marcaTiempo() }, ...prev]);
    c.persistir(() => servicioNotificaciones.enviar(log));
  };

  type DatosEnvio = {
    recipientId?: string; recipientName: string; recipientEmail?: string; recipientPhone?: string; category: NotificationCategory;
    channel: NotificationChannel; title: string; message: string; targetAudience?: string;
  };
  /** Acepta un objeto o los argumentos posicionales que usa el Centro de Notificaciones. */
  function sendDirectNotification(data: DatosEnvio): void;
  function sendDirectNotification(recipientId: string, recipientName: string, title: string, message: string,
    category: NotificationCategory, channel: NotificationChannel, recipientPhone?: string, recipientEmail?: string): void;
  function sendDirectNotification(...args: unknown[]) {
    const data: DatosEnvio = typeof args[0] === 'object' && args[0] !== null
      ? args[0] as DatosEnvio
      : {
          recipientId: args[0] as string, recipientName: args[1] as string, title: args[2] as string, message: args[3] as string,
          category: args[4] as NotificationCategory, channel: args[5] as NotificationChannel,
          recipientPhone: args[6] as string | undefined, recipientEmail: args[7] as string | undefined,
        };
    addNotificationLog({ ...data, status: 'delivered' });
    if (data.channel === 'push') void triggerRealWebNotification(data.title, data.message);
  }

  const sendManualCampaign = (campana: {
    title: string; message: string; category: NotificationCategory; channels: NotificationChannel[]; targetAudience: string; specificMemberIds?: string[];
  }) => {
    let destino: Member[];
    if (campana.specificMemberIds?.length) destino = c.d.members.filter(m => campana.specificMemberIds!.includes(m.id));
    else if (campana.targetAudience === 'active') destino = c.d.members.filter(m => estadoMembresia(m.membershipEndDate) === 'active');
    else if (campana.targetAudience === 'expiring') destino = c.d.members.filter(m => estadoMembresia(m.membershipEndDate) === 'expiring_soon');
    else if (campana.targetAudience === 'expired') destino = c.d.members.filter(m => estadoMembresia(m.membershipEndDate) === 'expired');
    else destino = c.d.members;

    const logs: Omit<NotificationLog, 'id' | 'timestamp'>[] = destino.flatMap(m => campana.channels.map(canal => ({
      recipientId: m.id, recipientName: m.fullName, recipientEmail: m.email, recipientPhone: m.phone, category: campana.category, channel: canal,
      title: campana.title.replace(/{{nombre}}/g, m.fullName.split(' ')[0]),
      message: campana.message.replace(/{{nombre}}/g, m.fullName).replace(/{{plan}}/g, m.planName)
        .replace(/{{fecha_vencimiento}}/g, m.membershipEndDate).replace(/{{telefono}}/g, m.phone).replace(/{{email}}/g, m.email),
      status: 'delivered' as const, targetAudience: campana.targetAudience,
    })));
    if (campana.channels.includes('push')) void triggerRealWebNotification(campana.title, campana.message.replace(/{{nombre}}/g, 'Socio'));
    const t = marcaTiempo();
    c.actualizar('notificationLogs', prev => [...logs.map(l => ({ ...l, id: idTemporal('log'), timestamp: t })), ...prev]);
    if (logs.length) c.persistir(() => servicioNotificaciones.enviarLote(logs), `Campaña enviada a ${destino.length} alumnos`);
    return destino.length;
  };

  return {
    updateNotificationRule,
    toggleNotificationRule: (id: string) => {
      const regla = c.d.notificationRules.find(r => r.id === id);
      if (regla) updateNotificationRule(id, { enabled: !regla.enabled });
    },
    addNotificationLog,
    sendDirectNotification,
    sendManualCampaign,
    triggerRealWebNotification,
    clearNotificationLogs: () => {
      c.actualizar('notificationLogs', () => []);
      c.persistir(() => servicioNotificaciones.limpiar(), 'Historial vaciado');
    },
    addClassNotice: (datos: Omit<GymClassNotice, 'id'>) => {
      c.actualizar('classes', prev => [{ ...datos, id: idTemporal('class') }, ...prev]);
      c.persistir(() => servicioNotificaciones.crearClase(datos), `Clase ${datos.name} publicada`);
    },
    deleteClassNotice: (id: string) => {
      c.actualizar('classes', prev => prev.filter(x => x.id !== id));
      c.persistir(() => servicioNotificaciones.eliminarClase(id), 'Clase eliminada');
    },
  };
}
