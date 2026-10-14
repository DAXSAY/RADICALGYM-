<?php
namespace Modulos\Alumnos;

use Nucleo\Archivos;
use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

final class AlumnosServicio
{
    private const CAMPOS = ['dni', 'nombres', 'apellidos', 'sexo', 'fecha_nacimiento', 'telefono', 'correo',
        'contacto_emergencia', 'telefono_emergencia', 'parentesco_emergencia', 'restricciones_medicas', 'objetivo', 'idrutina', 'notas', 'foto'];

    public function listar(array $filtros, Paginacion $p): array
    {
        return Cache::recordar('alumnos', [$filtros, $p->pagina, $p->cantidad], function () use ($filtros, $p) {
            [$filas, $total] = BaseDatos::procedimiento('sp_alumnos_listar', [
                $filtros['buscar'] ?? '', $filtros['sexo'] ?? '', (int) ($filtros['idplan'] ?? 0),
                $filtros['mes'] ?? '', (int) ($filtros['idprograma'] ?? 0), $filtros['estado'] ?? '',
                $p->pagina, $p->cantidad,
            ]);
            foreach ($filas as &$f) $f['foto_url'] = Archivos::url($f['foto']);
            return $p->respuesta($filas, (int) ($total[0]['total'] ?? 0));
        });
    }

