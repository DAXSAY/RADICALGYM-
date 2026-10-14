<?php
namespace Modulos\Asistencia;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

final class AsistenciaServicio
{
    public function alumnosDelDia(string $fecha, string $buscar, Paginacion $p): array
    {
        $donde = 'FROM asistencias_alumno s JOIN alumnos a ON a.idalumno = s.idalumno WHERE s.fecha = ?';
        $params = [$fecha];
        if ($buscar !== '') {
            $donde .= " AND CONCAT(a.nombres,' ',a.apellidos,' ',a.dni,' ',a.idalumno) LIKE ?";
            $params[] = "%{$buscar}%";
        }
        [$filas, $total] = BaseDatos::paginar(
            "s.idasistencia_alumno, s.idalumno, CONCAT(a.nombres,' ',a.apellidos) AS alumno, a.dni,
             TIME_FORMAT(s.hora_entrada, '%H:%i') AS hora_entrada", $donde, $params, 's.hora_entrada DESC', $p);
        return $p->respuesta($filas, $total);
    }

    public function registrarAlumno(string $valor): array
    {
        $r = BaseDatos::procedimiento('sp_asistencia_alumno_registrar', [$valor]);
        Cache::invalidar('panel');
        return $r[0][0];
    }

    /** Estado del personal en una fecha: todos los activos con su marca (si existe). */
    public function personalDelDia(string $fecha, Paginacion $p): array
    {
        $tiempo = strtotime($fecha) ?: throw new ErrorHttp('Fecha no válida', 422);
        $dia = (int) date('N', $tiempo);
        [$filas, $total] = BaseDatos::paginar(
            "e.idempleado, CONCAT(e.nombres,' ',e.apellidos) AS empleado, e.cargo,
             TIME_FORMAT(s.hora_entrada,'%H:%i') AS hora_entrada, TIME_FORMAT(s.hora_salida,'%H:%i') AS hora_salida,
             IFNULL(s.estado, 'sin_marca') AS estado, s.horas_trabajadas, s.observacion,
             (SELECT CONCAT(TIME_FORMAT(MIN(h.hora_inicio),'%H:%i'),' - ',TIME_FORMAT(MAX(h.hora_fin),'%H:%i'))
                FROM horarios_empleado h WHERE h.idempleado = e.idempleado AND h.dia_semana = {$dia}) AS turno",
            'FROM empleados e LEFT JOIN asistencias_empleado s ON s.idempleado = e.idempleado AND s.fecha = ? WHERE e.activo = 1',
            [$fecha], 'e.cargo, e.nombres', $p);
        return $p->respuesta($filas, $total);
    }

    public function marcarPersonal(int $idempleado): array
    {
        $r = BaseDatos::procedimiento('sp_asistencia_empleado_marcar', [$idempleado]);
        Cache::invalidar('panel', 'personal');
        return $r[0][0];
    }

    /**
     * Marca genérica usada por el módulo de asistencias del frontend.
     * Alumnos: una fila por marca. Personal: una fila por día (entrada y salida).
     */
    public function registrar(array $d): array
    {
        $metodo = $d['metodo'] ?? 'dni_manual';
        $notas = ($d['notas'] ?? '') ?: null;
        if ($d['categoria'] === 'alumno') {
            BaseDatos::ejecutar('INSERT INTO asistencias_alumno (idalumno, fecha, hora_entrada, tipo, metodo, notas) VALUES (?, CURDATE(), CURTIME(), ?, ?, ?)',
                [(int) $d['id'], $d['tipo'] === 'salida' ? 'salida' : 'entrada', $metodo, $notas]);
            Cache::invalidar('panel', 'asistencia');
            return ['clave' => 'a-' . BaseDatos::ultimoId()];
        }
        $id = (int) $d['id'];
        $estado = in_array($d['estado'] ?? '', ['falta', 'permiso'], true) ? $d['estado'] : null;
        $hoy = BaseDatos::fila('SELECT * FROM asistencias_empleado WHERE idempleado = ? AND fecha = CURDATE()', [$id]);
        if ($estado) {
            $this->registrarFalta($id, date('Y-m-d'), $notas ?? ucfirst($estado));
            if ($estado === 'permiso') BaseDatos::ejecutar("UPDATE asistencias_empleado SET estado = 'permiso' WHERE idempleado = ? AND fecha = CURDATE()", [$id]);
            $clave = 'e-' . BaseDatos::valor('SELECT idasistencia_empleado FROM asistencias_empleado WHERE idempleado = ? AND fecha = CURDATE()', [$id]) . '-entrada';
        } elseif (($d['tipo'] ?? 'entrada') === 'salida') {
            if (!$hoy || !$hoy['hora_entrada']) throw new ErrorHttp('Primero registra la entrada del día', 422);
            BaseDatos::ejecutar('UPDATE asistencias_empleado SET hora_salida = CURTIME(), observacion = COALESCE(?, observacion) WHERE idasistencia_empleado = ?',
                [$notas, $hoy['idasistencia_empleado']]);
            $clave = 'e-' . $hoy['idasistencia_empleado'] . '-salida';
        } else {
            // Segunda marca del día = salida
            if ($hoy && $hoy['hora_entrada'] && !$hoy['hora_salida'] && in_array($hoy['estado'], ['puntual', 'tarde'], true)) {
                return $this->registrar(['tipo' => 'salida'] + $d);
            }
            if ($hoy && $hoy['hora_entrada']) throw new ErrorHttp('La entrada y salida de hoy ya fueron registradas', 422);
            if ($hoy) {
                BaseDatos::ejecutar("UPDATE asistencias_empleado SET hora_entrada = CURTIME(), estado = 'puntual', observacion = ? WHERE idasistencia_empleado = ?",
                    [$notas, $hoy['idasistencia_empleado']]);
                $clave = 'e-' . $hoy['idasistencia_empleado'] . '-entrada';
            } else {
                BaseDatos::ejecutar('INSERT INTO asistencias_empleado (idempleado, fecha, hora_entrada, metodo, observacion) VALUES (?, CURDATE(), CURTIME(), ?, ?)',
                    [$id, $metodo, $notas]);
                $clave = 'e-' . BaseDatos::ultimoId() . '-entrada';
            }
            // Recepción puede corregir manualmente puntual/tarde
            if (in_array($d['estado'] ?? '', ['puntual', 'tarde'], true)) {
                BaseDatos::ejecutar('UPDATE asistencias_empleado SET estado = ? WHERE idempleado = ? AND fecha = CURDATE()', [$d['estado'], $id]);
            }
        }
        Cache::invalidar('panel', 'personal', 'asistencia');
        return ['clave' => $clave];
    }

    /** Elimina una marca: a-{id} (alumno), e-{id}-entrada|salida (personal). */
    public function eliminar(string $clave): void
    {
        if (preg_match('/^a-(\d+)$/', $clave, $m)) {
            BaseDatos::ejecutar('DELETE FROM asistencias_alumno WHERE idasistencia_alumno = ?', [(int) $m[1]]);
        } elseif (preg_match('/^e-(\d+)-salida$/', $clave, $m)) {
            BaseDatos::ejecutar('UPDATE asistencias_empleado SET hora_salida = NULL, horas_trabajadas = 0 WHERE idasistencia_empleado = ?', [(int) $m[1]]);
        } elseif (preg_match('/^e-(\d+)-entrada$/', $clave, $m)) {
            BaseDatos::ejecutar('DELETE FROM asistencias_empleado WHERE idasistencia_empleado = ?', [(int) $m[1]]);
        } else {
            throw new ErrorHttp('Registro de asistencia no válido', 422);
        }
        Cache::invalidar('panel', 'personal', 'asistencia');
    }

    public function registrarFalta(int $idempleado, string $fecha, ?string $observacion): void
    {
        if ($fecha > date('Y-m-d')) throw new ErrorHttp('No se puede registrar una falta futura', 422);
        BaseDatos::ejecutar(
            "INSERT INTO asistencias_empleado (idempleado, fecha, estado, observacion) VALUES (?, ?, 'falta', ?)
             ON DUPLICATE KEY UPDATE estado = 'falta', hora_entrada = NULL, hora_salida = NULL, horas_trabajadas = 0, observacion = VALUES(observacion)",
            [$idempleado, $fecha, $observacion]);
        Cache::invalidar('panel', 'personal');
    }
}
