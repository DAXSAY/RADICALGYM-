import React, { useState } from 'react';
import { 
  ExerciseItem, 
  ExerciseCommentWithImage 
} from '../../types/gym';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export const CLINICAL_EXERCISE_IMAGE_PRESETS: { title: string; url: string; category: string }[] = [
  {
    title: 'Gato-Camello (Movilidad Raquídea)',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    category: 'Columna & Espalda'
  },
  {
    title: 'Puente Glúteo con Activación Pélvica',
    url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&auto=format&fit=crop&q=80',
    category: 'Cadena Posterior'
  },
  {
    title: 'Rotación con Banda Elástica (Manguito Rotador)',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80',
    category: 'Hombro'
  },
  {
    title: 'Extensión Isométrica de Cuádriceps',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    category: 'Rodilla'
  },
  {
    title: 'Deadbug / Estabilidad Lumbo-Pélvica',
    url: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&auto=format&fit=crop&q=80',
    category: 'Core'
  },
  {
    title: 'Clamshell / Fortalecimiento Glúteo Medio',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80',
    category: 'Cadera'
  },
  {
    title: 'Propiocepción en Bosu / Base Inestable',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    category: 'Tobillo & Equilibrio'
  },
  {
    title: 'Estiramiento de Williams / Rodilla al Pecho',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    category: 'Protocolo Williams'
  },
  {
    title: 'Estiramiento de Isquiotibiales y Fascia Lumbar',
    url: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=600&auto=format&fit=crop&q=80',
    category: 'Flexibilidad'
  }
];

interface ExercisePrescriptionCardProps {
  exercises: ExerciseItem[];
  onChange: (exercises: ExerciseItem[]) => void;
  cardTitle: string;
  onCardTitleChange: (title: string) => void;
  cardFrequency: string;
  onCardFrequencyChange: (freq: string) => void;
  readOnly?: boolean;
}

