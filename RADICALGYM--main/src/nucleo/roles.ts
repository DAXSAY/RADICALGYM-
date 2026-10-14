export type Rol = 'administrador' | 'recepcion' | 'entrenador' | 'nutricionista' | 'fisioterapeuta' | 'alumno';

export const NOMBRE_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  recepcion: 'Recepción',
  entrenador: 'Entrenador',
  nutricionista: 'Nutricionista',
  fisioterapeuta: 'Fisioterapeuta',
  alumno: 'Alumno',
};

export const PERSONAL: Rol[] = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta'];

export interface Usuario {
  idusuario: number;
  usuario: string;
  rol: Rol;
  idempleado: number | null;
  idalumno: number | null;
  nombre: string;
  foto?: string | null;
}
