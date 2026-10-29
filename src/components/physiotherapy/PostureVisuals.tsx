import React, { useState } from 'react';
import { 
  Check, 
  Eye, 
  AlertCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Sliders, 
  Maximize2,
  Activity,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  LateralPostureEvaluation, 
  VisualJointKnees, 
  VisualJointAnkles 
} from '../../types/gym';

export interface PostureOption {
  id: string;
  name: string;
  type: 'neutral' | 'cabeza_adelantada' | 'cifosis_dorsal' | 'lordosis_lumbar' | 'escoliosis' | 'hombros_protraidos';
  shortDesc: string;
  clinicalSigns: string;
  badge: string;
  badgeColor: string;
}

export const POSTURE_PRESETS: PostureOption[] = [
  {
    id: 'pos-neutral',
    name: 'Alineación Neutral Equilibrada',
    type: 'neutral',
    shortDesc: 'Línea de plomada pasa por conducto auditivo, acromion, trocánter y maléolo.',
    clinicalSigns: 'Curvaturas fisiológicas armónicas, pelvis neutra y simetría bilateral.',
    badge: 'Alineación Normal',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'pos-cabeza',
    name: 'Cabeza Adelantada (Forward Head)',
    type: 'cabeza_adelantada',
    shortDesc: 'Oreja por delante de la línea acromial con hiperextensión suboccipital.',
    clinicalSigns: 'Sobrecarga de trapecios superiores y debilidad de flexores profundos del cuello.',
    badge: 'Cervical Alterada',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'pos-cifosis',
    name: 'Hipercifosis Dorsal Torácica',
    type: 'cifosis_dorsal',
    shortDesc: 'Curva dorsal exagerada ("joroba") con escápulas en abducción/campaneo.',
    clinicalSigns: 'Acortamiento pectoral menor, debilidad de romboides y trapecio medio.',
    badge: 'Dorsal Aumentada',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  {
    id: 'pos-lordosis',
    name: 'Hiperlordosis Lumbar',
    type: 'lordosis_lumbar',
    shortDesc: 'Arco lumbar acentuado con anteversión pélvica marcada.',
    clinicalSigns: 'Tensión en flexores de cadera (psoas) e inhibición de glúteos y transverso.',
    badge: 'Lumbo-Pélvica',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    id: 'pos-escoliosis',
    name: 'Escoliosis / Asimetría Lateral',
    type: 'escoliosis',
    shortDesc: 'Desviación lateral de la columna con asimetría de triángulos de la talla.',
    clinicalSigns: 'Desnivel de hombros, ángulo de Cobb funcional o estructural a vigilar.',
    badge: 'Asimetría Tridimensional',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  },
  {
    id: 'pos-hombros',
    name: 'Hombros Protraídos & Enrollados',
    type: 'hombros_protraidos',
    shortDesc: 'Rotación interna humeral con antepulsión de cabeza humeral.',
    clinicalSigns: 'Riesgo de pinzamiento subacromial y tendinopatía de manguito rotador.',
    badge: 'Cintura Escapular',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300'
  }
];

export const PostureSilhouetteSVG: React.FC<{ type: PostureOption['type']; active?: boolean }> = ({ type, active }) => {
  const strokeColor = active ? '#38bdf8' : '#64748b';
  const plumbLineColor = '#ef4444';

  switch (type) {
    case 'neutral':
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="50" y1="5" x2="50" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="50" cy="22" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#0284c7' : '#1e293b'} fillOpacity="0.4" />
          <path d="M49 32 L49 42" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M50 42 C47 52, 53 65, 50 78 C47 90, 52 100, 50 110" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="50" cy="110" rx="9" ry="6" stroke={strokeColor} strokeWidth="2" />
          <line x1="50" y1="114" x2="50" y2="150" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="150" x2="56" y2="150" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="22" r="2" fill="#22c55e" />
          <circle cx="50" cy="45" r="2" fill="#22c55e" />
          <circle cx="50" cy="110" r="2" fill="#22c55e" />
          <circle cx="50" cy="150" r="2" fill="#22c55e" />
        </svg>
      );

    case 'cabeza_adelantada':
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="42" y1="5" x2="42" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="62" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#f59e0b' : '#1e293b'} fillOpacity="0.4" />
          <path d="M58 29 L46 44" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
          <path d="M46 44 C42 55, 46 75, 43 95 L42 112" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="112" x2="42" y2="150" stroke={strokeColor} strokeWidth="3" />
          <line x1="36" y1="150" x2="50" y2="150" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'cifosis_dorsal':
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="46" y1="5" x2="46" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="56" cy="22" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#ef4444' : '#1e293b'} fillOpacity="0.4" />
          <path d="M52 32 C38 48, 26 62, 38 82 C44 95, 46 102, 46 112" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="46" y1="112" x2="46" y2="150" stroke={strokeColor} strokeWidth="3" />
          <line x1="38" y1="150" x2="54" y2="150" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="31" cy="62" r="3" fill="#ef4444" />
        </svg>
      );

    case 'lordosis_lumbar':
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="48" y1="5" x2="48" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="48" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#f59e0b' : '#1e293b'} fillOpacity="0.4" />
          <path d="M48 30 C44 48, 48 65, 46 78 C44 88, 65 96, 52 112" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="50" cy="112" rx="10" ry="6" transform="rotate(25 50 112)" stroke="#f59e0b" strokeWidth="2" />
          <line x1="48" y1="118" x2="48" y2="150" stroke={strokeColor} strokeWidth="3" />
          <line x1="40" y1="150" x2="56" y2="150" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'escoliosis':
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="50" y1="5" x2="50" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="50" cy="20" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#a855f7' : '#1e293b'} fillOpacity="0.4" />
          <path d="M50 30 C62 48, 64 64, 50 78 C36 92, 38 104, 50 114" stroke="#a855f7" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="28" y1="46" x2="72" y2="40" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="112" x2="70" y2="116" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="115" x2="42" y2="150" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="58" y1="115" x2="58" y2="150" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'hombros_protraidos':
    default:
      return (
        <svg viewBox="0 0 100 160" className="w-full h-28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="46" y1="5" x2="46" y2="155" stroke={plumbLineColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="50" cy="22" r="10" stroke={strokeColor} strokeWidth="2.5" fill={active ? '#6366f1' : '#1e293b'} fillOpacity="0.4" />
          <path d="M48 32 L46 50 C44 70, 46 90, 46 112" stroke={strokeColor} strokeWidth="3" />
          <circle cx="60" cy="52" r="6" stroke="#6366f1" strokeWidth="2.5" fill="#6366f1" fillOpacity="0.3" />
          <path d="M60 58 Q66 85 58 110" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="46" y1="112" x2="46" y2="150" stroke={strokeColor} strokeWidth="3" />
          <line x1="38" y1="150" x2="54" y2="150" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );
  }
};

