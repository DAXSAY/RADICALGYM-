import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BadgeDollarSign, 
  Briefcase, 
  Store, 
  BellRing,
  RotateCcw,
  Sparkles, 
  Utensils, 
  HeartPulse, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  GraduationCap,
  Bike,
  Dumbbell,
  Activity,
  ArrowRight
} from 'lucide-react';
import { NavTab } from './Header';
import { useGym } from '../../context/GymContext';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenUserAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onOpenUserAuthModal }) => {
  const { 
    renewalAlerts, 
    lowStockProducts, 
    resetToDefaults, 
    currentUser, 
    attendances,
    appointments,
    staffContracts,
    members
  } = useGym();
  
  const expiringContractsCount = staffContracts.filter(c => c.status === 'expiring_soon').length;

  const currentMember = members.find(m => m.id === currentUser?.memberId) || members[0];

  // ==========================================
  // NAVIGATION MATRICES PER ROLE
  // ==========================================

  // 1. STUDENT NAV (Strictly restricted to the 4 sections requested)
  const studentNav: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'mi_membresia', code: 'MB', label: 'Mi Membresía & Matrícula', icon: CreditCard },
    { id: 'mis_citas', code: 'CT', label: 'Notificaciones & Citas', icon: Calendar, badge: appointments.filter(a => a.status === 'scheduled').length || undefined },
    { id: 'spinning_cine', code: 'SP', label: 'Salón de Spinning (Cine)', icon: Bike },
    { id: 'mis_medidas', code: 'MD', label: 'Mis Medidas & Progreso', icon: Activity },
  ];

  // 2. TRAINER NAV (Routines, Members, Nutrition, Physio, Attendance, Spinning, Appointments)
  const trainerNavGroup1: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', code: 'DB', label: 'Resumen Deportivo', icon: LayoutDashboard },
    { id: 'routines', code: 'RT', label: 'Rutinas & Ejercicios', icon: Dumbbell },
    { id: 'members', code: 'AL', label: 'Alumnos & Fichas', icon: Users },
    { id: 'spinning', code: 'SP', label: 'Salón de Spinning', icon: Bike },
    { id: 'appointments', code: 'HC', label: 'Horarios & Citas', icon: Calendar, badge: appointments.filter(a => a.status === 'scheduled').length || undefined },
  ];

  const trainerNavGroup2: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'nutrition', code: 'NM', label: 'Nutrición & Medidas', icon: Utensils },
    { id: 'physiotherapy', code: 'FT', label: 'Fisioterapia', icon: HeartPulse },
    { id: 'attendances', code: 'AS', label: 'Control Asistencias', icon: UserCheck },
  ];

  // 3. RECEPTION NAV (Attendance, Store/POS, Members registration, Memberships, Appointments, Spinning, Alerts)
  const receptionNavGroup1: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'attendances', code: 'AS', label: 'Asistencias & Check-in', icon: UserCheck },
    { id: 'store', code: 'SL', label: 'Ventas / POS & Tienda', icon: Store, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'members', code: 'AL', label: 'Registro de Alumnos', icon: Users },
    { id: 'memberships', code: 'MB', label: 'Planes & Tarifas', icon: CreditCard },
  ];

  const receptionNavGroup2: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'appointments', code: 'HC', label: 'Horarios & Citas', icon: Calendar, badge: appointments.filter(a => a.status === 'scheduled').length || undefined },
    { id: 'spinning', code: 'SP', label: 'Salón de Spinning (Reservas)', icon: Bike },
    { id: 'alerts', code: 'NT', label: 'Notificaciones & Alertas', icon: BellRing, badge: renewalAlerts.length > 0 ? renewalAlerts.length : undefined },
  ];

  // 4. ADMIN NAV (Full unrestricted access to all modules)
  const adminManagementNav: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', code: 'DB', label: 'Dashboard General', icon: LayoutDashboard },
    { id: 'members', code: 'AL', label: 'Alumnos / Socios', icon: Users },
    { id: 'staff', code: 'CP', label: 'Contratos de Personal', icon: Briefcase, badge: expiringContractsCount > 0 ? expiringContractsCount : undefined },
    { id: 'memberships', code: 'MB', label: 'Planes & Tarifas', icon: CreditCard },
  ];

  const adminHealthNav: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'nutrition', code: 'NM', label: 'Nutrición & Medidas', icon: Utensils },
    { id: 'physiotherapy', code: 'FT', label: 'Fisioterapia', icon: HeartPulse },
    { id: 'spinning', code: 'SP', label: 'Salón de Spinning (Cine)', icon: Bike },
    { id: 'routines', code: 'RT', label: 'Rutinas & Ejercicios', icon: Dumbbell },
    { id: 'appointments', code: 'HC', label: 'Horarios & Citas', icon: Calendar, badge: appointments.filter(a => a.status === 'scheduled').length || undefined },
  ];

  const adminOperationsNav: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'attendances', code: 'AS', label: 'Control Asistencias', icon: UserCheck },
    { id: 'store', code: 'SL', label: 'Ventas / POS', icon: Store, badge: lowStockProducts.length > 0 ? lowStockProducts.length : undefined },
    { id: 'finance', code: 'FN', label: 'Finanzas & Caja', icon: BadgeDollarSign },
    { id: 'alerts', code: 'NT', label: 'Notificaciones & Alertas', icon: BellRing, badge: renewalAlerts.length > 0 ? renewalAlerts.length : undefined }
  ];

  const isStudent = currentUser.role === 'student';
  const isTrainer = currentUser.role === 'trainer';
  const isReception = currentUser.role === 'reception' || currentUser.role === 'staff';
  const isAdmin = currentUser.role === 'admin';

  const renderNavButton = (item: { id: NavTab; code: string; label: string; icon: React.FC<{ className?: string }>; badge?: number }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id || 
      (isStudent && (
        (item.id === 'mi_membresia' && (activeTab === 'mi_membresia' || activeTab === 'student_portal' || activeTab === 'memberships')) ||
        (item.id === 'mis_citas' && (activeTab === 'mis_citas' || activeTab === 'appointments')) ||
        (item.id === 'spinning_cine' && (activeTab === 'spinning_cine' || activeTab === 'spinning')) ||
        (item.id === 'mis_medidas' && (activeTab === 'mis_medidas' || activeTab === 'measurements' || activeTab === 'nutrition'))
      ));

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between space-x-2.5 p-2 rounded-lg text-xs lg:text-sm transition-colors text-left cursor-pointer ${
          isActive
            ? 'bg-blue-600 text-white font-medium shadow-sm'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
            isActive 
              ? 'bg-blue-400/25 text-white border border-blue-400/40' 
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}>
            {item.code}
          </div>
          <span className="truncate text-xs">{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-500 text-slate-950">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-full lg:w-56 bg-slate-900 text-white min-h-full border-r border-slate-800 flex flex-col justify-between shrink-0 shadow-lg select-none">
      <div className="p-3 lg:p-4 space-y-4">
        
        {/* Role Indicator Banner */}
        <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isAdmin ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' :
              isTrainer ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' :
              isReception ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' :
              'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
            }`} />
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                Rol Conectado
              </span>
              <span className="text-xs font-black text-white truncate block">
                {isAdmin ? 'Administrador' : isTrainer ? 'Entrenador' : isReception ? 'Recepción' : 'Alumno / Socio'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenUserAuthModal}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
            title="Cambiar de rol o usuario"
          >
            Cambiar
          </button>
        </div>

        {/* ==============================================================
            1. STUDENT VIEW (Restricted Navigation)
           ============================================================== */}
        {isStudent && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-2 pb-1.5 flex items-center justify-between">
                <span>Portal del Alumno</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-black">
                  Exclusivo
                </span>
              </div>
              <nav className="grid grid-cols-1 gap-1">
                {studentNav.map(renderNavButton)}
              </nav>
            </div>

            {/* Student Membership Summary Mini Box */}
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tu Membresía Actual
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate">{currentMember?.planName}</span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 rounded">
                  {currentMember?.status === 'active' ? 'ACTIVO' : 'POR VENCER'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Vence: {currentMember?.membershipEndDate}
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================
            2. TRAINER VIEW (Coaching, Routines, Members, Spinning, Health)
           ============================================================== */}
        {isTrainer && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider px-2 pb-1.5 flex items-center justify-between">
                <span>Área Deportiva & Clases</span>
                <span className="text-[10px] text-slate-500 font-normal">Coach</span>
              </div>
              <nav className="grid grid-cols-1 gap-1">
                {trainerNavGroup1.map(renderNavButton)}
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 pt-1 flex items-center justify-between">
                <span>Salud & Seguimiento</span>
                <span className="text-[10px] text-slate-500 font-normal">Fichas</span>
              </div>
              <nav className="grid grid-cols-1 gap-1">
                {trainerNavGroup2.map(renderNavButton)}
              </nav>
            </div>
          </div>
        )}

        {/* ==============================================================
            3. RECEPTION VIEW (Attendances, POS, Registration, Spinning, Citas)
           ============================================================== */}
        {isReception && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2 pb-1.5 flex items-center justify-between">
                <span>Mostrador & Caja</span>
                <span className="text-[10px] text-slate-500 font-normal">Recepción</span>
              </div>
              <nav className="grid grid-cols-1 gap-1">
                {receptionNavGroup1.map(renderNavButton)}
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 pt-1 flex items-center justify-between">
                <span>Servicios & Horarios</span>
                <span className="text-[10px] text-slate-500 font-normal">Citas</span>
              </div>
              <nav className="grid grid-cols-1 gap-1">
                {receptionNavGroup2.map(renderNavButton)}
              </nav>
            </div>
          </div>
        )}

        {/* ==============================================================
            4. ADMIN VIEW (Unrestricted - Full Access)
           ============================================================== */}
        {isAdmin && (
          <div className="space-y-4">
            {/* Group 1: Gestión */}
            <div>
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider px-2 pb-1.5 flex items-center justify-between">
                <span>Gestión & Personal</span>
                <span className="text-[10px] text-slate-500 font-normal">Base</span>
              </div>
              <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
                {adminManagementNav.map(renderNavButton)}
              </nav>
            </div>

            {/* Group 2: Salud & Clases */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 pt-1 flex items-center justify-between">
                <span>Salud, Spinning & Rutinas</span>
                <span className="text-[10px] text-slate-500 font-normal">Clínica</span>
              </div>
              <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                {adminHealthNav.map(renderNavButton)}
              </nav>
            </div>

            {/* Group 3: Operativo */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5 pt-1 flex items-center justify-between">
                <span>Operativo & Caja</span>
                <span className="text-[10px] text-slate-500 font-normal">Finanzas</span>
              </div>
              <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
                {adminOperationsNav.map(renderNavButton)}
              </nav>
            </div>
          </div>
        )}

      </div>

      {/* Footer Info / User Switcher / Status */}
      <div className="p-3 lg:p-4 border-t border-slate-800 space-y-2 hidden lg:block">
        <div 
          onClick={onOpenUserAuthModal}
          className="bg-slate-800/90 hover:bg-slate-750 rounded-xl p-3 text-xs border border-slate-700/70 cursor-pointer transition-all hover:border-blue-500/50 group"
          title="Cambiar usuario o iniciar sesión"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">Usuario Conectado</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
              isAdmin
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50' 
                : isTrainer
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                : isReception
                ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
            }`}>
              {isAdmin ? 'Administrador' : isTrainer ? 'Entrenador' : isReception ? 'Recepción' : 'Alumno'}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                currentUser.fullName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200 text-xs font-bold truncate group-hover:text-white transition-colors">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                @{currentUser.username}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-blue-400 font-semibold group-hover:text-blue-300">
            <span>Cambiar rol / Login</span>
            <span>→</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Deseas restaurar los datos de ejemplo iniciales?')) {
              resetToDefaults();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Restablecer datos a estado inicial"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer datos demo
        </button>
      </div>
    </aside>
  );
};
