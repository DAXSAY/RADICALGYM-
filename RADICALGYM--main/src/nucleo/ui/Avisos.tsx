import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type Aviso = { id: number; texto: string; tipo: 'exito' | 'error' };
const Contexto = createContext<(texto: string, tipo?: Aviso['tipo']) => void>(() => {});

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const avisar = useCallback((texto: string, tipo: Aviso['tipo'] = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos(a => [...a, { id, texto, tipo }]);
    setTimeout(() => setAvisos(a => a.filter(x => x.id !== id)), 3500);
  }, []);
  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-xs" aria-live="polite">
        {avisos.map(a => (
          <div key={a.id} className={`aparecer flex items-start gap-2 px-3.5 py-2.5 rounded-xl shadow-lg text-xs font-medium
            ${a.tipo === 'exito' ? 'bg-negro text-white' : 'bg-rojo text-white'}`}>
            {a.tipo === 'exito' ? <CheckCircle2 className="w-4 h-4 text-oro shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{a.texto}</span>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export const useAvisos = () => useContext(Contexto);
