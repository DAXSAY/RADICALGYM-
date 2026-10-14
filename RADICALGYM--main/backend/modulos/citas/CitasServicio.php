<?php
namespace Modulos\Citas;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

/** Horarios y citas de nutrición y fisioterapia. */
final class CitasServicio
{
    private const CARGO = ['nutricion' => 'nutricionista', 'fisioterapia' => 'fisioterapeuta'];

    /** Citas de un día agrupables por horario (lista de personas en x horario). */
    public function agenda(string $servicio, int $idempleado, string $fecha): array
    {
        return Cache::recordar('citas', [$servicio, $idempleado, $fecha], function () use ($servicio, $idempleado, $fecha) {
            $citas = BaseDatos::procedimiento('sp_agenda_listar', [$servicio, $idempleado, $fecha])[0] ?? [];
            foreach ($citas as &$c) {
                $c['hora_inicio'] = substr($c['hora_inicio'], 0, 5);
                $c['hora_fin'] = substr($c['hora_fin'], 0, 5);
            }
            return $citas;
        }, 60);
    }

    /** Profesionales del servicio con su horario semanal. */
    public function horarios(string $servicio): array
    {
        $cargo = self::CARGO[$servicio] ?? throw new ErrorHttp('Servicio no válido', 422);
        return Cache::recordar('citas', ['horarios', $servicio], function () use ($cargo) {
            $profesionales = BaseDatos::filas(
                "SELECT idempleado, CONCAT(nombres,' ',apellidos) AS nombre, especialidad
                   FROM empleados WHERE cargo = ? AND activo = 1 ORDER BY nombres", [$cargo]);
            foreach ($profesionales as &$pr) {
                $pr['horario'] = BaseDatos::filas(
                    "SELECT dia_semana, TIME_FORMAT(hora_inicio,'%H:%i') AS hora_inicio, TIME_FORMAT(hora_fin,'%H:%i') AS hora_fin
                       FROM horarios_empleado WHERE idempleado = ? ORDER BY dia_semana, hora_inicio", [$pr['idempleado']]);
            }
            return $profesionales;
        }, 600);
    }

    public function crear(array $d): array
    {
        if (!isset(self::CARGO[$d['servicio']])) throw new ErrorHttp('Servicio no válido', 422);
        $cargo = BaseDatos::valor('SELECT cargo FROM empleados WHERE idempleado = ?', [(int) $d['idempleado']]);
        if ($cargo !== self::CARGO[$d['servicio']]) {
            throw new ErrorHttp('El profesional no corresponde al servicio', 422);
        }
        $duracion = (int) ($d['duracion'] ?? 45);
        $fin = $d['hora_fin'] ?? date('H:i', strtotime($d['hora_inicio']) + $duracion * 60);
        BaseDatos::ejecutar('INSERT INTO citas (servicio, idalumno, idempleado, fecha, hora_inicio, hora_fin, motivo, consultorio, notas, estado)
                             VALUES (?,?,?,?,?,?,?,?,?,?)',
            [$d['servicio'], (int) $d['idalumno'], (int) $d['idempleado'], $d['fecha'], $d['hora_inicio'], $fin, $d['motivo'] ?? null,
                ($d['consultorio'] ?? '') ?: null, ($d['notas'] ?? '') ?: null, ($d['estado'] ?? '') ?: 'programada']);
        Cache::invalidar('citas', 'panel');
        return BaseDatos::fila('SELECT * FROM citas WHERE idcita = ?', [BaseDatos::ultimoId()]);
    }

    public function cambiarEstado(int $id, string $estado): void
    {
        if (!in_array($estado, ['programada', 'confirmada', 'atendiendo', 'atendida', 'pospuesta', 'falta', 'cancelada'], true)) {
            throw new ErrorHttp('Estado no válido', 422);
        }
        BaseDatos::ejecutar('UPDATE citas SET estado = ? WHERE idcita = ?', [$estado, $id]);
        Cache::invalidar('citas', 'panel');
    }

    public function eliminar(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM citas WHERE idcita = ?', [$id]);
        Cache::invalidar('citas', 'panel');
    }

    public function delAlumno(int $idalumno, Paginacion $p): array
    {
        [$filas, $total] = BaseDatos::paginar(
            "c.idcita, c.servicio, c.fecha, TIME_FORMAT(c.hora_inicio,'%H:%i') AS hora_inicio, c.estado, c.motivo,
             CONCAT(e.nombres,' ',e.apellidos) AS profesional",
            'FROM citas c JOIN empleados e ON e.idempleado = c.idempleado WHERE c.idalumno = ?',
            [$idalumno], 'c.fecha DESC, c.hora_inicio', $p);
        return $p->respuesta($filas, $total);
    }
}
