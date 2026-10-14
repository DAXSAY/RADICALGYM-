import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  abierto: boolean;
  titulo: string;
  subtitulo?: string;
  alCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg' | 'xl';
}

const ANCHOS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export function Dialogo({ abierto, titulo, subtitulo, alCerrar, children, pie, ancho = 'md' }: Props) {
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto, alCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-[2px]"
         onMouseDown={e => e.target === e.currentTarget && alCerrar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo}
           className={`aparecer w-full ${ANCHOS[ancho]} bg-white rounded-2xl shadow-xl flex flex-col max-h-[92vh]`}>
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-borde">
          <div>
            <h2 className="text-sm font-bold">{titulo}</h2>
            {subtitulo && <p className="text-[11px] text-tenue mt-0.5">{subtitulo}</p>}
          </div>
          <button onClick={alCerrar} aria-label="Cerrar" className="p-1 rounded-lg text-tenue hover:bg-pastel-gris cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="px-5 py-4 overflow-y-auto desplazable">{children}</div>
        {pie && <footer className="px-5 py-3 border-t border-borde flex justify-end gap-2">{pie}</footer>}
      </div>
    </div>
  );
}
