import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  Search, 
  Filter, 
  AlertTriangle, 
  Plus, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Phone, 
  ChevronRight, 
  ChevronDown, 
  Share2, 
  Dumbbell, 
  Trash2, 
  Target, 
  Eye, 
  Flame, 
  Zap, 
  Download, 
  Printer, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Check, 
  Info, 
  ArrowRight,
  ShieldCheck,
  X,
  BookmarkPlus,
  BookOpen,
  Layers,
  Save,
  CheckCircle,
  RefreshCw,
  Pill,
  BookMarked
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { useGym } from '../../context/GymContext';
import { 
  Member, 
  PhysiotherapySessionRecord, 
  BodyPainZone, 
  PhysicalEvaluation, 
  FunctionalEvaluation, 
  ExerciseDosage, 
  ExerciseItem, 
  JointFunctionalTestItem,
  EvaluationTemplate,
  LateralPostureEvaluation,
  VisualJointKnees,
  VisualJointAnkles,
  WilliamsEvaluation,
  CustomPhysioTreatmentItem
} from '../../types/gym';
import { BodyMapVisual, ZONE_DETAILS } from './BodyMapVisual';
import { PostureVisualSelector, POSTURE_PRESETS } from './PostureVisuals';
import { FunctionalVisuals } from './FunctionalVisuals';
import { ExerciseVisuals, PRESET_EXERCISES_WITH_VISUALS } from './ExerciseVisuals';
import { WilliamsVisuals, DEFAULT_WILLIAMS_EXERCISES } from './WilliamsVisuals';
import { EditableTreatments, DEFAULT_TREATMENT_ITEMS } from './EditableTreatments';
import { ExercisePrescriptionCard } from './ExercisePrescriptionCard';
import { PhysioTextualRecordsView } from './PhysioTextualRecordsView';
import { PhysioReportModal } from './PhysioReportModal';
import confetti from 'canvas-confetti';

const COMMON_TREATMENTS = [
  'Terapia manual miofascial / Masoterapia',
  'Reeducación motriz & Ejercicios terapéuticos',
  'Electroterapia TENS (Analgesia)',
  'Crioterapia / Compresas frías',
  'Termoterapia superficial / Compresas calientes',
  'Punción seca de puntos gatillo',
  'Vendaje neuromuscular / Kinesiotaping',
  'Estiramientos miofasciales globales'
];

const COMMON_ANTECEDENTS = [
  'Hernia discal lumbar o cervical previa',
  'Tendinopatía crónica o fascitis',
  'Intervención quirúrgica ortopédica previa',
  'Esguince grado II o III recurrente',
  'Subluxación o luxación de hombro',
  'Sin antecedentes médicos relevantes'
];

const COMMON_MEDICATIONS = [
  'Ibuprofeno / Naproxeno (AINEs)',
  'Paracetamol 500mg-1g',
  'Clorzoxazona / Ciclobenzaprina (Relajante muscular)',
  'Infiltración con corticoides reciente',
  'Tramadol / Analgésico opioide suave',
  'Protector gástrico (Omeprazol)',
  'Sin medicación actual'
];

const DEFAULT_FUNCTIONAL_TESTS: JointFunctionalTestItem[] = [
  { testName: 'Test de Lasègue (Radiculopatía L5-S1)', joint: 'Columna Lumbar', result: 'negativo' },
  { testName: 'Test de Thomas (Retracción de Psoas)', joint: 'Cadera / Psoas', result: 'negativo' },
  { testName: 'Test de Ober (Tensor Fascia Lata)', joint: 'Cadera / TFL', result: 'negativo' },
  { testName: 'Test de Lachman (LCA de Rodilla)', joint: 'Rodilla / Ligamentos', result: 'negativo' },
  { testName: 'Test de McMurray (Meniscos de Rodilla)', joint: 'Rodilla / Meniscos', result: 'negativo' },
  { testName: 'Test de Hawkins-Kennedy (Manguito Rotador)', joint: 'Hombro / Manguito', result: 'negativo' },
  { testName: 'Test de Neer (Pinzamiento Subacromial)', joint: 'Hombro / Manguito', result: 'negativo' },
  { testName: 'Test de Spurling (Compresión Cervical)', joint: 'Columna Cervical', result: 'negativo' },
  { testName: 'Test de Cozen (Epicondilitis / Codo)', joint: 'Codo & Antebrazo', result: 'negativo' },
  { testName: 'Test de Phalen (Túnel Carpiano / Muñeca)', joint: 'Muñeca & Mano', result: 'negativo' },
  { testName: 'Test de Finkelstein (Tendinitis De Quervain)', joint: 'Muñeca & Pulgar', result: 'negativo' }
];