// =========================================================================
// SVG SILUETA LATERAL ESPECÍFICA CON LÍNEA DE PLOMADA Y MARCADORES ANATÓMICOS
// =========================================================================
export const LateralSilhouetteAnatomySVG: React.FC<{
  lateralEval?: LateralPostureEvaluation;
  className?: string;
}> = ({ lateralEval, className = "w-full h-72" }) => {
  const isHeadForward = lateralEval?.headPosition?.includes('adelantada');
  const isCervicalHypo = lateralEval?.cervicalSpine === 'rectificacion_cervical';
  const isCifosis = lateralEval?.thoracicSpine === 'hipercifosis_dorsal';
  const isLordosis = lateralEval?.lumbarSpine === 'hiperlordosis_lumbar';
  const isAnteversion = lateralEval?.pelvisTilt === 'anteversion_marcada';
  const isRecurvatum = lateralEval?.kneeSagittal === 'genu_recurvatum';
  const isFlexo = lateralEval?.kneeSagittal === 'genu_flexo';

  // Head center X position
  const headX = isHeadForward ? 64 : 50;
  const earX = isHeadForward ? 62 : 49;
  const shoulderX = 49;
  const hipX = isAnteversion ? 52 : 49;
  const kneeX = isRecurvatum ? 44 : isFlexo ? 55 : 49;
  const ankleX = 49;

  return (
    <svg viewBox="0 0 120 220" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Dark Container */}
      <rect width="120" height="220" rx="16" fill="#090d16" />

      {/* Grid Reference lines */}
      <line x1="10" y1="30" x2="110" y2="30" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
      <line x1="10" y1="65" x2="110" y2="65" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
      <line x1="10" y1="125" x2="110" y2="125" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
      <line x1="10" y1="170" x2="110" y2="170" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 2" />
      <line x1="10" y1="205" x2="110" y2="205" stroke="#334155" strokeWidth="1.5" />

      {/* Plumb Line (Línea de Plomada Roja de Referencia) */}
      <line x1="49" y1="8" x2="49" y2="210" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />
      <circle cx="49" cy="8" r="3" fill="#ef4444" />
      <text x="54" y="14" fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="monospace">PLOMADA</text>

      {/* Anatomical Lateral Body Profile */}
      {/* Head */}
      <circle cx={headX} cy="30" r="13" stroke="#38bdf8" strokeWidth="2.5" fill="#0284c7" fillOpacity="0.25" />
      {/* Ear tragus marker */}
      <circle cx={earX} cy="30" r="2.5" fill="#facc15" stroke="#000" strokeWidth="0.8" />
      <text x={earX + 5} y="32" fill="#facc15" fontSize="6" fontWeight="bold">Oreja</text>

      {/* Neck Cervical Spine */}
      {isHeadForward ? (
        <path d={`M${earX - 3} 38 C${shoulderX + 4} 45, ${shoulderX + 6} 55, ${shoulderX} 62`} stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
      ) : isCervicalHypo ? (
        <path d={`M${earX} 40 L${shoulderX} 62`} stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d={`M${earX} 40 C${shoulderX + 2} 48, ${shoulderX + 2} 56, ${shoulderX} 62`} stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      )}

      {/* Thoracic Spine (Dorsal) */}
      {isCifosis ? (
        <path d={`M${shoulderX} 62 C34 78, 32 98, ${shoulderX} 118`} stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d={`M${shoulderX} 62 C43 78, 43 98, ${shoulderX} 118`} stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" />
      )}
      {/* Acromion shoulder marker */}
      <circle cx={shoulderX} cy="62" r="2.5" fill="#22c55e" stroke="#000" strokeWidth="0.8" />
      <text x={shoulderX + 5} y="64" fill="#22c55e" fontSize="6" fontWeight="bold">Acromion</text>

      {/* Lumbar Spine */}
      {isLordosis ? (
        <path d={`M${shoulderX} 118 C64 128, 64 140, ${hipX} 150`} stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d={`M${shoulderX} 118 C54 128, 54 140, ${hipX} 150`} stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" />
      )}

      {/* Pelvis & Greater Trochanter Marker */}
      <ellipse 
        cx={hipX} 
        cy="150" 
        rx="10" 
        ry="7" 
        transform={isAnteversion ? `rotate(22 ${hipX} 150)` : `rotate(5 ${hipX} 150)`} 
        stroke={isAnteversion ? "#f59e0b" : "#38bdf8"} 
        strokeWidth="2.2" 
        fill={isAnteversion ? "#f59e0b" : "#38bdf8"} 
        fillOpacity="0.2" 
      />
      <circle cx={hipX} cy="150" r="2.5" fill="#facc15" stroke="#000" strokeWidth="0.8" />
      <text x={hipX + 8} y="152" fill="#facc15" fontSize="6" fontWeight="bold">Trocánter</text>

      {/* Femur / Thigh to Knee */}
      <line x1={hipX} y1="154" x2={kneeX} y2="182" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      {/* Knee joint marker */}
      <circle cx={kneeX} cy="182" r="3" fill={isRecurvatum || isFlexo ? "#f43f5e" : "#22c55e"} stroke="#000" strokeWidth="0.8" />
      <text x={kneeX + 6} y="184" fill={isRecurvatum || isFlexo ? "#f43f5e" : "#22c55e"} fontSize="6" fontWeight="bold">
        {isRecurvatum ? "Recurvatum" : isFlexo ? "Flexo" : "Cóndilo"}
      </text>

      {/* Tibia to Ankle */}
      <line x1={kneeX} y1="184" x2={ankleX} y2="205" stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" />
      {/* Lateral malleolus ankle marker */}
      <circle cx={ankleX} cy="205" r="2.5" fill="#22c55e" stroke="#000" strokeWidth="0.8" />
      <text x={ankleX + 5} y="207" fill="#22c55e" fontSize="6" fontWeight="bold">Maléolo</text>

      {/* Foot base */}
      <path d={`M${ankleX - 6} 205 L${ankleX + 16} 205 L${ankleX + 18} 208 L${ankleX - 7} 208 Z`} fill="#64748b" />

      {/* Deviation badges */}
      {isHeadForward && (
        <g>
          <rect x="75" y="24" width="40" height="13" rx="3" fill="#ef4444" fillOpacity="0.9" />
          <text x="79" y="33" fill="#fff" fontSize="6" fontWeight="bold">Adelantada</text>
        </g>
      )}
      {isCifosis && (
        <g>
          <rect x="5" y="75" width="34" height="13" rx="3" fill="#ef4444" fillOpacity="0.9" />
          <text x="8" y="84" fill="#fff" fontSize="6" fontWeight="bold">Cifosis</text>
        </g>
      )}
      {isLordosis && (
        <g>
          <rect x="76" y="125" width="40" height="13" rx="3" fill="#f59e0b" fillOpacity="0.9" />
          <text x="79" y="134" fill="#fff" fontSize="6" fontWeight="bold">Lordosis +</text>
        </g>
      )}
    </svg>
  );
};