export const ExercisePrescriptionCard: React.FC<ExercisePrescriptionCardProps> = ({
  exercises,
  onChange,
  cardTitle,
  onCardTitleChange,
  cardFrequency,
  onCardFrequencyChange,
  readOnly = false
}) => {
  const [selectedPresetModalExIndex, setSelectedPresetModalExIndex] = useState<number | null>(null);
  const [selectedCommentModalExIndex, setSelectedCommentModalExIndex] = useState<number | null>(null);

  // Comment with image input states
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImageUrl, setNewCommentImageUrl] = useState('');
  const [newCommentTitle, setNewCommentTitle] = useState('');

  // Exercise expand/collapse state
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(exercises[0]?.id || null);

  const handleUpdateExercise = (index: number, field: keyof ExerciseItem, value: any) => {
    if (readOnly) return;
    const updated = [...exercises];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleDeleteExercise = (id: string) => {
    if (readOnly) return;
    onChange(exercises.filter(e => e.id !== id));
  };

  const handleAddExercise = () => {
    if (readOnly) return;
    const newEx: ExerciseItem = {
      id: `ex-custom-${Date.now()}`,
      name: 'Nuevo Ejercicio Terapéutico',
      series: 3,
      repsOrTime: '10 repeticiones lentas',
      restSeconds: 45,
      targetZone: 'Zona en Recuperación',
      techniqueTips: 'Mantener control respiratorio y alineación articular sin forzar dolor.',
      imageUrl: CLINICAL_EXERCISE_IMAGE_PRESETS[0].url,
      commentsWithImages: []
    };
    onChange([...exercises, newEx]);
    setExpandedExerciseId(newEx.id);
  };

  // Add Comment with Image to an Exercise
  const handleAddCommentWithImage = (exIndex: number) => {
    if (!newCommentText.trim()) return;
    const ex = exercises[exIndex];
    const newCommentItem: ExerciseCommentWithImage = {
      id: `comm-img-${Date.now()}`,
      comment: newCommentText.trim(),
      imageUrl: newCommentImageUrl.trim() || undefined,
      imageTitle: newCommentTitle.trim() || undefined,
      createdAt: new Date().toLocaleDateString('es-PE')
    };

    const updatedComments = [...(ex.commentsWithImages || []), newCommentItem];
    handleUpdateExercise(exIndex, 'commentsWithImages', updatedComments);

    setNewCommentText('');
    setNewCommentImageUrl('');
    setNewCommentTitle('');
    setSelectedCommentModalExIndex(null);
  };

  const handleDeleteCommentWithImage = (exIndex: number, commentId: string) => {
    const ex = exercises[exIndex];
    const updatedComments = (ex.commentsWithImages || []).filter(c => c.id !== commentId);
    handleUpdateExercise(exIndex, 'commentsWithImages', updatedComments);
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-blue-900/40 text-white shadow-xl">
      
      {/* Title & Frequency Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-400" />
            <input
              type="text"
              disabled={readOnly}
              value={cardTitle}
              onChange={e => onCardTitleChange(e.target.value)}
              placeholder="Título de la Cartilla..."
              className="text-base font-black text-white bg-transparent border-b border-dashed border-slate-700 hover:border-blue-400 focus:border-blue-400 focus:outline-none w-full sm:w-auto"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Frecuencia:</span>
            <input
              type="text"
              disabled={readOnly}
              value={cardFrequency}
              onChange={e => onCardFrequencyChange(e.target.value)}
              placeholder="ej. 3 veces por semana..."
              className="text-xs font-bold text-blue-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-700"
            />
          </div>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleAddExercise}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Ejercicio a la Cartilla</span>
          </button>
        )}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3.5">
        {exercises.map((ex, exIndex) => {
          const isExpanded = expandedExerciseId === ex.id;
          const commentsCount = ex.commentsWithImages?.length || 0;

          return (
            <div 
              key={ex.id}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700 space-y-3"
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  {/* Thumbnail / Image Trigger */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 group">
                    {ex.imageUrl ? (
                      <img 
                        src={ex.imageUrl} 
                        alt={ex.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setSelectedPresetModalExIndex(exIndex)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity cursor-pointer"
                        title="Cambiar imagen de ejercicio"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                        {exIndex + 1}
                      </span>
                      <input
                        type="text"
                        disabled={readOnly}
                        value={ex.name}
                        onChange={e => handleUpdateExercise(exIndex, 'name', e.target.value)}
                        placeholder="Nombre del ejercicio..."
                        className="font-black text-sm text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-400 focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[11px] text-blue-300 font-bold">
                        {ex.targetZone || 'General'}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {ex.series} series × {ex.repsOrTime}
                      </span>
                      <span>·</span>
                      <span className="text-slate-400">
                        Descanso: {ex.restSeconds}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Comments count badge */}
                  <button
                    type="button"
                    onClick={() => setExpandedExerciseId(isExpanded ? null : ex.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{commentsCount} {commentsCount === 1 ? 'comentario con foto' : 'comentarios'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="p-1.5 bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar ejercicio de la cartilla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Technique Cue Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Indicación Técnica & Pautas Clave para el Alumno:
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={ex.techniqueTips || ''}
                  onChange={e => handleUpdateExercise(exIndex, 'techniqueTips', e.target.value)}
                  placeholder="ej. Sincronizar con respiración, no arquear la zona lumbar, mantener escápulas activas..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                />
              </div>

              {/* EXPANDED SECTION: PARÁMETROS COMPLETOS Y COMENTARIOS CON IMÁGENES */}
              {isExpanded && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                  
                  {/* Detailed Parameters Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Series:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        disabled={readOnly}
                        value={ex.series}
                        onChange={e => handleUpdateExercise(exIndex, 'series', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Reps / Tiempo:</label>
                      <input
                        type="text"
                        disabled={readOnly}
                        value={ex.repsOrTime}
                        onChange={e => handleUpdateExercise(exIndex, 'repsOrTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Descanso (seg):</label>
                      <input
                        type="number"
                        step="15"
                        disabled={readOnly}
                        value={ex.restSeconds}
                        onChange={e => handleUpdateExercise(exIndex, 'restSeconds', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Zona Muscular:</label>
                      <input
                        type="text"
                        disabled={readOnly}
                        value={ex.targetZone || ''}
                        onChange={e => handleUpdateExercise(exIndex, 'targetZone', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Main Image URL Input & Presets trigger */}
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                      Imagen Principal:
                    </span>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={ex.imageUrl || ''}
                      onChange={e => handleUpdateExercise(exIndex, 'imageUrl', e.target.value)}
                      placeholder="URL de imagen del ejercicio o selecciona un preset..."
                      className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono"
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setSelectedPresetModalExIndex(exIndex)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        Galería Presets
                      </button>
                    )}
                  </div>

                  {/* =========================================================
                      SECCIÓN: AGREGAR MÁS IMÁGENES POR COMENTARIO
                     ========================================================= */}
                  <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                          Imágenes por Comentario / Pauta Específica
                        </span>
                      </div>

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCommentModalExIndex(exIndex);
                            setNewCommentText('');
                            setNewCommentImageUrl(CLINICAL_EXERCISE_IMAGE_PRESETS[1]?.url || '');
                            setNewCommentTitle('');
                          }}
                          className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Imagen por Comentario</span>
                        </button>
                      )}
                    </div>

                    {/* Comments with Images List */}
                    {commentsCount === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        No hay imágenes anexadas por comentario aún. Haz clic en "Agregar Imagen por Comentario" para ilustrar detalles como colocación de pies, ángulo del brazo o postura.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {ex.commentsWithImages?.map(commentItem => (
                          <div 
                            key={commentItem.id}
                            className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5 relative group"
                          >
                            {commentItem.imageUrl && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700">
                                <img 
                                  src={commentItem.imageUrl} 
                                  alt={commentItem.imageTitle || 'Comentario'} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            )}

                            <div className="space-y-1 flex-1 pr-4">
                              {commentItem.imageTitle && (
                                <h6 className="text-[11px] font-black text-white line-clamp-1">
                                  {commentItem.imageTitle}
                                </h6>
                              )}
                              <p className="text-[11px] text-slate-300 leading-snug">
                                {commentItem.comment}
                              </p>
                              {commentItem.createdAt && (
                                <span className="text-[9px] text-slate-500 font-mono block">
                                  {commentItem.createdAt}
                                </span>
                              )}
                            </div>

                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCommentWithImage(exIndex, commentItem.id)}
                                className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 cursor-pointer p-1"
                                title="Eliminar este comentario con foto"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: SELECCIONAR PRESET DE IMAGEN DE EJERCICIO */}
      {selectedPresetModalExIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-2xl w-full text-white shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h5 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Galería de Imágenes Clínicas de Ejercicios Terapéuticos</span>
              </h5>
              <button
                type="button"
                onClick={() => setSelectedPresetModalExIndex(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CLINICAL_EXERCISE_IMAGE_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    handleUpdateExercise(selectedPresetModalExIndex, 'imageUrl', preset.url);
                    setSelectedPresetModalExIndex(null);
                  }}
                  className="bg-slate-950 p-2 rounded-xl border border-slate-800 hover:border-cyan-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-900">
                    <img 
                      src={preset.url} 
                      alt={preset.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase text-cyan-400 block">{preset.category}</span>
                    <h6 className="text-[11px] font-bold text-white line-clamp-1">{preset.title}</h6>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR COMENTARIO CON FOTO ESPECÍFICA */}
      {selectedCommentModalExIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 max-w-md w-full text-white shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h5 className="text-sm font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Anexar Comentario con Imagen Ilustrativa</span>
              </h5>
              <button
                type="button"
                onClick={() => setSelectedCommentModalExIndex(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Título de la Pauta / Detalle:</label>
                <input
                  type="text"
                  placeholder="ej. Alineación del ángulo de codo / Apoyo plantar..."
                  value={newCommentTitle}
                  onChange={e => setNewCommentTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Comentario / Indicación Técnica:</label>
                <textarea
                  rows={2}
                  placeholder="Escribe la corrección o detalle que debe vigilar el alumno en esta imagen..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">URL de la Imagen o Preset:</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newCommentImageUrl}
                  onChange={e => setNewCommentImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              {/* Quick image preset chips */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-slate-400 block font-bold">O elige un preset rápido:</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {CLINICAL_EXERCISE_IMAGE_PRESETS.slice(0, 5).map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setNewCommentImageUrl(p.url);
                        if (!newCommentTitle) setNewCommentTitle(p.title);
                      }}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-[10px] rounded-lg border border-slate-700 text-slate-300"
                    >
                      {p.title.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedCommentModalExIndex(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddCommentWithImage(selectedCommentModalExIndex)}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Guardar Comentario con Imagen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
