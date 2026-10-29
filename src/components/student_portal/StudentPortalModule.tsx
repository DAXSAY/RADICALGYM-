import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Bike, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Dumbbell, 
  Utensils, 
  HeartPulse, 
  FileText, 
  Share2, 
  Download, 
  Key, 
  Ticket, 
  QrCode, 
  Phone, 
  User, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Info,
  Layers,
  Volume2,
  Fan,
  X,
  BarChart3,
  Flame,
  Target
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { SpinningSession, SpinningBike, SpinningReservation } from '../../types/gym';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import confetti from 'canvas-confetti';

interface StudentPortalModuleProps {
  currentSection?: 'membership' | 'appointments' | 'spinning' | 'measurements';
  onSectionChange?: (section: 'membership' | 'appointments' | 'spinning' | 'measurements') => void;
}

export const StudentPortalModule: React.FC<StudentPortalModuleProps> = ({
  currentSection = 'membership',
  onSectionChange
}) => {
  const { 
    currentUser, 
    members, 
    plans, 
    trainers, 
    spinningBikes, 
    spinningSessions, 
    spinningReservations,
    spinningAccessCodes,
    redeemSpinningAccessCode,
    reserveSpinningBike,
    bodyAssessments,
    nutritionPlans,
    physioRecords,
    appointments
  } = useGym();

  const [activeTab, setActiveTab] = useState<'membership' | 'appointments' | 'spinning' | 'measurements'>(currentSection);

  // Sync internal tab if prop changes
  React.useEffect(() => {
    if (currentSection) setActiveTab(currentSection);
  }, [currentSection]);

  const handleTabClick = (tab: 'membership' | 'appointments' | 'spinning' | 'measurements') => {
    setActiveTab(tab);
    if (onSectionChange) onSectionChange(tab);
  };

  // Find linked member profile or fallback to demo member
  const currentMember = useMemo(() => {
    if (currentUser?.memberId) {
      const found = members.find(m => m.id === currentUser.memberId);
      if (found) return found;
    }
    // Match by email or name
    const byEmail = members.find(m => m.email.toLowerCase() === currentUser?.email.toLowerCase());
    if (byEmail) return byEmail;

    return members[0]; // fallback demo student (Alejandro Ramos)
  }, [currentUser, members]);

  // Current Member's Plan
  const memberPlan = useMemo(() => {
    if (!currentMember) return plans[0];
    return plans.find(p => p.id === currentMember.planId || p.name === currentMember.planName) || plans[0];
  }, [currentMember, plans]);

  // Current Member's Assigned Trainer
  const assignedTrainer = useMemo(() => {
    if (!currentMember?.assignedTrainerId) return trainers[0];
    return trainers.find(t => t.id === currentMember.assignedTrainerId) || trainers[0];
  }, [currentMember, trainers]);

  // Current Member's Assessments
  const memberAssessments = useMemo(() => {
    if (!currentMember) return [];
    return bodyAssessments.filter(a => a.memberId === currentMember.id);
  }, [currentMember, bodyAssessments]);

  const latestAssessment = memberAssessments[0] || bodyAssessments[0];

  // Current Member's Nutrition Plan
  const memberNutritionPlan = useMemo(() => {
    if (!currentMember) return nutritionPlans[0];
    return nutritionPlans.find(np => np.memberId === currentMember.id) || nutritionPlans[0];
  }, [currentMember, nutritionPlans]);

  // Current Member's Physio Records
  const memberPhysioRecords = useMemo(() => {
    if (!currentMember) return [];
    return physioRecords.filter(r => r.memberId === currentMember.id);
  }, [currentMember, physioRecords]);

  // Current Member's Appointments
  const memberAppointments = useMemo(() => {
    if (!currentMember) return [];
    return appointments.filter(a => a.memberId === currentMember.id || a.memberName.toLowerCase().includes(currentMember.fullName.toLowerCase()));
  }, [currentMember, appointments]);

  // --- SPINNING STATE & HELPERS ---
  const [selectedSessionId, setSelectedSessionId] = useState<string>(spinningSessions[0]?.id || '');
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [selectedBikeNumber, setSelectedBikeNumber] = useState<number | null>(null);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [viewTicketReservation, setViewTicketReservation] = useState<SpinningReservation | null>(null);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successReminder, setSuccessReminder] = useState<{
    bikeNumber: number;
    sessionTitle: string;
    startTime: string;
    instructorName: string;
    code?: string;
    reservation?: SpinningReservation;
  } | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const currentSession = useMemo(() => {
    return spinningSessions.find(s => s.id === selectedSessionId) || spinningSessions[0];
  }, [spinningSessions, selectedSessionId]);

  const sessionReservations = useMemo(() => {
    if (!currentSession) return [];
    return spinningReservations.filter(r => r.sessionId === currentSession.id && r.status !== 'cancelled');
  }, [spinningReservations, currentSession]);

  // My reservation in this session
  const myReservationInSession = useMemo(() => {
    if (!currentMember) return null;
    return sessionReservations.find(r => r.memberId === currentMember.id || r.memberName.toLowerCase() === currentMember.fullName.toLowerCase());
  }, [sessionReservations, currentMember]);

  // Days left calculation
  const [progressMetric, setProgressMetric] = useState<'weight' | 'fat' | 'muscle' | 'combined' | 'perimeter'>('combined');

  const studentChartData = useMemo(() => {
    if (memberAssessments.length >= 2) {
      return [...memberAssessments].reverse().map((a, idx) => ({
        fecha: a.date,
        peso: a.weightKg,
        grasaPct: a.bodyFatPercentage,
        musculoKg: a.muscleMassKg,
        cintura: a.measurements?.waistCm || 78,
        brazos: a.measurements?.armsCm || 34,
        piernas: a.measurements?.thighsCm || 55,
        toma: `Toma #${idx + 1}`
      }));
    }
    const baseWeight = latestAssessment?.weightKg || 74.5;
    const baseFat = latestAssessment?.bodyFatPercentage || 17.5;
    const baseMuscle = latestAssessment?.muscleMassKg || 58.2;
    return [
      { fecha: '15 May', peso: Number((baseWeight + 3.2).toFixed(1)), grasaPct: Number((baseFat + 2.5).toFixed(1)), musculoKg: Number((baseMuscle - 1.2).toFixed(1)), cintura: 82, brazos: 33, piernas: 54, toma: 'Toma #1 (Inicial)' },
      { fecha: '15 Jun', peso: Number((baseWeight + 2.0).toFixed(1)), grasaPct: Number((baseFat + 1.8).toFixed(1)), musculoKg: Number((baseMuscle - 0.4).toFixed(1)), cintura: 80.5, brazos: 33.5, piernas: 54.5, toma: 'Toma #2' },
      { fecha: '15 Jul', peso: Number((baseWeight + 0.9).toFixed(1)), grasaPct: Number((baseFat + 0.8).toFixed(1)), musculoKg: Number((baseMuscle + 0.3).toFixed(1)), cintura: 79, brazos: 34, piernas: 55, toma: 'Toma #3' },
      { fecha: '15 Ago', peso: baseWeight, grasaPct: baseFat, musculoKg: baseMuscle, cintura: 78, brazos: 34.5, piernas: 55.5, toma: 'Toma #4 (Actual)' }
    ];
  }, [memberAssessments, latestAssessment]);

  // Days left calculation
  const daysLeft = useMemo(() => {
    if (!currentMember?.membershipEndDate) return 0;
    const today = new Date('2026-08-30');
    const end = new Date(currentMember.membershipEndDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [currentMember]);

  // Handle Bike Selection & Booking
  const handleSelectBike = (bikeNum: number) => {
    const isOccupied = sessionReservations.some(r => r.bikeNumber === bikeNum);
    if (isOccupied) {
      alert(`La bicicleta #${bikeNum} ya está reservada para esta sesión. Por favor selecciona otra.`);
      return;
    }
    setSelectedBikeNumber(bikeNum);
  };

  // Direct Member Reservation with Membership
  const handleConfirmDirectReservation = () => {
    if (!selectedBikeNumber || !currentSession || !currentMember) return;

    if (currentMember.status === 'expired') {
      alert('Tu membresía está vencida. Por favor renueva tu plan o canjea un código único Yape.');
      return;
    }

    const res = reserveSpinningBike({
      sessionId: currentSession.id,
      bikeNumber: selectedBikeNumber,
      memberId: currentMember.id,
      memberName: currentMember.fullName,
      memberPhone: currentMember.phone,
      memberEmail: currentMember.email,
      shoesRequirement: 'zapatilla_comun',
      isExternalGuest: false
    });

    if (res.success && res.reservation) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      setViewTicketReservation(res.reservation);
      setSuccessReminder({
        bikeNumber: selectedBikeNumber,
        sessionTitle: currentSession.title,
        startTime: currentSession.startTime,
        instructorName: currentSession.instructorName,
        reservation: res.reservation
      });
      setSelectedBikeNumber(null);
      setCodeSuccessMsg(`¡Tu sitio en la Bici #${selectedBikeNumber} ha quedado guardado! Recuerda asistir a las ${currentSession.startTime}.`);
      setTimeout(() => setCodeSuccessMsg(null), 8000);
    } else {
      alert(res.message);
    }
  };

  // Handle Redeem Access Code
  const handleRedeemCode = (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const codeToUse = (directCode || redeemCodeInput).trim().toUpperCase();
    if (!codeToUse) {
      alert('Por favor ingresa tu código único de reserva (ej. YAPE-8421).');
      return;
    }

    if (!selectedBikeNumber) {
      // Pick first available
      const freeBike = spinningBikes.find(b => !sessionReservations.some(r => r.bikeNumber === b.bikeNumber));
      if (!freeBike) {
        alert('Lo sentimos, todas las bicicletas están ocupadas en esta sesión.');
        return;
      }
      setSelectedBikeNumber(freeBike.bikeNumber);
    }

    const bikeToUse = selectedBikeNumber || spinningBikes.find(b => !sessionReservations.some(r => r.bikeNumber === b.bikeNumber))?.bikeNumber || 1;

    const res = redeemSpinningAccessCode(
      codeToUse,
      bikeToUse,
      currentMember?.fullName || currentUser.fullName,
      currentMember?.phone || currentUser.phone
    );

    if (res.success && res.reservation) {
      confetti({ particleCount: 75, spread: 85, origin: { y: 0.5 } });
      setViewTicketReservation(res.reservation);
      setSuccessReminder({
        bikeNumber: bikeToUse,
        sessionTitle: currentSession?.title || 'Clase de Spinning',
        startTime: currentSession?.startTime || '07:00 AM',
        instructorName: currentSession?.instructorName || 'Coach',
        code: codeToUse,
        reservation: res.reservation
      });
      setRedeemCodeInput('');
      setSelectedBikeNumber(null);
      setIsRedeemingCode(false);
      setCodeSuccessMsg(`¡Código ${codeToUse} canjeado con éxito! Tu sitio ha quedado guardado en la Bici #${bikeToUse}. Recuerda asistir hoy a las ${currentSession?.startTime}.`);
      setTimeout(() => setCodeSuccessMsg(null), 8000);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      
      {/* WELCOME STUDENT BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4 sm:space-x-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg shrink-0">
              {currentMember?.photoUrl || currentUser.photoUrl ? (
                <img 
                  src={currentMember?.photoUrl || currentUser.photoUrl} 
                  alt={currentMember?.fullName} 
                  className="w-full h-full object-cover rounded-[14px]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white">
                  {currentMember?.fullName.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  Portal del Alumno / Socio VIP
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentMember?.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                    : currentMember?.status === 'expiring_soon'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}>
                  {currentMember?.status === 'active' ? '● Membresía Activa' : currentMember?.status === 'expiring_soon' ? '⚠️ Por Vencer' : '⛔ Membresía Vencida'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ¡Hola, {currentMember?.fullName.split(' ')[0]}! 👋
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                DNI: <strong className="text-white font-mono">{currentMember?.dni}</strong> · Plan: <strong className="text-cyan-300">{currentMember?.planName}</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">Vigencia</span>
              <span className={`text-base sm:text-lg font-black ${daysLeft > 7 ? 'text-emerald-400' : daysLeft > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {daysLeft > 0 ? `${daysLeft} días` : 'Vencido'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">Peso Actual</span>
              <span className="text-base sm:text-lg font-black text-cyan-300">
                {latestAssessment?.weightKg || 74.5} kg
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 px-4 border border-white/10 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-slate-300 block uppercase tracking-wider">Citas Activas</span>
              <span className="text-base sm:text-lg font-black text-purple-300">
                {memberAppointments.length}
              </span>
            </div>
          </div>
        </div>

        {/* PORTAL NAV TABS */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => handleTabClick('membership')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'membership'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-300" />
            <span>1. Mi Membresía & Matrícula</span>
          </button>

          <button
            onClick={() => handleTabClick('appointments')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'appointments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-300" />
            <span>2. Notificaciones & Citas (Fisio / Nutri)</span>
            {memberAppointments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[10px] font-black">
                {memberAppointments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabClick('spinning')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'spinning'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4 text-amber-300" />
            <span>3. Salón de Spinning (Croquis Tipo Cine)</span>
          </button>

          <button
            onClick={() => handleTabClick('measurements')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'measurements'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-300" />
            <span>4. Mis Medidas & Progreso</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MI MEMBRESÍA & MATRÍCULA
         ========================================================================= */}
      {activeTab === 'membership' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Digital Member Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs">
                    IC
                  </div>
                  <span className="font-extrabold tracking-wider text-xs">IRONCORE GYM</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                  CARNET DIGITAL DE SOCIO
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/40 border border-blue-400/40 overflow-hidden flex items-center justify-center">
                    {currentMember?.photoUrl ? (
                      <img src={currentMember.photoUrl} alt={currentMember.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{currentMember?.fullName}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">DNI: {currentMember?.dni}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Plan:</span>
                    <strong className="text-cyan-300 font-bold">{currentMember?.planName}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Vigencia:</span>
                    <strong className="text-white font-mono">{currentMember?.membershipStartDate} al {currentMember?.membershipEndDate}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estado:</span>
                    <strong className={currentMember?.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}>
                      {currentMember?.status === 'active' ? 'VIGENTE' : 'POR VENCER'}
                    </strong>
                  </div>
                </div>

                {/* Simulated Barcode / QR */}
                <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center space-y-1">
                  <div className="flex items-center space-x-1 font-mono text-[9px] text-slate-800 tracking-widest font-black">
                    <span>||| | | |||| | ||| |||| | | ||| ||</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 font-bold">
                    SOCIO-ID: {currentMember?.dni}
                  </span>
                </div>
              </div>
            </div>

            {/* Coach Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tu Entrenador Asignado
              </span>
              <div className="flex items-center space-x-3">
                <img 
                  src={assignedTrainer.photoUrl} 
                  alt={assignedTrainer.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{assignedTrainer.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold">{assignedTrainer.specialization}</p>
                  <p className="text-[11px] text-slate-500">Horario: {assignedTrainer.availableSchedule}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Details & Tuition */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Detalles de Matrícula & Beneficios de tu Plan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Información oficial de tu suscripción en el gimnasio.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-black font-mono">
                  S/ {memberPlan.price.toFixed(2)} / ciclo
                </span>
              </div>

              {/* Progress Bar of Days */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Progreso del Periodo</span>
                  <span>{daysLeft > 0 ? `${daysLeft} días restantes` : 'Membresía caducada'}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.max(10, Math.min(100, (daysLeft / 30) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Fecha de Matrícula</span>
                  <span className="text-xs font-extrabold text-slate-800">{currentMember?.registrationDate || '2026-08-01'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Inicio de Vigencia</span>
                  <span className="text-xs font-extrabold text-slate-800">{currentMember?.membershipStartDate}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Fin de Vigencia</span>
                  <span className="text-xs font-extrabold text-blue-700">{currentMember?.membershipEndDate}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Objetivo Deportivo</span>
                  <span className="text-xs font-extrabold text-slate-800 capitalize">{currentMember?.objective.replace('_', ' ')}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Contacto Emergencia</span>
                  <span className="text-xs font-extrabold text-slate-800 truncate">{currentMember?.emergencyContact.name} ({currentMember?.emergencyContact.relationship})</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Teléfono Emergencia</span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">{currentMember?.emergencyContact.phone}</span>
                </div>
              </div>

              {/* Included Benefits */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Beneficios Incluidos en tu Membresía:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {memberPlan.features.map((feat, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Renewal Action */}
              <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-extrabold text-blue-900">¿Deseas renovar o cambiar tu plan?</h4>
                  <p className="text-[11px] text-blue-700">Contáctate con Recepción o tu entrenador para promociones de renovación anticipada.</p>
                </div>
                <a
                  href={`https://wa.me/51987333444?text=${encodeURIComponent(`Hola Recepción IronCore, soy el alumno ${currentMember?.fullName} (DNI: ${currentMember?.dni}) y deseo consultar por la renovación de mi plan ${currentMember?.planName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: NOTIFICACIONES & CITAS (FISIOTERAPIA / NUTRICIÓN)
         ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Tus Citas Programadas (Fisioterapia & Nutrición)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consultas agendadas con los especialistas del gimnasio.
                  </p>
                </div>
              </div>

              <a
                href={`https://wa.me/51987333444?text=${encodeURIComponent(`Hola Recepción IronCore, soy el alumno ${currentMember?.fullName} (DNI: ${currentMember?.dni}) y deseo agendar una nueva cita con Fisioterapia o Nutrición.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>+ Solicitar Nueva Cita</span>
              </a>
            </div>

            {memberAppointments.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No tienes citas pendientes agendadas</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Aprovecha las consultas de evaluación postural y nutrición deportiva incluidas en tu membresía.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberAppointments.map(app => (
                  <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition-all shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          app.serviceType === 'physiotherapy' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {app.serviceType === 'physiotherapy' ? <HeartPulse className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-500">
                            {app.serviceType === 'physiotherapy' ? 'Fisioterapia & Readaptación' : 'Nutrición Deportiva'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">{app.specialistName}</h4>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Fecha:</span>
                        <strong className="text-slate-800 font-mono">{app.date}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">Hora:</span>
                        <strong className="text-blue-700 font-mono">{app.startTime} - {app.endTime}</strong>
                      </div>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                        Motivo: {app.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Clinical Records & PDF Reports */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tus Informes Clínicos & Cartillas de Fisioterapia
                </h3>
                <p className="text-xs text-slate-500">
                  Historial de evaluaciones con escala de dolor y ejercicios asignados.
                </p>
              </div>
            </div>

            {memberPhysioRecords.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Aún no tienes sesiones de fisioterapia registradas.
              </p>
            ) : (
              <div className="space-y-3">
                {memberPhysioRecords.map(rec => (
                  <div key={rec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">Sesión del {rec.date} ({rec.time})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          Dolor EVA: {rec.painLevelEVA}/10
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Zonas: <strong>{rec.affectedZones?.join(', ') || rec.affectedZone}</strong> · Terapeuta: {rec.physiotherapistName}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Indicaciones: {rec.homeIndications}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          alert(`Ficha Clínica del ${rec.date}:\nDiagnóstico: ${rec.consultationReason}\nEjercicios: ${rec.exerciseDosage?.customCardTitle || 'Movilidad y fortalecimiento'}\nRestricciones: ${rec.gymWorkoutRestrictions}`);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Ver Resumen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 3: SALÓN DE SPINNING (RESERVA TIPO CINE CON CÓDIGO ÚNICO)
         ========================================================================= */}
      {activeTab === 'spinning' && (
        <div className="space-y-6">
          
          {/* 1. SESSION PICKER & HEADER */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-blue-800/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-400 text-slate-950 inline-block mb-1">
                  1. Salón de Spinning · Croquis Tipo Cine
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Reserva tu Bicicleta en Vivo
                </h2>
                <p className="text-xs sm:text-sm text-blue-200">
                  Visualiza primero los sitios disponibles en la sala. Selecciona tu bicicleta para canjear tu código o validar tu membresía.
                </p>
              </div>

              {/* Current Session Badge */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-300" />
                <div>
                  <span className="text-[10px] text-blue-200 font-bold uppercase block">Sesión Activa</span>
                  <strong className="text-sm text-white font-mono">{currentSession?.startTime} · {currentSession?.title}</strong>
                </div>
              </div>
            </div>

            {/* Session Selector Strip */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-xs font-bold text-blue-200 block">Elige el horario de tu clase:</span>
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {spinningSessions.map(sess => {
                  const isSelected = sess.id === currentSession?.id;
                  return (
                    <button
                      key={sess.id}
                      onClick={() => {
                        setSelectedSessionId(sess.id);
                        setSelectedBikeNumber(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-yellow-400 text-slate-950 font-black shadow-md ring-2 ring-yellow-300'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sess.startTime} - {sess.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 uppercase">
                        {sess.intensity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. RECORDATORIO VISUAL DE SITIO GUARDADO (SI YA RESERVÓ) */}
          {(myReservationInSession || successReminder) && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xl shrink-0 shadow-lg">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        ● Sitio Guardado
                      </span>
                      <span className="text-xs text-emerald-300 font-extrabold">
                        Bicicleta #{myReservationInSession?.bikeNumber || successReminder?.bikeNumber}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                      ¡Ya reservaste tu código! Recuerda asistir hoy a las {myReservationInSession?.sessionTime || currentSession?.startTime}.
                    </h3>
                    <p className="text-xs text-slate-300">
                      Clase: <strong>{currentSession?.title}</strong> con <strong>{currentSession?.instructorName}</strong> · Asiste 10 minutos antes para calibrar tu bici.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewTicketReservation(myReservationInSession || successReminder?.reservation || null)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-colors shadow-md cursor-pointer flex items-center space-x-1.5"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Ver Ticket / QR</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {codeSuccessMsg && !myReservationInSession && !successReminder && (
            <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 p-3 px-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{codeSuccessMsg}</span>
            </div>
          )}

          {/* 3. CINEMA-STYLE CROQUIS (PRIMERO VISIBLE) */}
          <div className="bg-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden space-y-6">
            
            {/* Screen at front */}
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="h-2.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600 rounded-full shadow-[0_0_25px_rgba(37,99,235,0.8)]" />
              <span className="inline-block text-[10px] font-black uppercase tracking-widest text-cyan-300/80">
                PANTALLA DE PROYECCIÓN DE SALA & MÉTRICAS RPM
              </span>

              {/* Coach Pod */}
              <div className="inline-flex items-center justify-center p-2.5 px-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-lg space-x-3 mt-2">
                <Bike className="w-4 h-4 text-cyan-400 animate-bounce" />
                <span className="text-xs font-black text-white">
                  Tarima del Coach · {currentSession?.instructorName}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300 border-y border-slate-800/80 py-3">
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-600" />
                <span>Libre (Click para Canjear Código)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 rounded bg-blue-900 border border-blue-700 opacity-70" />
                <span>Sitio Guardado / Ocupado</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 rounded bg-yellow-400 text-slate-950" />
                <span>Sitio Elegido</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500 ring-2 ring-emerald-300" />
                <span>Tu Sitio Guardado</span>
              </div>
            </div>

            {/* Bikes Grid 4 Rows x 6 Cols */}
            <div className="max-w-3xl mx-auto space-y-5">
              {[1, 2, 3, 4].map(rowNum => {
                const rowBikes = spinningBikes.filter(b => b.row === rowNum);
                const rowLabels: Record<number, string> = {
                  1: 'Fila A (Frontal al Coach)',
                  2: 'Fila B (Zona Media)',
                  3: 'Fila C (Zona Media Alta)',
                  4: 'Fila D (Tarima Elevada Panorámica)'
                };

                return (
                  <div key={rowNum} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                      {rowLabels[rowNum]}
                    </span>

                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {rowBikes.map(bike => {
                        const isReserved = sessionReservations.some(r => r.bikeNumber === bike.bikeNumber);
                        const isMine = myReservationInSession?.bikeNumber === bike.bikeNumber;
                        const isSelected = selectedBikeNumber === bike.bikeNumber;

                        let style = 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700';
                        let label = `#${bike.bikeNumber} LIBRE`;

                        if (isMine) {
                          style = 'bg-emerald-500 text-slate-950 font-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)]';
                          label = 'TU SITIO';
                        } else if (isSelected) {
                          style = 'bg-yellow-400 text-slate-950 font-black border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.7)] ring-2 ring-yellow-400';
                          label = 'ELEGIDA';
                        } else if (isReserved) {
                          style = 'bg-blue-950/70 text-slate-400 border-blue-900/80 cursor-not-allowed opacity-60';
                          label = 'GUARDADO';
                        }

                        return (
                          <button
                            key={bike.id}
                            type="button"
                            onClick={() => {
                              if (isMine) {
                                alert(`¡Tu sitio ya está guardado en la Bici #${bike.bikeNumber}! Recuerda asistir hoy a las ${currentSession?.startTime}.`);
                                return;
                              }
                              if (isReserved) {
                                alert(`Este sitio (Bici #${bike.bikeNumber}) ya ha sido reservado y guardado para esta sesión.`);
                                return;
                              }
                              setSelectedBikeNumber(bike.bikeNumber);
                            }}
                            className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer transform hover:scale-105 active:scale-95 ${style}`}
                          >
                            <Bike className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-[10px] sm:text-xs font-black">
                              Bici {bike.bikeNumber}
                            </span>
                            <span className="text-[7.5px] font-extrabold uppercase tracking-wider opacity-95">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instruction hint when no seat is selected yet */}
            {!selectedBikeNumber && !myReservationInSession && (
              <div className="text-center p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto">
                👆 Haz click en cualquier <strong>Bicicleta Libre</strong> para que aparezca el formulario para canjear tu código de reserva.
              </div>
            )}
          </div>

          {/* 4. RECIÉN AL SELECCIONAR: PANEL DE CANJE DE CÓDIGO & RESERVA DE ASIENTO */}
          {selectedBikeNumber && (
            <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 text-white shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-400 text-slate-950 inline-block mb-1">
                    Sitio Seleccionado: Bici #{selectedBikeNumber}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-yellow-400" />
                    <span>Canjear Código para Guardar Sitio en Bici #{selectedBikeNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Ingresa el código único generado por tu pago (Yape, Plin o Recepción) o selecciona uno de los códigos de demostración:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBikeNumber(null)}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer self-start md:self-auto"
                >
                  ✕ Cambiar de Bicicleta
                </button>
              </div>

              {/* Form Input for Code */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-7">
                  <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Key className="w-4 h-4 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ingresa código (ej. SPIN-DEMO-2026, YAPE-8421)..."
                        value={redeemCodeInput}
                        onChange={(e) => setRedeemCodeInput(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 font-mono font-bold uppercase focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center space-x-1.5 hover:scale-105"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Canjear y Guardar Sitio</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-5 flex items-center justify-end gap-2">
                  <span className="text-xs text-slate-400 hidden sm:inline">o si tienes membresía:</span>
                  <button
                    type="button"
                    onClick={handleConfirmDirectReservation}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Bike className="w-4 h-4" />
                    <span>Guardar con mi Membresía</span>
                  </button>
                </div>
              </div>

              {/* DEMO CODES CHIPS FOR 1-CLICK TEST & CLIENT PRESENTATION */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      ⚡ Códigos Rápidos de Demostración (Click para canjear en Bici #{selectedBikeNumber}):
                    </span>
                  </div>
                  {copiedCode && (
                    <span className="text-[10px] font-bold text-emerald-400">
                      ✓ Copiado {copiedCode}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {spinningAccessCodes.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setRedeemCodeInput(item.code);
                        handleRedeemCode(undefined, item.code);
                      }}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-amber-300 group-hover:text-yellow-200">
                          {item.code}
                        </span>
                        <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded">
                          1-Click
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.issuedToName}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 4: MIS MEDIDAS & PROGRESO EN HISTORIAL
         ========================================================================= */}
      {activeTab === 'measurements' && (
        <div className="space-y-6">
          
          {/* Metrics Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peso Actual</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">{latestAssessment?.weightKg || 74.5} kg</span>
              <span className="text-[10px] text-emerald-600 font-bold block flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> -1.8 kg este mes
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">% Grasa Corporal</span>
              <span className="text-xl sm:text-2xl font-black text-blue-600">{latestAssessment?.bodyFatPercentage || 17.5}%</span>
              <span className="text-[10px] text-blue-500 font-semibold block">Rango Atlético Óptimo</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Masa Muscular</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600">{latestAssessment?.muscleMassKg || 58.2} kg</span>
              <span className="text-[10px] text-emerald-600 font-bold block flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +0.9 kg masa magra
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IMC Actual</span>
              <span className="text-xl sm:text-2xl font-black text-purple-600">{latestAssessment?.bmi || 23.4}</span>
              <span className="text-[10px] text-slate-500 font-semibold block">Normopeso Saludable</span>
            </div>
          </div>

          {/* =========================================================================
              INTERACTIVE PROGRESS & EVOLUTION CHART (RECHARTS)
             ========================================================================= */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span>Tu Curva de Transformación & Progreso Corporal</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Explora tus avances interactuando con los puntos de evaluación y alternando entre métricas.
                </p>
              </div>

              {/* Metric Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProgressMetric('combined')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === 'combined'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Integral
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric('weight')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === 'weight'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Peso
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric('fat')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === 'fat'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  % Grasa
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric('muscle')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === 'muscle'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Músculo
                </button>
                <button
                  type="button"
                  onClick={() => setProgressMetric('perimeter')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    progressMetric === 'perimeter'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cintura
                </button>
              </div>
            </div>

            {/* Interactive Chart Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentChartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studentWeightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="studentFatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="studentMuscleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="studentPerimeterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#e2e8f0' }} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px', 
                      color: '#f8fafc',
                      padding: '10px 14px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} ${name === 'grasaPct' ? '%' : name === 'cintura' || name === 'brazos' ? 'cm' : 'kg'}`,
                      name === 'peso' ? 'Peso Corporal' : name === 'grasaPct' ? '% Grasa' : name === 'musculoKg' ? 'Masa Muscular' : name === 'cintura' ? 'Cintura' : 'Brazos'
                    ]}
                    labelFormatter={(label) => `Fecha de Toma: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(val) => (
                      <span className="text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                        {val === 'peso' ? 'Peso (kg)' : val === 'grasaPct' ? '% Grasa Corporal' : val === 'musculoKg' ? 'Masa Muscular (kg)' : val === 'cintura' ? 'Cintura (cm)' : val}
                      </span>
                    )}
                  />

                  {/* Reference Goal Line */}
                  <ReferenceLine 
                    y={progressMetric === 'fat' ? 15 : progressMetric === 'weight' ? 72 : undefined} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    label={{ value: progressMetric === 'fat' ? 'Meta Grasa: 15%' : 'Meta Peso: 72kg', fill: '#059669', fontSize: 10, position: 'top' }} 
                  />

                  {(progressMetric === 'combined' || progressMetric === 'weight') && (
                    <Area 
                      type="monotone" 
                      dataKey="peso" 
                      name="peso"
                      stroke="#2563eb" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#studentWeightGrad)" 
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {(progressMetric === 'combined' || progressMetric === 'fat') && (
                    <Area 
                      type="monotone" 
                      dataKey="grasaPct" 
                      name="grasaPct"
                      stroke="#f59e0b" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#studentFatGrad)" 
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {(progressMetric === 'combined' || progressMetric === 'muscle') && (
                    <Area 
                      type="monotone" 
                      dataKey="musculoKg" 
                      name="musculoKg"
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#studentMuscleGrad)" 
                      activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  )}

                  {progressMetric === 'perimeter' && (
                    <>
                      <Area 
                        type="monotone" 
                        dataKey="cintura" 
                        name="cintura"
                        stroke="#8b5cf6" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#studentPerimeterGrad)" 
                        activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="brazos" 
                        name="brazos"
                        stroke="#ec4899" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Achievements Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Pérdida Total</span>
                <span className="text-sm font-black text-blue-600">-3.2 kg desde inicio</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Grasa Reducida</span>
                <span className="text-sm font-black text-amber-600">-2.5% adiposidad</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Músculo Ganado</span>
                <span className="text-sm font-black text-emerald-600">+1.2 kg masa magra</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Cintura</span>
                <span className="text-sm font-black text-purple-600">-4.0 cm perímetro</span>
              </div>
            </div>
          </div>

          {/* Measurements History Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Historial Evolutivo de Cineantropometría & Bioimpedancia
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de tus evaluaciones corporales sesión tras sesión.
                </p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {memberAssessments.length} evaluaciones registradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Peso</th>
                    <th className="p-3">% Grasa</th>
                    <th className="p-3">Masa Muscular</th>
                    <th className="p-3">Cintura</th>
                    <th className="p-3">Brazos</th>
                    <th className="p-3">Evaluador</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberAssessments.map(ass => (
                    <tr key={ass.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 font-mono">{ass.date}</td>
                      <td className="p-3 font-extrabold text-blue-700">{ass.weightKg} kg</td>
                      <td className="p-3">{ass.bodyFatPercentage}%</td>
                      <td className="p-3 font-semibold text-emerald-700">{ass.muscleMassKg} kg</td>
                      <td className="p-3">{ass.measurements.waistCm || 78} cm</td>
                      <td className="p-3">{ass.measurements.armsCm || 34} cm</td>
                      <td className="p-3 text-slate-600">{ass.evaluatorName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Progreso Favorable
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assigned Nutritional Meal Plan (Text + Weight Box) */}
          {memberNutritionPlan && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Tu Plan Nutricional Asignado ({memberNutritionPlan.title})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Meta calórica: <strong className="text-emerald-700 font-mono">{memberNutritionPlan.targetCalories} kcal</strong> · Agua recomendada: <strong className="text-blue-600">{memberNutritionPlan.waterLitersDay} L/día</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    P: {memberNutritionPlan.macros.proteinGrams}g
                  </span>
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    C: {memberNutritionPlan.macros.carbsGrams}g
                  </span>
                  <span className="text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    G: {memberNutritionPlan.macros.fatsGrams}g
                  </span>
                </div>
              </div>

              {/* Meals cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberNutritionPlan.meals.map(meal => (
                  <div key={meal.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-slate-900">{meal.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({meal.time})</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 font-mono">
                        {meal.totalCalories} kcal
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {meal.items.map(it => (
                        <div key={it.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-800">{it.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                              {it.portion}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {it.calories} kcal
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TICKET MODAL POST-BOOKING */}
      {viewTicketReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Pase Confirmado</span>
              <h3 className="text-lg font-black text-slate-900">¡Bicicleta #{viewTicketReservation.bikeNumber} Reservada!</h3>
              <p className="text-xs text-slate-500 mt-1">
                {currentSession?.title} · {currentSession?.startTime} ({currentSession?.date})
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Alumno:</span>
                <strong className="text-slate-900">{viewTicketReservation.memberName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Instructor:</span>
                <strong className="text-slate-900">{currentSession?.instructorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ubicación:</span>
                <strong className="text-slate-900">{currentSession?.roomName}</strong>
              </div>
            </div>

            <button
              onClick={() => setViewTicketReservation(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cerrar y Ver Mi Asiento
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
