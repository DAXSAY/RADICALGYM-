import type { ReactNode } from 'react';
import { Cargando, Vacio } from './Estados';

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
  className?: string;
  ocultarEnMovil?: boolean;
}

interface Props<T> {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string | number;
  cargando?: boolean;
  vacio?: string;
  alSeleccionar?: (fila: T) => void;
}

export function Tabla<T>({ columnas, filas, clave, cargando, vacio = 'Sin registros', alSeleccionar }: Props<T>) {
  if (cargando && !filas.length) return <Cargando />;
  if (!filas.length) return <Vacio texto={vacio} />;
  return (
    <div className={`overflow-x-auto desplazable ${cargando ? 'opacity-60' : ''}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[11px] text-tenue">
            {columnas.map(c => (
              <th key={c.titulo} className={`font-semibold px-3 py-2.5 whitespace-nowrap ${c.ocultarEnMovil ? 'hidden md:table-cell' : ''} ${c.className ?? ''}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map(f => (
            <tr key={clave(f)} onClick={() => alSeleccionar?.(f)}
                className={`border-t border-borde/70 ${alSeleccionar ? 'cursor-pointer hover:bg-oro-suave/50' : ''}`}>
              {columnas.map(c => (
                <td key={c.titulo} className={`px-3 py-2.5 align-middle ${c.ocultarEnMovil ? 'hidden md:table-cell' : ''} ${c.className ?? ''}`}>
                  {c.celda(f)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
