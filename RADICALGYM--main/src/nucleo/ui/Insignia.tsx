import type { ReactNode } from 'react';

export type Tono = 'oro' | 'verde' | 'rojo' | 'azul' | 'lila' | 'naranja' | 'gris';

const TONOS: Record<Tono, string> = {
  oro: 'bg-oro-suave text-[#8a6700]',
  verde: 'bg-pastel-verde text-verde',
  rojo: 'bg-pastel-rojo text-rojo',
  azul: 'bg-pastel-azul text-azul',
  lila: 'bg-pastel-lila text-lila',
  naranja: 'bg-pastel-naranja text-naranja',
  gris: 'bg-pastel-gris text-tenue',
};

export function Insignia({ tono = 'gris', children }: { tono?: Tono; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${TONOS[tono]}`}>{children}</span>;
}

/** Tonos estándar para estados que vienen de la API. */
export const TONO_ESTADO: Record<string, Tono> = {
  activa: 'verde', vigente: 'verde', puntual: 'verde', aprobado: 'verde', atendida: 'verde', redimido: 'verde',
  por_vencer: 'oro', pendiente: 'oro', tarde: 'oro', programada: 'azul', pospuesta: 'naranja', congelada: 'azul',
  vencida: 'rojo', vencido: 'rojo', falta: 'rojo', rechazado: 'rojo', cancelada: 'gris', anulada: 'gris',
  permiso: 'lila', renovado: 'gris', sin_plan: 'gris', sin_marca: 'gris',
};

export function InsigniaEstado({ estado }: { estado: string }) {
  return <Insignia tono={TONO_ESTADO[estado] ?? 'gris'}>{estado.replace(/_/g, ' ')}</Insignia>;
}