    /** Lista corta para selectores (id + nombre). */
    public function opciones(string $buscar): array
    {
        return Cache::recordar('alumnos', ['opciones', $buscar], fn () => BaseDatos::filas(
            "SELECT idalumno, CONCAT(nombres,' ',apellidos) AS nombre, dni
               FROM alumnos WHERE activo = 1
                AND CONCAT(nombres,' ',apellidos,' ',dni,' ',idalumno) LIKE ?
              ORDER BY apellidos, nombres LIMIT 20", ['%' . $buscar . '%']));
    }

    public function obtener(int $id): array
    {
        $a = BaseDatos::fila('SELECT * FROM alumnos WHERE idalumno = ?', [$id]);
        if (!$a) throw new ErrorHttp('Alumno no encontrado', 404);
        $a['foto_url'] = Archivos::url($a['foto']);
        $a['matriculas'] = BaseDatos::filas(
            "SELECT m.idmatricula, m.idplan, p.nombre AS plan, m.fecha_inicio, m.fecha_fin, m.monto, m.metodo_pago, m.estado,
                    pr.nombre AS programa, CONCAT(e.nombres,' ',e.apellidos) AS entrenador
               FROM matriculas m
               JOIN planes p ON p.idplan = m.idplan
               LEFT JOIN programas_entrenamiento pr ON pr.idprograma = m.idprograma
               LEFT JOIN empleados e ON e.idempleado = m.identrenador
              WHERE m.idalumno = ? ORDER BY m.fecha_inicio DESC", [$id]);
        return $a;
    }

    public function crear(array $d): array
    {
        $r = BaseDatos::procedimiento('sp_alumno_registrar', [
            $d['dni'], $d['nombres'], $d['apellidos'], $d['sexo'], ($d['fecha_nacimiento'] ?? '') ?: null,
            $d['telefono'] ?? null, $d['correo'] ?? null, $d['contacto_emergencia'] ?? null,
            $d['telefono_emergencia'] ?? null, $d['restricciones_medicas'] ?? null, $d['objetivo'] ?? null,
        ]);
        $id = (int) $r[0][0]['idalumno'];
        // Cuenta de acceso del alumno: usuario = DNI, clave inicial = DNI
        BaseDatos::ejecutar("INSERT INTO usuarios (usuario, clave, rol, idalumno) VALUES (?, ?, 'alumno', ?)",
            [$d['dni'], password_hash($d['dni'], PASSWORD_BCRYPT), $id]);

        $extras = array_intersect_key($d, array_flip(['parentesco_emergencia', 'idrutina', 'notas', 'foto']));
        if (array_filter($extras)) $this->actualizar($id, $extras);
        if (!empty($d['idplan'])) {
            $this->matricular($id, $d);
        }
        Cache::invalidar('alumnos', 'panel');
        return $this->obtener($id);
    }

    public function actualizar(int $id, array $d): array
    {
        $this->obtener($id);
        $sets = [];
        $valores = [];
        foreach (self::CAMPOS as $c) {
            if (array_key_exists($c, $d)) {
                $sets[] = "{$c} = ?";
                $valores[] = $d[$c] === '' ? null : $d[$c];
            }
        }
        if ($sets) {
            $valores[] = $id;
            BaseDatos::ejecutar('UPDATE alumnos SET ' . implode(', ', $sets) . ' WHERE idalumno = ?', $valores);
        }
        Cache::invalidar('alumnos');
        return $this->obtener($id);
    }

    public function desactivar(int $id): void
    {
        BaseDatos::ejecutar('UPDATE alumnos SET activo = 0 WHERE idalumno = ?', [$id]);
        BaseDatos::ejecutar('UPDATE usuarios SET activo = 0 WHERE idalumno = ?', [$id]);
        Cache::invalidar('alumnos', 'panel');
    }

    public function guardarFoto(int $id): array
    {
        $this->obtener($id);
        $ruta = Archivos::guardar('archivo', 'alumnos', $id, 'foto', ['jpg', 'jpeg', 'png', 'webp']);
        BaseDatos::ejecutar('UPDATE alumnos SET foto = ? WHERE idalumno = ?', [$ruta, $id]);
        Cache::invalidar('alumnos');
        return ['foto' => $ruta, 'foto_url' => Archivos::url($ruta)];
    }

    public function matricular(int $idalumno, array $d): array
    {
        $r = BaseDatos::procedimiento('sp_matricula_registrar', [
            $idalumno, (int) $d['idplan'], (int) ($d['idprograma'] ?? 0), (int) ($d['identrenador'] ?? 0),
            ($d['fecha_inicio'] ?? '') ?: $this->inicioRenovacion($idalumno),
            isset($d['descuento']) ? max(0, (float) BaseDatos::valor('SELECT precio FROM planes WHERE idplan = ?', [(int) $d['idplan']]) - (float) $d['descuento'])
                : (float) ($d['monto'] ?? 0),
            $d['metodo_pago'] ?? 'efectivo',
        ]);
        Cache::invalidar('alumnos', 'panel', 'caja');
        return $r[0][0];
    }

    /** Si el plan actual sigue vigente la renovación empieza al día siguiente de su fin; si no, hoy. */
    private function inicioRenovacion(int $idalumno): string
    {
        $fin = BaseDatos::valor("SELECT MAX(fecha_fin) FROM matriculas WHERE idalumno = ? AND estado IN ('activa','congelada')", [$idalumno]);
        return $fin && $fin >= date('Y-m-d') ? date('Y-m-d', strtotime($fin . ' +1 day')) : date('Y-m-d');
    }

    /** Cambia el entrenador de la matrícula vigente del alumno. */
    public function asignarEntrenador(int $idalumno, ?int $identrenador): void
    {
        $n = BaseDatos::ejecutar("UPDATE matriculas SET identrenador = ? WHERE idmatricula = (
                SELECT id FROM (SELECT idmatricula AS id FROM matriculas WHERE idalumno = ? AND estado <> 'anulada' ORDER BY fecha_fin DESC LIMIT 1) t)",
            [$identrenador ?: null, $idalumno]);
        if (!$n && !BaseDatos::valor("SELECT 1 FROM matriculas WHERE idalumno = ? AND estado <> 'anulada'", [$idalumno])) {
            throw new ErrorHttp('El alumno no tiene matrícula para asignarle entrenador', 422);
        }
        Cache::invalidar('alumnos');
    }

    public function cambiarEstadoMatricula(int $idmatricula, string $estado): void
    {
        if (!in_array($estado, ['activa', 'congelada', 'anulada'], true)) {
            throw new ErrorHttp('Estado no válido', 422);
        }
        BaseDatos::ejecutar('UPDATE matriculas SET estado = ? WHERE idmatricula = ?', [$estado, $idmatricula]);
        Cache::invalidar('alumnos', 'panel', 'caja');
    }

    public function asistencias(int $idalumno, Paginacion $p): array
    {
        [$filas, $total] = BaseDatos::paginar('fecha, hora_entrada', 'FROM asistencias_alumno WHERE idalumno = ?',
            [$idalumno], 'fecha DESC', $p);
        return $p->respuesta($filas, $total);
    }
}
