import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Pagina una lista en el cliente para que las tablas grandes no saturen la pantalla. */
export function usePaginacion<T>(items: T[], porPagina = 10) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina));
  // Si cambian los filtros y la página queda fuera de rango, volver a la última válida
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);
  const visibles = useMemo(() => items.slice((pagina - 1) * porPagina, pagina * porPagina), [items, pagina, porPagina]);
  return { visibles, pagina, setPagina, totalPaginas, total: items.length, porPagina };
}

/** Controles de paginación con el estilo del diseño original. */
export const Paginador: React.FC<{ p: ReturnType<typeof usePaginacion<unknown>> }> = ({ p }) => {
  if (p.total <= p.porPagina) return null;
  const desde = (p.pagina - 1) * p.porPagina + 1;
  const hasta = Math.min(p.pagina * p.porPagina, p.total);
  const boton = 'p-1.5 rounded-md border border-gray-300 bg-white text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-default cursor-pointer';
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-gray-200 bg-white text-[11px] text-slate-500">
      <span>Mostrando <strong className="text-slate-800">{desde}–{hasta}</strong> de <strong className="text-slate-800">{p.total}</strong></span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={boton} disabled={p.pagina <= 1} onClick={() => p.setPagina(p.pagina - 1)} aria-label="Página anterior">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2 font-bold text-slate-800">{p.pagina} / {p.totalPaginas}</span>
        <button type="button" className={boton} disabled={p.pagina >= p.totalPaginas} onClick={() => p.setPagina(p.pagina + 1)} aria-label="Página siguiente">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
