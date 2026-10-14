<?php
namespace Modulos\Nutricion;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

/** Dietas, catálogo de alimentos y medidas antropométricas. */
final class NutricionServicio
{
    public const PERIMETROS = ['cuello', 'hombros', 'pecho', 'cintura', 'abdomen', 'cadera',
        'biceps_relajado_der', 'biceps_relajado_izq', 'biceps_contraido_der', 'biceps_contraido_izq',
        'antebrazo_der', 'antebrazo_izq', 'muslo_der', 'muslo_izq', 'pantorrilla_der', 'pantorrilla_izq'];
    private const COMPOSICION = ['grasa_porcentaje', 'masa_muscular_kg', 'grasa_visceral', 'agua_porcentaje',
        'metabolismo_basal', 'edad_metabolica', 'masa_osea_kg', 'puntuacion_fisica', 'pliegue_triceps', 'pliegue_subescapular',
        'pliegue_suprailiaco', 'pliegue_abdominal', 'pliegue_muslo', 'pliegue_pantorrilla', 'hora', 'notas_objetivo'];

    // ----------------------------- Alimentos -----------------------------
    public function alimentos(string $buscar): array
    {
        return Cache::recordar('nutricion', ['alimentos', $buscar], fn () => BaseDatos::filas(
            'SELECT idalimento, nombre, kcal_100g FROM alimentos WHERE nombre LIKE ? ORDER BY nombre LIMIT 30', ["%{$buscar}%"]), 3600);
    }

    public function crearAlimento(string $nombre, float $kcal): array
    {
        BaseDatos::ejecutar('INSERT INTO alimentos (nombre, kcal_100g) VALUES (?, ?) ON DUPLICATE KEY UPDATE kcal_100g = VALUES(kcal_100g)',
            [$nombre, $kcal]);
        Cache::invalidar('nutricion');
        return BaseDatos::fila('SELECT * FROM alimentos WHERE nombre = ?', [$nombre]);
    }

    // ----------------------------- Dietas -----------------------------
    public function dietas(?int $idalumno, string $buscar, Paginacion $p): array
    {
        return Cache::recordar('nutricion', ['dietas', $idalumno, $buscar, $p->pagina, $p->cantidad], function () use ($idalumno, $buscar, $p) {
            $donde = 'FROM dietas d JOIN alumnos a ON a.idalumno = d.idalumno JOIN empleados e ON e.idempleado = d.idnutricionista WHERE 1=1';
            $params = [];
            if ($idalumno) { $donde .= ' AND d.idalumno = ?'; $params[] = $idalumno; }
            if ($buscar !== '') { $donde .= " AND CONCAT(a.nombres,' ',a.apellidos,' ',d.titulo) LIKE ?"; $params[] = "%{$buscar}%"; }
            [$filas, $total] = BaseDatos::paginar(
                "d.iddieta, d.idalumno, CONCAT(a.nombres,' ',a.apellidos) AS alumno, d.titulo, d.objetivo, d.calorias_meta,
                 d.calorias_totales, d.comidas_por_dia, d.fecha, d.activa, CONCAT(e.nombres,' ',e.apellidos) AS nutricionista",
                $donde, $params, 'd.activa DESC, d.fecha DESC', $p);
            return $p->respuesta($filas, $total);
        });
    }

