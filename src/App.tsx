import React, { useState, useEffect } from 'react';
import { GymProvider, useGym } from './context/GymContext';
import { Header, NavTab } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { MembersManagement } from './components/members/MembersManagement';
import { NewMemberModal } from './components/members/NewMemberModal';
import { MembershipsPlans } from './components/memberships/MembershipsPlans';
import { FinanceModule } from './components/finance/FinanceModule';
import { StaffContractsModule } from './components/staff/StaffContractsModule';
import { PhysiotherapyModule } from './components/physiotherapy/PhysiotherapyModule';
import { AppointmentsScheduleModule } from './components/appointments/AppointmentsScheduleModule';
import { NutritionMeasurementsModule } from './components/nutrition_measurements/NutritionMeasurementsModule';
import { StorePOS } from './components/store/StorePOS';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { AttendanceModule } from './components/attendances/AttendanceModule';
import { UserAuthModal } from './components/auth/UserAuthModal';
import { StudentPortalModule } from './components/student_portal/StudentPortalModule';

// Specialized modules
import { TrainersManagement } from './components/trainers/TrainersManagement';
import { RoutinesAndExercises } from './components/routines/RoutinesAndExercises';
import { MeasurementsModule } from './components/measurements/MeasurementsModule';
import { SpinningModule } from './components/spinning/SpinningModule';
import { ShieldAlert, ArrowRight } from 'lucide-react';

