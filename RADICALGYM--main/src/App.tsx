import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { GymProvider, useGym } from './nucleo/contexto/GymContext';
import { Header } from './nucleo/diseno/Header';
import { Sidebar } from './nucleo/diseno/Sidebar';
import { navegar, useTabActual, type NavTab, type PropsModulo } from './nucleo/router/enrutador';
import { useSesion } from './nucleo/sesion/SesionContexto';
import { RUTAS } from './modulos';
import { NewMemberModal } from './modulos/alumnos/ui/NewMemberModal';
import { UserAuthModal } from './modulos/autenticacion/ui/UserAuthModal';
import { PaginaIngreso } from './modulos/autenticacion/ui/PaginaIngreso';

const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" /> {texto}
  </div>
);

function MainAppContent() {
  const { currentUser, cargando } = useGym();
  const tab = useTabActual();
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isUserAuthModalOpen, setIsUserAuthModalOpen] = useState(false);

  const rutas = useMemo(() => RUTAS.filter(r => r.roles.includes(currentUser.role)), [currentUser.role]);
  const actual = rutas.find(r => r.id === tab);

  // Ruta no permitida o vacía: ir a la primera del rol
  useEffect(() => {
    if (!actual && rutas.length) navegar(rutas[0].id);
  }, [actual, rutas]);

  useEffect(() => {
    document.title = actual ? `${actual.titulo} · Radical Gym` : 'Radical Gym';
  }, [actual]);

  const setActiveTab = (t: NavTab) => navegar(t);
  const props: PropsModulo = {
    setActiveTab,
    onOpenNewMemberModal: () => setIsNewMemberModalOpen(true),
    onOpenQuickSaleModal: () => setActiveTab('store'),
    onOpenNewExpenseModal: () => setActiveTab('finance'),
  };
  const Componente = actual?.componente;

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-blue-600 selection:text-white" style={{ backgroundColor: '#f3f4f6' }}>
      <Header
        activeTab={(tab || 'dashboard') as NavTab}
        setActiveTab={setActiveTab}
        onOpenNewMemberModal={props.onOpenNewMemberModal}
        onOpenQuickSaleModal={props.onOpenQuickSaleModal}
        onOpenNewExpenseModal={props.onOpenNewExpenseModal}
        onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full mx-auto">
        <Sidebar rutas={rutas} activeTab={tab} setActiveTab={setActiveTab} onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0 bg-gray-100">
          {cargando ? <Cargando texto="Cargando datos del gimnasio…" /> : (
            <Suspense fallback={<Cargando />}>
              {Componente && <Componente key={actual!.id} {...props} />}
            </Suspense>
          )}
        </main>
      </div>

      <NewMemberModal isOpen={isNewMemberModalOpen} onClose={() => setIsNewMemberModalOpen(false)} />
      <UserAuthModal isOpen={isUserAuthModalOpen} onClose={() => setIsUserAuthModalOpen(false)} />
    </div>
  );
}

export default function App() {
  const { usuario, cargando } = useSesion();
  if (cargando) return <Cargando texto="Verificando sesión…" />;
  if (!usuario) return <PaginaIngreso />;
  return (
    <GymProvider>
      <MainAppContent />
    </GymProvider>
  );
}
