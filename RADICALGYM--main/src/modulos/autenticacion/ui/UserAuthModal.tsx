import React, { useState } from 'react';
import {
  ShieldCheck, Dumbbell, GraduationCap, Users, Plus, LogOut, CheckCircle2, X, Sparkles, Key, UserCheck, Apple, HeartPulse, Search,
} from 'lucide-react';
import { useGym } from '../../../nucleo/contexto/GymContext';
import { useSesion } from '../../../nucleo/sesion/SesionContexto';
import { useAvisos } from '../../../nucleo/ui/Avisos';
import type { UserRole } from '../../../nucleo/tipos/gym';
import { servicioAutenticacion } from '../servicio';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: { role: UserRole; label: string; icon: React.FC<{ className?: string }>; estilo: string }[] = [
  { role: 'admin', label: 'Administrador', icon: ShieldCheck, estilo: 'bg-purple-100 text-purple-700 border-purple-200' },
  { role: 'staff', label: 'Recepción', icon: Users, estilo: 'bg-amber-100 text-amber-700 border-amber-200' },
  { role: 'trainer', label: 'Entrenador', icon: Dumbbell, estilo: 'bg-blue-100 text-blue-700 border-blue-200' },
  { role: 'nutritionist', label: 'Nutricionista', icon: Apple, estilo: 'bg-lime-100 text-lime-700 border-lime-200' },
  { role: 'physiotherapist', label: 'Fisioterapeuta', icon: HeartPulse, estilo: 'bg-rose-100 text-rose-700 border-rose-200' },
  { role: 'student', label: 'Alumno', icon: GraduationCap, estilo: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

export const InsigniaRol: React.FC<{ role: UserRole }> = ({ role }) => {
  const r = ROLES.find(x => x.role === role) ?? ROLES[5];
  const Icono = r.icon;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center space-x-1 w-fit ${r.estilo}`}>
      <Icono className="w-3 h-3" />
      <span>{r.label}</span>
    </span>
  );
};

const campo = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden';

/** Cuenta del usuario conectado: cerrar sesión, cambiar clave y (administrador) gestionar cuentas de acceso. */
export const UserAuthModal: React.FC<UserAuthModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, registerUser, members, staffContracts } = useGym();
  const { salir } = useSesion();
  const avisar = useAvisos();
  const esAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'accounts' | 'register' | 'password'>(esAdmin ? 'accounts' : 'password');
  const [busqueda, setBusqueda] = useState('');

  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [linkedId, setLinkedId] = useState('');

  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const vinculables = newRole === 'student'
    ? members.filter(m => !users.some(u => u.memberId === m.id)).map(m => ({ id: m.id, texto: `${m.fullName} (DNI ${m.dni})` }))
    : staffContracts.filter(s => !users.some(u => u.staffId === s.staffId)).map(s => ({ id: s.staffId, texto: `${s.fullName} · ${s.roleTitle}` }));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newPassword.length < 6 || !linkedId) {
      avisar('Completa usuario, una clave de al menos 6 caracteres y la persona vinculada', 'error');
      return;
    }
    const persona = vinculables.find(v => v.id === linkedId);
    registerUser({
      username: newUsername.trim(), password: newPassword, fullName: persona?.texto.split(' (')[0].split(' · ')[0] ?? newUsername,
      email: '', role: newRole, active: true,
      memberId: newRole === 'student' ? linkedId : undefined,
      staffId: newRole !== 'student' ? linkedId : undefined,
    });
    setNewUsername(''); setNewPassword(''); setLinkedId('');
    setActiveTab('accounts');
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await servicioAutenticacion.cambiarClave(claveActual, claveNueva);
      avisar('Contraseña actualizada');
      setClaveActual(''); setClaveNueva('');
    } catch (err) {
      avisar((err as Error).message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const pestana = (id: typeof activeTab, Icono: React.FC<{ className?: string }>, texto: string) => (
    <button onClick={() => setActiveTab(id)}
      className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
        activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
      <Icono className="w-3.5 h-3.5" />
      <span>{texto}</span>
    </button>
  );

  const cuentas = users.filter(u => !busqueda || `${u.fullName} ${u.username}`.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Mi Cuenta & Accesos</h2>
              <p className="text-xs text-slate-500">Sesión actual, cambio de contraseña{esAdmin ? ' y cuentas del personal y alumnos' : ''}.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm bg-blue-600 text-white font-black flex items-center justify-center text-base overflow-hidden">
              {currentUser.photoUrl ? <img src={currentUser.photoUrl} alt={currentUser.fullName} className="w-full h-full object-cover" /> : currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-semibold">Sesión actual:</span>
                <InsigniaRol role={currentUser.role} />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{currentUser.fullName}</h3>
              <p className="text-[11px] text-slate-500">@{currentUser.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conectado</span>
            </span>
            <button onClick={() => { onClose(); void salir(); }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50/50 px-5 pt-3 overflow-x-auto">
          {esAdmin && pestana('accounts', Users, `Cuentas del sistema (${users.length})`)}
          {esAdmin && pestana('register', Plus, 'Crear cuenta de acceso')}
          {pestana('password', Key, 'Cambiar mi contraseña')}
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'accounts' && esAdmin && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input className={`${campo} pl-8`} placeholder="Buscar por nombre o usuario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cuentas.slice(0, 40).map(u => (
                  <div key={u.id} className={`p-3.5 rounded-xl border flex items-start space-x-3 ${u.id === currentUser.id ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500' : 'border-slate-200 bg-white'}`}>
                    <div className="w-10 h-10 rounded-full shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {u.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate mb-1">{u.fullName}</h4>
                      <div className="mb-1.5"><InsigniaRol role={u.role} /></div>
                      <p className="text-[11px] text-slate-500 truncate">Usuario: @{u.username}</p>
                      {!u.active && <p className="text-[10px] text-rose-600 font-bold">Cuenta desactivada</p>}
                    </div>
                  </div>
                ))}
              </div>
              {cuentas.length > 40 && <p className="text-[11px] text-slate-400 text-center">Mostrando 40 de {cuentas.length}. Usa el buscador para encontrar más.</p>}
            </div>
          )}

          {activeTab === 'register' && esAdmin && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 font-medium flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Los alumnos y trabajadores nuevos ya reciben una cuenta (usuario y clave = DNI). Aquí puedes crear cuentas adicionales.</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de rol *</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ROLES.map(item => (
                    <button type="button" key={item.role} onClick={() => { setNewRole(item.role); setLinkedId(''); }}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                        newRole === item.role ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">{newRole === 'student' ? 'Alumno' : 'Trabajador'} vinculado *</label>
                  <select value={linkedId} onChange={e => setLinkedId(e.target.value)} className={campo} required>
                    <option value="">-- Seleccionar --</option>
                    {vinculables.map(v => <option key={v.id} value={v.id}>{v.texto}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario *</label>
                  <input className={campo} value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ej. lucia.paredes" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña inicial * (mín. 6)</label>
                  <input type="password" className={campo} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">Crear cuenta</button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña actual</label>
                <input type="password" className={campo} value={claveActual} onChange={e => setClaveActual(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nueva contraseña (mín. 6)</label>
                <input type="password" className={campo} value={claveNueva} onChange={e => setClaveNueva(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" disabled={guardando} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                {guardando ? 'Guardando…' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
