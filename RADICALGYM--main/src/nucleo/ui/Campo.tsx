import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface Envoltura { etiqueta?: string; error?: string; ayuda?: string; className?: string; children: ReactNode }

function Envoltura({ etiqueta, error, ayuda, className = '', children }: Envoltura) {
  return (
    <label className={`block ${className}`}>
      {etiqueta && <span className="block text-[11px] font-semibold text-tenue mb-1">{etiqueta}</span>}
      {children}
      {error ? <span className="block text-[11px] text-rojo mt-1">{error}</span>
        : ayuda && <span className="block text-[11px] text-tenue mt-1">{ayuda}</span>}
    </label>
  );
}

type PropsTexto = InputHTMLAttributes<HTMLInputElement> & { etiqueta?: string; error?: string; ayuda?: string; contenedor?: string };

export function CampoTexto({ etiqueta, error, ayuda, contenedor, className = '', ...resto }: PropsTexto) {
  return (
    <Envoltura etiqueta={etiqueta} error={error} ayuda={ayuda} className={contenedor}>
      <input {...resto} className={`campo ${error ? '!border-rojo' : ''} ${className}`} />
    </Envoltura>
  );
}

type PropsSeleccion = SelectHTMLAttributes<HTMLSelectElement> & {
  etiqueta?: string; error?: string; contenedor?: string;
  opciones: { valor: string | number; texto: string }[]; vacio?: string;
};

export function CampoSeleccion({ etiqueta, error, contenedor, opciones, vacio, className = '', ...resto }: PropsSeleccion) {
  return (
    <Envoltura etiqueta={etiqueta} error={error} className={contenedor}>
      <select {...resto} className={`campo ${className}`}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    </Envoltura>
  );
}

type PropsArea = TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta?: string; contenedor?: string };

export function CampoArea({ etiqueta, contenedor, className = '', ...resto }: PropsArea) {
  return (
    <Envoltura etiqueta={etiqueta} className={contenedor}>
      <textarea rows={2} {...resto} className={`campo resize-none ${className}`} />
    </Envoltura>
  );
}
