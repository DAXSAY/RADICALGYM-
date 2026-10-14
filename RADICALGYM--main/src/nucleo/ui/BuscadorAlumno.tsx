import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/clienteHttp';

interface OpcionAlumno { idalumno: number; nombre: string; dni: string }

/** Autocompletado de alumnos por nombre, DNI o código. */
export function BuscadorAlumno({ etiqueta = 'Alumno', valor, alCambiar }: {
  etiqueta?: string;
  valor: OpcionAlumno | null;
  alCambiar: (a: OpcionAlumno | null) => void;
}) {
  const [texto, setTexto] = useState('');
  const [opciones, setOpciones] = useState<OpcionAlumno[]>([]);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(() => {
      api.get<OpcionAlumno[]>('/alumnos/opciones', { buscar: texto }).then(setOpciones).catch(() => setOpciones([]));
    }, 250);
    return () => clearTimeout(t);
  }, [texto, abierto]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  return (
    <div ref={caja} className="relative">
      <span className="block text-[11px] font-semibold text-tenue mb-1">{etiqueta}</span>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-tenue absolute left-3 top-1/2 -translate-y-1/2" />
        <input className="campo !pl-8"
          placeholder="Nombre, DNI o código"
          value={valor && !abierto ? `${valor.nombre} · ${valor.idalumno}` : texto}
          onFocus={() => { setAbierto(true); setTexto(''); }}
          onChange={e => { setTexto(e.target.value); if (valor) alCambiar(null); }} />
      </div>
      {abierto && opciones.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-borde rounded-xl shadow-lg max-h-56 overflow-y-auto desplazable py-1">
          {opciones.map(o => (
            <li key={o.idalumno}>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-oro-suave/60 cursor-pointer flex justify-between gap-2"
                onClick={() => { alCambiar(o); setAbierto(false); }}>
                <span className="font-medium">{o.nombre}</span>
                <span className="text-tenue">{o.idalumno} · {o.dni}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { OpcionAlumno };
