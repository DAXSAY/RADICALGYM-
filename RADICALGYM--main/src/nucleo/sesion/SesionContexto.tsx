import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, configurarSesionExpirada, token } from '../api/clienteHttp';
import type { Usuario } from '../roles';
import { servicioAutenticacion } from '../../modulos/autenticacion/servicio';

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  ingresar: (usuario: string, clave: string) => Promise<void>;
  salir: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);
const CLAVE_USUARIO = 'rg_usuario';

function usuarioGuardado(): Usuario | null {
  try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null'); } catch { return null; }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(token.obtener() ? usuarioGuardado() : null);
  const [cargando, setCargando] = useState(!!token.obtener());

  const limpiar = useCallback(() => {
    token.borrar();
    try { localStorage.removeItem(CLAVE_USUARIO); } catch { /* sin almacenamiento */ }
    api.limpiarCache();
    setUsuario(null);
  }, []);

  useEffect(() => {
    configurarSesionExpirada(limpiar);
    if (!token.obtener()) return;
    servicioAutenticacion.perfil()
      .then(u => setUsuario(prev => ({ ...prev, ...u } as Usuario)))
      .catch(limpiar)
      .finally(() => setCargando(false));
  }, [limpiar]);

  const ingresar = async (nombreUsuario: string, clave: string) => {
    const r = await servicioAutenticacion.ingresar(nombreUsuario, clave);
    token.guardar(r.token);
    try { localStorage.setItem(CLAVE_USUARIO, JSON.stringify(r.usuario)); } catch { /* sin almacenamiento */ }
    api.limpiarCache();
    setUsuario(r.usuario);
  };

  const salir = async () => {
    await servicioAutenticacion.salir().catch(() => undefined);
    limpiar();
  };

  return <Contexto.Provider value={{ usuario, cargando, ingresar, salir }}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return c;
}
