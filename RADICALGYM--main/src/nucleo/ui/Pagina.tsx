import type { ReactNode } from 'react';

/** Encabezado de página: título, descripción corta y acciones a la derecha. */
export function EncabezadoPagina({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-lg font-bold tracking-tight">{titulo}</h1>
        {descripcion && <p className="text-tenue mt-0.5">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function Seccion({ titulo, acciones, children, className = '' }: { titulo?: string; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`tarjeta ${className}`}>
      {(titulo || acciones) && (
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
          {titulo && <h2 className="text-[13px] font-bold">{titulo}</h2>}
          {acciones}
        </div>
      )}
      {children}
    </section>
  );
}

export function Indicador({ etiqueta, valor, detalle, color = 'bg-oro-suave' }: { etiqueta: string; valor: ReactNode; detalle?: string; color?: string }) {
  return (
    <div className="tarjeta p-4 flex flex-col gap-1">
      <span className="text-[11px] text-tenue font-semibold flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${color}`} />{etiqueta}
      </span>
      <span className="text-xl font-bold tracking-tight">{valor}</span>
      {detalle && <span className="text-[11px] text-tenue">{detalle}</span>}
    </div>
  );
}

export function Pestanas<T extends string>({ opciones, valor, alCambiar }: { opciones: { valor: T; texto: string }[]; valor: T; alCambiar: (v: T) => void }) {
  return (
    <div className="inline-flex p-1 bg-white border border-borde rounded-xl gap-1 overflow-x-auto max-w-full">
      {opciones.map(o => (
        <button key={o.valor} onClick={() => alCambiar(o.valor)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors
            ${valor === o.valor ? 'bg-negro text-oro' : 'text-tenue hover:text-texto'}`}>
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ nombre, foto, tamano = 'w-8 h-8' }: { nombre: string; foto?: string | null; tamano?: string }) {
  if (foto) return <img src={foto} alt={nombre} className={`${tamano} rounded-full object-cover shrink-0`} />;
  const letras = nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  return <span className={`${tamano} rounded-full bg-oro-suave text-[#8a6700] font-bold text-[11px] flex items-center justify-center shrink-0`}>{letras}</span>;
}