function MainAppContent() {
  const { currentUser } = useGym();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [isQuickSaleModalOpen, setIsQuickSaleModalOpen] = useState(false);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isUserAuthModalOpen, setIsUserAuthModalOpen] = useState(false);

  const isStudent = currentUser.role === 'student';
  const isTrainer = currentUser.role === 'trainer';
  const isReception = currentUser.role === 'reception' || currentUser.role === 'staff';
  const isAdmin = currentUser.role === 'admin';

  // Role Tab Normalizer & Redirect
  useEffect(() => {
    if (isStudent) {
      if (
        activeTab !== 'mi_membresia' && 
        activeTab !== 'mis_citas' && 
        activeTab !== 'spinning_cine' && 
        activeTab !== 'mis_medidas' &&
        activeTab !== 'student_portal'
      ) {
        setActiveTab('mi_membresia');
      }
    } else if (isTrainer) {
      if (activeTab === 'finance' || activeTab === 'staff' || activeTab === 'memberships') {
        setActiveTab('routines');
      }
    } else if (isReception) {
      if (activeTab === 'finance' || activeTab === 'staff') {
        setActiveTab('attendances');
      }
    }
  }, [currentUser.role, isStudent, isTrainer, isReception, activeTab]);

  // Map student tab to portal section
  const studentSection = 
    activeTab === 'mis_citas' ? 'appointments' :
    activeTab === 'spinning_cine' ? 'spinning' :
    activeTab === 'mis_medidas' ? 'measurements' : 'membership';

  return (
    <div className="min-h-screen bg-gray-100 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col selection:bg-blue-600 selection:text-white" style={{ backgroundColor: '#f3f4f6' }}>
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
        onOpenQuickSaleModal={() => setActiveTab('store')}
        onOpenNewExpenseModal={() => setActiveTab('finance')}
        onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
      />

      {/* App Body: High Density Sidebar + Dynamic Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row w-full mx-auto">
        
        {/* Sidebar with Role-Based Navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenUserAuthModal={() => setIsUserAuthModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto min-w-0 bg-gray-100">
          
          {/* ==============================================================
              STUDENT ROLE VIEW: RESTRICTED STUDENT PORTAL
             ============================================================== */}
          {isStudent ? (
            <StudentPortalModule 
              currentSection={studentSection}
              onSectionChange={(sec) => {
                const tabMap: Record<string, NavTab> = {
                  membership: 'mi_membresia',
                  appointments: 'mis_citas',
                  spinning: 'spinning_cine',
                  measurements: 'mis_medidas'
                };
                setActiveTab(tabMap[sec] || 'mi_membresia');
              }}
            />
          ) : (
            <>
              {/* ==============================================================
                  STAFF / TRAINER / ADMIN VIEWS WITH ACCESS CONTROL
                 ============================================================== */}

              {/* DASHBOARD (Admin & Trainer) */}
              {activeTab === 'dashboard' && (
                <DashboardOverview 
                  setActiveTab={setActiveTab}
                  onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
                  onOpenQuickSaleModal={() => setActiveTab('store')}
                  onOpenNewExpenseModal={() => setActiveTab('finance')}
                />
              )}

              {/* MEMBERS MANAGEMENT (Admin, Reception, Trainer) */}
              {activeTab === 'members' && (
                <MembersManagement 
                  onOpenNewMemberModal={() => setIsNewMemberModalOpen(true)}
                />
              )}

              {/* STAFF CONTRACTS (Admin Only) */}
              {activeTab === 'staff' && (
                isAdmin ? (
                  <StaffContractsModule />
                ) : (
                  <AccessDeniedNotice 
                    roleTitle={isTrainer ? 'Entrenador' : 'Recepción'}
                    requiredRole="Administrador"
                    onGoBack={() => setActiveTab(isTrainer ? 'routines' : 'attendances')}
                  />
                )
              )}

              {/* MEMBERSHIPS PLANS (Admin & Reception) */}
              {activeTab === 'memberships' && (
                !isTrainer ? (
                  <MembershipsPlans />
                ) : (
                  <AccessDeniedNotice 
                    roleTitle="Entrenador"
                    requiredRole="Administrador o Recepción"
                    onGoBack={() => setActiveTab('routines')}
                  />
                )
              )}

              {/* NUTRITION & MEASUREMENTS (Admin & Trainer) */}
              {activeTab === 'nutrition' && (
                <NutritionMeasurementsModule />
              )}

              {/* PHYSIOTHERAPY (Admin & Trainer) */}
              {activeTab === 'physiotherapy' && (
                <PhysiotherapyModule />
              )}

              {/* APPOINTMENTS SCHEDULE (Admin, Trainer & Reception) */}
              {activeTab === 'appointments' && (
                <AppointmentsScheduleModule />
              )}

              {/* ATTENDANCES (Admin, Reception, Trainer) */}
              {activeTab === 'attendances' && (
                <AttendanceModule />
              )}

              {/* STORE / POS (Admin & Reception) */}
              {activeTab === 'store' && (
                !isTrainer ? (
                  <StorePOS />
                ) : (
                  <AccessDeniedNotice 
                    roleTitle="Entrenador"
                    requiredRole="Recepción o Administrador"
                    onGoBack={() => setActiveTab('routines')}
                  />
                )
              )}

              {/* FINANCE & CAJA (Admin Only) */}
              {activeTab === 'finance' && (
                isAdmin ? (
                  <FinanceModule 
                    onOpenNewExpenseModal={() => setIsNewExpenseModalOpen(true)}
                  />
                ) : (
                  <AccessDeniedNotice 
                    roleTitle={isTrainer ? 'Entrenador' : 'Recepción'}
                    requiredRole="Administrador"
                    onGoBack={() => setActiveTab(isTrainer ? 'routines' : 'attendances')}
                  />
                )
              )}

              {/* NOTIFICATION CENTER (Admin & Reception) */}
              {activeTab === 'alerts' && (
                <NotificationCenter />
              )}

              {/* TRAINERS MANAGEMENT (Admin) */}
              {activeTab === 'trainers' && (
                <TrainersManagement />
              )}

              {/* ROUTINES AND EXERCISES (Admin & Trainer) */}
              {activeTab === 'routines' && (
                <RoutinesAndExercises />
              )}

              {/* ANTHROPOMETRIC MEASUREMENTS (Admin & Trainer) */}
              {activeTab === 'measurements' && (
                <MeasurementsModule />
              )}

              {/* SPINNING STUDIO (Admin, Trainer, Reception) */}
              {activeTab === 'spinning' && (
                <SpinningModule />
              )}
            </>
          )}

        </main>

      </div>

      {/* Global Modals */}
      <NewMemberModal 
        isOpen={isNewMemberModalOpen}
        onClose={() => setIsNewMemberModalOpen(false)}
      />

      <UserAuthModal
        isOpen={isUserAuthModalOpen}
        onClose={() => setIsUserAuthModalOpen(false)}
      />

    </div>
  );
}

// Access Denied Component for Restricted Roles
function AccessDeniedNotice({ roleTitle, requiredRole, onGoBack }: { roleTitle: string; requiredRole: string; onGoBack: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          Módulo Restringido
        </span>
        <h2 className="text-lg font-black text-slate-900 mt-2">
          Acceso no permitido para {roleTitle}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Este módulo está reservado exclusivamente para personal con rol de <strong>{requiredRole}</strong>.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoBack}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
      >
        <span>Volver a tu módulo principal</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function App() {
  return (
    <GymProvider>
      <MainAppContent />
    </GymProvider>
  );
}
