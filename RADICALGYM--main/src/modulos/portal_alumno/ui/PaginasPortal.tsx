import React from 'react';
import { Activity, Apple, BadgeCheck, Bell, Bike, CalendarDays, Dumbbell, HeartPulse, Ruler, Scale, Utensils } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { usePortalAlumno } from '../controlador';

/* Vistas del alumno con el mismo estilo del diseño original (tarjetas blancas, slate y azul). */
const Tarjeta: React.FC<{ titulo?: string; icono?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ titulo, icono, children, className = '' }) => (
  <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-xs ${className}`}>
    {titulo && <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">{icono}{titulo}</h3>}
    {children}
  </div>
);

const Encabezado: React.FC<{ etiqueta: string; titulo: string; descripcion?: string; icono: React.ReactNode }> = ({ etiqueta, titulo, descripcion, icono }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-4">
    <div className="flex items-center gap-2 text-blue-600 text-[11px] font-bold uppercase tracking-wider mb-0.5">{icono}<span>{etiqueta}</span></div>
    <h1 className="text-lg font-bold text-slate-900">{titulo}</h1>
    {descripcion && <p className="text-xs text-gray-500">{descripcion}</p>}
  </div>
);

const Vacio = ({ texto }: { texto: string }) => <p className="text-xs text-slate-500 text-center py-6">{texto}</p>;
const fecha = (f?: string) => (f ? f.slice(0, 10).split('-').reverse().join('/') : '—');

export function PaginaMiPlan() {
  const p = usePortalAlumno();
  const yo = p.yo;
  if (!yo) return <Vacio texto="No se encontró tu ficha de alumno." />;
  const dias = Math.ceil((new Date(yo.membershipEndDate).getTime() - Date.now()) / 86400000);
  return (
    <div className="space-y-4 pb-8">
      <Encabezado etiqueta="Mi Plan Matriculado" titulo={`Hola, ${yo.fullName.split(' ')[0]}`} descripcion="Tu membresía, entrenador, rutina y próximas actividades." icono={<BadgeCheck className="w-3.5 h-3.5" />} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 text-white rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Plan actual</span>
              <div className="text-2xl font-extrabold mt-1">{yo.planName}</div>
              <div className="text-xs text-slate-400 mt-1">{fecha(yo.membershipStartDate)} → {fecha(yo.membershipEndDate)}</div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-black ${dias < 0 ? 'text-rose-400' : dias <= 7 ? 'text-amber-400' : 'text-emerald-400'}`}>{Math.max(dias, 0)}</div>
              <div className="text-[11px] text-slate-400">días restantes</div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 text-xs">
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-slate-400 text-[10px] uppercase font-bold">Entrenador</div><div className="font-bold mt-0.5">{p.entrenador?.name ?? 'Sin asignar'}</div></div>
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-slate-400 text-[10px] uppercase font-bold">Rutina</div><div className="font-bold mt-0.5 truncate">{p.rutina?.title ?? 'Sin asignar'}</div></div>
            <div className="bg-slate-800 rounded-lg p-3"><div className="text-slate-400 text-[10px] uppercase font-bold">Asistencias del mes</div><div className="font-bold mt-0.5">{p.resumen?.asistencias_mes ?? '—'}</div></div>
          </div>
        </div>
        <Tarjeta titulo="Mis avisos" icono={<Bell className="w-3.5 h-3.5 text-amber-500" />}>
          {p.avisos.length === 0 ? <Vacio texto="Sin avisos" /> : (
            <ul className="space-y-2">
              {p.avisos.map(a => (
                <li key={a.id} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/60 text-xs">
                  <div className="font-bold text-slate-900">{a.title}</div>
                  <p className="text-slate-600 mt-0.5">{a.message}</p>
                  <span className="text-[10px] text-slate-400">{a.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta titulo="Próximas citas de nutrición y fisioterapia" icono={<CalendarDays className="w-3.5 h-3.5 text-blue-600" />}>
          {p.proximasCitas.length === 0 ? <Vacio texto="No tienes citas programadas" /> : (
            <ul className="divide-y divide-gray-100">
              {p.proximasCitas.map(c => (
                <li key={c.id} className="py-2 flex items-center justify-between text-xs">
                  <div><div className="font-bold">{c.serviceType === 'nutrition' ? '🥗 Nutrición' : '🩺 Fisioterapia'} · {c.staffName}</div><div className="text-slate-500">{fecha(c.date)} · {c.timeSlot}</div></div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">{c.roomOrDesk}</span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
        <Tarjeta titulo="Mis reservas de spinning" icono={<Bike className="w-3.5 h-3.5 text-rose-600" />}>
          {p.reservasSpinning.length === 0 ? <Vacio texto="Sin reservas. Puedes reservar desde el módulo Spinning." /> : (
            <ul className="divide-y divide-gray-100">
              {p.reservasSpinning.map(r => {
                const s = p.sesionesSpinning.find(x => x.id === r.sessionId);
                return (
                  <li key={r.id} className="py-2 flex items-center justify-between text-xs">
                    <div><div className="font-bold">{s?.title ?? 'Sesión'}</div><div className="text-slate-500">{fecha(s?.date)} · {s?.startTime}</div></div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">Bici #{r.bikeNumber}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}

export function PaginaMiDieta() {
  const { dietaActiva: d } = usePortalAlumno();
  return (
    <div className="space-y-4 pb-8">
      <Encabezado etiqueta="Mi Dieta" titulo={d?.title ?? 'Aún no tienes una dieta asignada'} descripcion={d ? `Asignada el ${fecha(d.createdDate)} por ${d.trainerName ?? 'nutrición'}` : undefined} icono={<Apple className="w-3.5 h-3.5" />} />
      {d && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[['Calorías', `${d.dailyCaloriesTarget} kcal`, 'text-slate-900'], ['Proteínas', `${d.proteinsTargetGrams} g`, 'text-emerald-600'],
              ['Carbohidratos', `${d.carbsTargetGrams} g`, 'text-cyan-600'], ['Grasas', `${d.fatsTargetGrams} g`, 'text-rose-600'], ['Agua', `${d.waterLitersTarget} L`, 'text-blue-600']]
              .map(([t, v, c]) => (
                <div key={t} className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs"><div className="text-[11px] text-slate-500 font-bold uppercase">{t}</div><div className={`text-lg font-extrabold ${c}`}>{v}</div></div>
              ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d.meals.map((m, i) => (
              <Tarjeta key={m.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span><span className="font-bold text-sm">{m.name}</span><span className="text-xs text-slate-500">{m.time}</span></div>
                  <span className="text-xs font-black text-amber-600">{m.totalCalories} kcal</span>
                </div>
                <ul className="space-y-1">
                  {m.items.map(it => (
                    <li key={it.id} className="flex justify-between text-xs border-b border-slate-100 last:border-0 py-1">
                      <span className="font-semibold text-slate-800">{it.name} <span className="text-slate-500 font-normal">({it.portion})</span></span>
                      <span className="font-bold text-slate-700">{it.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              </Tarjeta>
            ))}
          </div>
          {(d.recommendations || d.hydrationGuidelines || d.supplements?.length) && (
            <Tarjeta titulo="Recomendaciones" icono={<Utensils className="w-3.5 h-3.5 text-blue-600" />}>
              <div className="text-xs text-slate-700 space-y-1">
                {d.recommendations && <p>{d.recommendations}</p>}
                {d.hydrationGuidelines && <p><strong>Hidratación:</strong> {d.hydrationGuidelines}</p>}
                {!!d.supplements?.length && <p><strong>Suplementos:</strong> {d.supplements.join(', ')}</p>}
              </div>
            </Tarjeta>
          )}
        </>
      )}
    </div>
  );
}

export function PaginaMisReportes() {
  const { medidas, ultimaMedida: u } = usePortalAlumno();
  const grafico = medidas.map(m => ({ fecha: fecha(m.date).slice(0, 5), Peso: m.weightKg, 'Grasa %': m.bioimpedance.bodyFatPercentage || null }));
  const par = (d: number, i: number) => (d || i ? `${d || '—'} / ${i || '—'}` : '—');
  return (
    <div className="space-y-4 pb-8">
      <Encabezado etiqueta="Reportes de Nutrición" titulo="Mis medidas y composición corporal" descripcion="Evolución de peso, IMC, grasa corporal y perímetros." icono={<Activity className="w-3.5 h-3.5" />} />
      {!u ? <Vacio texto="Aún no tienes evaluaciones registradas" /> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs"><div className="text-[11px] text-slate-500 font-bold uppercase flex items-center gap-1"><Scale className="w-3 h-3" />Peso</div><div className="text-lg font-extrabold">{u.weightKg} kg</div><div className="text-[10px] text-slate-400">{fecha(u.date)}</div></div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs"><div className="text-[11px] text-slate-500 font-bold uppercase">IMC</div><div className="text-lg font-extrabold text-blue-600">{u.bmi}</div><div className="text-[10px] text-slate-400">{u.bmiClassification}</div></div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs"><div className="text-[11px] text-slate-500 font-bold uppercase">% grasa</div><div className="text-lg font-extrabold text-rose-600">{u.bioimpedance.bodyFatPercentage || '—'}</div></div>
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs"><div className="text-[11px] text-slate-500 font-bold uppercase">Masa muscular</div><div className="text-lg font-extrabold text-emerald-600">{u.bioimpedance.muscleMassKg || '—'} kg</div></div>
          </div>
          {grafico.length > 1 && (
            <Tarjeta titulo="Evolución">
              <div className="h-60">
                <ResponsiveContainer>
                  <LineChart data={grafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="fecha" fontSize={11} />
                    <YAxis yAxisId="p" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                    <YAxis yAxisId="g" orientation="right" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="p" dataKey="Peso" stroke="#2563eb" strokeWidth={2} />
                    <Line yAxisId="g" dataKey="Grasa %" stroke="#e11d48" strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Tarjeta>
          )}
          <Tarjeta titulo="Historial de evaluaciones" icono={<Ruler className="w-3.5 h-3.5 text-blue-600" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="text-slate-500 border-b border-gray-200"><th className="py-2 pr-3">Fecha</th><th>Peso</th><th>IMC</th><th>Cintura / Cadera</th><th>Bíceps D/I</th><th>Muslo D/I</th><th>Pantorrilla D/I</th><th>% Grasa</th></tr></thead>
                <tbody>
                  {[...medidas].reverse().map(m => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-2 pr-3 font-bold">{fecha(m.date)}</td><td>{m.weightKg} kg</td><td>{m.bmi}</td>
                      <td>{m.perimeters.waist} / {m.perimeters.hip}</td>
                      <td>{par(m.perimeters.bicepsFlexedRight, m.perimeters.bicepsFlexedLeft)}</td>
                      <td>{par(m.perimeters.thighRight, m.perimeters.thighLeft)}</td>
                      <td>{par(m.perimeters.calfRight, m.perimeters.calfLeft)}</td>
                      <td>{m.bioimpedance.bodyFatPercentage || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tarjeta>
        </>
      )}
    </div>
  );
}

export function PaginaMiFisioterapia() {
  const { fisioterapia } = usePortalAlumno();
  const colorDolor = (n: number) => (n >= 7 ? 'bg-rose-100 text-rose-700 border-rose-200' : n >= 4 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200');
  return (
    <div className="space-y-4 pb-8">
      <Encabezado etiqueta="Mi Fisioterapia" titulo="Historial clínico y sesiones" descripcion="Zonas tratadas, técnicas aplicadas e indicaciones para casa." icono={<HeartPulse className="w-3.5 h-3.5" />} />
      {fisioterapia.length === 0 ? <Vacio texto="No tienes sesiones de fisioterapia registradas" /> : fisioterapia.map(s => (
        <Tarjeta key={s.id}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div><span className="font-bold text-sm">Sesión n.º {s.sessionNumber}</span><span className="text-xs text-slate-500 ml-2">{fecha(s.date)} · {s.physiotherapistName}</span></div>
            {s.nextAppointmentDate && <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">Próxima cita: {fecha(s.nextAppointmentDate)}</span>}
          </div>
          <p className="text-xs text-slate-700 mb-2"><strong>Motivo:</strong> {s.consultationReason}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {s.affectedZones.map(z => <span key={z.zone} className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${colorDolor(z.painLevel)}`}>{z.zone.replace(/_/g, ' ')} · EVA {z.painLevel}</span>)}
          </div>
          {s.treatmentsApplied.length > 0 && <p className="text-xs text-slate-600 mb-1"><strong>Técnicas:</strong> {s.treatmentsApplied.join(', ')}</p>}
          {s.homeIndications && <p className="text-xs text-slate-600 mb-1"><Dumbbell className="w-3 h-3 inline mr-1" /><strong>Para casa:</strong> {s.homeIndications}</p>}
          {s.gymWorkoutRestrictions && <p className="text-xs text-rose-700"><strong>Restricciones en el gimnasio:</strong> {s.gymWorkoutRestrictions}</p>}
        </Tarjeta>
      ))}
    </div>
  );
}
