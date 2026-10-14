import { api } from '../../nucleo/api/clienteHttp';
import type { Usuario } from '../../nucleo/roles';
import type { AppUser } from '../../nucleo/tipos/gym';
import { Fila, idNum, opc, ROL_DESDE_API, ROL_HACIA_API, txt } from '../../nucleo/utilidades/mapeo';

/** Usuario de la sesión (API) -> AppUser que muestran Header, Sidebar y el modal de cuenta. */
export const usuarioActual = (u: Usuario): AppUser => ({
  id: String(u.idusuario),
  username: u.usuario,
  fullName: u.nombre,
  email: '',
  role: ROL_DESDE_API[u.rol],
  photoUrl: u.foto ? (/^https?:/.test(u.foto) ? u.foto : `/uploads/${u.foto}`) : undefined,
  memberId: u.idalumno ? String(u.idalumno) : undefined,
  trainerId: u.rol === 'entrenador' && u.idempleado ? String(u.idempleado) : undefined,
  staffId: u.idempleado ? String(u.idempleado) : undefined,
  active: true,
});

export const adaptarUsuario = (u: Fila): AppUser => ({
  id: String(u.idusuario),
  username: txt(u.usuario),
  fullName: txt(u.nombre),
  email: txt(u.correo),
  role: ROL_DESDE_API[u.rol] ?? 'student',
  phone: opc(u.telefono),
  memberId: u.idalumno ? String(u.idalumno) : undefined,
  trainerId: u.rol === 'entrenador' && u.idempleado ? String(u.idempleado) : undefined,
  staffId: u.idempleado ? String(u.idempleado) : undefined,
  active: !!Number(u.activo),
});

export const servicioAutenticacion = {
  ingresar: (usuario: string, clave: string) =>
    api.post<{ token: string; usuario: Usuario }>('/auth/ingresar', { usuario, clave }),
  perfil: () => api.get<Usuario>('/auth/yo', undefined, false),
  salir: () => api.post('/auth/salir'),
  cambiarClave: (actual: string, nueva: string) => api.put('/auth/clave', { actual, nueva }),
  crearUsuario: (u: Omit<AppUser, 'id'> & { password: string }) =>
    api.post('/usuarios', {
      usuario: u.username, clave: u.password, rol: ROL_HACIA_API[u.role],
      idalumno: idNum(u.memberId) || undefined, idempleado: idNum(u.staffId ?? u.trainerId) || undefined,
    }),
};