// =========================================================================
// VISUAL KNEES & ANKLES SILHOUETTE SVG (RODILLAS & TOBILLOS)
// =========================================================================
export const KneesAnklesVisualSVG: React.FC<{
  knees?: VisualJointKnees;
  ankles?: VisualJointAnkles;
  className?: string;
}> = ({ knees, ankles, className = "w-full h-64" }) => {
  const isValgo = knees?.frontalAlignment === 'genu_valgo';
  const isVaro = knees?.frontalAlignment === 'genu_varo';
  const isFlatFoot = ankles?.plantarArch?.includes('plano');
  const isCavoFoot = ankles?.plantarArch === 'pie_cavo';
  const isValgoAnkle = ankles?.hindfootAlignment === 'valgo_retropie_pronacion';

  // Left & Right knee center X positions
  const leftKneeX = isValgo ? 56 : isVaro ? 36 : 46;
  const rightKneeX = isValgo ? 64 : isVaro ? 84 : 74;

  const leftFootX = isValgoAnkle ? 38 : 42;
  const rightFootX = isValgoAnkle ? 82 : 78;

  return (
    <svg viewBox="0 0 120 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="180" rx="14" fill="#090d16" />

      {/* Pelvis base */}
      <line x1="38" y1="20" x2="82" y2="20" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="38" cy="20" r="3" fill="#38bdf8" />
      <circle cx="82" cy="20" r="3" fill="#38bdf8" />
      <text x="44" y="14" fill="#94a3b8" fontSize="7" fontWeight="bold">EIPS / Pelvis</text>

      {/* Femur bones */}
      <line x1="38" y1="20" x2={leftKneeX} y2="78" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
      <line x1="82" y1="20" x2={rightKneeX} y2="78" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />

      {/* Knee joint Patellas */}
      <circle cx={leftKneeX} cy="78" r="6" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b" fillOpacity="0.3" />
      <circle cx={rightKneeX} cy="78" r="6" stroke="#f59e0b" strokeWidth="2" fill="#f59e0b" fillOpacity="0.3" />

      {/* Axis Lines for Valgo/Varo */}
      <line x1="38" y1="20" x2="38" y2="160" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <line x1="82" y1="20" x2="82" y2="160" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* Tibia bones */}
      <line x1={leftKneeX} y1="84" x2={leftFootX} y2="148" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
      <line x1={rightKneeX} y1="84" x2={rightFootX} y2="148" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

      {/* Ankle Malleoli */}
      <ellipse cx={leftFootX} cy="150" rx="4.5" ry="3" fill="#22c55e" />
      <ellipse cx={rightFootX} cy="150" rx="4.5" ry="3" fill="#22c55e" />

      {/* Feet Base */}
      <ellipse cx={leftFootX} cy="162" rx="7" ry="3.5" fill={isFlatFoot ? "#ef4444" : "#64748b"} />
      <ellipse cx={rightFootX} cy="162" rx="7" ry="3.5" fill={isFlatFoot ? "#ef4444" : "#64748b"} />

      {/* Badges on diagram */}
      <g>
        <rect x="15" y="88" width="40" height="13" rx="3" fill={isValgo || isVaro ? "#ef4444" : "#10b981"} />
        <text x="18" y="97" fill="#fff" fontSize="6.5" fontWeight="bold">
          {isValgo ? "Genu Valgo" : isVaro ? "Genu Varo" : "Rodilla Normal"}
        </text>
      </g>

      <g>
        <rect x="65" y="152" width="50" height="13" rx="3" fill={isFlatFoot || isValgoAnkle ? "#f59e0b" : "#10b981"} />
        <text x="68" y="161" fill="#fff" fontSize="6.5" fontWeight="bold">
          {isFlatFoot ? "Pie Plano" : isCavoFoot ? "Pie Cavo" : isValgoAnkle ? "Pronación" : "Tobillo Neutro"}
        </text>
      </g>
    </svg>
  );
};

