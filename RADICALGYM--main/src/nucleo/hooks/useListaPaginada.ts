import { useCallback, useEffect, useRef, useState } from 'react';
import type { Paginado } from '../api/clienteHttp';

/**
 * Estado común de listados paginados: filtros, página, carga y recarga.
 * Al cambiar un filtro se vuelve a la página 1.
 */
export function useListaPaginada<T, F extends object>(
  cargar: (filtros: F & { pagina: number }) => Promise<Paginado<T>>,
  filtrosIniciales: F,
) {
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  const [filtros, setFiltros] = useState<F>(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<Paginado<T>>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    cargarRef.current({ ...filtros, pagina })
      .then(r => { if (vigente) { setResultado(r); setError(null); } })
      .catch(e => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [filtros, pagina, version]);

  const cambiarFiltro = useCallback((parcial: Partial<F>) => {
    setFiltros(f => ({ ...f, ...parcial }));
    setPagina(1);
  }, []);

  return {
    filas: resultado?.datos ?? [],
    paginacion: resultado?.paginacion,
    cargando, error, filtros, pagina,
    cambiarFiltro, setPagina,
    recargar: useCallback(() => setVersion(v => v + 1), []),
  };
}

/** Carga simple de datos con estado de carga y recarga. */
export function useDatos<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    cargarRef.current()
      .then(d => { if (vigente) { setDatos(d); setError(null); } })
      .catch(e => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...dependencias]);

  return { datos, cargando, error, recargar: useCallback(() => setVersion(v => v + 1), []), setDatos };
}
