import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'oscuro';

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-oro text-negro hover:bg-oro-hover',
  oscuro: 'bg-negro text-white hover:bg-grafito',
  secundario: 'bg-white text-texto border border-borde hover:bg-fondo',
  fantasma: 'text-tenue hover:bg-pastel-gris hover:text-texto',
  peligro: 'bg-pastel-rojo text-rojo hover:bg-rojo hover:text-white',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icono?: ReactNode;
  cargando?: boolean;
  pequeno?: boolean;
}

export function Boton({ variante = 'primario', icono, cargando, pequeno, className = '', children, disabled, ...resto }: Props) {
  return (
    <button
      {...resto}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-colors cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed ${pequeno ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'} ${ESTILOS[variante]} ${className}`}
    >
      {cargando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icono}
      {children}
    </button>
  );
}
