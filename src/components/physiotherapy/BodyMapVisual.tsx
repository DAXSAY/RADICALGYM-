import React, { useState } from 'react';
import { BodyPainZone } from '../../types/gym';
import { Target, Check, Plus, Trash2, Sparkles, Activity } from 'lucide-react';

interface BodyMapVisualProps {
  selectedZones: BodyPainZone[];
  onToggleZone?: (zone: BodyPainZone) => void;
  onAddCustomZone?: (zoneName: string) => void;
  onRemoveZone?: (zone: BodyPainZone) => void;
  readOnly?: boolean;
  className?: string;
  zoneNotes?: Record<string, string>;
  onUpdateZoneNote?: (zone: string, note: string) => void;
}

export interface ZoneHotspot {
  id: BodyPainZone;
  label: string;
  sublabel: string;
  view: 'anterior' | 'posterior' | 'lateral' | 'both' | 'all';
  frontCoords?: { x: number; y: number };
  backCoords?: { x: number; y: number };
  lateralCoords?: { x: number; y: number };
  tagColor?: string;
}

export const ZONE_DETAILS: ZoneHotspot[] = [
  {
    id: 'cervical',
    label: 'Columna Cervical',
    sublabel: 'Cuello, nuca y trapecios superiores',
    view: 'all',
    frontCoords: { x: 100, y: 55 },
    backCoords: { x: 100, y: 52 },
    lateralCoords: { x: 94, y: 56 },
    tagColor: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-200'
  },
  {
    id: 'hombro',
    label: 'Hombro / Manguito Rotador',
    sublabel: 'Deltoides, supraespinoso e inserciones',
    view: 'all',
    frontCoords: { x: 62, y: 78 },
    backCoords: { x: 62, y: 78 },
    lateralCoords: { x: 96, y: 80 },
    tagColor: 'border-blue-500/50 bg-blue-950/40 text-blue-200'
  },
  {
    id: 'columna_dorsal',
    label: 'Columna Dorsal',
    sublabel: 'Espalda media, escápulas y romboides',
    view: 'all',
    backCoords: { x: 100, y: 95 },
    lateralCoords: { x: 108, y: 98 },
    tagColor: 'border-indigo-500/50 bg-indigo-950/40 text-indigo-200'
  },
  {
    id: 'lumbar',
    label: 'Columna Lumbar',
    sublabel: 'Espalda baja (L1 a L5-S1) y cuadrado lumbar',
    view: 'all',
    backCoords: { x: 100, y: 135 },
    lateralCoords: { x: 106, y: 140 },
    tagColor: 'border-rose-500/50 bg-rose-950/40 text-rose-200'
  },
  {
    id: 'muneca_mano',
    label: 'Muñeca & Mano (Tendinitis / Túnel Carpiano)',
    sublabel: 'Tendones flexores, extensores y articulación radiocarpiana',
    view: 'all',
    frontCoords: { x: 26, y: 168 },
    backCoords: { x: 26, y: 168 },
    lateralCoords: { x: 88, y: 172 },
    tagColor: 'border-amber-500/50 bg-amber-950/40 text-amber-200'
  },
  {
    id: 'codo',
    label: 'Codo (Epicondilitis / Epitrocleitis)',
    sublabel: 'Epicóndilos lateral y medial, tendón del bíceps',
    view: 'all',
    frontCoords: { x: 42, y: 122 },
    backCoords: { x: 42, y: 122 },
    lateralCoords: { x: 94, y: 128 },
    tagColor: 'border-orange-500/50 bg-orange-950/40 text-orange-200'
  },
  {
    id: 'codo_muneca',
    label: 'Codo & Muñeca (Conjunto)',
    sublabel: 'Antebrazo, túnel carpiano y tendones',
    view: 'all',
    frontCoords: { x: 38, y: 140 },
    backCoords: { x: 38, y: 140 },
    lateralCoords: { x: 92, y: 150 },
    tagColor: 'border-amber-500/50 bg-amber-950/40 text-amber-200'
  },
  {
    id: 'cadera',
    label: 'Cadera / Pelvis / Psoas',
    sublabel: 'Articulación coxofemoral, glúteos y flexores',
    view: 'all',
    frontCoords: { x: 100, y: 165 },
    backCoords: { x: 100, y: 165 },
    lateralCoords: { x: 98, y: 192 },
    tagColor: 'border-violet-500/50 bg-violet-950/40 text-violet-200'
  },
  {
    id: 'rodilla',
    label: 'Rodilla / Menisco / Rótula',
    sublabel: 'Meniscos, ligamentos cruzados y tendón rotuliano',
    view: 'all',
    frontCoords: { x: 88, y: 228 },
    backCoords: { x: 88, y: 228 },
    lateralCoords: { x: 94, y: 256 },
    tagColor: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
  },
  {
    id: 'tobillo_pie',
    label: 'Tobillo & Pie',
    sublabel: 'Tendón de Aquiles, ligamentos y fascia plantar',
    view: 'all',
    frontCoords: { x: 88, y: 290 },
    backCoords: { x: 88, y: 290 },
    lateralCoords: { x: 96, y: 336 },
    tagColor: 'border-teal-500/50 bg-teal-950/40 text-teal-200'
  },
  {
    id: 'muscular_general',
    label: 'Descarga Muscular General',
    sublabel: 'Sobrecarga global por entrenamiento intenso',
    view: 'all',
    frontCoords: { x: 100, y: 110 },
    backCoords: { x: 100, y: 110 },
    lateralCoords: { x: 96, y: 120 },
    tagColor: 'border-slate-500/50 bg-slate-950/40 text-slate-200'
  }
];