export const PhysiotherapyModule: React.FC = () => {
  const { 
    members, 
    physioRecords, 
    physioTemplates,
    addPhysioRecord, 
    updatePhysioRecord,
    deletePhysioRecord, 
    addPhysioTemplate,
    deletePhysioTemplate,
    staffContracts 
  } = useGym();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRestrictionsOnly, setFilterRestrictionsOnly] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  
  // Modals state
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [reportModalSession, setReportModalSession] = useState<PhysiotherapySessionRecord | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'fisica' | 'funcional' | 'dosificacion' | 'observaciones'>('general');

  // TEMPLATES STATE & TOAST
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateCategoryInput, setTemplateCategoryInput] = useState('Columna & Tronco');
  const [templateDescInput, setTemplateDescInput] = useState('');
  const [templateAppliedToast, setTemplateAppliedToast] = useState<string | null>(null);

  // EVOLUTION CHART METRICS VIEW
  const [chartMetricView, setChartMetricView] = useState<'both' | 'eva' | 'rom'>('both');

  // Main View Switcher ('fichas' or 'textual')
  const [activeMainView, setActiveMainView] = useState<'fichas' | 'textual'>('fichas');

  // FORM STATES
  const [formMemberId, setFormMemberId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('10:00 AM');
  const [formPhysioName, setFormPhysioName] = useState('Lic. Diego Morales Quintana');
  const [formReason, setFormReason] = useState('');
  
  // 1. ZONA AFECTADA & TRATAMIENTOS EDITABLES
  const [formZones, setFormZones] = useState<BodyPainZone[]>(['lumbar', 'muneca_mano']);
  const [formPainEVA, setFormPainEVA] = useState<number>(6);
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([
    'Terapia manual miofascial / Masoterapia',
    'Reeducación motriz & Ejercicios terapéuticos'
  ]);
  const [formEditableTreatments, setFormEditableTreatments] = useState<CustomPhysioTreatmentItem[]>(DEFAULT_TREATMENT_ITEMS);

  // 2. EVALUACIÓN FÍSICA & VISIÓN LATERAL & RODILLAS/TOBILLOS
  const [formClinicalHistory, setFormClinicalHistory] = useState('Paciente refiere dolor agudo luego de jornada intensa en gimnasio con sobrecarga.');
  const [formMedicalBackground, setFormMedicalBackground] = useState<string[]>(['Sin antecedentes relevantes']);
  const [formCustomBackground, setFormCustomBackground] = useState('');
  const [formMedications, setFormMedications] = useState<string[]>(['Ibuprofeno / Naproxeno (AINEs)']);
  const [formCustomMedication, setFormCustomMedication] = useState('');
  const [formMedicationsText, setFormMedicationsText] = useState<string>(
    'Ibuprofeno 400 mg cada 8 horas por 3 días (tras alimentos); Paracetamol 500 mg condicional si el dolor supera 5/10; Omeprazol 20 mg matutino.'
  );
  const [formPostureFindings, setFormPostureFindings] = useState<string[]>(['Hiperlordosis Lumbar', 'Hombros Protraídos']);
  const [formPostureNotes, setFormPostureNotes] = useState('Curvatura acentuada al inicio de la marcha y tensión en trapecios.');
  const [formLateralPosture, setFormLateralPosture] = useState<LateralPostureEvaluation>({
    headPosition: 'adelantada_leve',
    cervicalSpine: 'normal_fisiologica',
    thoracicSpine: 'hipercifosis_dorsal',
    lumbarSpine: 'hiperlordosis_lumbar',
    pelvisTilt: 'anteversion_marcada',
    kneeSagittal: 'neutra',
    plumbLineDeviation: 'anteriorizada',
    notes: 'Desviación anterior de línea de plomada con compensación lumbo-pélvica.'
  });
  const [formVisualKnees, setFormVisualKnees] = useState<VisualJointKnees>({
    frontalAlignment: 'genu_valgo',
    sagittalAlignment: 'neutro',
    patellarTracking: 'centrada',
    effusionInflammation: 'ausente',
    details: 'Valgo dinámico en sentadilla unipodal, rótulas libres de derrame.'
  });
  const [formVisualAnkles, setFormVisualAnkles] = useState<VisualJointAnkles>({
    hindfootAlignment: 'valgo_retropie_pronacion',
    plantarArch: 'pie_plano_flexible',
    achillesTendon: 'alineado_vertical',
    details: 'Pronación bilateral leve con caída de arco medial en apoyo.'
  });
  const [formVisualComments, setFormVisualComments] = useState<string>(
    'Buena troficidad muscular general. Se aprecia leve sobrecarga en cara anterior de tibia y ligera asimetría en triángulo de la talla derecho.'
  );

  // 3. EVALUACIÓN FUNCIONAL & PROTOCOLO WILLIAMS
  const [formWilliamsEval, setFormWilliamsEval] = useState<WilliamsEvaluation>({
    enabled: true,
    overallTolerance: 'buena',
    summaryNotes: 'Protocolo de Williams completado con tolerancia adecuada y alivio de sobrecarga lumbar.',
    exercises: DEFAULT_WILLIAMS_EXERCISES
  });

  // 3. EVALUACIÓN FUNCIONAL
  const [formROMStatus, setFormROMStatus] = useState<'completo' | 'limitado_leve' | 'limitado_moderado' | 'severamente_limitado'>('limitado_leve');
  const [formROMDetails, setFormROMDetails] = useState('Flexión y rotación limitadas en últimos 15 grados con compensación.');
  const [formMobilityQuality, setFormMobilityQuality] = useState('Movilidad disminuida con compensación motora');
  const [formPainPhase, setFormPainPhase] = useState<'inicio_movimiento' | 'arco_medio' | 'final_rango' | 'todo_el_recorrido'>('final_rango');
  const [formDynamicPainEVA, setFormDynamicPainEVA] = useState<number>(6);
  const [formPainNature, setFormPainNature] = useState('Punzante en ángulo terminal');
  const [formFunctionalTests, setFormFunctionalTests] = useState<JointFunctionalTestItem[]>(DEFAULT_FUNCTIONAL_TESTS);
  const [formMuscleTone, setFormMuscleTone] = useState<'normotono' | 'hipertono_espasmo' | 'contractura_focal' | 'hipotono'>('contractura_focal');
  const [formTempEdema, setFormTempEdema] = useState<'normotermico' | 'calor_local' | 'edema_leve' | 'edema_moderado'>('calor_local');
  const [formTenderZoneNotes, setFormTenderZoneNotes] = useState('Punto gatillo miofascial activo en cuadrado lumbar y flexores de muñeca.');

  // 4. DOSIFICACIÓN DE EJERCICIOS
  const [formCardTitle, setFormCardTitle] = useState('Cartilla de Fortalecimiento & Readaptación Funcional');
  const [formCardFrequency, setFormCardFrequency] = useState('3 veces por semana en días alternos');
  const [formCustomExercises, setFormCustomExercises] = useState<ExerciseItem[]>([
    {
      id: 'init-1',
      name: 'Cat-Camel (Gato-Camello) de Movilidad Raquídea',
      series: 3,
      repsOrTime: '10 repeticiones lentas',
      restSeconds: 45,
      techniqueTips: 'Movimiento ondulatorio suave sin forzar arcos dolorosos',
      targetZone: 'Columna Lumbar & Dorsal'
    },
    {
      id: 'init-2',
      name: 'Puente de Glúteo Bipodal con Pausa Isométrica',
      series: 4,
      repsOrTime: '12 repeticiones (3s arriba)',
      restSeconds: 60,
      techniqueTips: 'Apretar glúteos arriba sin hiperextender la zona lumbar',
      targetZone: 'Glúteo Mayor & Lumbar'
    },
    {
      id: 'init-3',
      name: 'Movilidad Suave de Flexores y Extensores de Muñeca',
      series: 3,
      repsOrTime: '15 reps sin carga',
      restSeconds: 30,
      techniqueTips: 'Estiramiento sostenido con codo extendido, sin generar dolor punzante',
      targetZone: 'Muñeca & Antebrazo'
    }
  ]);

  const [formProgressivePhase, setFormProgressivePhase] = useState<'descarga_isometrico' | 'concentrico_guiado' | 'excentrico_controlado' | 'fuerza_resistencia' | 'sobrecarga_progresiva'>('descarga_isometrico');
  const [formMaxKg, setFormMaxKg] = useState<number>(10);
  const [formProgressionCriteria, setFormProgressionCriteria] = useState('Progresar de fase cuando el dolor sea menor a 2/10 en las últimas 3 sesiones consecutivas');
  const [formAllowedExercises, setFormAllowedExercises] = useState('Caminata suave, Prensa en declive 30%, Polea al pecho guiada, Elíptica suave');
  const [formProhibitedExercises, setFormProhibitedExercises] = useState('Sentadilla libre pesada, Peso muerto convencional, Press de muñeca con barra, Saltos pliométricos');
  const [formPassiveMobility, setFormPassiveMobility] = useState('Tracción axial manual suave y movilización grado I-II articular');
  const [formResistanceDetails, setFormResistanceDetails] = useState('Series de 15 reps con bandas elásticas de baja tensión');
  const [formProprioceptionExercises, setFormProprioceptionExercises] = useState('Apoyo monopodal y equilibrio en plano estable');
  const [formProprioceptionLevel, setFormProprioceptionLevel] = useState<'bipodal' | 'monopodal_estable' | 'monopodal_inestable'>('monopodal_estable');
  const [formVestibularEnabled, setFormVestibularEnabled] = useState(false);
  const [formVestibularDetails, setFormVestibularDetails] = useState('');
  const [formPowerStatus, setFormPowerStatus] = useState<'contraindicado' | 'fase_preparatoria' | 'pliometria_adaptada' | 'potencia_plena'>('contraindicado');
  const [formPowerDetails, setFormPowerDetails] = useState('Prohibidos los movimientos balísticos o pliometría hasta alta médica.');

  // 5. OBSERVACIONES ADICIONALES (CRUD: AGREGAR, EDITAR, ELIMINAR)
  const [formAdditionalObservations, setFormAdditionalObservations] = useState<string[]>([
    'Contractura palpable en musculatura paravertebral y cuadrado lumbar derecho.',
    'Tensión moderada en tendones flexores de muñeca con crepitación leve al estirar.',
    'Se aconseja hielo 15 min después de entrenar y evitar agarre forzado en mancuernas.'
  ]);
  const [newObservationInput, setNewObservationInput] = useState('');

  // 6. EXPLICACIÓN ENTENDIBLE PARA EL ALUMNO Y EVOLUCIÓN
  const [formPatientFriendlySummary, setFormPatientFriendlySummary] = useState(
    'Tienes una molestia muscular en la espalda baja (lumbar) junto con una ligera inflamación o tendinitis en la muñeca. En esta fase es fundamental no levantar peso libre pesado ni hacer flexiones forzadas. Realiza tu cartilla de ejercicios suaves y estiramientos en casa.'
  );
  const [formImprovementStatus, setFormImprovementStatus] = useState<'notable_mejora' | 'mejora_leve' | 'estable' | 'en_evaluacion' | 'empeoramiento'>('en_evaluacion');
  const [formGymRestrictions, setFormGymRestrictions] = useState('Evitar peso muerto, sentadillas con barra libre y press con barra pesada');
  const [formHomeIndications, setFormHomeIndications] = useState('Aplicar compresas frías por 15 min tras entrenar y realizar la cartilla de ejercicios 3 veces por semana');
  const [formEvolutionNotes, setFormEvolutionNotes] = useState('Buena adherencia y respuesta al tratamiento de terapia manual.');
  const [formNextAppt, setFormNextAppt] = useState('');

  // Available staff
  const availablePhysios = useMemo(() => {
    const fromContracts = staffContracts
      .filter(c => c.role.toLowerCase().includes('fisio') || c.role.toLowerCase().includes('nutri') || c.role.toLowerCase().includes('terap'))
      .map(c => c.staffName);
    
    if (fromContracts.length > 0) return Array.from(new Set(fromContracts));
    return ['Lic. Diego Morales Quintana', 'Lic. Sofía Carrión Paredes', 'Lic. Carlos Méndez'];
  }, [staffContracts]);

  // Filtered members for sidebar
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.dni.includes(searchTerm) ||
        (m.phone && m.phone.includes(searchTerm));
      
      const hasRestrictions = m.medicalNotes && m.medicalNotes.trim().length > 0;
      if (filterRestrictionsOnly && !hasRestrictions) return false;

      return matchSearch;
    });
  }, [members, searchTerm, filterRestrictionsOnly]);

  // Selected member object
  const selectedMember = useMemo(() => {
    if (!selectedMemberId && filteredMembers.length > 0) {
      return filteredMembers[0];
    }
    return members.find(m => m.id === selectedMemberId) || filteredMembers[0] || null;
  }, [selectedMemberId, filteredMembers, members]);

  // Sessions for active member sorted by date/time desc
  const memberSessions = useMemo(() => {
    if (!selectedMember) return [];
    return physioRecords
      .filter(r => r.memberId === selectedMember.id)
      .sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
  }, [selectedMember, physioRecords]);

  // CLINICAL PROGRESS COMPUTATION FOR ACTIVE MEMBER
  const progressStats = useMemo(() => {
    if (!memberSessions || memberSessions.length === 0) return null;
    
    // Sort oldest to newest for progression
    const chronological = [...memberSessions].sort(
      (a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime()
    );

    const firstSession = chronological[0];
    const latestSession = chronological[chronological.length - 1];
    
    const initialEVA = firstSession.painLevelEVA;
    const currentEVA = latestSession.painLevelEVA;
    const diffEVA = initialEVA - currentEVA;
    const percentageRelief = initialEVA > 0 ? Math.round((diffEVA / initialEVA) * 100) : 0;

    let overallStatus: 'notable_mejora' | 'mejora_leve' | 'estable' | 'en_evaluacion' | 'empeoramiento' = 'en_evaluacion';
    if (chronological.length > 1) {
      if (diffEVA >= 3) overallStatus = 'notable_mejora';
      else if (diffEVA > 0) overallStatus = 'mejora_leve';
      else if (diffEVA === 0) overallStatus = 'estable';
      else overallStatus = 'empeoramiento';
    }

    return {
      sessionCount: memberSessions.length,
      initialEVA,
      currentEVA,
      diffEVA,
      percentageRelief,
      overallStatus,
      chronological
    };
  }, [memberSessions]);

  const getRomScoreOrDegrees = (s: PhysiotherapySessionRecord): number => {
    const romStatus = s.functionalEvaluation?.rangeOfMotionStatus;
    if (romStatus === 'completo') return 180;
    if (romStatus === 'limitacion_leve') return 145;
    if (romStatus === 'limitacion_moderada') return 95;
    if (romStatus === 'bloqueo_severo') return 45;

    const text = (s.rangeOfMotion || '').toLowerCase();
    if (text.includes('completo') || text.includes('180') || text.includes('100%')) return 180;
    if (text.includes('leve') || text.includes('140') || text.includes('75%')) return 145;
    if (text.includes('moderado') || text.includes('90') || text.includes('50%')) return 95;
    if (text.includes('severo') || text.includes('bloqueo') || text.includes('45') || text.includes('25%')) return 45;

    return Math.max(30, Math.min(180, Math.round(180 - (s.painLevelEVA * 14))));
  };

  const evolutionChartData = useMemo(() => {
    if (!progressStats || !progressStats.chronological || progressStats.chronological.length === 0) return [];
    
    return progressStats.chronological.map((s, idx) => {
      const romDeg = getRomScoreOrDegrees(s);
      const romPercent = Math.round((romDeg / 180) * 100);
      return {
        sessionLabel: `S#${idx + 1}`,
        date: s.date.slice(5),
        fullDate: s.date,
        time: s.time,
        painEVA: s.painLevelEVA,
        romDegrees: romDeg,
        romPercent: romPercent,
        zone: (s.affectedZones || [s.affectedZone])[0] || 'Zona',
        reason: s.consultationReason || 'Evaluación',
        status: s.improvementStatus || 'en_evaluacion'
      };
    });
  }, [progressStats]);

  const handleApplyTemplate = (template: EvaluationTemplate) => {
    setFormReason(template.consultationReason || '');
    if (template.affectedZones && template.affectedZones.length > 0) {
      setFormZones(template.affectedZones);
    }
    setFormPainEVA(template.painLevelEVA ?? 5);
    setFormPostureFindings(template.postureFindings || []);
    setFormPostureNotes(template.postureNotes || '');
    setFormROMStatus(template.romStatus || 'limitado_leve');
    setFormROMDetails(template.romDetails || '');
    setFormPainPhase(template.painPhase || 'final_rango');
    setFormDynamicPainEVA(template.dynamicPainEVA ?? template.painLevelEVA ?? 5);
    setFormPainNature(template.painNature || '');
    setFormFunctionalTests(template.functionalTests && template.functionalTests.length > 0 ? template.functionalTests : DEFAULT_FUNCTIONAL_TESTS);
    setFormMuscleTone(template.muscleTone || 'normotono');
    setFormTempEdema(template.tempEdema || 'normotermico');
    setFormTenderZoneNotes(template.tenderNotes || '');
    
    if (template.exerciseDosage) {
      setFormCardTitle(template.exerciseDosage.customCardTitle || 'Cartilla de Fortalecimiento');
      setFormCardFrequency(template.exerciseDosage.customCardFrequency || '3 veces por semana');
      if (template.exerciseDosage.customExercises && template.exerciseDosage.customExercises.length > 0) {
        setFormCustomExercises(template.exerciseDosage.customExercises);
      }
      if (template.exerciseDosage.progressiveLoads) {
        const pl = template.exerciseDosage.progressiveLoads;
        setFormProgressivePhase(pl.phase as any || 'descarga_isometrico');
        setFormMaxKg(pl.maxRecommendedKg || 0);
        setFormProgressionCriteria(pl.progressionCriteria || '');
      }
      if (template.exerciseDosage.exerciseAdaptation) {
        const ea = template.exerciseDosage.exerciseAdaptation;
        setFormAllowedExercises(ea.allowedExercises?.join(', ') || '');
        setFormProhibitedExercises(ea.prohibitedExercises?.join(', ') || '');
      }
      if (template.exerciseDosage.passiveMobility) {
        setFormPassiveMobility(template.exerciseDosage.passiveMobility.techniques?.join('; ') || '');
      }
      if (template.exerciseDosage.resistance) {
        setFormResistanceDetails(template.exerciseDosage.resistance.details || '');
      }
      if (template.exerciseDosage.proprioception) {
        setFormProprioceptionExercises(template.exerciseDosage.proprioception.exercises?.join(', ') || '');
        setFormProprioceptionLevel(template.exerciseDosage.proprioception.level as any || 'monopodal_estable');
      }
      if (template.exerciseDosage.vestibular) {
        setFormVestibularEnabled(!!template.exerciseDosage.vestibular.enabled);
        setFormVestibularDetails(template.exerciseDosage.vestibular.details || '');
      }
      if (template.exerciseDosage.power) {
        setFormPowerStatus(template.exerciseDosage.power.status as any || 'contraindicado');
        setFormPowerDetails(template.exerciseDosage.power.details || '');
      }
    }

    setFormGymRestrictions(template.gymRestrictions || '');
    setFormHomeIndications(template.homeIndications || '');
    setFormPatientFriendlySummary(template.patientFriendlySummary || '');
    if (template.additionalObservations && template.additionalObservations.length > 0) {
      setFormAdditionalObservations(template.additionalObservations);
    }

    setSelectedTemplateId(template.id);
    setTemplateAppliedToast(`Plantilla "${template.name}" cargada con éxito`);
    setTimeout(() => setTemplateAppliedToast(null), 3500);

    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    } catch (e) {
      // ignore
    }
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateNameInput.trim()) return;

    const created = addPhysioTemplate({
      name: templateNameInput.trim(),
      description: templateDescInput.trim() || `Configuración personalizada para ${formZones.join(', ')}`,
      category: templateCategoryInput || 'Personalizado',
      affectedZones: formZones,
      consultationReason: formReason || 'Evaluación personalizada',
      painLevelEVA: formPainEVA,
      postureFindings: formPostureFindings,
      postureNotes: formPostureNotes,
      romStatus: formROMStatus,
      romDetails: formROMDetails,
      painPhase: formPainPhase,
      dynamicPainEVA: formDynamicPainEVA,
      painNature: formPainNature,
      functionalTests: formFunctionalTests,
      muscleTone: formMuscleTone,
      tempEdema: formTempEdema,
      tenderNotes: formTenderZoneNotes,
      exerciseDosage: {
        customCardTitle: formCardTitle,
        customCardFrequency: formCardFrequency,
        customExercises: formCustomExercises,
        progressiveLoads: {
          phase: formProgressivePhase,
          maxRecommendedKg: formMaxKg,
          progressionCriteria: formProgressionCriteria
        },
        exerciseAdaptation: {
          allowedExercises: formAllowedExercises.split(',').map(s => s.trim()).filter(Boolean),
          prohibitedExercises: formProhibitedExercises.split(',').map(s => s.trim()).filter(Boolean),
          adaptationNotes: ''
        },
        passiveMobility: {
          techniques: [formPassiveMobility].filter(Boolean),
          notes: ''
        },
        resistance: {
          intensity: 'moderada',
          details: formResistanceDetails
        },
        proprioception: {
          exercises: [formProprioceptionExercises].filter(Boolean),
          level: formProprioceptionLevel
        },
        vestibular: {
          enabled: formVestibularEnabled,
          details: formVestibularDetails
        },
        power: {
          status: formPowerStatus,
          details: formPowerDetails
        }
      },
      gymRestrictions: formGymRestrictions,
      homeIndications: formHomeIndications,
      patientFriendlySummary: formPatientFriendlySummary,
      additionalObservations: formAdditionalObservations,
      isCustom: true
    });

    setIsSaveTemplateModalOpen(false);
    setTemplateNameInput('');
    setTemplateDescInput('');
    setSelectedTemplateId(created.id);
    setTemplateAppliedToast(`Plantilla "${created.name}" guardada con éxito`);
    setTimeout(() => setTemplateAppliedToast(null), 3500);
  };

  // Toggle zone in multiple selection
  const handleToggleZone = (zone: BodyPainZone) => {
    setFormZones(prev => {
      if (prev.includes(zone)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(z => z !== zone);
      } else {
        return [...prev, zone];
      }
    });
  };

  const handleAddCustomZone = (zoneName: string) => {
    if (!formZones.includes(zoneName)) {
      setFormZones(prev => [...prev, zoneName]);
    }
  };

  const handleRemoveZone = (zone: BodyPainZone) => {
    if (formZones.length > 1) {
      setFormZones(prev => prev.filter(z => z !== zone));
    }
  };

  // Toggle Posture Finding
  const handleTogglePostureFinding = (finding: string) => {
    setFormPostureFindings(prev => {
      if (prev.includes(finding)) {
        return prev.filter(f => f !== finding);
      } else {
        return [...prev, finding];
      }
    });
  };

  // Functional Test Handlers
  const handleToggleTestResult = (index: number, result: 'positivo' | 'negativo' | 'dudoso') => {
    setFormFunctionalTests(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], result };
      return copy;
    });
  };

  const handleAddCustomTest = (testName: string, joint: string) => {
    if (!testName.trim()) return;
    setFormFunctionalTests(prev => [
      ...prev,
      { testName: testName.trim(), joint: joint || 'Articulación', result: 'negativo' }
    ]);
  };

  const handleRemoveTest = (index: number) => {
    setFormFunctionalTests(prev => prev.filter((_, i) => i !== index));
  };

  // Exercise Handlers
  const handleAddCustomExercise = (ex: ExerciseItem) => {
    setFormCustomExercises(prev => [...prev, ex]);
  };

  const handleRemoveCustomExercise = (id: string) => {
    setFormCustomExercises(prev => prev.filter(e => e.id !== id));
  };

  // Observation Handlers (CRUD)
  const handleAddObservation = () => {
    if (!newObservationInput.trim()) return;
    setFormAdditionalObservations(prev => [...prev, newObservationInput.trim()]);
    setNewObservationInput('');
  };

  const handleEditObservation = (index: number, newText: string) => {
    setFormAdditionalObservations(prev => {
      const copy = [...prev];
      copy[index] = newText;
      return copy;
    });
  };

  const handleRemoveObservation = (index: number) => {
    setFormAdditionalObservations(prev => prev.filter((_, i) => i !== index));
  };

  // Open modal for NEW session
  const handleOpenNewSession = (targetMember?: Member) => {
    setEditingSessionId(null);
    const mem = targetMember || selectedMember || members[0];
    if (mem) {
      setFormMemberId(mem.id);
      if (mem.medicalNotes) {
        setFormReason(`Seguimiento por: ${mem.medicalNotes}`);
      } else {
        setFormReason('Evaluación y readaptación musculoesquelética');
      }
    }
    // Default zones: Lumbar and Muñeca to showcase multiple areas
    setFormZones(['lumbar', 'muneca_mano']);
    setFormPainEVA(6);
    setFormAdditionalObservations([
      'Contractura palpable en paravertebrales lumbares.',
      'Inflamación / tendinitis en muñeca al hacer agarre forzado.'
    ]);
    setFormPatientFriendlySummary(
      'Evaluación musculoesquelética: Se detecta sobrecarga en la zona lumbar e inflamación en la muñeca. Deberás evitar cargar barras pesadas o movimientos con impacto durante los próximos 7 a 10 días, sustituyéndolos por ejercicios guiados y la cartilla terapéutica en casa.'
    );
    setActiveModalTab('general');
    setIsNewSessionModalOpen(true);
  };

  // Open modal for EDITING existing session
  const handleEditSession = (session: PhysiotherapySessionRecord) => {
    setEditingSessionId(session.id);
    setFormMemberId(session.memberId);
    setFormDate(session.date);
    setFormTime(session.time);
    setFormPhysioName(session.physiotherapistName);
    setFormReason(session.consultationReason || '');
    setFormZones(session.affectedZones || (session.affectedZone ? [session.affectedZone] : ['lumbar']));
    setFormPainEVA(session.painLevelEVA || 5);
    setSelectedTreatments(session.treatmentsApplied || []);

    if (session.editableTreatments && session.editableTreatments.length > 0) {
      setFormEditableTreatments(session.editableTreatments);
    } else if (session.treatmentsApplied && session.treatmentsApplied.length > 0) {
      setFormEditableTreatments(
        DEFAULT_TREATMENT_ITEMS.map(t => ({
          ...t,
          applied: session.treatmentsApplied.includes(t.name)
        }))
      );
    }
    
    if (session.physicalEvaluation) {
      setFormClinicalHistory(session.physicalEvaluation.history || '');
      setFormMedicalBackground(session.physicalEvaluation.medicalAntecedents || ['Sin antecedentes']);
      setFormMedications(session.physicalEvaluation.medications || []);
      setFormMedicationsText(
        session.physicalEvaluation.medicationsText || 
        (session.physicalEvaluation.medications ? session.physicalEvaluation.medications.join(', ') : '')
      );
      if (session.physicalEvaluation.posturalVisualEvaluation) {
        const pve = session.physicalEvaluation.posturalVisualEvaluation;
        setFormPostureFindings(pve.postureFindings || []);
        setFormPostureNotes(pve.postureNotes || '');
        if (pve.lateralView) setFormLateralPosture(pve.lateralView);
        if (pve.visualKnees) setFormVisualKnees(pve.visualKnees);
        if (pve.visualAnkles) setFormVisualAnkles(pve.visualAnkles);
        if (pve.visualComments) setFormVisualComments(pve.visualComments);
      }
    }

    if (session.functionalEvaluation) {
      const fe = session.functionalEvaluation;
      setFormROMStatus((fe.rangeOfMotionStatus as any) || 'limitado_leve');
      setFormROMDetails(fe.rangeOfMotionDetails || '');
      setFormMobilityQuality(fe.mobilityQuality || '');
      setFormPainPhase((fe.painOnMovement?.movementPhase as any) || 'final_rango');
      setFormDynamicPainEVA(fe.painOnMovement?.dynamicPainEVA || session.painLevelEVA);
      setFormPainNature(fe.painOnMovement?.painNature || 'Punzante');
      if (fe.functionalJointTests && fe.functionalJointTests.length > 0) {
        setFormFunctionalTests(fe.functionalJointTests);
      }
      if (fe.palpationPainZone) {
        setFormMuscleTone((fe.palpationPainZone.muscleTone as any) || 'contractura_focal');
        setFormTempEdema((fe.palpationPainZone.temperatureEdema as any) || 'calor_local');
        setFormTenderZoneNotes(fe.palpationPainZone.tenderZoneNotes || '');
      }
      if (fe.williamsEvaluation) {
        setFormWilliamsEval(fe.williamsEvaluation);
      }
    }

    if (session.exerciseDosage) {
      const ed = session.exerciseDosage;
      setFormCardTitle(ed.customCardTitle || 'Cartilla Personalizada');
      setFormCardFrequency(ed.customCardFrequency || '3 veces por semana');
      setFormCustomExercises(ed.customExercises || []);
      setFormProgressivePhase((ed.progressiveLoads?.phase as any) || 'descarga_isometrico');
      setFormMaxKg(ed.progressiveLoads?.maxRecommendedKg || 10);
      setFormProgressionCriteria(ed.progressiveLoads?.progressionCriteria || '');
      setFormAllowedExercises(ed.exerciseAdaptation?.allowedExercises?.join(', ') || '');
      setFormProhibitedExercises(ed.exerciseAdaptation?.prohibitedExercises?.join(', ') || '');
    }

    setFormAdditionalObservations(session.additionalObservations || [
      'Observaciones clínicas registradas durante la valoración.'
    ]);
    setFormPatientFriendlySummary(session.patientFriendlySummary || session.evolutionNotes || '');
    setFormImprovementStatus(session.improvementStatus || 'en_evaluacion');
    setFormGymRestrictions(session.gymWorkoutRestrictions || '');
    setFormHomeIndications(session.homeIndications || '');
    setFormEvolutionNotes(session.evolutionNotes || '');
    setFormNextAppt(session.nextAppointmentDate || '');

    setActiveModalTab('general');
    setIsNewSessionModalOpen(true);
  };

  // Save session record (Create or Edit)
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const mem = members.find(m => m.id === formMemberId);
    if (!mem) return;

    const physicalEval: PhysicalEvaluation = {
      history: formClinicalHistory.trim() || 'Sin antecedentes clínicos relevantes reportados.',
      medicalAntecedents: formMedicalBackground,
      medications: formMedications,
      medicationsText: formMedicationsText.trim() || undefined,
      posturalVisualEvaluation: {
        postureFindings: formPostureFindings,
        postureNotes: formPostureNotes.trim() || undefined,
        primaryView: 'lateral',
        lateralView: formLateralPosture,
        visualKnees: formVisualKnees,
        visualAnkles: formVisualAnkles,
        visualComments: formVisualComments.trim() || undefined
      }
    };

    const functionalEval: FunctionalEvaluation = {
      rangeOfMotionStatus: formROMStatus,
      rangeOfMotionDetails: formROMDetails.trim() || 'Rango funcional dentro de la normalidad.',
      mobilityQuality: formMobilityQuality.trim() || 'Movilidad simétrica.',
      mobilityPassiveNotes: formPassiveMobility.trim() || undefined,
      painOnMovement: {
        movementPhase: formPainPhase,
        dynamicPainEVA: formDynamicPainEVA,
        painNature: formPainNature.trim() || 'Punzante'
      },
      functionalJointTests: formFunctionalTests,
      palpationPainZone: {
        triggerPoints: [formTenderZoneNotes],
        muscleTone: formMuscleTone,
        temperatureEdema: formTempEdema,
        tenderZoneNotes: formTenderZoneNotes.trim() || 'Sensibilidad a la palpación en zona afectada.'
      },
      williamsEvaluation: formWilliamsEval
    };

    const exerciseDosage: ExerciseDosage = {
      customCardTitle: formCardTitle.trim() || 'Cartilla Personalizada de Fisioterapia & Ejercicios',
      customCardFrequency: formCardFrequency.trim() || '3 veces por semana en días alternos',
      customExercises: formCustomExercises,
      progressiveLoads: {
        phase: formProgressivePhase,
        maxRecommendedKg: formMaxKg,
        progressionCriteria: formProgressionCriteria.trim() || 'Progresión según umbral de dolor EVA'
      },
      exerciseAdaptation: {
        allowedExercises: formAllowedExercises.split(',').map(s => s.trim()).filter(Boolean),
        prohibitedExercises: formProhibitedExercises.split(',').map(s => s.trim()).filter(Boolean),
        adaptationNotes: 'Supervisión en sala por instructores.'
      },
      passiveMobility: {
        techniques: [formPassiveMobility.trim()]
      },
      resistance: {
        intensity: 'moderada',
        details: formResistanceDetails.trim()
      },
      proprioception: {
        exercises: [formProprioceptionExercises.trim()],
        level: formProprioceptionLevel
      },
      vestibular: {
        enabled: formVestibularEnabled,
        details: formVestibularDetails.trim() || undefined
      },
      power: {
        status: formPowerStatus,
        details: formPowerDetails.trim() || undefined
      }
    };

    const primaryZone = formZones[0] || 'lumbar';
    const memberPreviousSessions = physioRecords.filter(r => r.memberId === mem.id && r.id !== editingSessionId);
    const sessionNumber = memberPreviousSessions.length + 1;

    const recordData: Omit<PhysiotherapySessionRecord, 'id'> = {
      memberId: mem.id,
      memberName: mem.fullName,
      memberDni: mem.dni,
      memberPhone: mem.phone,
      date: formDate,
      time: formTime,
      physiotherapistId: 'physio-1',
      physiotherapistName: formPhysioName,
      initialMedicalRestrictions: mem.medicalNotes || 'Sin restricciones reportadas en la ficha de inscripción.',
      consultationReason: formReason.trim() || 'Evaluación musculoesquelética y prescripción terapéutica',
      affectedZone: primaryZone,
      affectedZones: formZones,
      painLevelEVA: formPainEVA,
      posturalEvaluation: formPostureFindings.join(', ') + (formPostureNotes ? ` (${formPostureNotes})` : ''),
      rangeOfMotion: `${formROMStatus.replace('_', ' ')}: ${formROMDetails}`,
      functionalTests: formFunctionalTests.filter(t => t.result !== 'negativo').map(t => `${t.testName} (${t.result})`).join(', ') || 'Pruebas ortopédicas sin signos agudos de rotura.',
      treatmentsApplied: formEditableTreatments.filter(t => t.applied).map(t => t.name),
      editableTreatments: formEditableTreatments,
      gymWorkoutRestrictions: formGymRestrictions.trim() || `Evitar: ${formProhibitedExercises}`,
      homeIndications: formHomeIndications.trim() || `Seguir la cartilla de ejercicios: ${formCardTitle}`,
      evolutionNotes: formEvolutionNotes.trim() || 'Sesión finalizada con excelente respuesta motriz.',
      sessionNumber: sessionNumber,
      nextAppointmentDate: formNextAppt || undefined,
      physicalEvaluation: physicalEval,
      functionalEvaluation: functionalEval,
      exerciseDosage: exerciseDosage,
      studentReportSentAt: `${formDate} ${formTime}`,
      studentReportDeliveryMethod: 'whatsapp',
      additionalObservations: formAdditionalObservations,
      patientFriendlySummary: formPatientFriendlySummary.trim(),
      improvementStatus: formImprovementStatus
    };

    if (editingSessionId) {
      updatePhysioRecord(editingSessionId, recordData);
      setEditingSessionId(null);
      const updatedSession: PhysiotherapySessionRecord = {
        ...recordData,
        id: editingSessionId
      };
      setReportModalSession(updatedSession);
    } else {
      addPhysioRecord(recordData);
      const createdSession: PhysiotherapySessionRecord = {
        ...recordData,
        id: `phy-rec-${Date.now()}`
      };
      setReportModalSession(createdSession);
    }

    setIsNewSessionModalOpen(false);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }
  };

  const handlePreviewCurrentPDF = () => {
    const mem = members.find(m => m.id === formMemberId) || members[0];
    if (!mem) {
      alert('Por favor selecciona un alumno para previsualizar o descargar la ficha PDF.');
      return;
    }

    const primaryZone = formZones[0] || 'lumbar';
    const previewSession: PhysiotherapySessionRecord = {
      id: editingSessionId || `preview-${Date.now()}`,
      memberId: mem.id,
      memberName: mem.fullName,
      memberDni: mem.dni,
      memberPhone: mem.phone,
      date: formDate,
      time: formTime,
      physiotherapistId: 'physio-1',
      physiotherapistName: formPhysioName,
      initialMedicalRestrictions: mem.medicalNotes || 'Sin restricciones reportadas.',
      consultationReason: formReason.trim() || 'Evaluación musculoesquelética y prescripción terapéutica',
      affectedZone: primaryZone,
      affectedZones: formZones,
      painLevelEVA: formPainEVA,
      posturalEvaluation: formPostureFindings.join(', ') + (formPostureNotes ? ` (${formPostureNotes})` : ''),
      rangeOfMotion: `${formROMStatus.replace('_', ' ')}: ${formROMDetails}`,
      functionalTests: formFunctionalTests.filter(t => t.result !== 'negativo').map(t => `${t.testName} (${t.result})`).join(', ') || 'Pruebas ortopédicas sin signos agudos.',
      treatmentsApplied: formEditableTreatments.filter(t => t.applied).map(t => t.name),
      editableTreatments: formEditableTreatments,
      gymWorkoutRestrictions: formGymRestrictions.trim() || `Evitar: ${formProhibitedExercises}`,
      homeIndications: formHomeIndications.trim() || `Seguir la cartilla de ejercicios: ${formCardTitle}`,
      evolutionNotes: formEvolutionNotes.trim() || 'Sesión finalizada con excelente respuesta motriz.',
      sessionNumber: physioRecords.filter(r => r.memberId === mem.id).length + 1,
      nextAppointmentDate: formNextAppt || undefined,
      physicalEvaluation: {
        history: formClinicalHistory.trim() || 'Sin antecedentes clínicos relevantes reportados.',
        medicalAntecedents: formMedicalBackground,
        medications: formMedications,
        medicationsText: formMedicationsText.trim() || undefined,
        posturalVisualEvaluation: {
          postureFindings: formPostureFindings,
          postureNotes: formPostureNotes.trim() || undefined,
          primaryView: 'lateral',
          lateralView: formLateralPosture,
          visualKnees: formVisualKnees,
          visualAnkles: formVisualAnkles,
          visualComments: formVisualComments.trim() || undefined
        }
      },
      functionalEvaluation: {
        rangeOfMotionStatus: formROMStatus,
        rangeOfMotionDetails: formROMDetails.trim() || 'Rango funcional dentro de la normalidad.',
        mobilityQuality: formMobilityQuality.trim() || 'Movilidad simétrica.',
        mobilityPassiveNotes: formPassiveMobility.trim() || undefined,
        painOnMovement: {
          movementPhase: formPainPhase,
          dynamicPainEVA: formDynamicPainEVA,
          painNature: formPainNature.trim() || 'Punzante'
        },
        functionalJointTests: formFunctionalTests,
        palpationPainZone: {
          triggerPoints: [formTenderZoneNotes],
          muscleTone: formMuscleTone,
          temperatureEdema: formTempEdema,
          tenderZoneNotes: formTenderZoneNotes.trim() || 'Sensibilidad a la palpación en zona afectada.'
        },
        williamsEvaluation: formWilliamsEval
      },
      exerciseDosage: {
        customCardTitle: formCardTitle.trim() || 'Cartilla Personalizada de Fisioterapia & Ejercicios',
        customCardFrequency: formCardFrequency.trim() || '3 veces por semana en días alternos',
        customExercises: formCustomExercises,
        progressiveLoads: {
          phase: formProgressivePhase,
          maxRecommendedKg: formMaxKg,
          progressionCriteria: formProgressionCriteria.trim() || 'Progresión según umbral de dolor EVA'
        },
        exerciseAdaptation: {
          allowedExercises: formAllowedExercises.split(',').map(s => s.trim()).filter(Boolean),
          prohibitedExercises: formProhibitedExercises.split(',').map(s => s.trim()).filter(Boolean),
          adaptationNotes: 'Supervisión en sala por instructores.'
        },
        passiveMobility: {
          techniques: [formPassiveMobility.trim()]
        },
        resistance: {
          intensity: 'moderada',
          details: formResistanceDetails.trim()
        },
        proprioception: {
          exercises: [formProprioceptionExercises.trim()],
          level: formProprioceptionLevel
        },
        vestibular: {
          enabled: formVestibularEnabled,
          details: formVestibularDetails.trim() || undefined
        },
        power: {
          status: formPowerStatus,
          details: formPowerDetails.trim() || undefined
        }
      },
      studentReportSentAt: `${formDate} ${formTime}`,
      studentReportDeliveryMethod: 'whatsapp',
      additionalObservations: formAdditionalObservations,
      patientFriendlySummary: formPatientFriendlySummary.trim(),
      improvementStatus: formImprovementStatus
    };

    setReportModalSession(previewSession);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-cyan-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Módulo Clínico & Readaptación Deportiva
              </span>
              <span className="bg-blue-500/20 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                Selección Múltiple de Zonas + PDF Descargable
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-cyan-400" />
              <span>Fisioterapia, Lesiones & Historial de Mejoras</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Selecciona múltiples zonas afectadas simultáneas (ej: Lumbar + Muñeca), gestiona observaciones del fisioterapeuta con agregar/editar/eliminar, monitorea la evolución clínica del alumno y descarga la ficha ilustrada en PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenNewSession()}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Evaluación Clínica</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveMainView('fichas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeMainView === 'fichas'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-300" />
          <span>Fichas Clínicas e Historial Gráfico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainView('textual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap ${
            activeMainView === 'textual'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Evaluaciones y Alumnos Textual</span>
          <span className="bg-emerald-500/20 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
            {physioRecords.length} Registros
          </span>
        </button>
      </div>

      {activeMainView === 'textual' ? (
        <PhysioTextualRecordsView onNewEvaluation={() => handleOpenNewSession()} />
      ) : (
      /* MAIN TWO-COLUMN WORKSPACE */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CLIENT LIST & MEDICAL RESTRICTIONS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>Alumnos & Pacientes ({filteredMembers.length})</span>
              </h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por alumno, DNI o teléfono..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle: Restrictions only */}
            <button
              type="button"
              onClick={() => setFilterRestrictionsOnly(!filterRestrictionsOnly)}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors border cursor-pointer ${
                filterRestrictionsOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Con Lesiones / Restricciones</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                filterRestrictionsOnly ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
              }`}>
                {members.filter(m => m.medicalNotes && m.medicalNotes.trim().length > 0).length}
              </span>
            </button>

            {/* Students List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredMembers.map(member => {
                const isSelected = selectedMember?.id === member.id;
                const hasRestrictions = member.medicalNotes && member.medicalNotes.trim().length > 0;
                const sessionCount = physioRecords.filter(r => r.memberId === member.id).length;

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {member.photoUrl ? (
                          <img 
                            src={member.photoUrl} 
                            alt={member.fullName}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {member.fullName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {member.fullName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            DNI: {member.dni} • {member.planName}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        {sessionCount > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                            {sessionCount} {sessionCount === 1 ? 'sesión' : 'sesiones'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sin historial</span>
                        )}
                      </div>
                    </div>

                    {/* Medical Restriction Warning Flag */}
                    {hasRestrictions && (
                      <div className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{member.medicalNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CLIENT CLINICAL VIEW & PROGRESS HISTORY (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {selectedMember ? (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-5">
              
              {/* Member Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  {selectedMember.photoUrl ? (
                    <img
                      src={selectedMember.photoUrl}
                      alt={selectedMember.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                      {selectedMember.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        {selectedMember.fullName}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        selectedMember.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {selectedMember.status === 'active' ? 'Membresía Activa' : 'Membresía Inactiva'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      DNI: {selectedMember.dni} • Tel: {selectedMember.phone} • Plan: {selectedMember.planName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {memberSessions.length > 0 && (
                    <button
                      onClick={() => setReportModalSession(memberSessions[0])}
                      className="flex items-center space-x-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 px-3 py-2 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      title="Ver y descargar la ficha clínica PDF de la última sesión"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Descargar Ficha PDF</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenNewSession(selectedMember)}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Sesión con Imágenes</span>
                  </button>
                </div>
              </div>

              {/* MEDICAL RESTRICTIONS HIGHLIGHT BANNER */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 border-l-4 border-amber-500 p-4 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Restricciones Médicas y Lesiones Declaradas en Recepción:
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Ficha Alumno
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-amber-200/60">
                  {selectedMember.medicalNotes && selectedMember.medicalNotes.trim().length > 0 
                    ? selectedMember.medicalNotes 
                    : 'ℹ️ No se registraron restricciones médicas al momento de la inscripción del alumno en recepción.'}
                </p>
              </div>

              {/* CLINICAL PROGRESS & IMPROVEMENTS DASHBOARD FOR THIS STUDENT */}
              {progressStats && progressStats.sessionCount > 0 && (
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-800/40 shadow-md space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/40 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                        Evolución Clínica & Mejoras del Alumno ({progressStats.sessionCount} {progressStats.sessionCount === 1 ? 'Sesión' : 'Sesiones'})
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        progressStats.overallStatus === 'notable_mejora'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          : progressStats.overallStatus === 'mejora_leve'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                          : progressStats.overallStatus === 'estable'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                      }`}>
                        {progressStats.overallStatus === 'notable_mejora' ? '🎉 Notable Mejoría' :
                         progressStats.overallStatus === 'mejora_leve' ? '👍 Mejoría Leve' :
                         progressStats.overallStatus === 'estable' ? '⚖️ Condición Estable' : '🔍 En Seguimiento Inicial'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Dolor Inicial</span>
                      <p className="text-lg font-black text-rose-400 mt-0.5">{progressStats.initialEVA}/10</p>
                      <span className="text-[9px] text-slate-400">Sesión #1</span>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Dolor Actual</span>
                      <p className="text-lg font-black text-emerald-400 mt-0.5">{progressStats.currentEVA}/10</p>
                      <span className="text-[9px] text-slate-400">Última sesión</span>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Alivio Total</span>
                      <p className="text-lg font-black text-cyan-400 mt-0.5">
                        {progressStats.percentageRelief > 0 ? `-${progressStats.percentageRelief}%` : '0%'}
                      </p>
                      <span className="text-[9px] text-slate-400">Reducción de dolor</span>
                    </div>

                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Estado Clínico</span>
                      <p className="text-xs font-bold text-white mt-1.5 truncate">
                        {progressStats.currentEVA <= 2 ? 'Fase Alta / Mantenimiento' :
                         progressStats.currentEVA <= 5 ? 'Readaptación Activa' : 'Fase Aguda'}
                      </p>
                      <span className="text-[9px] text-cyan-300">Monitoreado</span>
                    </div>
                  </div>

                  {/* SEGUIMIENTO EVOLUTIVO: GRÁFICO COMPARATIVO DE RANGOS ARTICULARES (ROM) Y DOLOR (EVA) */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-900/60 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block">
                            Seguimiento Evolutivo Comparativo
                          </span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.2 rounded">
                            ROM vs EVA
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white mt-0.5">
                          Evolución Temporal: Escala Analógica del Dolor (0-10) vs. Rango Articular Funcional (0°-180°)
                        </h5>
                      </div>

                      {/* Chart Metric Filter Buttons */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => setChartMetricView('both')}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            chartMetricView === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Ambos (EVA & ROM)
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricView('eva')}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            chartMetricView === 'eva' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Solo Dolor EVA
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartMetricView('rom')}
                          className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            chartMetricView === 'rom' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Solo Rango ROM
                        </button>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-56 sm:h-64 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolutionChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            tick={{ fontSize: 11, fill: '#cbd5e1' }}
                            tickLine={false}
                          />
                          {(chartMetricView === 'both' || chartMetricView === 'eva') && (
                            <YAxis 
                              yAxisId="left" 
                              domain={[0, 10]} 
                              stroke="#f43f5e" 
                              tick={{ fontSize: 11, fill: '#f43f5e' }}
                              tickLine={false}
                              label={{ value: 'EVA (0-10)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10, offset: 12 }}
                            />
                          )}
                          {(chartMetricView === 'both' || chartMetricView === 'rom') && (
                            <YAxis 
                              yAxisId="right" 
                              orientation="right" 
                              domain={[0, 180]} 
                              stroke="#06b6d4" 
                              tick={{ fontSize: 11, fill: '#06b6d4' }}
                              tickLine={false}
                              label={{ value: 'ROM (0°-180°)', angle: 90, position: 'insideRight', fill: '#06b6d4', fontSize: 10, offset: 12 }}
                            />
                          )}
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                                      <span className="font-extrabold text-cyan-400">{data.sessionLabel} • {data.fullDate}</span>
                                      <span className="text-[10px] text-slate-400">{data.time}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 font-medium truncate max-w-[200px]">
                                      {data.reason}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <div className="bg-rose-950/40 p-1.5 rounded border border-rose-800/40">
                                        <span className="text-[9px] text-rose-300 block font-bold">Nivel Dolor EVA</span>
                                        <span className="text-sm font-extrabold text-rose-400">{data.painEVA} / 10</span>
                                      </div>
                                      <div className="bg-cyan-950/40 p-1.5 rounded border border-cyan-800/40">
                                        <span className="text-[9px] text-cyan-300 block font-bold">Rango Articular</span>
                                        <span className="text-sm font-extrabold text-cyan-400">{data.romDegrees}° ({data.romPercent}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} 
                            formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                          />
                          {(chartMetricView === 'both' || chartMetricView === 'eva') && (
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="painEVA" 
                              name="Dolor EVA (0-10)" 
                              stroke="#f43f5e" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 1.5 }}
                              activeDot={{ r: 6, fill: '#f43f5e' }}
                            />
                          )}
                          {(chartMetricView === 'both' || chartMetricView === 'rom') && (
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="romDegrees" 
                              name="Rango Articular ROM (0°-180°)" 
                              stroke="#06b6d4" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 1.5 }}
                              activeDot={{ r: 6, fill: '#06b6d4' }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Timeline Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                        Hitos de Sesión:
                      </span>
                      {progressStats.chronological.map((s, idx) => {
                        const romDeg = getRomScoreOrDegrees(s);
                        return (
                          <div key={`chrono-${s.id || idx}-${idx}`} className="flex items-center shrink-0">
                            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-center min-w-[95px]">
                              <span className="text-[9px] font-bold text-cyan-400 block">S#{idx + 1} • {s.date.slice(5)}</span>
                              <div className="flex items-center justify-center gap-1.5 my-0.5">
                                <span className="text-xs font-black text-rose-400">
                                  {s.painLevelEVA}/10
                                </span>
                                <span className="text-slate-500 text-[10px]">|</span>
                                <span className="text-xs font-black text-cyan-300">
                                  {romDeg}°
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 block truncate max-w-[85px]">
                                {(s.affectedZones || [s.affectedZone])[0]}
                              </span>
                            </div>
                            {idx < progressStats.chronological.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical History of Sessions for this Student */}
              <div>
                <div className="flex items-center justify-between mb-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Sesiones Registradas ({memberSessions.length})</span>
                  </h4>
                  {memberSessions.length > 0 && (
                    <span className="text-[11px] text-slate-500">
                      Última atención: {memberSessions[0].date}
                    </span>
                  )}
                </div>

                {memberSessions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">Sin sesiones registradas para este alumno</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en &quot;Nueva Sesión con Imágenes&quot; para registrar la primera evaluación.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memberSessions.map((session, idx) => {
                      const isExpanded = expandedSessionId === session.id;
                      const zones = session.affectedZones || [session.affectedZone];

                      return (
                        <div
                          key={`session-card-${session.id || idx}-${idx}`}
                          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                        >
                          {/* Session Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                Sesión #{session.sessionNumber || (memberSessions.length - idx)}
                              </span>
                              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {session.date}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-600 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {session.time}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs font-medium text-slate-600">
                                {session.physiotherapistName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                Dolor EVA: {session.painLevelEVA}/10
                              </span>
                              {session.improvementStatus && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {session.improvementStatus === 'notable_mejora' ? 'Notable Mejora' :
                                   session.improvementStatus === 'mejora_leve' ? 'Mejora Leve' :
                                   session.improvementStatus === 'estable' ? 'Estable' : 'En Evaluación'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Multiple Affected Zones Badges */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Zonas Afectadas Evaluadas ({zones.length}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {zones.map((zKey, zIdx) => {
                                const info = ZONE_DETAILS.find(item => item.id === zKey);
                                return (
                                  <span
                                    key={`zone-badge-${session.id || idx}-${zKey}-${zIdx}`}
                                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-1.5"
                                  >
                                    <Target className="w-3 h-3 text-rose-600" />
                                    <span>{info?.label || zKey}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Reason & Posture Summary */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700 block text-[10px] uppercase">Motivo / Diagnóstico:</span>
                              <p className="text-slate-800 truncate">{session.consultationReason}</p>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700 block text-[10px] uppercase">Postura Evaluada:</span>
                              <p className="text-slate-800 truncate">{session.posturalEvaluation || 'Alineación neutral'}</p>
                            </div>
                          </div>

                          {/* Gym Workout Restrictions Banner */}
                          <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-rose-800 text-[11px] uppercase">Restricciones en Gimnasio:</strong>
                              <p className="text-slate-800 text-[11px] font-medium">{session.gymWorkoutRestrictions}</p>
                            </div>
                          </div>

                          {/* Footer with Actions (Edit, PDF Report, WhatsApp, Delete) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                            <button
                              onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              <span>{isExpanded ? 'Ocultar Detalle' : 'Ver Evaluación, Ejercicios & Observaciones'}</span>
                            </button>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleEditSession(session)}
                                className="flex items-center gap-1 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer border border-slate-200"
                                title="Editar esta sesión y sus observaciones"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>

                              <button
                                onClick={() => setReportModalSession(session)}
                                className="flex items-center gap-1.5 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer border border-blue-200"
                                title="Ver ficha clínica, descargar en PDF y compartir"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Reporte PDF</span>
                              </button>

                              <button
                                onClick={() => setReportModalSession(session)}
                                className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer border border-emerald-200"
                                title="Enviar resumen por WhatsApp"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (confirm('¿Estás seguro de eliminar este registro de fisioterapia?')) {
                                    deletePhysioRecord(session.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Clinical Details */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/80 p-3.5 rounded-xl text-xs">
                              
                              {/* Therapist observations */}
                              {session.additionalObservations && session.additionalObservations.length > 0 && (
                                <div className="space-y-1.5">
                                  <strong className="text-slate-800 text-[11px] uppercase tracking-wider block">
                                    Observaciones del Fisioterapeuta ({session.additionalObservations.length}):
                                  </strong>
                                  <div className="space-y-1">
                                    {session.additionalObservations.map((obs, oIdx) => (
                                      <p key={`obs-${session.id || idx}-${oIdx}`} className="bg-white p-2 rounded-lg border border-slate-200 text-slate-700">
                                        • {obs}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Student friendly summary */}
                              {session.patientFriendlySummary && (
                                <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-blue-900">
                                  <strong className="block text-[10px] uppercase font-bold mb-0.5">Explicación para el Alumno:</strong>
                                  <p className="text-slate-700 leading-relaxed">{session.patientFriendlySummary}</p>
                                </div>
                              )}

                              {/* Exercise dosage cards preview */}
                              {session.exerciseDosage && (
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                                    <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Cartilla de Ejercicios: {session.exerciseDosage.customCardTitle}</span>
                                  </span>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {session.exerciseDosage.customExercises.map((ex, exIdx) => (
                                      <div key={ex.id ? `ex-card-${session.id || idx}-${ex.id}` : `ex-card-${session.id || idx}-${exIdx}`} className="bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
                                        <div className="font-bold text-slate-900 flex items-center justify-between">
                                          <span>{exIdx + 1}. {ex.name}</span>
                                          <span className="text-emerald-700 font-semibold">{ex.series}x{ex.repsOrTime}</span>
                                        </div>
                                        {ex.techniqueTips && (
                                          <p className="text-[10px] text-slate-500 italic mt-0.5">💡 {ex.techniqueTips}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">Selecciona un alumno para ver su historial clínico</p>
            </div>
          )}

        </div>

      </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR EVALUACIÓN CLÍNICA */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block">
                    {editingSessionId ? 'Modificar Registro Clínico' : 'Ficha de Valoración Fisioterapéutica'}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {editingSessionId ? 'Editar Evaluación Clínica & Observaciones' : 'Nueva Evaluación Clínica con Imágenes'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewSessionModalOpen(false)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs (5 Tabs) */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-1 overflow-x-auto shrink-0 py-1.5">
              <button
                type="button"
                onClick={() => setActiveModalTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === 'general' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>1. Zonas & Tratamiento Editable ({formZones.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('fisica')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === 'fisica' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>2. Postura & Visión Lateral</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('funcional')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === 'funcional' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>3. Funcional & Protocolo Williams</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('dosificacion')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === 'dosificacion' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                <span>4. Cartilla con Fotos ({formCustomExercises.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('observaciones')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === 'observaciones' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-600" />
                <span>5. Observaciones & Alumno ({formAdditionalObservations.length})</span>
              </button>
            </div>

            {/* PLANTILLAS DE EVALUACIÓN: BARRA DE CARGA Y GUARDADO RÁPIDO */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-b border-indigo-100 p-2.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Plantillas de Evaluación:</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold">
                      {physioTemplates.length} disponibles
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    Carga protocolos predefinidos para agilizar la ficha o guarda tu configuración actual.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const tpl = physioTemplates.find(t => t.id === e.target.value);
                    if (tpl) handleApplyTemplate(tpl);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs max-w-[220px]"
                >
                  <option value="">⚡ Cargar plantilla predefinida...</option>
                  {physioTemplates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} {tpl.isCustom ? '⭐ (Personalizada)' : ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setTemplateNameInput(`Protocolo ${formZones.map(z => z.replace('_', ' ')).join(' + ')}`);
                    setTemplateDescInput(`Tratamiento y ejercicios para ${formReason || 'evaluación fisioterapéutica'}`);
                    setIsSaveTemplateModalOpen(true);
                  }}
                  className="flex items-center gap-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Guardar todos los campos actuales como nueva plantilla"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Guardar como Plantilla</span>
                </button>
              </div>
            </div>

            {/* Template Toast Banner */}
            {templateAppliedToast && (
              <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-bold flex items-center justify-between animate-in slide-in-from-top shrink-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{templateAppliedToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateAppliedToast(null)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveSession} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TAB 1: ZONAS AFECTADAS (MÚLTIPLE) & DATOS BÁSICOS */}
              {activeModalTab === 'general' && (
                <div className="space-y-5">
                  
                  {/* Student & Date Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Alumno / Paciente *
                      </label>
                      <select
                        value={formMemberId}
                        onChange={e => setFormMemberId(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      >
                        {members.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.fullName} (DNI: {m.dni})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Fecha & Hora *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={formDate}
                          onChange={e => setFormDate(e.target.value)}
                          required
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          value={formTime}
                          onChange={e => setFormTime(e.target.value)}
                          placeholder="10:00 AM"
                          className="w-24 text-xs p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Fisioterapeuta Tratante *
                      </label>
                      <select
                        value={formPhysioName}
                        onChange={e => setFormPhysioName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      >
                        {availablePhysios.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Consultation Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Motivo de Consulta / Diagnóstico Inicial *
                    </label>
                    <input
                      type="text"
                      value={formReason}
                      onChange={e => setFormReason(e.target.value)}
                      placeholder="ej. Dolor lumbar agudo tras peso muerto + tendinitis de muñeca derecha"
                      required
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>

                  {/* Pain Level EVA Slider */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-600" />
                        <span>Escala Analógica Visual de Dolor (EVA):</span>
                      </span>
                      <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                        {formPainEVA} / 10 • {formPainEVA <= 3 ? 'Leve' : formPainEVA <= 7 ? 'Moderado' : 'Severo / Incapacitante'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={formPainEVA}
                      onChange={e => setFormPainEVA(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>

                  {/* INTERACTIVE BODY MAP (MULTIPLE SELECTION WITH SILHOUETTES) */}
                  <div>
                    <BodyMapVisual
                      selectedZones={formZones}
                      onToggleZone={handleToggleZone}
                      onAddCustomZone={handleAddCustomZone}
                      onRemoveZone={handleRemoveZone}
                    />
                  </div>

                  {/* TRATAMIENTO Y TÉCNICA EDITABLE */}
                  <EditableTreatments
                    treatments={formEditableTreatments}
                    onChange={setFormEditableTreatments}
                  />
                </div>
              )}

              {/* TAB 2: EVALUACIÓN FÍSICA & POSTURA */}
              {activeModalTab === 'fisica' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Historia Clínica & Mecanismo de Lesión:
                    </label>
                    <textarea
                      rows={2}
                      value={formClinicalHistory}
                      onChange={e => setFormClinicalHistory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      placeholder="Mecanismo de lesión, tiempo de evolución, desencadenantes..."
                    />
                  </div>

                  {/* Antecedentes Médicos */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Antecedentes Médicos Previos:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {COMMON_ANTECEDENTS.map(antecedent => {
                        const isChecked = formMedicalBackground.includes(antecedent);
                        return (
                          <label
                            key={antecedent}
                            className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2 cursor-pointer transition-colors ${
                              isChecked ? 'bg-indigo-50 border-indigo-400 font-bold text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setFormMedicalBackground(prev => prev.filter(a => a !== antecedent));
                                } else {
                                  setFormMedicalBackground(prev => [...prev, antecedent]);
                                }
                              }}
                              className="accent-indigo-600"
                            />
                            <span>{antecedent}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* MEDICAMENTOS EN CUADRADO DE TEXTO */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-cyan-600" />
                        <span>Medicamentos Actuales, Dosis & Posología (Cuadrado de Texto):</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Especifica fármacos, frecuencia y si fueron prescritos recientemente
                      </span>
                    </div>

                    {/* Quick Insert Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Insertar rápido:</span>
                      {[
                        'Ibuprofeno 400mg c/8h',
                        'Paracetamol 500mg c/8h',
                        'Ciclobenzaprina 10mg noche',
                        'Naproxeno 500mg c/12h',
                        'Diclofenaco 50mg c/8h',
                        'Omeprazol 20mg ayunas',
                        'Tramadol 50mg condicional',
                        'Sin medicación farmacológica'
                      ].map(pill => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => {
                            if (!formMedicationsText.trim()) {
                              setFormMedicationsText(pill);
                            } else if (!formMedicationsText.includes(pill)) {
                              setFormMedicationsText(prev => `${prev}; ${pill}`);
                            }
                          }}
                          className="px-2 py-0.5 rounded-md bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-800 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          + {pill}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={formMedicationsText}
                      onChange={e => setFormMedicationsText(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-cyan-500 font-medium text-slate-800 leading-relaxed placeholder-slate-400"
                      placeholder="Ej: Ibuprofeno 400 mg cada 8 horas por 3 días (tras alimentos); Paracetamol 500 mg condicional al dolor; Omeprazol 20 mg protector gástrico..."
                    />
                  </div>

                  {/* VISUAL POSTURE SELECTOR (VISIÓN LATERAL, RODILLAS, TOBILLO & COMENTARIOS) */}
                  <div>
                    <PostureVisualSelector
                      lateralEvaluation={formLateralPosture}
                      onLateralEvaluationChange={setFormLateralPosture}
                      visualKnees={formVisualKnees}
                      onVisualKneesChange={setFormVisualKnees}
                      visualAnkles={formVisualAnkles}
                      onVisualAnklesChange={setFormVisualAnkles}
                      visualComments={formVisualComments}
                      onVisualCommentsChange={setFormVisualComments}
                      selectedFindings={formPostureFindings}
                      onToggleFinding={handleTogglePostureFinding}
                      notes={formPostureNotes}
                      onNotesChange={setFormPostureNotes}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: EVALUACIÓN FUNCIONAL & ARTICULAR */}
              {activeModalTab === 'funcional' && (
                <div className="space-y-5">
                  <FunctionalVisuals
                    romStatus={formROMStatus}
                    onRomStatusChange={setFormROMStatus}
                    romDetails={formROMDetails}
                    onRomDetailsChange={setFormROMDetails}
                    mobilityQuality={formMobilityQuality}
                    onMobilityQualityChange={setFormMobilityQuality}
                    painPhase={formPainPhase}
                    onPainPhaseChange={setFormPainPhase}
                    dynamicPainEVA={formDynamicPainEVA}
                    onDynamicPainEVAChange={setFormDynamicPainEVA}
                    painNature={formPainNature}
                    onPainNatureChange={setFormPainNature}
                    tests={formFunctionalTests}
                    functionalTests={formFunctionalTests}
                    onToggleTestResult={handleToggleTestResult}
                    muscleTone={formMuscleTone}
                    onMuscleToneChange={setFormMuscleTone}
                    tempEdema={formTempEdema}
                    onTempEdemaChange={setFormTempEdema}
                    tenderZoneNotes={formTenderZoneNotes}
                    tenderNotes={formTenderZoneNotes}
                    onTenderZoneNotesChange={setFormTenderZoneNotes}
                  />

                  {/* Add Custom Test Control */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      ¿Deseas agregar una prueba ortopédica o funcional personalizada?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const testName = prompt('Nombre de la prueba ortopédica o funcional:');
                        if (testName) {
                          const joint = prompt('Articulación evaluada (ej. Muñeca, Lumbar, Tobillo):') || 'Articulación';
                          handleAddCustomTest(testName, joint);
                        }
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Otra Prueba</span>
                    </button>
                  </div>

                  {/* EVALUACIÓN FUNCIONAL WILLIAMS */}
                  <WilliamsVisuals
                    williamsEval={formWilliamsEval}
                    onChange={setFormWilliamsEval}
                  />
                </div>
              )}

              {/* TAB 4: CARTILLA DE EJERCICIOS CON IMÁGENES Y COMENTARIOS */}
              {activeModalTab === 'dosificacion' && (
                <div className="space-y-5">
                  <ExercisePrescriptionCard
                    exercises={formCustomExercises}
                    onChange={setFormCustomExercises}
                    cardTitle={formCardTitle}
                    onCardTitleChange={setFormCardTitle}
                    cardFrequency={formCardFrequency}
                    onCardFrequencyChange={setFormCardFrequency}
                  />

                  {/* Adaptación y Restricciones Rápidas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Criterios de Progresión de Cargas:
                      </label>
                      <input
                        type="text"
                        value={formProgressionCriteria}
                        onChange={e => setFormProgressionCriteria(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        placeholder="Ej. Incrementar repeticiones antes de peso..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Carga Máxima Guiada (Kg):
                      </label>
                      <input
                        type="number"
                        value={formMaxKg}
                        onChange={e => setFormMaxKg(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        placeholder="Kg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: OBSERVACIONES CLÍNICAS (CRUD: AGREGAR, EDITAR, ELIMINAR), EVOLUCIÓN & ALUMNO */}
              {activeModalTab === 'observaciones' && (
                <div className="space-y-6">
                  
                  {/* SECCIÓN DE OBSERVACIONES CLÍNICAS DINÁMICAS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          <span>Observaciones Clínicas del Fisioterapeuta (Agregar / Editar / Eliminar)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Agrega cualquier hallazgo clínico particular, notas biomecánicas o indicaciones que saldrán impresas en el reporte PDF.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                        {formAdditionalObservations.length} observaciones
                      </span>
                    </div>

                    {/* Add Observation Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Escribe una observación clínica (ej. Disminución de dolor a la palpación, dolor de muñeca al apoyar palma)..."
                        value={newObservationInput}
                        onChange={e => setNewObservationInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddObservation();
                          }
                        }}
                        className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddObservation}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                    </div>

                    {/* Quick Observation Suggestions */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sugerencias rápidas para agregar en un clic:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Contractura muscular paravertebral activa',
                          'Tendinitis en muñeca al agarre y pronación',
                          'Hipersensibilidad al tacto en inserción tendinosa',
                          'Buena tolerancia al tratamiento y sin dolor nocturno',
                          'Limitación para flexionar tronco en últimos 15 grados',
                          'Discrepancia pélvica de 1cm con compensación de marcha',
                          'Se aconseja hielo 15 min tras sesión de musculación'
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              if (!formAdditionalObservations.includes(suggestion)) {
                                setFormAdditionalObservations(prev => [...prev, suggestion]);
                              }
                            }}
                            className="text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            + {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Observations List (Editable & Deletable) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {formAdditionalObservations.map((obs, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={obs}
                            onChange={e => handleEditObservation(idx, e.target.value)}
                            className="flex-1 bg-transparent text-xs text-slate-800 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveObservation(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                            title="Eliminar observación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* EXPLICACIÓN ENTENDIBLE PARA EL ALUMNO */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 rounded-2xl border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-blue-600" />
                        <span>Explicación Didáctica y Entendible para el Alumno *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const zonesText = formZones.map(z => {
                            const found = ZONE_DETAILS.find(item => item.id === z);
                            return found ? found.label : z;
                          }).join(' y ');
                          setFormPatientFriendlySummary(
                            `Hola, en esta sesión se evaluaron las molestias en ${zonesText}. Tu nivel de dolor actual es ${formPainEVA}/10. Es fundamental no levantar cargas axiales pesadas ni forzar la muñeca. Cumple con la cartilla de ejercicios terapéuticos y asiste a tu próximo control.`
                          );
                        }}
                        className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-300 hover:bg-blue-100 cursor-pointer"
                      >
                        Auto-generar texto claro
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={formPatientFriendlySummary}
                      onChange={e => setFormPatientFriendlySummary(e.target.value)}
                      placeholder="Redacta en palabras sencillas qué tiene el alumno y qué debe hacer..."
                      className="w-full text-xs p-2.5 rounded-xl border border-blue-200 bg-white"
                    />
                  </div>

                  {/* ESTADO DE MEJORA & EVOLUCIÓN RESPECTO A SESIONES PREVIAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 uppercase">
                        Estado de Mejoría respecto a sesiones previas:
                      </label>
                      <select
                        value={formImprovementStatus}
                        onChange={e => setFormImprovementStatus(e.target.value as any)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                      >
                        <option value="notable_mejora">🎉 Notable Mejoría (Dolor reducido &gt; 50% / Mayor ROM)</option>
                        <option value="mejora_leve">👍 Mejoría Leve (Menos molestia al movimiento)</option>
                        <option value="estable">⚖️ Condición Estable (Sin cambios significativos)</option>
                        <option value="en_evaluacion">🔍 En Evaluación Inicial (Primera sesión o fase de prueba)</option>
                        <option value="empeoramiento">⚠️ Aumento de Sintomatología (Reajustar protocolo)</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 uppercase">
                        Fecha Sugerida de Próximo Control:
                      </label>
                      <input
                        type="date"
                        value={formNextAppt}
                        onChange={e => setFormNextAppt(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  {/* CUIDADOS EN EL GIMNASIO & EN CASA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-rose-800 uppercase mb-1">
                        Restricciones en Sala de Pesas / Gimnasio:
                      </label>
                      <input
                        type="text"
                        value={formGymRestrictions}
                        onChange={e => setFormGymRestrictions(e.target.value)}
                        placeholder="ej. Evitar peso muerto, sentadillas pesadas, agarre falso..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-800 uppercase mb-1">
                        Pautas e Indicaciones para el Hogar:
                      </label>
                      <input
                        type="text"
                        value={formHomeIndications}
                        onChange={e => setFormHomeIndications(e.target.value)}
                        placeholder="ej. Compresas frías 15 min, cartilla 3 veces por semana..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Al guardar se generará automáticamente la ficha ilustrada en PDF</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewSessionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewCurrentPDF}
                    className="flex items-center gap-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    title="Previsualizar y descargar la ficha en PDF estructurado con los datos actuales"
                  >
                    <Download className="w-4 h-4 text-cyan-700" />
                    <span>Previsualizar / Descargar PDF</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer hover:scale-105"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{editingSessionId ? 'Guardar Cambios de Sesión' : 'Guardar y Abrir Reporte PDF'}</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL: GUARDAR CONFIGURACIÓN ACTUAL COMO NUEVA PLANTILLA */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookmarkPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-sm sm:text-base">Guardar como Plantilla de Evaluación</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Se guardarán las zonas afectadas seleccionadas ({formZones.length}), pruebas ortopédicas ({formFunctionalTests.length}), dosificación de ejercicios ({formCustomExercises.length}) y observaciones para reutilizarlas en nuevas fichas clínicas.
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Protocolo Lumbar & Estabilidad Core"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Categoría Clínica
                </label>
                <select
                  value={templateCategoryInput}
                  onChange={(e) => setTemplateCategoryInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="Columna & Tronco">Columna & Tronco (Lumbar, Dorsal, Pelvis)</option>
                  <option value="Cervical & Hombro">Cervical & Hombro (Manguito, Trapecio)</option>
                  <option value="Miembro Superior">Miembro Superior (Muñeca, Codo, Mano)</option>
                  <option value="Miembro Inferior">Miembro Inferior (Rodilla, Tobillo, Cadera)</option>
                  <option value="Readaptación Deportiva">Readaptación Deportiva & Retorno a Cargas</option>
                  <option value="Personalizado">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">
                  Descripción o Criterio Clínico
                </label>
                <textarea
                  rows={2}
                  placeholder="Indicaciones para cuándo aplicar esta plantilla..."
                  value={templateDescInput}
                  onChange={(e) => setTemplateDescInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORTE CLÍNICO ILUSTRADO & DESCARGA EN PDF */}
      {reportModalSession && (
        <PhysioReportModal
          session={reportModalSession}
          member={members.find(m => m.id === reportModalSession.memberId)}
          onClose={() => setReportModalSession(null)}
        />
      )}

    </div>
  );
};