    public function dieta(int $id, ?int $soloAlumno = null): array
    {
        $d = BaseDatos::fila(
            "SELECT d.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, CONCAT(e.nombres,' ',e.apellidos) AS nutricionista
               FROM dietas d JOIN alumnos a ON a.idalumno = d.idalumno JOIN empleados e ON e.idempleado = d.idnutricionista
              WHERE d.iddieta = ?", [$id]);
        if (!$d || ($soloAlumno && (int) $d['idalumno'] !== $soloAlumno)) throw new ErrorHttp('Dieta no encontrada', 404);
        $d['comidas'] = BaseDatos::filas("SELECT iddieta_comida, orden, nombre, TIME_FORMAT(hora,'%H:%i') AS hora
                                            FROM dieta_comidas WHERE iddieta = ? ORDER BY orden", [$id]);
        foreach ($d['comidas'] as &$c) {
            $c['alimentos'] = BaseDatos::filas('SELECT iddieta_alimento, alimento, gramos, kilocalorias FROM dieta_alimentos WHERE iddieta_comida = ?',
                [$c['iddieta_comida']]);
            $c['kilocalorias'] = round(array_sum(array_column($c['alimentos'], 'kilocalorias')), 1);
        }
        return $d;
    }

    /** Dieta activa del alumno (portal). */
    public function dietaActiva(int $idalumno): ?array
    {
        $id = BaseDatos::valor('SELECT iddieta FROM dietas WHERE idalumno = ? AND activa = 1 ORDER BY fecha DESC LIMIT 1', [$idalumno]);
        return $id ? $this->dieta((int) $id) : null;
    }

    public function crearDieta(array $d): array
    {
        $comidas = array_values(array_filter($d['comidas'] ?? [], fn ($c) => trim($c['nombre'] ?? '') !== ''));
        if (!$comidas) throw new ErrorHttp('Agrega al menos una comida', 422);
        if (count($comidas) > 8) throw new ErrorHttp('Máximo 8 comidas por día', 422);
        $d['comidas'] = $comidas;
        $r = BaseDatos::procedimiento('sp_dieta_crear', [json_encode($d, JSON_UNESCAPED_UNICODE)]);
        Cache::invalidar('nutricion');
        return $this->dieta((int) $r[0][0]['iddieta']);
    }

    /** Edita cabecera y reemplaza comidas/alimentos (los triggers recalculan las kcal). */
    public function actualizarDieta(int $id, array $d): array
    {
        if (!BaseDatos::valor('SELECT 1 FROM dietas WHERE iddieta = ?', [$id])) throw new ErrorHttp('Dieta no encontrada', 404);
        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            $cab = ['titulo', 'objetivo', 'calorias_meta', 'proteinas_g', 'carbohidratos_g', 'grasas_g', 'agua_litros', 'recomendaciones',
                'suplementos', 'pautas_hidratacion', 'activa'];
            $sets = [];
            $valores = [];
            foreach ($cab as $c) {
                if (array_key_exists($c, $d)) { $sets[] = "{$c} = ?"; $valores[] = is_bool($d[$c]) ? (int) $d[$c] : $d[$c]; }
            }
            if ($sets) BaseDatos::ejecutar('UPDATE dietas SET ' . implode(', ', $sets) . ' WHERE iddieta = ?', [...$valores, $id]);
            if (!empty($d['activa'])) {
                BaseDatos::ejecutar('UPDATE dietas SET activa = 0 WHERE idalumno = (SELECT idalumno FROM (SELECT idalumno FROM dietas WHERE iddieta = ?) t) AND iddieta <> ?', [$id, $id]);
            }
            if (isset($d['comidas']) && is_array($d['comidas'])) {
                $comidas = array_values(array_filter($d['comidas'], fn ($c) => trim($c['nombre'] ?? '') !== ''));
                if (!$comidas || count($comidas) > 8) throw new ErrorHttp('La dieta debe tener entre 1 y 8 comidas', 422);
                BaseDatos::ejecutar('DELETE FROM dieta_comidas WHERE iddieta = ?', [$id]);
                foreach ($comidas as $i => $c) {
                    BaseDatos::ejecutar('INSERT INTO dieta_comidas (iddieta, orden, nombre, hora) VALUES (?,?,?,?)', [$id, $i + 1, $c['nombre'], ($c['hora'] ?? '') ?: null]);
                    $idc = BaseDatos::ultimoId();
                    foreach ($c['alimentos'] ?? [] as $a) {
                        if (trim($a['alimento'] ?? '') === '' || (float) ($a['gramos'] ?? 0) <= 0) continue;
                        BaseDatos::ejecutar('INSERT INTO dieta_alimentos (iddieta_comida, alimento, gramos, kilocalorias, proteinas_g, carbohidratos_g, grasas_g) VALUES (?,?,?,?,?,?,?)',
                            [$idc, $a['alimento'], (float) $a['gramos'], ((float) ($a['kilocalorias'] ?? 0)) ?: null,
                                (float) ($a['proteinas_g'] ?? 0), (float) ($a['carbohidratos_g'] ?? 0), (float) ($a['grasas_g'] ?? 0)]);
                    }
                }
                BaseDatos::ejecutar('UPDATE dietas SET comidas_por_dia = ?, calorias_totales = (SELECT IFNULL(ROUND(SUM(a.kilocalorias)),0)
                    FROM dieta_alimentos a JOIN dieta_comidas c ON c.iddieta_comida = a.iddieta_comida WHERE c.iddieta = ?) WHERE iddieta = ?', [count($comidas), $id, $id]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('nutricion');
        return $this->dieta($id);
    }

    public function eliminarDieta(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM dietas WHERE iddieta = ?', [$id]);
        Cache::invalidar('nutricion');
    }

    // ----------------------------- Medidas -----------------------------
    public function medidas(?int $idalumno, Paginacion $p): array
    {
        return Cache::recordar('nutricion', ['medidas', $idalumno, $p->pagina, $p->cantidad], function () use ($idalumno, $p) {
            $donde = 'FROM medidas m JOIN alumnos a ON a.idalumno = m.idalumno JOIN empleados e ON e.idempleado = m.idevaluador WHERE 1=1';
            $params = [];
            if ($idalumno) { $donde .= ' AND m.idalumno = ?'; $params[] = $idalumno; }
            [$filas, $total] = BaseDatos::paginar(
                "m.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, CONCAT(e.nombres,' ',e.apellidos) AS evaluador",
                $donde, $params, 'm.fecha DESC, m.idmedida DESC', $p);
            return $p->respuesta($filas, $total);
        });
    }

    public function crearMedida(array $d): array
    {
        $campos = ['idalumno', 'idevaluador', 'fecha', 'peso_kg', 'talla_cm', ...self::PERIMETROS, ...self::COMPOSICION, 'observaciones'];
        $valores = [];
        foreach ($campos as $c) {
            $v = $d[$c] ?? null;
            $valores[] = ($v === '' ? null : $v);
        }
        $marcas = implode(',', array_fill(0, count($campos), '?'));
        BaseDatos::ejecutar('INSERT INTO medidas (' . implode(',', $campos) . ") VALUES ({$marcas})", $valores);
        Cache::invalidar('nutricion');
        return BaseDatos::fila('SELECT * FROM medidas WHERE idmedida = ?', [BaseDatos::ultimoId()]);
    }

    public function eliminarMedida(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM medidas WHERE idmedida = ?', [$id]);
        Cache::invalidar('nutricion');
    }
}
