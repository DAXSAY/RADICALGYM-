import React, { useState } from 'react';
import { 
  PhysiotherapySessionRecord, 
  Member 
} from '../../types/gym';
import { BodyMapVisual, ZONE_DETAILS } from './BodyMapVisual';
import { PostureSilhouetteSVG, POSTURE_PRESETS } from './PostureVisuals';
import { ExerciseVectorDrawing, PRESET_EXERCISES_WITH_VISUALS } from './ExerciseVisuals';
import { 
  X, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  CheckCircle2, 
  FileText, 
  Dumbbell, 
  Activity, 
  AlertTriangle, 
  HeartPulse, 
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  Download,
  Info,
  Loader2,
  Pill,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PhysioReportModalProps {
  session: PhysiotherapySessionRecord;
  member?: Member;
  onClose: () => void;
}

export const PhysioReportModal: React.FC<PhysioReportModalProps> = ({
  session,
  member,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Match posture preset if available
  const matchedPosturePreset = POSTURE_PRESETS.find(p => 
    session.posturalEvaluation?.toLowerCase().includes(p.name.toLowerCase().slice(0, 10)) ||
    session.physicalEvaluation?.posturalVisualEvaluation?.postureFindings?.some(v => v.toLowerCase().includes(p.name.toLowerCase().slice(0, 10)))
  ) || POSTURE_PRESETS[0];

  const affectedZonesList = session.affectedZones || (session.affectedZone ? [session.affectedZone] : ['lumbar']);

  const handleCopyText = () => {
    const text = `📋 *REPORTE CLÍNICO DE FISIOTERAPIA Y DOSIFICACIÓN*\n` +
      `👤 *Paciente:* ${session.memberName} (DNI: ${session.memberDni})\n` +
      `👨‍⚕️ *Fisioterapeuta:* ${session.physiotherapistName}\n` +
      `📅 *Fecha:* ${session.date} | ${session.time} (Sesión #${session.sessionNumber || 1})\n\n` +
      `🎯 *Zonas Afectadas:* ${affectedZonesList.map(z => {
        const found = ZONE_DETAILS.find(item => item.id === z);
        return found ? found.label : z;
      }).join(', ')}\n` +
      `⚡ *Nivel de Dolor EVA:* ${session.painLevelEVA}/10\n` +
      `📐 *Evaluación Postural:* ${session.posturalEvaluation}\n` +
      `🔬 *Rango Articular:* ${session.rangeOfMotion}\n\n` +
      (session.additionalObservations && session.additionalObservations.length > 0 
        ? `📝 *OBSERVACIONES CLÍNICAS DEL FISIOTERAPEUTA:*\n${session.additionalObservations.map((obs, i) => `• ${obs}`).join('\n')}\n\n` 
        : '') +
      `🏋️‍♂️ *CARTILLA DE EJERCICIOS DOSIFICADOS:*\n` +
      (session.exerciseDosage?.customExercises.map((e, i) => `${i + 1}. ${e.name} - ${e.series}x${e.repsOrTime} (Desc: ${e.restSeconds}s)\n   💡 ${e.techniqueTips}`).join('\n') || 'Ejercicios de movilidad básica según tolerancia.') +
      `\n\n🚫 *RESTRICCIONES EN EL GIMNASIO:* ${session.gymWorkoutRestrictions || 'Adaptar cargas según dolor.'}\n` +
      `🏡 *PAUTAS EN CASA:* ${session.homeIndications}\n` +
      (session.nextAppointmentDate ? `📆 *Próximo Control:* ${session.nextAppointmentDate}\n` : '') +
      `\nCentro de Fisioterapia & Rendimiento Deportivo`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const phone = session.memberPhone || member?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    const zoneNames = affectedZonesList.map(z => {
      const found = ZONE_DETAILS.find(item => item.id === z);
      return found ? found.label : z;
    }).join(', ');

    const message = encodeURIComponent(
      `¡Hola ${session.memberName.split(' ')[0]}! 👋 Te compartimos tu *Ficha Clínica y Cartilla de Ejercicios de Fisioterapia* (Sesión #${session.sessionNumber || 1}):\n\n` +
      `📅 *Fecha de Atención:* ${session.date} a las ${session.time}\n` +
      `👨‍⚕️ *Fisioterapeuta:* ${session.physiotherapistName}\n` +
      `🎯 *Zonas en Recuperación:* ${zoneNames}\n` +
      `⚡ *Nivel de Dolor Actual:* ${session.painLevelEVA}/10\n\n` +
      (session.additionalObservations && session.additionalObservations.length > 0 
        ? `📝 *Observaciones Médicas:*\n${session.additionalObservations.map(o => `• ${o}`).join('\n')}\n\n` 
        : '') +
      `🏋️‍♂️ *CARTILLA PERSONALIZADA (${session.exerciseDosage?.customCardFrequency || '3x semana'}):*\n` +
      (session.exerciseDosage?.customExercises.map((e, i) => `🔹 *${e.name}*: ${e.series} series × ${e.repsOrTime} (Descanso: ${e.restSeconds}s)\n   Pauta: ${e.techniqueTips}`).join('\n\n') || 'Ver cartilla adjunta en tu perfil de alumno.') +
      `\n\n🚫 *CUIDADOS EN SALA DE PESAS:* ${session.gymWorkoutRestrictions || 'Evitar cargas axiales máximas.'}\n` +
      `🏡 *INDICACIONES EN CASA:* ${session.homeIndications}\n` +
      (session.nextAppointmentDate ? `📆 *Tu Próxima Cita:* ${session.nextAppointmentDate}\n\n` : '\n') +
      `¡Sigue tus pautas y verás mejoras en tu movilidad y alivio de dolor! 💪🩺`
    );

    const url = cleanPhone.length >= 8 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(url, '_blank');

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDownloadDirectPDF = async () => {
    const reportElement = document.getElementById('printable-physio-report');
    if (!reportElement) {
      window.print();
      return;
    }

    try {
      setIsGeneratingPDF(true);
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Subsequent pages if report is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const cleanName = (session.memberName || 'Paciente').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Ficha_Fisioterapia_${cleanName}_${session.date || 'sesion'}.pdf`);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Error generating PDF with html2canvas:', err);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* PRINT-SPECIFIC CSS RULES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-physio-report, #printable-physio-report * {
            visibility: visible;
          }
          #printable-physio-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Top Control Bar (Non-Printable) */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block">
                Ficha Clínica & Reporte PDF
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Fisioterapia, Postura & Ejercicios Ilustrados
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar texto del reporte"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Enviar directamente por WhatsApp al alumno"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadDirectPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer disabled:opacity-70"
              title="Convertir y descargar ficha actual como archivo PDF estructurado"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              title="Abrir diálogo de impresión de navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dispatch Notification Bar */}
        <div className="no-print bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-xs text-emerald-900 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Reporte clínico listo para:</strong> {session.memberName} (Tel: {session.memberPhone || member?.phone || 'Sin registrar'})
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Sesión #{session.sessionNumber || 1} • {session.studentReportSentAt ? 'Despachado' : 'Listo para enviar'}
          </span>
        </div>

        {/* Printable & Scrollable Report Content */}
        <div id="printable-physio-report" className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1">
          
          {/* Clinical Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 page-break-avoid">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                <HeartPulse className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Centro de Fisioterapia & Readaptación Físico-Deportiva
                </h2>
                <p className="text-xs text-slate-600">
                  Fisioterapeuta Tratante: <strong>{session.physiotherapistName}</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Fecha de Valoración: {session.date} • {session.time} • Sesión #{session.sessionNumber || 1}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Folio Clínico
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                PHY-{session.id.slice(-6).toUpperCase()}
              </span>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {session.consultationReason || 'Consulta de Fisioterapia'}
                </span>
                {session.improvementStatus && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {session.improvementStatus === 'notable_mejora' ? '🎉 Notable Mejoría' :
                     session.improvementStatus === 'mejora_leve' ? '👍 Mejoría Leve' :
                     session.improvementStatus === 'estable' ? '⚖️ Condición Estable' : '🔍 En Evolución'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Patient Details & Medical Background */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs page-break-avoid">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Alumno / Paciente</span>
              <p className="font-extrabold text-slate-900 text-sm">{session.memberName}</p>
              <p className="text-slate-500 text-[11px]">DNI: {session.memberDni}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Teléfono / Celular</span>
              <p className="font-bold text-slate-800">{session.memberPhone || member?.phone || 'No registrado'}</p>
              <p className="text-slate-500 text-[11px]">Plan: {member?.planName || 'Gimnasio'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Escala de Dolor EVA</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-base font-black text-rose-600">{session.painLevelEVA}/10</span>
                <span className="text-[10px] font-semibold text-slate-500">
                  ({session.painLevelEVA <= 3 ? 'Dolor Leve' : session.painLevelEVA <= 6 ? 'Dolor Moderado' : 'Dolor Intenso'})
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Próximo Control</span>
              <p className="font-bold text-blue-600 mt-0.5">{session.nextAppointmentDate || 'A coordinar según mejoría'}</p>
            </div>
          </div>

          {/* MEDICAMENTOS EN CUADRADO DE TEXTO */}
          {(session.physicalEvaluation?.currentMedicationsText || (session.physicalEvaluation?.medications && session.physicalEvaluation.medications.length > 0)) && (
            <div className="bg-cyan-50/70 border border-cyan-200 p-3 sm:p-4 rounded-xl text-xs space-y-1 page-break-avoid">
              <span className="font-bold text-cyan-950 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Pill className="w-4 h-4 text-cyan-700" />
                Medicamentos & Posología Actual (Prescripción / Consumo):
              </span>
              <p className="text-slate-800 font-semibold leading-relaxed bg-white/80 p-2.5 rounded-lg border border-cyan-100 font-mono text-[11px]">
                {session.physicalEvaluation?.currentMedicationsText || session.physicalEvaluation?.medications?.join(', ')}
              </p>
            </div>
          )}

          {/* PATIENT-FRIENDLY SUMMARY (ENTENDIBLE PARA EL ALUMNO) */}
          <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 border border-blue-200/80 p-4 sm:p-5 rounded-2xl shadow-xs space-y-2 page-break-avoid">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-700 shrink-0" />
              <h4 className="text-xs sm:text-sm font-bold text-blue-950 uppercase tracking-wider">
                Explicación Sencilla para el Alumno / Paciente
              </h4>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {session.patientFriendlySummary || 
                `Hola ${session.memberName.split(' ')[0]}, el fisioterapeuta ha evaluado las zonas con molestia (${affectedZonesList.map(z => {
                  const found = ZONE_DETAILS.find(item => item.id === z);
                  return found ? found.label : z;
                }).join(' y ')}). Tu nivel de dolor actual es ${session.painLevelEVA}/10. Para acelerar tu recuperación, debes seguir las pautas de ejercicio y las precauciones en la sala de musculación descritas abajo.`}
            </p>

            {/* Quick Action Pills for Student */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-800 text-[11px] block uppercase mb-1">
                  🟢 Permitido en Sala
                </span>
                <p className="text-slate-700 text-[11px]">
                  {session.exerciseDosage?.exerciseAdaptation?.allowedExercises?.join(', ') || 'Movilidad suave, caminata, ejercicios guiados sin impacto.'}
                </p>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-xs">
                <span className="font-bold text-rose-800 text-[11px] block uppercase mb-1">
                  🔴 Prohibido Temporalmente
                </span>
                <p className="text-slate-700 text-[11px]">
                  {session.gymWorkoutRestrictions || 'Cargas máximas axiales, movimientos balísticos o que generen dolor punzante.'}
                </p>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-blue-200 text-xs">
                <span className="font-bold text-blue-800 text-[11px] block uppercase mb-1">
                  🏡 Cuidado en Casa
                </span>
                <p className="text-slate-700 text-[11px]">
                  {session.homeIndications || 'Cumplir la cartilla de ejercicios, hidratación y descansos.'}
                </p>
              </div>
            </div>
          </div>

          {/* 1. VISUAL ANATOMICAL BODY MAP (READ-ONLY) */}
          <div className="space-y-2 page-break-avoid">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>1. Mapa Anatómico de Dolor & Zonas Afectadas ({affectedZonesList.length})</span>
            </h4>
            <BodyMapVisual
              selectedZones={affectedZonesList}
              readOnly={true}
            />
          </div>

          {/* 2. VISUAL POSTURAL EVALUATION */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 page-break-avoid">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>2. Evaluación Visual de Postura & Biomecánica</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${matchedPosturePreset.badgeColor}`}>
                {matchedPosturePreset.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Silhouette Graphic */}
              <div className="md:col-span-4 bg-slate-900 p-2 rounded-xl flex items-center justify-center">
                <PostureSilhouetteSVG type={matchedPosturePreset.type} active={true} />
              </div>

              {/* Diagnosis details */}
              <div className="md:col-span-8 space-y-2">
                <h5 className="text-sm font-bold text-slate-900">
                  Patrón Postural: {matchedPosturePreset.name}
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {session.posturalEvaluation || matchedPosturePreset.shortDesc}
                </p>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <p><strong>Hallazgos Posturales:</strong> {session.physicalEvaluation?.posturalVisualEvaluation?.postureFindings?.join(', ') || session.posturalEvaluation}</p>
                  <p><strong>Cadenas Musculares Implicadas:</strong> {matchedPosturePreset.clinicalSigns}</p>
                  {session.physicalEvaluation?.posturalVisualEvaluation?.postureNotes && (
                    <p className="italic text-slate-500">Nota técnica: {session.physicalEvaluation.posturalVisualEvaluation.postureNotes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* VISIÓN LATERAL SAGITAL (PLOMADA & CURVATURAS) */}
            {session.physicalEvaluation?.lateralEvaluation && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] block">
                  📐 Visión Lateral Sagital & Eje de Plomada:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Plomada</span>
                    <strong className="text-blue-900 capitalize">{session.physicalEvaluation.lateralEvaluation.plumbLineDeviation.replace('_', ' ')}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Cervical / Cabeza</span>
                    <strong className="text-slate-800 capitalize">{session.physicalEvaluation.lateralEvaluation.cervicalSpine.replace(/_/g, ' ')}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Dorsal & Lumbar</span>
                    <strong className="text-slate-800 capitalize">{session.physicalEvaluation.lateralEvaluation.lumbarSpine.replace(/_/g, ' ')}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Pelvis & Rodilla</span>
                    <strong className="text-slate-800 capitalize">{session.physicalEvaluation.lateralEvaluation.pelvisTilt.replace(/_/g, ' ')}</strong>
                  </div>
                </div>
                {session.physicalEvaluation.lateralEvaluation.notes && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                    Nota sagital: {session.physicalEvaluation.lateralEvaluation.notes}
                  </p>
                )}
              </div>
            )}

            {/* EVALUACIÓN VISUAL: RODILLAS, TOBILLO & COMENTARIOS */}
            {(session.physicalEvaluation?.visualKnees || session.physicalEvaluation?.visualAnkles || session.physicalEvaluation?.visualComments) && (
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 text-xs space-y-2">
                <span className="font-bold text-blue-950 uppercase tracking-wide text-[11px] block">
                  🦵 Evaluación Visual de Rodillas & Tobillos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {session.physicalEvaluation?.visualKnees && (
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 space-y-1">
                      <strong className="text-blue-900 block text-xs">Rodillas:</strong>
                      <p>Alineación: <span className="font-semibold capitalize">{session.physicalEvaluation.visualKnees.frontalAlignment.replace(/_/g, ' ')}</span></p>
                      <p>Tracking patelar: <span className="font-semibold capitalize">{session.physicalEvaluation.visualKnees.patellarTracking.replace(/_/g, ' ')}</span></p>
                      <p>Derrame: <span className="font-semibold capitalize">{session.physicalEvaluation.visualKnees.effusionInflammation.replace(/_/g, ' ')}</span></p>
                      {session.physicalEvaluation.visualKnees.details && (
                        <p className="text-slate-500 italic text-[10px]">{session.physicalEvaluation.visualKnees.details}</p>
                      )}
                    </div>
                  )}

                  {session.physicalEvaluation?.visualAnkles && (
                    <div className="bg-white p-2.5 rounded-lg border border-blue-100 space-y-1">
                      <strong className="text-blue-900 block text-xs">Tobillo & Pie:</strong>
                      <p>Retropié: <span className="font-semibold capitalize">{session.physicalEvaluation.visualAnkles.hindfootAlignment.replace(/_/g, ' ')}</span></p>
                      <p>Arco plantar: <span className="font-semibold capitalize">{session.physicalEvaluation.visualAnkles.plantarArch.replace(/_/g, ' ')}</span></p>
                      <p>Tendón Aquiles: <span className="font-semibold capitalize">{session.physicalEvaluation.visualAnkles.achillesTendon.replace(/_/g, ' ')}</span></p>
                      {session.physicalEvaluation.visualAnkles.details && (
                        <p className="text-slate-500 italic text-[10px]">{session.physicalEvaluation.visualAnkles.details}</p>
                      )}
                    </div>
                  )}
                </div>

                {session.physicalEvaluation?.visualComments && (
                  <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-blue-100">
                    <strong>Comentarios visuales del terapeuta:</strong> {session.physicalEvaluation.visualComments}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. FUNCTIONAL EVALUATION & JOINT TESTS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 page-break-avoid">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-blue-600" />
              <span>3. Evaluación Funcional, Rangos Articulares & Palpación</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                <strong className="text-blue-900 block mb-1">Rangos Articulares (ROM)</strong>
                <p className="text-slate-800">{session.rangeOfMotion}</p>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                <strong className="text-rose-900 block mb-1">Dolor a la Movilidad</strong>
                <p className="text-slate-800">
                  {session.functionalEvaluation 
                    ? `${session.functionalEvaluation.painOnMovement.painNature} al ${session.functionalEvaluation.painOnMovement.movementPhase.replace('_', ' ')} (EVA: ${session.functionalEvaluation.painOnMovement.dynamicPainEVA}/10)`
                    : 'Molestia en arcos extremos de movimiento.'}
                </p>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                <strong className="text-amber-900 block mb-1">Palpación por Zona</strong>
                <p className="text-slate-800">
                  {session.functionalEvaluation?.palpationPainZone 
                    ? `Tono: ${session.functionalEvaluation.palpationPainZone.muscleTone}, ${session.functionalEvaluation.palpationPainZone.tenderZoneNotes}`
                    : 'Sensibilidad localizada en vientre muscular.'}
                </p>
              </div>
            </div>

            {/* Pathological Tests Badges */}
            {session.functionalEvaluation?.functionalJointTests && session.functionalEvaluation.functionalJointTests.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Pruebas Ortopédicas Específicas por Articulación:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {session.functionalEvaluation.functionalJointTests.map((t, idx) => (
                    <div
                      key={`report-test-${t.testName || idx}-${idx}`}
                      className={`p-2 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 ${
                        t.result === 'positivo'
                          ? 'bg-rose-100/80 border-rose-300 text-rose-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{t.testName}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                        t.result === 'positivo' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {t.result}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EVALUACIÓN FUNCIONAL WILLIAMS (FLEXIÓN LUMBAR) */}
            {session.functionalEvaluation?.williamsEvaluation && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Protocolo de Evaluación Funcional Williams (6 Ejercicios de Flexión):
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 capitalize">
                    Tolerancia: {session.functionalEvaluation.williamsEvaluation.overallTolerance}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(session.functionalEvaluation.williamsEvaluation.exercises || []).map((w, idx) => (
                    <div key={`williams-rep-${w.id || idx}`} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-800 truncate">#{idx + 1} {w.name}</span>
                        <span className={`px-1 py-0.2 rounded font-black text-[9px] ${
                          w.status === 'completado_sin_dolor' ? 'bg-emerald-100 text-emerald-800' :
                          w.status === 'dolor_leve' ? 'bg-blue-100 text-blue-800' :
                          w.status === 'dolor_moderado' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          EVA {w.painEVA}/10
                        </span>
                      </div>
                      <p className="text-slate-500 truncate capitalize">{w.status.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>

                {session.functionalEvaluation.williamsEvaluation.summaryNotes && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <strong>Conclusión Williams:</strong> {session.functionalEvaluation.williamsEvaluation.summaryNotes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* OBSERVACIONES ADICIONALES DEL FISIOTERAPEUTA (EDITADAS / AGREGADAS) */}
          {session.additionalObservations && session.additionalObservations.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 page-break-avoid">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Observaciones Clínicas & Hallazgos Adicionales ({session.additionalObservations.length})</span>
              </h4>
              <div className="space-y-1.5">
                {session.additionalObservations.map((obs, idx) => (
                  <div key={`report-obs-${idx}`} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed font-medium">{obs}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DOSIFICACIÓN DE EJERCICIOS CON ILUSTRACIONES VECTORIALES */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 page-break-avoid">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-emerald-600" />
                  <span>4. Cartilla Personalizada de Ejercicios Terapéuticos</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {session.exerciseDosage?.customCardTitle || 'Prescripción y Dosificación Personalizada'}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start sm:self-auto">
                Frecuencia: {session.exerciseDosage?.customCardFrequency || '3 veces por semana'}
              </span>
            </div>

            {/* Exercise Visual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(session.exerciseDosage?.customExercises || []).map((ex, idx) => {
                const matchedPreset = PRESET_EXERCISES_WITH_VISUALS.find(p =>
                  p.name.toLowerCase().includes(ex.name.toLowerCase().slice(0, 10)) ||
                  ex.name.toLowerCase().includes(p.name.toLowerCase().slice(0, 10))
                );

                return (
                  <div
                    key={ex.id ? `report-ex-${ex.id}` : `report-ex-${idx}`}
                    className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between space-y-2 page-break-avoid"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h6 className="text-xs font-bold text-slate-900">
                            {ex.name}
                          </h6>
                        </div>
                        {ex.targetZone && (
                          <span className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {ex.targetZone}
                          </span>
                        )}
                      </div>

                      {/* SVG Vector Drawing */}
                      <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-center my-1.5">
                        <ExerciseVectorDrawing
                          type={matchedPreset ? matchedPreset.type : 'movilidad'}
                          name={ex.name}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {ex.series} series
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {ex.repsOrTime}
                        </span>
                        {ex.restSeconds > 0 && (
                          <span className="font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            Descanso: {ex.restSeconds}s
                          </span>
                        )}
                      </div>
                      {ex.techniqueTips && (
                        <p className="text-[10px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                          💡 <strong>Técnica:</strong> {ex.techniqueTips}
                        </p>
                      )}

                      {/* COMENTARIOS CON IMÁGENES ADJUNTAS */}
                      {ex.commentsWithImages && ex.commentsWithImages.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-200">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">
                            📸 Pautas Visuales & Comentarios Adjuntos:
                          </span>
                          <div className="space-y-1.5">
                            {ex.commentsWithImages.map(c => (
                              <div key={c.id} className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5">
                                <p className="text-[10px] font-medium text-slate-800 leading-snug">
                                  💬 {c.comment}
                                </p>
                                {c.attachedImages && c.attachedImages.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {c.attachedImages.map((img, imgIdx) => (
                                      <div key={imgIdx} className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                        <img src={img} alt="Pauta visual" className="w-full h-full object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progressive Loads & Adaptations */}
            {session.exerciseDosage && (
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 text-xs space-y-1 text-slate-700">
                <p>
                  <strong>Fase de Carga Progresiva:</strong> Fase {session.exerciseDosage.progressiveLoads.phase.replace('_', ' ')} (Carga máxima guiada: {session.exerciseDosage.progressiveLoads.maxRecommendedKg || 0} kg). {session.exerciseDosage.progressiveLoads.progressionCriteria}
                </p>
                <p>
                  <strong>Adecuación en Sala de Musculación:</strong> {session.exerciseDosage.exerciseAdaptation.adaptationNotes}
                </p>
              </div>
            )}
          </div>

          {/* 5. RESTRICTIONS & HOME INDICATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 page-break-avoid">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-rose-800 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Restricciones en Sala de Gimnasio:
              </span>
              <p className="text-slate-800 font-medium">
                {session.gymWorkoutRestrictions || 'Sin restricciones severas. Modificar según umbral de dolor EVA.'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-blue-800 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Pautas para el Hogar:
              </span>
              <p className="text-slate-800 font-medium">
                {session.homeIndications || 'Realizar cartilla de movilidad 3 veces por semana y aplicar frío/calor según indicación.'}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 page-break-avoid">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-700">Lic. {session.physiotherapistName}</p>
              <p className="text-[11px]">Fisioterapeuta Colegiado & Readaptador Físico</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[11px] text-slate-400">Documento clínico generado el {session.date} a las {session.time}</p>
              <p className="text-[10px] text-slate-400">Gym & Fisioterapia - Ficha Médica Oficial</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
