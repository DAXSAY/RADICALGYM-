import { useState } from 'react';
import { useDatos } from '../../nucleo/hooks/useListaPaginada';
import { useSesion } from '../../nucleo/sesion/SesionContexto';
import { useAvisos } from '../../nucleo/ui/Avisos';
import { hoy, mesActual } from '../../nucleo/utilidades/formato';
import { servicioMiEspacio } from './servicio';

export const FORM_PERMISO = { tipo: 'personal', fecha_inicio: hoy(), fecha_fin: hoy(), motivo: '' };

export function useMiEspacioControlador() {
  const { usuario } = useSesion();
  const avisar = useAvisos();
  const [mes, setMes] = useState(mesActual());
  const [permiso, setPermiso] = useState<typeof FORM_PERMISO | null>(null);
  const [sustento, setSustento] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [anio, numMes] = mes.split('-').map(Number);

  const resumen = useDatos(() => servicioMiEspacio.resumen(usuario!.idempleado!, anio, numMes), [mes]);

  const marcar = async () => {
    setEnviando(true);
    try {
      const r = await servicioMiEspacio.marcar();
      avisar(r.hora_salida ? `Salida registrada a las ${r.hora_salida.slice(0, 5)}` : `Entrada registrada a las ${r.hora_entrada.slice(0, 5)}`);
      resumen.recargar();
    } catch (e) { avisar((e as Error).message, 'error'); } finally { setEnviando(false); }
  };

  const enviarPermiso = async () => {
    if (!permiso) return;
    setEnviando(true);
    try {
      const creado = await servicioMiEspacio.solicitarPermiso(permiso) as { idpermiso: number };
      if (sustento) await servicioMiEspacio.subirSustento(creado.idpermiso, sustento);
      avisar('Permiso solicitado');
      setPermiso(null);
      setSustento(null);
      resumen.recargar();
    } catch (e) { avisar((e as Error).message, 'error'); } finally { setEnviando(false); }
  };

  const r = resumen.datos;
  const avance = r ? Math.min(100, Math.round((Number(r.horas_trabajadas) / Math.max(1, Number(r.horas_asignadas_mes))) * 100)) : 0;
  return { resumen, mes, setMes, marcar, enviando, permiso, setPermiso, sustento, setSustento, enviarPermiso, avance };
}
