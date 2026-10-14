export const soles = (n: number | string | null | undefined) =>
  `S/ ${Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fecha = (f?: string | null) => {
  if (!f) return '—';
  const [a, m, d] = f.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

export const hoy = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const mesActual = () => hoy().slice(0, 7);

export const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const OBJETIVOS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  perdida_peso: 'Pérdida de peso',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  tonificacion: 'Tonificación',
  rehabilitacion: 'Rehabilitación',
};

export const METODOS_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  yape_plin: 'Yape / Plin',
};

export const iniciales = (nombre: string) =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export const etiqueta = (texto: string) => texto.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