export const BodyMapVisual: React.FC<BodyMapVisualProps> = ({
  selectedZones,
  onToggleZone,
  onAddCustomZone,
  onRemoveZone,
  readOnly = false,
  className = '',
  zoneNotes = {},
  onUpdateZoneNote
}) => {
  const [activeView, setActiveView] = useState<'both' | 'anterior' | 'posterior' | 'lateral'>('both');
  const [customZoneInput, setCustomZoneInput] = useState('');

  const isSelected = (zone: BodyPainZone) => selectedZones.includes(zone);

  const handleZoneClick = (zone: BodyPainZone) => {
    if (!readOnly && onToggleZone) {
      onToggleZone(zone);
    }
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customZoneInput.trim()) return;
    if (onAddCustomZone) {
      onAddCustomZone(customZoneInput.trim());
    } else if (onToggleZone) {
      onToggleZone(customZoneInput.trim());
    }
    setCustomZoneInput('');
  };

  const handleRemove = (zone: BodyPainZone) => {
    if (onRemoveZone) {
      onRemoveZone(zone);
    } else if (onToggleZone) {
      onToggleZone(zone);
    }
  };

  // Check if wrist, elbow, lumbar, etc are selected
  const hasWrist = isSelected('muneca_mano') || selectedZones.some(z => z.toLowerCase().includes('muñeca') || z.toLowerCase().includes('tendinitis'));
  const hasElbow = isSelected('codo') || isSelected('codo_muneca') || selectedZones.some(z => z.toLowerCase().includes('codo') || z.toLowerCase().includes('epicondil'));
  const hasLumbar = isSelected('lumbar') || selectedZones.some(z => z.toLowerCase().includes('lumbar'));
  const hasCervical = isSelected('cervical') || selectedZones.some(z => z.toLowerCase().includes('cervical') || z.toLowerCase().includes('cuello'));
  const hasDorsal = isSelected('columna_dorsal') || selectedZones.some(z => z.toLowerCase().includes('dorsal') || z.toLowerCase().includes('espalda'));
  const hasShoulder = isSelected('hombro') || selectedZones.some(z => z.toLowerCase().includes('hombro') || z.toLowerCase().includes('manguito'));
  const hasHip = isSelected('cadera') || isSelected('cadera_pelvis') || selectedZones.some(z => z.toLowerCase().includes('cadera') || z.toLowerCase().includes('glúteo'));
  const hasKnee = isSelected('rodilla') || selectedZones.some(z => z.toLowerCase().includes('rodilla') || z.toLowerCase().includes('menisco'));
  const hasAnkle = isSelected('tobillo_pie') || selectedZones.some(z => z.toLowerCase().includes('tobillo') || z.toLowerCase().includes('pie') || z.toLowerCase().includes('aquil'));

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-700/60 ${className}`}>
      
      {/* Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Target className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Mapa Anatómico de Dolor & Lesión (Selección Múltiple)
            </h4>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {readOnly 
              ? `${selectedZones.length} zonas afectadas identificadas en la evaluación clínica`
              : 'Selecciona todas las zonas que duelan (ej: Lumbar + Muñeca). Puedes tocar la silueta o añadir zonas personalizadas'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center bg-slate-950/60 p-1 rounded-xl border border-slate-700/50 self-start sm:self-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveView('both')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vista Completa
          </button>
          <button
            type="button"
            onClick={() => setActiveView('anterior')}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'anterior' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setActiveView('posterior')}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              activeView === 'posterior' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Espalda
          </button>
          <button
            type="button"
            onClick={() => setActiveView('lateral')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeView === 'lateral' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Lateral</span>
            <span className="text-[9px] bg-blue-500/30 px-1 py-0.2 rounded text-blue-200">Perfil</span>
          </button>
        </div>
      </div>

      {/* Main Body Silhouettes & Hotspots */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* Visual Silhouette Canvas (6 cols) */}
        <div className="md:col-span-6 lg:col-span-6 flex justify-center items-center bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 relative min-h-[360px] overflow-hidden">
          <div className={`flex items-center ${activeView === 'both' ? 'justify-start sm:justify-center gap-2.5 sm:gap-4 w-full overflow-x-auto pb-7 pt-1' : 'justify-center gap-4 w-full max-w-[340px]'}`}>
            
            {/* ANTERIOR (FRONT) SILHOUETTE */}
            {(activeView === 'both' || activeView === 'anterior') && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Anterior (Frente)
                </span>
                <div className={`relative ${activeView === 'both' ? 'w-28 h-64 sm:w-32 sm:h-74 shrink-0' : 'w-40 h-80 sm:w-48 sm:h-92'} select-none transition-all`}>
                  {/* SVG Anatomical Human Silhouette */}
                  <svg
                    viewBox="0 0 200 360"
                    className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="bodyGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Head */}
                    <ellipse cx="100" cy="30" rx="19" ry="24" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="2" />
                    
                    {/* Neck */}
                    <path d="M92 52 L92 68 L108 68 L108 52 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Torso & Shoulders */}
                    <path
                      d="M60 72 C68 68, 88 66, 100 66 C112 66, 132 68, 140 72 C148 76, 146 100, 140 120 C136 135, 132 155, 126 175 L74 175 C68 155, 64 135, 60 120 C54 100, 52 76, 60 72 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="2"
                    />

                    {/* Chest / Pectorals Contours */}
                    <path d="M78 88 Q100 102 100 120 Q100 102 122 88" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="100" y1="68" x2="100" y2="155" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Left Arm & Forearm */}
                    <path
                      d="M58 74 L42 122 L32 165 L26 160 L38 120 L54 74 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    <ellipse cx="26" cy="172" rx="6" ry="10" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.2" />

                    {/* Right Arm & Forearm */}
                    <path
                      d="M142 74 L158 122 L168 165 L174 160 L162 120 L146 74 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    <ellipse cx="174" cy="172" rx="6" ry="10" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.2" />

                    {/* Pelvis & Hips */}
                    <path
                      d="M74 175 L68 198 L92 204 L100 200 L108 204 L132 198 L126 175 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="1.8"
                    />

                    {/* Left Leg */}
                    <path
                      d="M68 198 L64 246 L68 280 L66 332 L78 334 L82 280 L88 246 L94 202 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    <path d="M64 332 L56 348 L80 348 L78 334 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />

                    {/* Right Leg */}
                    <path
                      d="M132 198 L136 246 L132 280 L134 332 L122 334 L118 280 L112 246 L106 202 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    <path d="M136 332 L144 348 L120 348 L122 334 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />

                    {/* ACTIVE ZONES HIGHLIGHT OVERLAYS - FRONT */}
                    {hasCervical && (
                      <ellipse cx="100" cy="58" rx="14" ry="10" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                    )}
                    {hasShoulder && (
                      <>
                        <circle cx="64" cy="80" r="12" fill="#f43f5e" fillOpacity="0.7" filter="url(#glowRed)" />
                        <circle cx="136" cy="80" r="12" fill="#f43f5e" fillOpacity="0.7" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasElbow && (
                      <>
                        <circle cx="43" cy="122" r="9" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                        <circle cx="157" cy="122" r="9" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasWrist && (
                      <>
                        <circle cx="28" cy="168" r="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                        <circle cx="172" cy="168" r="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasHip && (
                      <ellipse cx="100" cy="188" rx="28" ry="14" fill="#f43f5e" fillOpacity="0.7" filter="url(#glowRed)" />
                    )}
                    {hasKnee && (
                      <>
                        <ellipse cx="76" cy="254" rx="11" ry="11" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRed)" />
                        <ellipse cx="124" cy="254" rx="11" ry="11" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasAnkle && (
                      <>
                        <ellipse cx="72" cy="336" rx="9" ry="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                        <ellipse cx="128" cy="336" rx="9" ry="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                      </>
                    )}
                    {isSelected('muscular_general') && (
                      <rect x="70" y="75" width="60" height="90" rx="15" fill="#f43f5e" fillOpacity="0.3" filter="url(#glowRed)" />
                    )}
                  </svg>

                  {/* Interactive Hotspots for Front */}
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleZoneClick('cervical')}
                        title="Columna Cervical (Cuello)"
                        style={{ left: '50%', top: '16%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasCervical ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold">C</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('hombro')}
                        title="Hombro Izquierdo / Manguito"
                        style={{ left: '31%', top: '22%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasShoulder ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">H</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('codo')}
                        title="Codo (Epicóndilos)"
                        style={{ left: '21%', top: '34%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasElbow ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">C</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('muneca_mano')}
                        title="Muñeca y Mano (Tendinitis)"
                        style={{ left: '14%', top: '47%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasWrist ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">M</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('cadera')}
                        title="Cadera y Pelvis"
                        style={{ left: '50%', top: '52%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasHip ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">P</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('rodilla')}
                        title="Rodilla"
                        style={{ left: '38%', top: '70%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasKnee ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">R</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('tobillo_pie')}
                        title="Tobillo y Pie"
                        style={{ left: '36%', top: '92%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasAnkle ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">T</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* POSTERIOR (BACK) SILHOUETTE */}
            {(activeView === 'both' || activeView === 'posterior') && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Posterior (Espalda)
                </span>
                <div className={`relative ${activeView === 'both' ? 'w-28 h-64 sm:w-32 sm:h-74 shrink-0' : 'w-40 h-80 sm:w-48 sm:h-92'} select-none transition-all`}>
                  {/* SVG Anatomical Human Silhouette Posterior */}
                  <svg
                    viewBox="0 0 200 360"
                    className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Head - back view */}
                    <ellipse cx="100" cy="30" rx="19" ry="24" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="2" />
                    <path d="M90 40 Q100 44 110 40" stroke="#64748b" strokeWidth="1.2" />

                    {/* Neck back */}
                    <path d="M92 52 L92 68 L108 68 L108 52 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />
                    
                    {/* Torso Back with Spine Line */}
                    <path
                      d="M60 72 C68 68, 88 66, 100 66 C112 66, 132 68, 140 72 C148 76, 146 100, 140 120 C136 135, 132 155, 126 175 L74 175 C68 155, 64 135, 60 120 C54 100, 52 76, 60 72 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="2"
                    />

                    {/* Scapula contours */}
                    <path d="M72 82 Q82 96 74 112" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M128 82 Q118 96 126 112" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                    
                    {/* Spinal Column Line */}
                    <line x1="100" y1="56" x2="100" y2="175" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2 3" />

                    {/* Arms Back */}
                    <path d="M58 74 L42 122 L32 165 L26 160 L38 120 L54 74 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />
                    <ellipse cx="26" cy="172" rx="6" ry="10" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.2" />
                    <path d="M142 74 L158 122 L168 165 L174 160 L162 120 L146 74 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />
                    <ellipse cx="174" cy="172" rx="6" ry="10" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.2" />

                    {/* Glutes */}
                    <path
                      d="M74 175 C70 195, 78 212, 100 208 C122 212, 130 195, 126 175 Z"
                      fill="url(#bodyGradFront)"
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    <line x1="100" y1="175" x2="100" y2="208" stroke="#64748b" strokeWidth="1.5" />

                    {/* Legs Back */}
                    <path d="M72 208 L66 248 L70 282 L66 332 L78 334 L84 282 L88 248 L96 208 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="2" />
                    <path d="M104 208 L112 248 L116 282 L122 334 L134 332 L130 282 L134 248 L128 208 Z" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="2" />
                    
                    {/* Heels */}
                    <ellipse cx="72" cy="336" rx="7" ry="5" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />
                    <ellipse cx="128" cy="336" rx="7" ry="5" fill="url(#bodyGradFront)" stroke="#475569" strokeWidth="1.5" />

                    {/* ACTIVE ZONES HIGHLIGHT OVERLAYS - BACK */}
                    {hasCervical && (
                      <ellipse cx="100" cy="58" rx="14" ry="10" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                    )}
                    {hasDorsal && (
                      <rect x="88" y="78" width="24" height="42" rx="10" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRed)" />
                    )}
                    {hasLumbar && (
                      <rect x="86" y="125" width="28" height="38" rx="10" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                    )}
                    {hasShoulder && (
                      <>
                        <circle cx="64" cy="82" r="12" fill="#f43f5e" fillOpacity="0.7" filter="url(#glowRed)" />
                        <circle cx="136" cy="82" r="12" fill="#f43f5e" fillOpacity="0.7" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasElbow && (
                      <>
                        <circle cx="43" cy="125" r="9" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                        <circle cx="157" cy="125" r="9" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasWrist && (
                      <>
                        <circle cx="28" cy="168" r="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                        <circle cx="172" cy="168" r="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasHip && (
                      <ellipse cx="100" cy="192" rx="26" ry="14" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRed)" />
                    )}
                    {hasKnee && (
                      <>
                        <ellipse cx="76" cy="256" rx="10" ry="10" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRed)" />
                        <ellipse cx="124" cy="256" rx="10" ry="10" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRed)" />
                      </>
                    )}
                    {hasAnkle && (
                      <>
                        <ellipse cx="72" cy="336" rx="9" ry="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                        <ellipse cx="128" cy="336" rx="9" ry="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRed)" />
                      </>
                    )}
                  </svg>

                  {/* Interactive Hotspots for Back */}
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleZoneClick('columna_dorsal')}
                        title="Columna Dorsal / Escápulas"
                        style={{ left: '50%', top: '27%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasDorsal ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('lumbar')}
                        title="Columna Lumbar / Espalda Baja"
                        style={{ left: '50%', top: '40%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasLumbar ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold">L</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('muneca_mano')}
                        title="Muñeca y Mano (Tendinitis)"
                        style={{ left: '14%', top: '47%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasWrist ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">M</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* LATERAL (SAGITTAL PROFILE) SILHOUETTE */}
            {(activeView === 'both' || activeView === 'lateral') && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <span>Sagital (Lateral)</span>
                </span>
                <div className={`relative ${activeView === 'both' ? 'w-28 h-64 sm:w-32 sm:h-74 shrink-0' : 'w-40 h-80 sm:w-48 sm:h-92'} select-none transition-all`}>
                  {/* SVG Anatomical Human Silhouette Lateral */}
                  <svg
                    viewBox="0 0 200 360"
                    className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="bodyGradLateral" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="50%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <filter id="glowRedLateral" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Postural Plumb Line (Eje de Plomada Sagital) */}
                    <line x1="98" y1="12" x2="98" y2="348" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />

                    {/* Head Profile (Facing Left: Brow, Nose, Lips, Chin, Occiput) */}
                    <path
                      d="M98 12 C82 12, 68 20, 68 32 C68 35, 65 37, 62 39 C60 41, 60 43, 64 45 C62 47, 63 50, 66 51 C63 52, 64 55, 68 56 C74 58, 82 54, 88 50 C94 48, 98 44, 102 44 C112 44, 120 38, 120 28 C120 18, 110 12, 98 12 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="1.8"
                    />

                    {/* Ear silhouette outline */}
                    <ellipse cx="94" cy="36" rx="4" ry="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />

                    {/* Neck Profile */}
                    <path
                      d="M74 56 C75 62, 78 68, 80 72 L106 72 C108 65, 107 58, 106 50 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />

                    {/* Spine Physiological Curvature Line (Cervical, Thoracic, Lumbar) */}
                    <path
                      d="M102 54 Q96 64 104 72 Q114 96 112 124 Q106 142 108 160 Q116 180 110 200"
                      stroke="#94a3b8"
                      strokeWidth="2"
                      strokeDasharray="2 3"
                      opacity="0.8"
                    />

                    {/* Torso Profile (Thoracic Kyphosis & Lumbar Lordosis) */}
                    <path
                      d="M80 72 C74 85, 72 105, 74 125 C75 142, 78 160, 82 178 L114 178 C118 160, 112 142, 114 125 C116 102, 112 85, 106 72 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="2"
                    />

                    {/* Rib cage arc accent */}
                    <path d="M84 94 Q94 108 86 122" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

                    {/* Pelvis & Gluteal Curvature */}
                    <path
                      d="M82 178 C80 190, 84 204, 88 214 L114 214 C122 202, 120 188, 114 178 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    {/* Greater trochanter circle accent */}
                    <circle cx="98" cy="192" r="5" stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Lower Limb (Thigh, Knee, Calf, Shin) */}
                    <path
                      d="M88 214 C84 230, 83 245, 84 256 C86 268, 86 295, 88 330 L104 330 C108 318, 114 285, 112 268 C110 255, 112 235, 114 214 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="2"
                    />

                    {/* Patella & Knee Joint Line in Profile */}
                    <path d="M83 250 C80 254, 80 260, 83 264" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
                    <line x1="84" y1="256" x2="108" y2="256" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Foot in Profile (Calcaneus, Longitudinal Arch, Toes facing Left) */}
                    <path
                      d="M88 330 C86 334, 76 340, 68 344 L54 344 C52 344, 52 348, 55 350 L108 350 C114 350, 114 340, 108 334 C106 332, 104 330, 104 330 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#475569"
                      strokeWidth="1.8"
                    />

                    {/* Arm in Lateral Profile (Shoulder, Elbow, Wrist, Hand) */}
                    <path
                      d="M94 72 C90 85, 90 108, 92 128 L88 168 C86 178, 88 190, 86 198 L92 198 C96 190, 96 178, 98 168 L102 128 C104 108, 102 85, 98 72 Z"
                      fill="url(#bodyGradLateral)"
                      stroke="#64748b"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />

                    {/* ACTIVE ZONES HIGHLIGHT OVERLAYS - LATERAL */}
                    {hasCervical && (
                      <ellipse cx="94" cy="58" rx="14" ry="10" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRedLateral)" />
                    )}
                    {hasShoulder && (
                      <circle cx="96" cy="80" r="12" fill="#f43f5e" fillOpacity="0.75" filter="url(#glowRedLateral)" />
                    )}
                    {hasDorsal && (
                      <ellipse cx="108" cy="98" rx="10" ry="18" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRedLateral)" />
                    )}
                    {hasLumbar && (
                      <ellipse cx="106" cy="140" rx="12" ry="16" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRedLateral)" />
                    )}
                    {hasElbow && (
                      <circle cx="94" cy="128" r="9" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRedLateral)" />
                    )}
                    {hasWrist && (
                      <circle cx="90" cy="172" r="8" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRedLateral)" />
                    )}
                    {hasHip && (
                      <ellipse cx="98" cy="192" rx="16" ry="14" fill="#f43f5e" fillOpacity="0.8" filter="url(#glowRedLateral)" />
                    )}
                    {hasKnee && (
                      <ellipse cx="94" cy="256" rx="14" ry="11" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRedLateral)" />
                    )}
                    {hasAnkle && (
                      <ellipse cx="98" cy="336" rx="12" ry="9" fill="#f43f5e" fillOpacity="0.85" filter="url(#glowRedLateral)" />
                    )}
                    {isSelected('muscular_general') && (
                      <rect x="74" y="74" width="44" height="106" rx="12" fill="#f43f5e" fillOpacity="0.3" filter="url(#glowRedLateral)" />
                    )}
                  </svg>

                  {/* Interactive Hotspots for Lateral */}
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleZoneClick('cervical')}
                        title="Columna Cervical (Nuca / Cuello Lateral)"
                        style={{ left: '47%', top: '16%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasCervical ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold">C</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('hombro')}
                        title="Hombro Lateral / Manguito Rotador"
                        style={{ left: '48%', top: '22%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasShoulder ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">H</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('columna_dorsal')}
                        title="Columna Dorsal (Cifosis Sagital)"
                        style={{ left: '55%', top: '28%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasDorsal ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">D</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('lumbar')}
                        title="Columna Lumbar (Lordosis Sagital)"
                        style={{ left: '54%', top: '39%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasLumbar ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[10px] font-bold">L</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('codo')}
                        title="Codo Lateral (Epicóndilo)"
                        style={{ left: '46%', top: '36%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasElbow ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">C</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('muneca_mano')}
                        title="Muñeca y Mano Lateral"
                        style={{ left: '44%', top: '48%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasWrist ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">M</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('cadera')}
                        title="Cadera / Trocánter Mayor / Banda Iliotibial"
                        style={{ left: '49%', top: '53%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasHip ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">P</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('rodilla')}
                        title="Rodilla Lateral (Interlínea articular / Rótula)"
                        style={{ left: '47%', top: '71%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasKnee ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">R</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleZoneClick('tobillo_pie')}
                        title="Tobillo Lateral (Maleolo externo / Tendón de Aquiles)"
                        style={{ left: '49%', top: '93%' }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                          hasAnkle ? 'bg-rose-500 text-white ring-4 ring-rose-500/40 animate-pulse' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold">T</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

          </div>

          {!readOnly && (
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="font-bold text-rose-400">{selectedZones.length} {selectedZones.length === 1 ? 'zona seleccionada' : 'zonas seleccionadas'}</span>
              <span className="text-cyan-400 font-medium">Click para activar/desactivar</span>
            </div>
          )}
        </div>

        {/* Multi-Selection Zone Interactive Cards (6 cols) */}
        <div className="md:col-span-6 lg:col-span-6 space-y-3">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Zonas Clínicas & Diagnósticos ({selectedZones.length})</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Multi-selección activa
            </span>
          </div>

          {/* Preset Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
            {ZONE_DETAILS.filter(z => z.id !== 'codo_muneca').map(zone => {
              const active = isSelected(zone.id);
              return (
                <button
                  key={zone.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleZoneClick(zone.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-rose-950/90 to-rose-900/70 border-rose-500/90 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  } ${readOnly ? 'cursor-default' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    active ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {active ? <Check className="w-3 h-3" /> : null}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${active ? 'text-white' : 'text-slate-300'}`}>
                      {zone.label}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {zone.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ADD CUSTOM ZONE OR DIAGNOSIS (e.g. Tendinitis en la muñeca, Lumbalgia L5-S1) */}
          {!readOnly && (
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>¿Otra zona o diagnóstico específico? (ej. Tendinitis de muñeca, Hernia discal)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe otra zona o patología (ej. Tendinitis en muñeca derecha)..."
                  value={customZoneInput}
                  onChange={e => setCustomZoneInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustom();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => handleAddCustom()}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick tags summary of selected items with delete & notes */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[11px] text-slate-300 font-bold block">
              Zonas marcadas para el reporte ({selectedZones.length}):
            </span>
            {selectedZones.length === 0 ? (
              <span className="text-[11px] text-slate-500 italic block">Ninguna zona seleccionada</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedZones.map((zoneKey, zIdx) => {
                  const z = ZONE_DETAILS.find(item => item.id === zoneKey);
                  const displayName = z ? z.label : zoneKey;

                  return (
                    <span
                      key={`sel-zone-${zoneKey}-${zIdx}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-xs"
                    >
                      <Target className="w-3 h-3 text-rose-400 shrink-0" />
                      <span>{displayName}</span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemove(zoneKey)}
                          className="hover:text-rose-100 text-rose-300/70 p-0.5 rounded cursor-pointer ml-1"
                          title="Quitar zona"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
