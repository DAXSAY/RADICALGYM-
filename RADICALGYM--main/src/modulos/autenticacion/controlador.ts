import { useState, type FormEvent } from 'react';
import type { ContextoModulo } from '../../nucleo/contexto/tipos';
import { idTemporal } from '../../nucleo/contexto/tipos';
import { useSesion } from '../../nucleo/sesion/SesionContexto';
import type { AppUser } from '../../nucleo/tipos/gym';
import { servicioAutenticacion } from './servicio';

/** Formulario de la pantalla de ingreso. */
export function useIngresoControlador() {
  const { ingresar } = useSesion();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await ingresar(usuario.trim(), clave);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return { usuario, setUsuario, clave, setClave, error, enviando, enviar };
}

/** Cuentas de usuario (solo administrador puede crear nuevas). */
export function accionesUsuarios(c: ContextoModulo) {
  return {
    registerUser: (datos: Omit<AppUser, 'id'> & { password?: string }): AppUser => {
      const nuevo: AppUser = { ...datos, id: idTemporal('usr') };
      c.actualizar('users', prev => [...prev, nuevo]);
      c.persistir(() => servicioAutenticacion.crearUsuario({ ...datos, password: datos.password ?? datos.username }), `Usuario ${datos.username} creado`);
      return nuevo;
    },
  };
}
