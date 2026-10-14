import { CalendarPlus, Clock } from 'lucide-react';
import { Boton } from '../../../nucleo/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../../nucleo/ui/Campo';
import { Dialogo } from '../../../nucleo/ui/Dialogo';
import { Cargando, Vacio } from '../../../nucleo/ui/Estados';
import { InsigniaEstado } from '../../../nucleo/ui/Insignia';
import { EncabezadoPagina, Indicador, Seccion } from '../../../nucleo/ui/Pagina';
import { DIAS, fecha, soles } from '../../../nucleo/utilidades/formato';
import { TIPOS_CONTRATO, TIPOS_PERMISO } from '../servicio';
import { FORM_PERMISO, useMiEspacioControlador } from '../controlador';

export default function PaginaMiEspacio() {
  const c = useMiEspacioControlador();
  const r = c.resumen.datos;

  return (
    <div className="aparecer">
      <EncabezadoPagina titulo="Mi espacio" descripcion="Tu horario, contrato, horas y permisos"
        acciones={<>
          <input type="month" className="campo !w-40" value={c.mes} onChange={e => c.setMes(e.target.value)} aria-label="Mes" />
          <Boton variante="secundario" icono={<CalendarPlus className="w-4 h-4" />} onClick={() => c.setPermiso({ ...FORM_PERMISO })}>Solicitar permiso</Boton>
          <Boton icono={<Clock className="w-4 h-4" />} cargando={c.enviando} onClick={c.marcar}>Marcar entrada / salida</Boton>
        </>} />

      {c.resumen.cargando && !r ? <Cargando /> : !r ? <Vacio texto={c.resumen.error ?? 'Sin datos'} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="tarjeta p-4">
              <div className="text-[11px] text-tenue font-semibold">Horas trabajadas / asignadas</div>
              <div className="text-xl font-bold mt-1">{Number(r.horas_trabajadas).toFixed(1)} <span className="text-tenue text-sm font-medium">/ {r.horas_asignadas_mes} h</span></div>
              <div className="h-1.5 rounded-full bg-pastel-gris mt-2 overflow-hidden"><div className="h-full bg-oro rounded-full" style={{ width: `${c.avance}%` }} /></div>
            </div>
            <Indicador etiqueta="Días puntuales" valor={r.dias_puntual} color="bg-pastel-verde" />
            <Indicador etiqueta="Tardanzas / faltas" valor={`${r.tardanzas} / ${r.faltas}`} color="bg-pastel-rojo" />
            <Indicador etiqueta="Días de permiso" valor={r.dias_permiso} color="bg-pastel-lila" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Seccion titulo="Horario semanal">
              <ul className="px-4 pb-3">
                {r.horario.length === 0 && <li className="text-tenue py-2">Sin horario asignado</li>}
                {r.horario.map((b, i) => (
                  <li key={i} className="flex justify-between py-2 border-t border-borde first:border-0">
                    <span className="font-semibold">{DIAS[b.dia_semana]}</span><span className="text-tenue">{b.hora_inicio} – {b.hora_fin}</span>
                  </li>
                ))}
              </ul>
            </Seccion>

            <Seccion titulo="Contrato">
              {r.idcontrato ? (
                <div className="px-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between"><span className="font-semibold">{TIPOS_CONTRATO[r.tipo_contrato!]}</span><InsigniaEstado estado={r.estado_contrato!} /></div>
                  <div className="text-tenue">Vence: {fecha(r.fin_contrato)}</div>
                  <div className="text-tenue">{r.horas_semanales} horas semanales</div>
                  <div className="text-tenue">Sueldo: {soles(r.sueldo_mensual)} · {soles(r.tarifa_hora)}/h</div>
                </div>
              ) : <Vacio texto="Sin contrato registrado" />}
            </Seccion>

            <Seccion titulo="Mis permisos">
              <ul className="px-4 pb-3">
                {r.permisos.length === 0 && <li className="text-tenue py-2">Sin solicitudes</li>}
                {r.permisos.map(p => (
                  <li key={p.idpermiso} className="flex items-center justify-between gap-2 py-2 border-t border-borde first:border-0">
                    <div><div className="font-semibold">{TIPOS_PERMISO[p.tipo]}</div><div className="text-[11px] text-tenue">{fecha(p.fecha_inicio)} – {fecha(p.fecha_fin)}</div></div>
                    <InsigniaEstado estado={p.estado} />
                  </li>
                ))}
              </ul>
            </Seccion>
          </div>

          <Seccion titulo="Asistencia del mes" className="mt-4">
            {r.asistencias.length === 0 ? <Vacio texto="Sin marcas este mes" /> : (
              <div className="overflow-x-auto desplazable">
                <table className="w-full">
                  <thead><tr className="text-[11px] text-tenue text-left"><th className="px-4 py-2">Fecha</th><th>Entrada</th><th>Salida</th><th>Horas</th><th>Estado</th><th className="hidden md:table-cell">Observación</th></tr></thead>
                  <tbody>
                    {r.asistencias.map(a => (
                      <tr key={a.fecha} className="border-t border-borde">
                        <td className="px-4 py-2 font-medium">{fecha(a.fecha)}</td><td>{a.hora_entrada ?? '—'}</td><td>{a.hora_salida ?? '—'}</td>
                        <td>{Number(a.horas_trabajadas).toFixed(1)}</td><td><InsigniaEstado estado={a.estado} /></td>
                        <td className="hidden md:table-cell text-tenue">{a.observacion ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>
        </>
      )}

      <Dialogo abierto={!!c.permiso} titulo="Solicitar permiso" alCerrar={() => c.setPermiso(null)} ancho="sm"
        pie={<><Boton variante="secundario" onClick={() => c.setPermiso(null)}>Cancelar</Boton><Boton cargando={c.enviando} disabled={!c.permiso?.motivo} onClick={c.enviarPermiso}>Enviar</Boton></>}>
        {c.permiso && (
          <div className="grid grid-cols-2 gap-3">
            <CampoSeleccion contenedor="col-span-2" etiqueta="Tipo" value={c.permiso.tipo} onChange={e => c.setPermiso({ ...c.permiso!, tipo: e.target.value })}
              opciones={Object.entries(TIPOS_PERMISO).map(([valor, texto]) => ({ valor, texto }))} />
            <CampoTexto etiqueta="Desde" type="date" value={c.permiso.fecha_inicio} onChange={e => c.setPermiso({ ...c.permiso!, fecha_inicio: e.target.value })} />
            <CampoTexto etiqueta="Hasta" type="date" value={c.permiso.fecha_fin} onChange={e => c.setPermiso({ ...c.permiso!, fecha_fin: e.target.value })} />
            <CampoArea contenedor="col-span-2" etiqueta="Motivo" value={c.permiso.motivo} onChange={e => c.setPermiso({ ...c.permiso!, motivo: e.target.value })} />
            <CampoTexto contenedor="col-span-2" etiqueta="Sustento (opcional)" type="file" accept=".pdf,image/*" onChange={e => c.setSustento(e.target.files?.[0] ?? null)} />
          </div>
        )}
      </Dialogo>
    </div>
  );
}
