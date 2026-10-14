<?php
namespace Modulos\Fisioterapia;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

/** Técnicas y procedimientos + sesiones con varias zonas y dolor por zona. */
final class FisioterapiaServicio
{
    public const ZONAS = ['cervical', 'hombro', 'columna_dorsal', 'lumbar', 'cadera', 'rodilla', 'tobillo_pie', 'codo_muneca', 'muscular_general'];

    // ----------------------------- Técnicas -----------------------------
    public function tecnicas(string $buscar): array
    {
        return Cache::recordar('fisioterapia', ['tecnicas', $buscar], fn () => BaseDatos::filas(
            "SELECT t.idtecnica, t.nombre, t.descripcion,
                    (SELECT COUNT(*) FROM sesion_tecnicas s WHERE s.idtecnica = t.idtecnica) AS usos
               FROM tecnicas_fisioterapia t
              WHERE t.activo = 1 AND CONCAT(t.nombre,' ',IFNULL(t.descripcion,'')) LIKE ?
              ORDER BY t.nombre", ["%{$buscar}%"]), 600);
    }

    public function guardarTecnica(?int $id, string $nombre, ?string $descripcion): array
    {
        if ($id) {
            BaseDatos::ejecutar('UPDATE tecnicas_fisioterapia SET nombre = ?, descripcion = ? WHERE idtecnica = ?', [$nombre, $descripcion, $id]);
        } else {
            BaseDatos::ejecutar('INSERT INTO tecnicas_fisioterapia (nombre, descripcion) VALUES (?, ?)', [$nombre, $descripcion]);
            $id = BaseDatos::ultimoId();
        }
        Cache::invalidar('fisioterapia');
        return BaseDatos::fila('SELECT idtecnica, nombre, descripcion FROM tecnicas_fisioterapia WHERE idtecnica = ?', [$id])
            ?? throw new ErrorHttp('Técnica no encontrada', 404);
    }

    /** Si la técnica ya se usó en sesiones solo se oculta, para no perder el historial. */
    public function eliminarTecnica(int $id): string
    {
        $usada = (int) BaseDatos::valor('SELECT COUNT(*) FROM sesion_tecnicas WHERE idtecnica = ?', [$id]);
        if ($usada) {
            BaseDatos::ejecutar('UPDATE tecnicas_fisioterapia SET activo = 0 WHERE idtecnica = ?', [$id]);
        } else {
            BaseDatos::ejecutar('DELETE FROM tecnicas_fisioterapia WHERE idtecnica = ?', [$id]);
        }
        Cache::invalidar('fisioterapia');
        return $usada ? 'Técnica archivada (tiene sesiones registradas)' : 'Técnica eliminada';
    }

    // ----------------------------- Sesiones -----------------------------
    public function sesiones(?int $idalumno, string $buscar, Paginacion $p): array
    {
        return Cache::recordar('fisioterapia', ['sesiones', $idalumno, $buscar, $p->pagina, $p->cantidad], function () use ($idalumno, $buscar, $p) {
            $donde = 'FROM sesiones_fisioterapia s JOIN alumnos a ON a.idalumno = s.idalumno
                      JOIN empleados e ON e.idempleado = s.idfisioterapeuta WHERE 1=1';
            $params = [];
            if ($idalumno) { $donde .= ' AND s.idalumno = ?'; $params[] = $idalumno; }
            if ($buscar !== '') { $donde .= " AND CONCAT(a.nombres,' ',a.apellidos,' ',a.dni,' ',s.motivo_consulta) LIKE ?"; $params[] = "%{$buscar}%"; }
            [$filas, $total] = BaseDatos::paginar(
                "s.idsesion_fisioterapia, s.idalumno, CONCAT(a.nombres,' ',a.apellidos) AS alumno, s.fecha, s.numero_sesion,
                 s.motivo_consulta, s.proxima_cita, CONCAT(e.nombres,' ',e.apellidos) AS fisioterapeuta,
                 (SELECT GROUP_CONCAT(CONCAT(z.zona,':',z.nivel_dolor) ORDER BY z.nivel_dolor DESC SEPARATOR ',')
                    FROM sesion_zonas z WHERE z.idsesion_fisioterapia = s.idsesion_fisioterapia) AS zonas",
                $donde, $params, 's.fecha DESC, s.idsesion_fisioterapia DESC', $p);
            foreach ($filas as &$f) {
                $f['zonas'] = array_map(function ($par) {
                    [$zona, $dolor] = explode(':', $par);
                    return ['zona' => $zona, 'nivel_dolor' => (int) $dolor];
                }, $f['zonas'] ? explode(',', $f['zonas']) : []);
            }
            return $p->respuesta($filas, $total);
        });
    }

    public function sesion(int $id, ?int $soloAlumno = null): array
    {
        $s = BaseDatos::fila(
            "SELECT s.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, a.restricciones_medicas,
                    CONCAT(e.nombres,' ',e.apellidos) AS fisioterapeuta
               FROM sesiones_fisioterapia s JOIN alumnos a ON a.idalumno = s.idalumno
               JOIN empleados e ON e.idempleado = s.idfisioterapeuta WHERE s.idsesion_fisioterapia = ?", [$id]);
        if (!$s || ($soloAlumno && (int) $s['idalumno'] !== $soloAlumno)) throw new ErrorHttp('Sesión no encontrada', 404);
        $s['zonas'] = BaseDatos::filas('SELECT zona, nivel_dolor FROM sesion_zonas WHERE idsesion_fisioterapia = ? ORDER BY nivel_dolor DESC', [$id]);
        $s['tecnicas'] = BaseDatos::filas(
            'SELECT t.idtecnica, t.nombre FROM sesion_tecnicas st JOIN tecnicas_fisioterapia t ON t.idtecnica = st.idtecnica
              WHERE st.idsesion_fisioterapia = ? ORDER BY t.nombre', [$id]);
        return $s;
    }

    public function eliminarSesion(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM sesiones_fisioterapia WHERE idsesion_fisioterapia = ?', [$id]);
        Cache::invalidar('fisioterapia');
    }

    public function crearSesion(array $d): array
    {
        $zonas = [];
        foreach ($d['zonas'] ?? [] as $z) {
            if (!in_array($z['zona'] ?? '', self::ZONAS, true)) throw new ErrorHttp('Zona no válida: ' . ($z['zona'] ?? ''), 422);
            $dolor = (int) ($z['nivel_dolor'] ?? 0);
            if ($dolor < 0 || $dolor > 10) throw new ErrorHttp('El nivel de dolor va de 0 a 10', 422);
            $zonas[] = ['zona' => $z['zona'], 'nivel_dolor' => $dolor];
        }
        $d['zonas'] = $zonas;
        // Las técnicas pueden llegar por id o por nombre; los nombres nuevos se agregan al catálogo
        $ids = [];
        foreach ($d['tecnicas'] ?? [] as $t) {
            if (is_numeric($t)) { $ids[] = (int) $t; continue; }
            $nombre = trim((string) $t);
            if ($nombre === '') continue;
            $id = BaseDatos::valor('SELECT idtecnica FROM tecnicas_fisioterapia WHERE nombre = ?', [$nombre]);
            if (!$id) {
                BaseDatos::ejecutar('INSERT INTO tecnicas_fisioterapia (nombre) VALUES (?)', [$nombre]);
                $id = BaseDatos::ultimoId();
            }
            $ids[] = (int) $id;
        }
        // Solo técnicas que siguen existiendo (pudieron eliminarse mientras se llenaba la sesión)
        $ids = array_values(array_unique($ids));
        $d['tecnicas'] = $ids ? array_map('intval', array_column(BaseDatos::filas(
            'SELECT idtecnica FROM tecnicas_fisioterapia WHERE idtecnica IN (' . implode(',', array_fill(0, count($ids), '?')) . ')', $ids), 'idtecnica')) : [];
        $r = BaseDatos::procedimiento('sp_sesion_fisioterapia_crear', [json_encode($d, JSON_UNESCAPED_UNICODE)]);
        Cache::invalidar('fisioterapia');
        return $this->sesion((int) $r[0][0]['idsesion_fisioterapia']);
    }
}
