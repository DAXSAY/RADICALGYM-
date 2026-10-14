import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Buscador con espera (debounce) para no consultar la API en cada tecla. */
export function Buscador({ valor, alCambiar, placeholder = 'Buscar…', className = '' }: {
  valor: string; alCambiar: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  useEffect(() => {
    if (texto === valor) return;
    const t = setTimeout(() => alCambiar(texto), 300);
    return () => clearTimeout(t);
  }, [texto, valor, alCambiar]);
  return (
    <div className={`relative ${className}`}>
      <Search className="w-3.5 h-3.5 text-tenue absolute left-3 top-1/2 -translate-y-1/2" />
      <input className="campo !pl-8" placeholder={placeholder} value={texto} onChange={e => setTexto(e.target.value)} />
    </div>
  );
}
