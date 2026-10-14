<?php
namespace Modulos\Entrenamiento;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;

/** Entrenadores, catálogo de ejercicios y rutinas por días. */
final class EntrenamientoServicio
{
    // ----------------------------- Entrenadores -----------------------------
    public function guardarEntrenador(?int $id, array $d): array
    {
        [$nombres, $apellidos] = self::separarNombre($d['nombre'] ?? trim(($d['nombres'] ?? '') . ' ' . ($d['apellidos'] ?? '')));
        $v = [$nombres, $apellidos, $d['telefono'] ?? null, ($d['correo'] ?? '') ?: null, $d['especialidad'] ?? null,
            $d['biografia'] ?? null, (float) ($d['calificacion'] ?? 5), $d['horario_disponible'] ?? null, ($d['foto'] ?? '') ?: null];
        if ($id) {
            BaseDatos::ejecutar('UPDATE empleados SET nombres=?, apellidos=?, telefono=?, correo=?, especialidad=?, biografia=?,
                                 calificacion=?, horario_disponible=?, foto=COALESCE(?, foto) WHERE idempleado=? AND cargo=\'entrenador\'', [...$v, $id]);
        } else {
            BaseDatos::ejecutar("INSERT INTO empleados (nombres, apellidos, telefono, correo, especialidad, biografia, calificacion,
                                 horario_disponible, foto, cargo, titulo_cargo, fecha_ingreso) VALUES (?,?,?,?,?,?,?,?,?, 'entrenador', 'Entrenador', CURDATE())", $v);
            $id = BaseDatos::ultimoId();
        }
        Cache::invalidar('personal');
        return BaseDatos::fila('SELECT * FROM empleados WHERE idempleado = ?', [$id]) ?? throw new ErrorHttp('Entrenador no encontrado', 404);
    }

    public function desactivarEntrenador(int $id): void
    {
        BaseDatos::ejecutar("UPDATE empleados SET activo = 0 WHERE idempleado = ? AND cargo = 'entrenador'", [$id]);
        BaseDatos::ejecutar('UPDATE usuarios SET activo = 0 WHERE idempleado = ?', [$id]);
        Cache::invalidar('personal');
    }

    public static function separarNombre(string $completo): array
    {
        $partes = preg_split('/\s+/', trim($completo)) ?: [''];
        $n = count($partes) >= 4 ? 2 : 1;
        return [implode(' ', array_slice($partes, 0, $n)), implode(' ', array_slice($partes, $n)) ?: '-'];
    }

    // ----------------------------- Ejercicios -----------------------------
    private const CAMPOS_EJERCICIO = ['nombre', 'grupo_muscular', 'musculos_secundarios', 'equipo', 'dificultad', 'instrucciones',
        'consejos', 'series_repeticiones', 'video_url', 'miniatura_url'];

    public function guardarEjercicio(?int $id, array $d): array
    {
        $v = array_map(fn ($c) => ($d[$c] ?? '') === '' ? null : $d[$c], self::CAMPOS_EJERCICIO);
        if ($id) {
            BaseDatos::ejecutar('UPDATE ejercicios SET ' . implode('=?, ', self::CAMPOS_EJERCICIO) . '=? WHERE idejercicio = ?', [...$v, $id]);
        } else {
            BaseDatos::ejecutar('INSERT INTO ejercicios (' . implode(',', self::CAMPOS_EJERCICIO) . ') VALUES (' . implode(',', array_fill(0, count($v), '?')) . ')', $v);
            $id = BaseDatos::ultimoId();
        }
        Cache::invalidar('entrenamiento');
        return BaseDatos::fila('SELECT * FROM ejercicios WHERE idejercicio = ?', [$id]);
    }

    public function eliminarEjercicio(int $id): void
    {
        $usado = BaseDatos::valor('SELECT COUNT(*) FROM rutina_ejercicios WHERE idejercicio = ?', [$id]);
        BaseDatos::ejecutar($usado ? 'UPDATE ejercicios SET activo = 0 WHERE idejercicio = ?' : 'DELETE FROM ejercicios WHERE idejercicio = ?', [$id]);
        Cache::invalidar('entrenamiento');
    }

    // ----------------------------- Rutinas -----------------------------
    /** Crea o reemplaza una rutina con sus días y ejercicios en una transacción. */
    public function guardarRutina(?int $id, array $d): array
    {
        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            $v = [$d['titulo'], $d['descripcion'] ?? null, $d['nivel'], $d['objetivo'], ($d['identrenador'] ?? null) ?: null, ($d['idalumno'] ?? null) ?: null];
            if ($id) {
                BaseDatos::ejecutar('UPDATE rutinas SET titulo=?, descripcion=?, nivel=?, objetivo=?, identrenador=?, idalumno=? WHERE idrutina=?', [...$v, $id]);
                BaseDatos::ejecutar('DELETE FROM rutina_dias WHERE idrutina = ?', [$id]);
            } else {
                BaseDatos::ejecutar('INSERT INTO rutinas (titulo, descripcion, nivel, objetivo, identrenador, idalumno, fecha) VALUES (?,?,?,?,?,?, CURDATE())', $v);
                $id = BaseDatos::ultimoId();
            }
            foreach (array_values($d['dias'] ?? []) as $i => $dia) {
                BaseDatos::ejecutar('INSERT INTO rutina_dias (idrutina, orden, nombre, enfoque, notas) VALUES (?,?,?,?,?)',
                    [$id, $i + 1, $dia['nombre'] ?: 'Día ' . ($i + 1), $dia['enfoque'] ?? null, $dia['notas'] ?? null]);
                $idDia = BaseDatos::ultimoId();
                foreach (array_values($dia['ejercicios'] ?? []) as $k => $ej) {
                    BaseDatos::ejecutar('INSERT INTO rutina_ejercicios (idrutina_dia, idejercicio, orden, series, repeticiones, rir, descanso_seg, notas)
                                         VALUES (?,?,?,?,?,?,?,?)', [$idDia, (int) $ej['idejercicio'], $k + 1, (int) ($ej['series'] ?? 3),
                        (string) ($ej['repeticiones'] ?? '10'), $ej['rir'] ?? null, (int) ($ej['descanso_seg'] ?? 60), $ej['notas'] ?? null]);
                }
            }
            if (!empty($d['idalumno'])) {
                BaseDatos::ejecutar('UPDATE alumnos SET idrutina = ? WHERE idalumno = ?', [$id, (int) $d['idalumno']]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('entrenamiento', 'alumnos');
        return BaseDatos::fila('SELECT * FROM rutinas WHERE idrutina = ?', [$id]);
    }

    public function eliminarRutina(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM rutinas WHERE idrutina = ?', [$id]);
        Cache::invalidar('entrenamiento', 'alumnos');
    }
}
