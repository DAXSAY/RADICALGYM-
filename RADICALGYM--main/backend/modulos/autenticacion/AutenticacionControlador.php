<?php
namespace Modulos\Autenticacion;

use Nucleo\Autenticacion;
use Nucleo\BaseDatos;
use Nucleo\ClienteRedis;
use Nucleo\ErrorHttp;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class AutenticacionControlador
{
    public function ingresar(Peticion $p): void
    {
        $d = $p->validar(['usuario', 'clave']);
        $u = BaseDatos::fila(
            "SELECT u.idusuario, u.usuario, u.clave, u.rol, u.idempleado, u.idalumno, u.activo,
                    COALESCE(CONCAT(e.nombres,' ',e.apellidos), CONCAT(a.nombres,' ',a.apellidos)) AS nombre,
                    COALESCE(e.foto, a.foto) AS foto
               FROM usuarios u
               LEFT JOIN empleados e ON e.idempleado = u.idempleado
               LEFT JOIN alumnos a   ON a.idalumno = u.idalumno
              WHERE u.usuario = ?", [trim($d['usuario'])]);

        if (!$u || !password_verify($d['clave'], $u['clave'])) {
            throw new ErrorHttp('Usuario o contraseña incorrectos', 401);
        }
        if (!$u['activo']) {
            throw new ErrorHttp('El usuario está desactivado', 403);
        }
        BaseDatos::ejecutar('UPDATE usuarios SET ultimo_acceso = NOW() WHERE idusuario = ?', [$u['idusuario']]);
        unset($u['clave'], $u['activo']);
        Respuesta::ok(['token' => Autenticacion::emitir($u), 'usuario' => $u]);
    }

    public function yo(Peticion $p): void
    {
        Respuesta::ok($p->usuario);
    }

    public function salir(Peticion $p): void
    {
        Autenticacion::cerrar($p->usuario);
        Respuesta::ok(['mensaje' => 'Sesión cerrada']);
    }

    /** Alta de una cuenta de acceso vinculada a un trabajador o alumno existente (solo administrador). */
    public function crearUsuario(Peticion $p): void
    {
        $d = $p->validar(['usuario', 'clave', 'rol']);
        $roles = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta', 'alumno'];
        if (!in_array($d['rol'], $roles, true)) throw new ErrorHttp('Rol no válido', 422);
        if (strlen($d['clave']) < 6) throw new ErrorHttp('La clave debe tener al menos 6 caracteres', 422);
        $idalumno = $d['rol'] === 'alumno' ? ((int) ($d['idalumno'] ?? 0) ?: null) : null;
        $idempleado = $d['rol'] !== 'alumno' ? ((int) ($d['idempleado'] ?? 0) ?: null) : null;
        if (!$idalumno && !$idempleado) throw new ErrorHttp('Vincula la cuenta a un alumno o trabajador', 422);
        BaseDatos::ejecutar('INSERT INTO usuarios (usuario, clave, rol, idempleado, idalumno) VALUES (?,?,?,?,?)',
            [$d['usuario'], password_hash($d['clave'], PASSWORD_BCRYPT), $d['rol'], $idempleado, $idalumno]);
        \Nucleo\Cache::invalidar('usuarios');
        Respuesta::creado(['idusuario' => BaseDatos::ultimoId()]);
    }

    public function cambiarClave(Peticion $p): void
    {
        $d = $p->validar(['actual', 'nueva']);
        $hash = BaseDatos::valor('SELECT clave FROM usuarios WHERE idusuario = ?', [$p->usuario['idusuario']]);
        if (!$hash || !password_verify($d['actual'], $hash)) throw new ErrorHttp('La clave actual no es correcta', 422);
        if (strlen($d['nueva']) < 6) throw new ErrorHttp('La nueva clave debe tener al menos 6 caracteres', 422);
        BaseDatos::ejecutar('UPDATE usuarios SET clave = ? WHERE idusuario = ?', [password_hash($d['nueva'], PASSWORD_BCRYPT), $p->usuario['idusuario']]);
        Respuesta::ok(['mensaje' => 'Clave actualizada']);
    }

    public function salud(Peticion $p): void
    {
        Respuesta::ok([
            'mysql' => (bool) BaseDatos::valor('SELECT 1'),
            'redis' => ClienteRedis::instancia()->comando('PING') === 'PONG',
        ]);
    }
}