// =========================================================================
// MAIN POSTURE VISUAL SELECTOR WITH LATERAL VIEW, EDITABLE POSTURE & KNEES/ANKLES
// =========================================================================
export interface PostureVisualsProps {
  selectedFindings: string[];
  onToggleFinding?: (findingName: string) => void;
  onAddCustomFinding?: (findingName: string) => void;
  onRemoveFinding?: (findingName: string) => void;
  notes?: string;
  onNotesChange?: (notes: string) => void;
  // Lateral view props
  lateralEvaluation?: LateralPostureEvaluation;
  onLateralEvaluationChange?: (lat: LateralPostureEvaluation) => void;
  // Knees and Ankles visual props
  visualKnees?: VisualJointKnees;
  onVisualKneesChange?: (knees: VisualJointKnees) => void;
  visualAnkles?: VisualJointAnkles;
  onVisualAnklesChange?: (ankles: VisualJointAnkles) => void;
  visualComments?: string;
  onVisualCommentsChange?: (comm: string) => void;
  readOnly?: boolean;
}

export const PostureVisualSelector: React.FC<PostureVisualsProps> = ({
  selectedFindings,
  onToggleFinding,
  onAddCustomFinding,
  onRemoveFinding,
  notes = '',
  onNotesChange,
  lateralEvaluation,
  onLateralEvaluationChange,
  visualKnees,
  onVisualKneesChange,
  visualAnkles,
  onVisualAnklesChange,
  visualComments = '',
  onVisualCommentsChange,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'lateral' | 'rodillas_tobillo'>('lateral');
  const [customFindingInput, setCustomFindingInput] = useState('');

  // Default Lateral State if not set
  const currentLateral: LateralPostureEvaluation = lateralEvaluation || {
    headPosition: 'adelantada_leve',
    cervicalSpine: 'normal_fisiologica',
    thoracicSpine: 'hipercifosis_dorsal',
    lumbarSpine: 'hiperlordosis_lumbar',
    pelvisTilt: 'anteversion_marcada',
    kneeSagittal: 'neutra',
    plumbLineDeviation: 'anteriorizada',
    notes: ''
  };

  // Default Knees State
  const currentKnees: VisualJointKnees = visualKnees || {
    frontalAlignment: 'genu_valgo',
    sagittalAlignment: 'neutro',
    patellarTracking: 'centrada',
    effusionInflammation: 'ausente',
    details: 'Ligero valgo dinámico observable en apoyo unipodal.'
  };

  // Default Ankles State
  const currentAnkles: VisualJointAnkles = visualAnkles || {
    hindfootAlignment: 'valgo_retropie_pronacion',
    plantarArch: 'pie_plano_flexible',
    achillesTendon: 'alineado_vertical',
    details: 'Tendón de Aquiles vertical con aplanamiento del arco medial en carga.'
  };

  const handleUpdateLateral = (field: keyof LateralPostureEvaluation, value: any) => {
    if (onLateralEvaluationChange) {
      onLateralEvaluationChange({
        ...currentLateral,
        [field]: value
      });
    }
  };

  const handleUpdateKnees = (field: keyof VisualJointKnees, value: any) => {
    if (onVisualKneesChange) {
      onVisualKneesChange({
        ...currentKnees,
        [field]: value
      });
    }
  };

  const handleUpdateAnkles = (field: keyof VisualJointAnkles, value: any) => {
    if (onVisualAnklesChange) {
      onVisualAnklesChange({
        ...currentAnkles,
        [field]: value
      });
    }
  };

  const isSelected = (name: string) => {
    return selectedFindings.some(f => f.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(f.toLowerCase()));
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customFindingInput.trim()) return;
    if (onAddCustomFinding) {
      onAddCustomFinding(customFindingInput.trim());
    } else if (onToggleFinding) {
      onToggleFinding(customFindingInput.trim());
    }
    setCustomFindingInput('');
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800 text-white shadow-xl">
      
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Evaluación Postural & Biomecánica Integral</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Editable
            </span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Examina la postura en plano sagital (visión lateral), inspección de rodillas/tobillos y patrones posturales.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('lateral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'lateral'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📐 Visión Lateral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rodillas_tobillo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rodillas_tobillo'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🦵 Rodillas & Tobillo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Patrones & Tarjetas</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: VISIÓN LATERAL (SAGITAL & LÍNEA DE PLOMADA)
         ========================================================================= */}
      {activeTab === 'lateral' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          
          {/* Left Column: Anatomical SVG Silhouette */}
          <div className="lg:col-span-5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Silueta Plano Sagital
              </span>
              <span className="text-[10px] text-red-400 font-mono font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Línea Plomada Roja
              </span>
            </div>

            <LateralSilhouetteAnatomySVG lateralEval={currentLateral} />

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Criterio Normal de Plomada:</span>
              <p>Pasa por el lóbulo de la oreja, acromion, trocánter mayor, anterior al eje de rodilla y anterior al maléolo externo.</p>
            </div>
          </div>

          {/* Right Column: Editable Lateral Checkpoints */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                <span>Checkpoints Anatómicos en Visión Lateral</span>
                <span className="text-[10px] font-normal text-slate-400">Edición en tiempo real</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Cabeza y Cuello */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">1. Posición de Cabeza:</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.headPosition}
                    onChange={e => handleUpdateLateral('headPosition', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="alineada">Alineada con Plomada</option>
                    <option value="adelantada_leve">Cabeza Adelantada Leve (+2 cm)</option>
                    <option value="adelantada_severa">Cabeza Adelantada Severa (Forward Head)</option>
                    <option value="retraccion_cervical">Retracción / Posteriorizada</option>
                  </select>
                </div>

                {/* 2. Columna Cervical */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">2. Columna Cervical:</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.cervicalSpine}
                    onChange={e => handleUpdateLateral('cervicalSpine', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_fisiologica">Lordosis Fisiológica Normal</option>
                    <option value="rectificacion_cervical">Rectificación Cervical (Cuello recto)</option>
                    <option value="hiperlordosis_cervical">Hiperlordosis Cervical</option>
                  </select>
                </div>

                {/* 3. Columna Dorsal */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">3. Columna Torácica / Dorsal:</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.thoracicSpine}
                    onChange={e => handleUpdateLateral('thoracicSpine', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_armonica">Cifosis Armónica Fisiológica</option>
                    <option value="hipercifosis_dorsal">Hipercifosis Dorsal (Dorso curvo)</option>
                    <option value="espalda_plana_rectificada">Dorso Plano / Rectificación Torácica</option>
                  </select>
                </div>

                {/* 4. Columna Lumbar */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">4. Columna Lumbar:</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.lumbarSpine}
                    onChange={e => handleUpdateLateral('lumbarSpine', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="normal_fisiologica">Lordosis Lumbar Fisiológica</option>
                    <option value="hiperlordosis_lumbar">Hiperlordosis Lumbar Acentuada</option>
                    <option value="rectificacion_lumbar">Rectificación Lumbar (Espalda plana)</option>
                  </select>
                </div>

                {/* 5. Inclinación Pélvica */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">5. Báscula Pélvica Sagital:</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.pelvisTilt}
                    onChange={e => handleUpdateLateral('pelvisTilt', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="neutra">Pelvis Neutra (Inclinación ~10°)</option>
                    <option value="anteversion_marcada">Anteversión Pélvica Marcada (&gt;15°)</option>
                    <option value="retroversion_marcada">Retroversión Pélvica (Aplanamiento)</option>
                  </select>
                </div>

                {/* 6. Rodillas en Sagital */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">6. Rodillas (Visión Lateral):</label>
                  <select
                    disabled={readOnly}
                    value={currentLateral.kneeSagittal}
                    onChange={e => handleUpdateLateral('kneeSagittal', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-medium focus:border-cyan-400"
                  >
                    <option value="neutra">Neutra (Extensión fisiológica 0°)</option>
                    <option value="genu_recurvatum">Genu Recurvatum (Hiperextensión &gt;5°)</option>
                    <option value="genu_flexo">Genu Flexo (Falta de extensión)</option>
                  </select>
                </div>
              </div>

              {/* Plomada Global */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Desviación respecto a la Línea de Plomada:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'equilibrada', label: 'Equilibrada', desc: 'Alineación armónica' },
                    { id: 'anteriorizada', label: 'Anteriorizada', desc: 'Centro cae hacia adelante' },
                    { id: 'posteriorizada', label: 'Posteriorizada', desc: 'Centro cae hacia atrás' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleUpdateLateral('plumbLineDeviation', opt.id)}
                      className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        currentLateral.plumbLineDeviation === opt.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{opt.label}</div>
                      <div className="text-[10px] opacity-80">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas de Visión Lateral */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Notas de Observación en Visión Lateral:
                </label>
                <textarea
                  disabled={readOnly}
                  rows={2}
                  value={currentLateral.notes || ''}
                  onChange={e => handleUpdateLateral('notes', e.target.value)}
                  placeholder="Detalles sobre protrusión de abdomen, báscula pélvica dinámica, marcha lateral..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: RODILLAS, TOBILLO & COMENTARIOS VISUALES
         ========================================================================= */}
      {activeTab === 'rodillas_tobillo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">
          
          {/* Left Diagram */}
          <div className="lg:col-span-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Ejes Mecánicos de Miembro Inferior
            </span>
            <KneesAnklesVisualSVG knees={currentKnees} ankles={currentAnkles} />
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
              <p>Valora el ángulo Q de rodillas, el tracking patelar y la caída del arco longitudinal del pie en bipedestación.</p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* SECCIÓN 1: EVALUACIÓN VISUAL DE RODILLAS */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Evaluación Visual de Rodillas</span>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                  Frente & Rótula
                </span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Alineación Frontal:</label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.frontalAlignment}
                    onChange={e => handleUpdateKnees('frontalAlignment', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="neutro_simetrico">Neutro y Simétrico</option>
                    <option value="genu_valgo">Genu Valgo (Rodillas en X)</option>
                    <option value="genu_varo">Genu Varo (Rodillas arqueadas)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Tracking & Posición Patelar:</label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.patellarTracking}
                    onChange={e => handleUpdateKnees('patellarTracking', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="centrada">Rótula Centrada en Tróclea</option>
                    <option value="estrabismo_convergente">Estrabismo Convergente</option>
                    <option value="estrabismo_divergente">Estrabismo Divergente</option>
                    <option value="rotula_alta">Rótula Alta (Patella Alta)</option>
                    <option value="rotula_baja">Rótula Baja</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Derrame / Inflamación Perirrotuliana:</label>
                  <select
                    disabled={readOnly}
                    value={currentKnees.effusionInflammation}
                    onChange={e => handleUpdateKnees('effusionInflammation', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="ausente">Ausente (Sin edema ni tumefacción)</option>
                    <option value="derrame_leve">Derrame Leve (Signo de la ola positivo)</option>
                    <option value="derrame_a_tension">Derrame a Tensión (Signo del témpano)</option>
                    <option value="bursitis_prerrotuliana">Bursitis Prerrotuliana / Infrarrotuliana</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={currentKnees.details || ''}
                    onChange={e => handleUpdateKnees('details', e.target.value)}
                    placeholder="Detalles de rodilla (ej. dolor a la palpación en interlínea medial, crepitación patelar)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: EVALUACIÓN VISUAL DE TOBILLO Y PIE */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                <span>2. Evaluación Visual de Tobillo y Pie</span>
                <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Retropié & Arco
                </span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Alineación de Retropié (Calcáneo):</label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.hindfootAlignment}
                    onChange={e => handleUpdateAnkles('hindfootAlignment', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="neutro">Neutro (Calcáneo vertical)</option>
                    <option value="valgo_retropie_pronacion">Valgo de Retropié (Pronación)</option>
                    <option value="varo_retropie_supinacion">Varo de Retropié (Supinación)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Arco Longitudinal Plantar:</label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.plantarArch}
                    onChange={e => handleUpdateAnkles('plantarArch', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="normal">Arco Normal Fisiológico</option>
                    <option value="pie_plano_flexible">Pie Plano Flexible</option>
                    <option value="pie_plano_rigido">Pie Plano Rígido</option>
                    <option value="pie_cavo">Pie Cavo (Arco elevado)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Tendón de Aquiles:</label>
                  <select
                    disabled={readOnly}
                    value={currentAnkles.achillesTendon}
                    onChange={e => handleUpdateAnkles('achillesTendon', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="alineado_vertical">Alineado Verticalmente (Sin engrosamiento)</option>
                    <option value="engrosamiento">Engrosamiento Nódulo Tendinoso</option>
                    <option value="desviacion_medial">Desviación Medial por Pronación Forzada</option>
                    <option value="desviacion_lateral">Desviación Lateral</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <input
                    type="text"
                    disabled={readOnly}
                    value={currentAnkles.details || ''}
                    onChange={e => handleUpdateAnkles('details', e.target.value)}
                    placeholder="Detalles de tobillo (ej. apoyo en borde externo, dolor insercional calcáneo)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: COMENTARIOS VISUALES EDITABLES */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-black text-cyan-300 uppercase tracking-wider block">
                3. Comentarios Visuales Generales de la Evaluación:
              </label>
              <textarea
                disabled={readOnly}
                rows={3}
                value={visualComments}
                onChange={e => {
                  if (onVisualCommentsChange) onVisualCommentsChange(e.target.value);
                }}
                placeholder="Observaciones de inspección visual: cicatrices quirúrgicas, asimetrías de volumen muscular en gemelos o cuádriceps, edema maleolar o marcha claudicante..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
              />
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 3: PRESETS DE POSTURA & HALLAZGOS EDITABLES
         ========================================================================= */}
      {activeTab === 'presets' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Custom finding add input (EVALUACIÓN POSTURAL EDITABLE) */}
          {!readOnly && (
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="Escribe un hallazgo postural personalizado (ej. Asimetría de escápula derecha)..."
                  value={customFindingInput}
                  onChange={e => setCustomFindingInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddCustom()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Hallazgo</span>
              </button>
            </div>
          )}

          {/* Active Custom Findings Badges */}
          {selectedFindings.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Hallazgos Activos:</span>
              {selectedFindings.map(finding => (
                <span
                  key={finding}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600/30 text-blue-200 border border-blue-500/40 flex items-center gap-1.5"
                >
                  <span>{finding}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onRemoveFinding) onRemoveFinding(finding);
                        else if (onToggleFinding) onToggleFinding(finding);
                      }}
                      className="hover:text-red-300 cursor-pointer"
                      title="Eliminar hallazgo"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POSTURE_PRESETS.map((preset) => {
              const active = isSelected(preset.name);
              return (
                <div
                  key={preset.id}
                  onClick={() => {
                    if (!readOnly && onToggleFinding) {
                      onToggleFinding(preset.name);
                    }
                  }}
                  className={`rounded-2xl p-3 border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
                    active
                      ? 'bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      active ? 'bg-blue-600 text-white font-bold' : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {active && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="w-full py-2 px-3 rounded-xl flex items-center justify-center my-1 bg-slate-900">
                    <PostureSilhouetteSVG type={preset.type} active={active} />
                  </div>

                  <div className="mt-2 space-y-1">
                    <h5 className={`text-xs font-bold ${active ? 'text-blue-300' : 'text-slate-200'}`}>
                      {preset.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {preset.shortDesc}
                    </p>
                    <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                      <strong className="text-slate-300">Clínica:</strong> {preset.clinicalSigns}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Posture Notes */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-bold text-slate-300 uppercase block">
              Notas Adicionales de la Evaluación Postural:
            </label>
            <textarea
              disabled={readOnly}
              rows={2}
              value={notes}
              onChange={e => onNotesChange && onNotesChange(e.target.value)}
              placeholder="Alineación en bipedestación estática, respuesta a la autocorrección postural..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500"
            />
          </div>

        </div>
      )}

    </div>
  );
};
