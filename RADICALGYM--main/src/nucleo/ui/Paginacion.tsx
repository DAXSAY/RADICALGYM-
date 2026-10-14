import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paginado } from '../api/clienteHttp';

interface Props {
  paginacion?: Paginado<unknown>['paginacion'];
  alCambiar: (pagina: number) => void;
}

export function Paginacion({ paginacion, alCambiar }: Props) {
  if (!paginacion || paginacion.total === 0) return null;
  const { pagina, total_paginas, total, por_pagina } = paginacion;
  const desde = (pagina - 1) * por_pagina + 1;
  const hasta = Math.min(pagina * por_pagina, total);
  const boton = 'p-1.5 rounded-lg border border-borde bg-white hover:bg-fondo disabled:opacity-40 cursor-pointer disabled:cursor-default';
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-borde text-[11px] text-tenue">
      <span>{desde}–{hasta} de {total}</span>
      <div className="flex items-center gap-1.5">
        <button className={boton} disabled={pagina <= 1} onClick={() => alCambiar(pagina - 1)} aria-label="Página anterior">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-1.5 font-semibold text-texto">{pagina} / {total_paginas}</span>
        <button className={boton} disabled={pagina >= total_paginas} onClick={() => alCambiar(pagina + 1)} aria-label="Página siguiente">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
