/**
 * Cliente HTTP de la API PHP. Agrega el token, normaliza errores y mantiene
 * una caché en memoria de lecturas (GET) que se invalida por prefijo al escribir.
 */
export interface Paginado<T> {
  datos: T[];
  paginacion: { pagina: number; por_pagina: number; total: number; total_paginas: number };
}

export class ErrorApi extends Error {
  constructor(mensaje: string, public estado: number, public errores?: Record<string, string>) {
    super(mensaje);
  }
}

const CLAVE_TOKEN = 'rg_token';
const TTL_MS = 30_000;
const cache = new Map<string, { expira: number; valor: unknown }>();

let alExpirarSesion: () => void = () => {};
export const configurarSesionExpirada = (fn: () => void) => { alExpirarSesion = fn; };

export const token = {
  obtener: () => { try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; } },
  guardar: (t: string) => { try { localStorage.setItem(CLAVE_TOKEN, t); } catch { /* sin almacenamiento */ } },
  borrar: () => { try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ } },
};

type Parametros = Record<string, string | number | boolean | undefined | null>;

function construirUrl(ruta: string, parametros?: Parametros) {
  const qs = new URLSearchParams();
  Object.entries(parametros ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return `/api${ruta}${s ? `?${s}` : ''}`;
}

async function solicitar<T>(metodo: string, ruta: string, cuerpo?: unknown, parametros?: Parametros): Promise<T> {
  const cabeceras: Record<string, string> = {};
  const t = token.obtener();
  if (t) cabeceras.Authorization = `Bearer ${t}`;
  let body: BodyInit | undefined;
  if (cuerpo instanceof FormData) body = cuerpo;
  else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  let resp: Response;
  try {
    resp = await fetch(construirUrl(ruta, parametros), { method: metodo, headers: cabeceras, body });
  } catch {
    throw new ErrorApi('No se pudo conectar con el servidor', 0);
  }
  const json = await resp.json().catch(() => null);
  if (!resp.ok || !json?.ok) {
    if (resp.status === 401 && t) alExpirarSesion();
    throw new ErrorApi(json?.mensaje ?? `Error ${resp.status}`, resp.status, json?.errores);
  }
  return ('paginacion' in json ? { datos: json.datos, paginacion: json.paginacion } : json.datos) as T;
}

export const api = {
  async get<T>(ruta: string, parametros?: Parametros, usarCache = true): Promise<T> {
    const clave = construirUrl(ruta, parametros);
    const guardado = cache.get(clave);
    if (usarCache && guardado && guardado.expira > Date.now()) return guardado.valor as T;
    const valor = await solicitar<T>('GET', ruta, undefined, parametros);
    cache.set(clave, { expira: Date.now() + TTL_MS, valor });
    return valor;
  },
  post: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('POST', ruta, cuerpo ?? {}),
  put: <T>(ruta: string, cuerpo?: unknown) => solicitar<T>('PUT', ruta, cuerpo ?? {}),
  delete: <T>(ruta: string) => solicitar<T>('DELETE', ruta),
  subir: <T>(ruta: string, archivo: File) => {
    const fd = new FormData();
    fd.append('archivo', archivo);
    return solicitar<T>('POST', ruta, fd);
  },
  /** Borra de la caché local las lecturas cuyo recurso empiece por alguno de los prefijos. */
  invalidar(...prefijos: string[]) {
    for (const clave of cache.keys()) {
      if (prefijos.some(p => clave.startsWith(`/api${p}`))) cache.delete(clave);
    }
  },
  limpiarCache: () => cache.clear(),
};
