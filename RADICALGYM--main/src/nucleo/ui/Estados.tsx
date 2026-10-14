import { Inbox, Loader2 } from 'lucide-react';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-tenue">
      <Loader2 className="w-4 h-4 animate-spin" /> {texto}
    </div>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-tenue">
      <Inbox className="w-6 h-6 opacity-60" />
      <span>{texto}</span>
    </div>
  );
}
