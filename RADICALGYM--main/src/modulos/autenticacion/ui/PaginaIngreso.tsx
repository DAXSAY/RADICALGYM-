import { Loader2, LogIn } from 'lucide-react';
import { useIngresoControlador } from '../controlador';

/** Ingreso al sistema con el estilo del diseño original (slate / azul). */
export function PaginaIngreso() {
  const c = useIngresoControlador();
  const campo = 'w-full bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-xs text-slate-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600';
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-100 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
        <img src="/logo-completo.png" alt="Radical Gym" className="w-60 object-contain" />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight font-['Outfit',sans-serif]">Sistema de gestión <span className="text-blue-400">Radical Gym</span></h1>
          <p className="text-slate-400 mt-3 max-w-sm text-sm">Alumnos, contratos de personal, nutrición, fisioterapia, spinning, asistencias, ventas y caja.</p>
        </div>
        <span className="text-slate-500 text-[11px]">Radical Gym · Panel de administración</span>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={c.enviar} className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="lg:hidden bg-slate-900 rounded-xl p-4 flex justify-center"><img src="/logo-completo.png" alt="Radical Gym" className="w-40" /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Iniciar sesión</h2>
            <p className="text-xs text-slate-500 mt-1">Los alumnos ingresan con su DNI.</p>
          </div>
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Usuario o DNI</span>
            <input className={campo} value={c.usuario} onChange={e => c.setUsuario(e.target.value)} autoFocus required autoComplete="username" />
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-slate-700 mb-1">Contraseña</span>
            <input className={campo} type="password" value={c.clave} onChange={e => c.setClave(e.target.value)} required autoComplete="current-password" />
          </label>
          {c.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2 text-xs font-medium">{c.error}</div>}
          <button type="submit" disabled={c.enviando}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60">
            {c.enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />} Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
