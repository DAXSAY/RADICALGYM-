import React from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { useGym } from '../contexto/GymContext';
import type { NavTab, RutaModulo } from '../router/enrutador';
import { useSesion } from '../sesion/SesionContexto';
import { InsigniaRol } from '../../modulos/autenticacion/ui/UserAuthModal';

interface SidebarProps {
  rutas: RutaModulo[];
  activeTab: NavTab | '';
  setActiveTab: (tab: NavTab) => void;
  onOpenUserAuthModal?: () => void;
}

const GRUPOS: { id: RutaModulo['grupo']; titulo: string; etiqueta: string; insignia: string }[] = [
  { id: 'cuenta', titulo: 'Mi Cuenta', etiqueta: 'Personal', insignia: 'bg-blue-400 text-slate-950' },
  { id: 'gestion', titulo: 'Gestión & Personal', etiqueta: 'Base', insignia: 'bg-amber-500 text-slate-950' },
  { id: 'salud', titulo: 'Salud & Citas', etiqueta: 'Clínica', insignia: 'bg-cyan-400 text-slate-950' },
  { id: 'operativo', titulo: 'Operativo & Caja', etiqueta: 'Recepción', insignia: 'bg-rose-500 text-white' },
];

/** Barra lateral del diseño original; muestra solo los módulos permitidos para el rol del usuario. */
export const Sidebar: React.FC<SidebarProps> = ({ rutas, activeTab, setActiveTab, onOpenUserAuthModal }) => {
  const ctx = useGym();
  const { currentUser } = ctx;
  const { salir } = useSesion();

  return (
    <aside className="w-full lg:w-56 bg-slate-900 text-white min-h-full border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-lg select-none">
      <div className="p-3 lg:p-4 space-y-4">
        {GRUPOS.map(grupo => {
          const items = rutas.filter(r => r.grupo === grupo.id);
          if (!items.length) return null;
          return (
            <div key={grupo.id}>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 pt-1 flex items-center justify-between">
                <span>{grupo.titulo}</span>
                <span className="text-[10px] text-slate-500 font-normal">{grupo.etiqueta}</span>
              </div>
              <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
                {items.map(item => {
                  const activo = activeTab === item.id;
                  const badge = item.insignia ? item.insignia(ctx) : 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between space-x-2.5 p-2 rounded-lg text-xs lg:text-sm transition-colors text-left cursor-pointer ${
                        activo ? 'bg-blue-600 text-white font-medium shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          activo ? 'bg-blue-400/25 text-white border border-blue-400/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {item.codigo}
                        </div>
                        <span className="truncate text-xs">{item.titulo}</span>
                      </div>
                      {badge > 0 && (
                        <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded-full ${grupo.insignia}`}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      <div className="p-3 lg:p-4 border-t border-slate-800 space-y-2 hidden lg:block">
        <div
          onClick={onOpenUserAuthModal}
          className="bg-slate-800/90 hover:bg-slate-750 rounded-xl p-3 text-xs border border-slate-700/70 cursor-pointer transition-all hover:border-blue-500/50 group"
          title="Mi cuenta"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Usuario Activo</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {currentUser.photoUrl ? <img src={currentUser.photoUrl} alt={currentUser.fullName} className="w-full h-full object-cover" /> : currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 text-xs font-bold truncate group-hover:text-white transition-colors">{currentUser.fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">@{currentUser.username}</div>
            </div>
          </div>
          <div className="mt-2"><InsigniaRol role={currentUser.role} /></div>
          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-blue-400 font-semibold group-hover:text-blue-300">
            <span>Mi cuenta / contraseña</span>
            <span>→</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => ctx.resetToDefaults()}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 cursor-pointer"
            title="Volver a cargar los datos desde el servidor"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button
            onClick={() => void salir()}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] text-rose-300 hover:text-white hover:bg-rose-600/80 border border-slate-800 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>
    </aside>
  );
};
