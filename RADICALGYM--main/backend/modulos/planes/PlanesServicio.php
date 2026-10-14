<?php
namespace Modulos\Planes;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;

/** Planes y tarifas + programas de entrenamiento. */
final class PlanesServicio
{
    public function planes(bool $soloActivos): array
    {
        return Cache::recordar('planes', ['planes', $soloActivos], fn () => BaseDatos::filas(
            'SELECT p.*, (SELECT COUNT(*) FROM matriculas m WHERE m.idplan = p.idplan AND m.estado = \'activa\') AS alumnos_activos
               FROM planes p ' . ($soloActivos ? 'WHERE p.activo = 1 ' : '') . 'ORDER BY p.duracion_meses, p.precio'), 600);
    }

    public function guardarPlan(?int $id, array $d): array
    {
        $valores = [$d['nombre'], (int) $d['duracion_meses'], (int) ($d['duracion_dias'] ?? 0), (float) $d['precio'],
            (int) !empty($d['incluye_entrenador']), (int) !empty($d['incluye_nutricion']), $d['descripcion'] ?? null,
            is_array($d['caracteristicas'] ?? null) ? implode('|', $d['caracteristicas']) : ($d['caracteristicas'] ?? null),
            (int) !empty($d['destacado']), (int) ($d['activo'] ?? 1)];
        if ((int) $d['duracion_meses'] <= 0 && (int) ($d['duracion_dias'] ?? 0) <= 0) {
            throw new ErrorHttp('Indica la duración del plan en meses o días', 422);
        }
        if ($id) {
            BaseDatos::ejecutar('UPDATE planes SET nombre=?, duracion_meses=?, duracion_dias=?, precio=?, incluye_entrenador=?, incluye_nutricion=?,
                                 descripcion=?, caracteristicas=?, destacado=?, activo=? WHERE idplan=?', [...$valores, $id]);
        } else {
            BaseDatos::ejecutar('INSERT INTO planes (nombre, duracion_meses, duracion_dias, precio, incluye_entrenador, incluye_nutricion, descripcion,
                                 caracteristicas, destacado, activo) VALUES (?,?,?,?,?,?,?,?,?,?)', $valores);
            $id = BaseDatos::ultimoId();
        }
        Cache::invalidar('planes', 'alumnos');
        return BaseDatos::fila('SELECT * FROM planes WHERE idplan = ?', [$id]) ?? throw new ErrorHttp('Plan no encontrado', 404);
    }

    public function desactivarPlan(int $id): void
    {
        BaseDatos::ejecutar('UPDATE planes SET activo = 0 WHERE idplan = ?', [$id]);
        Cache::invalidar('planes');
    }

    public function programas(): array
    {
        return Cache::recordar('planes', 'programas', fn () => BaseDatos::filas(
            "SELECT pr.*, CONCAT(e.nombres,' ',e.apellidos) AS entrenador,
                    (SELECT COUNT(*) FROM matriculas m WHERE m.idprograma = pr.idprograma AND m.estado = 'activa') AS alumnos_afiliados
               FROM programas_entrenamiento pr
               LEFT JOIN empleados e ON e.idempleado = pr.identrenador
              WHERE pr.activo = 1 ORDER BY pr.nombre"), 600);
    }

    public function guardarPrograma(?int $id, array $d): array
    {
        $valores = [$d['nombre'], $d['objetivo'], $d['nivel'], ($d['identrenador'] ?? null) ?: null, $d['descripcion'] ?? null];
        if ($id) {
            BaseDatos::ejecutar('UPDATE programas_entrenamiento SET nombre=?, objetivo=?, nivel=?, identrenador=?, descripcion=? WHERE idprograma=?',
                [...$valores, $id]);
        } else {
            BaseDatos::ejecutar('INSERT INTO programas_entrenamiento (nombre, objetivo, nivel, identrenador, descripcion) VALUES (?,?,?,?,?)', $valores);
            $id = BaseDatos::ultimoId();
        }
        Cache::invalidar('planes', 'alumnos');
        return BaseDatos::fila('SELECT * FROM programas_entrenamiento WHERE idprograma = ?', [$id]);
    }
}
