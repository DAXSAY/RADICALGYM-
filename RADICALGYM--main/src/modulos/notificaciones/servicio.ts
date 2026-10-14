import { api } from '../../nucleo/api/clienteHttp';
import type { GymClassNotice, NotificationCategory, NotificationChannel, NotificationLog, NotificationRule } from '../../nucleo/tipos/gym';
import { Fila, idNum, num, opc, txt } from '../../nucleo/utilidades/mapeo';

const CATEGORIA: Record<string, NotificationCategory> = {
  vencimiento: 'renewal_reminder', clase: 'class_notice', promocion: 'special_promo', aviso: 'general_alert', cumpleanos: 'birthday',
};
const CATEGORIA_API: Record<NotificationCategory, string> = {
  renewal_reminder: 'vencimiento', class_notice: 'clase', special_promo: 'promocion', general_alert: 'aviso', birthday: 'cumpleanos',
};
const CANAL: Record<string, NotificationChannel> = { push: 'push', correo: 'email', whatsapp: 'whatsapp', sms: 'sms' };
const CANAL_API: Record<NotificationChannel, string> = { push: 'push', email: 'correo', whatsapp: 'whatsapp', sms: 'sms' };
const ESTADO: Record<string, NotificationLog['status']> = { enviado: 'sent', entregado: 'delivered', leido: 'read', programado: 'scheduled' };

export const adaptarRegla = (r: Fila): NotificationRule => ({
  id: String(r.idregla), name: txt(r.nombre), category: CATEGORIA[r.categoria] ?? 'general_alert', enabled: !!Number(r.activa),
  channels: txt(r.canales).split('|').filter(Boolean).map(c => CANAL[c] ?? 'push'), triggerTiming: txt(r.momento),
  timingValueDays: num(r.dias), templateTitle: txt(r.titulo_plantilla), templateBody: txt(r.cuerpo_plantilla), badgeTag: txt(r.etiqueta),
});

export const adaptarNotificacion = (n: Fila): NotificationLog => ({
  id: String(n.idnotificacion), recipientId: n.idalumno ? String(n.idalumno) : undefined,
  recipientName: txt(n.destinatario_nombre) || (n.destino === 'alumnos' ? 'Todos los alumnos' : n.destino === 'personal' ? 'Todo el personal' : 'Todos'),
  recipientEmail: opc(n.destinatario_correo), recipientPhone: opc(n.destinatario_telefono), category: CATEGORIA[n.tipo] ?? 'general_alert',
  channel: CANAL[n.canal] ?? 'push', title: txt(n.titulo), message: txt(n.mensaje), timestamp: txt(n.fecha).slice(0, 16),
  status: Number(n.leida) ? 'read' : ESTADO[n.estado_envio] ?? 'delivered', targetAudience: opc(n.publico),
});

export const adaptarClase = (c: Fila): GymClassNotice => ({
  id: String(c.idclase), name: txt(c.nombre), instructorName: txt(c.instructor), schedule: txt(c.horario), room: txt(c.sala),
  registeredCount: num(c.inscritos), capacity: num(c.capacidad), date: txt(c.fecha),
});

export const notificacionHaciaApi = (n: Omit<NotificationLog, 'id' | 'timestamp'>) => ({
  titulo: n.title, mensaje: n.message, destino: idNum(n.recipientId) ? 'alumno' : 'todos', idalumno: idNum(n.recipientId) || undefined,
  tipo: CATEGORIA_API[n.category], canal: CANAL_API[n.channel], estado_envio: 'entregado', destinatario_nombre: n.recipientName,
  destinatario_correo: n.recipientEmail, destinatario_telefono: n.recipientPhone, publico: n.targetAudience,
});

export const servicioNotificaciones = {
  actualizarRegla: (r: NotificationRule) => api.put(`/reglas/${r.id}`, {
    nombre: r.name, categoria: CATEGORIA_API[r.category], activa: r.enabled ? 1 : 0, canales: r.channels.map(c => CANAL_API[c]).join('|'),
    momento: r.triggerTiming, dias: r.timingValueDays, titulo_plantilla: r.templateTitle, cuerpo_plantilla: r.templateBody, etiqueta: r.badgeTag,
  }),
  enviar: (n: Omit<NotificationLog, 'id' | 'timestamp'>) => api.post('/notificaciones', notificacionHaciaApi(n)),
  enviarLote: (lista: Omit<NotificationLog, 'id' | 'timestamp'>[]) => api.post('/notificaciones/lote', { notificaciones: lista.map(notificacionHaciaApi) }),
  limpiar: () => api.delete('/notificaciones'),
  crearClase: (c: Omit<GymClassNotice, 'id'>) => api.post('/clases', {
    nombre: c.name, instructor: c.instructorName, horario: c.schedule, sala: c.room, inscritos: c.registeredCount, capacidad: c.capacity, fecha: c.date,
  }),
  eliminarClase: (id: string) => api.delete(`/clases/${id}`),
};
