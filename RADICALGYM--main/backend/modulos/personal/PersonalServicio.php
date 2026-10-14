<?php
namespace Modulos\Personal;

use Nucleo\Archivos;
use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

/** Empleados, contratos, horarios y permisos. */
final class PersonalServicio
{
    private const ROLES_USUARIO = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta'];

    public function listar(array $f, Paginacion $p): array
    {
        return Cache::recordar('personal', [$f, $p->pagina, $p->cantidad], function () use ($f, $p) {
            $donde = 'FROM empleados e
                      LEFT JOIN contratos c ON c.idcontrato = (SELECT MAX(idcontrato) FROM contratos WHERE idempleado = e.idempleado)
                      WHERE e.activo = 1';
            $params = [];
            if (!empty($f['cargo'])) { $donde .= ' AND e.cargo = ?'; $params[] = $f['cargo']; }
            if (!empty($f['buscar'])) {
                $donde .= " AND CONCAT(e.nombres,' ',e.apellidos,' ',e.dni,' ',e.idempleado) LIKE ?";
                $params[] = '%' . $f['buscar'] . '%';
            }
            [$filas, $total] = BaseDatos::paginar(
                "e.idempleado, e.dni, e.nombres, e.apellidos, e.sexo, e.telefono, e.correo, e.cargo, e.especialidad, e.foto,
                 e.fecha_ingreso, c.idcontrato, c.tipo AS tipo_contrato, c.fecha_fin AS fin_contrato, c.estado AS estado_contrato,
                 c.sueldo_mensual, c.horas_semanales", $donde, $params, 'e.apellidos, e.nombres', $p);
            foreach ($filas as &$x) $x['foto_url'] = Archivos::url($x['foto']);
            return $p->respuesta($filas, $total);
        });
    }

    /** Profesionales por cargo (para selectores). */
    public function porCargo(string $cargo): array
    {
        return Cache::recordar('personal', ['cargo', $cargo], fn () => BaseDatos::filas(
            "SELECT idempleado, CONCAT(nombres,' ',apellidos) AS nombre, especialidad
               FROM empleados WHERE activo = 1 AND (? = '' OR cargo = ?) ORDER BY nombres", [$cargo, $cargo]), 600);
    }

    public function obtener(int $id): array
    {
        $e = BaseDatos::fila('SELECT * FROM empleados WHERE idempleado = ?', [$id]);
        if (!$e) throw new ErrorHttp('Empleado no encontrado', 404);
        $e['foto_url'] = Archivos::url($e['foto']);
        $e['usuario'] = BaseDatos::valor('SELECT usuario FROM usuarios WHERE idempleado = ?', [$id]);
        $e['contratos'] = BaseDatos::filas('SELECT * FROM contratos WHERE idempleado = ? ORDER BY fecha_inicio DESC', [$id]);
        foreach ($e['contratos'] as &$c) $c['documento_url'] = Archivos::url($c['documento']);
        $e['horarios'] = $this->horarios($id);
        return $e;
    }

    public function crear(array $d): array
    {
        BaseDatos::ejecutar('INSERT INTO empleados (dni, nombres, apellidos, sexo, telefono, correo, cargo, especialidad, fecha_ingreso)
                             VALUES (?,?,?,?,?,?,?,?,?)', [
            $d['dni'], $d['nombres'], $d['apellidos'], $d['sexo'], $d['telefono'] ?? null, ($d['correo'] ?? '') ?: null,
            $d['cargo'], $d['especialidad'] ?? null, $d['fecha_ingreso'] ?? date('Y-m-d'),
        ]);
        $id = BaseDatos::ultimoId();
        if (in_array($d['cargo'], self::ROLES_USUARIO, true)) {
            BaseDatos::ejecutar('INSERT INTO usuarios (usuario, clave, rol, idempleado) VALUES (?,?,?,?)', [
                ($d['usuario'] ?? '') ?: $d['dni'], password_hash(($d['clave'] ?? '') ?: $d['dni'], PASSWORD_BCRYPT), $d['cargo'], $id,
            ]);
        }
        Cache::invalidar('personal');
        return $this->obtener($id);
    }

    public function actualizar(int $id, array $d): array
    {
        $this->obtener($id);
        BaseDatos::ejecutar('UPDATE empleados SET nombres=?, apellidos=?, sexo=?, telefono=?, correo=?, cargo=?, especialidad=? WHERE idempleado=?', [
            $d['nombres'], $d['apellidos'], $d['sexo'], $d['telefono'] ?? null, ($d['correo'] ?? '') ?: null,
            $d['cargo'], $d['especialidad'] ?? null, $id,
        ]);
        BaseDatos::ejecutar('UPDATE usuarios SET rol = ? WHERE idempleado = ? AND ? IN (\'administrador\',\'recepcion\',\'entrenador\',\'nutricionista\',\'fisioterapeuta\')',
            [$d['cargo'], $id, $d['cargo']]);
        Cache::invalidar('personal');
        return $this->obtener($id);
    }

    public function desactivar(int $id): void
    {
        BaseDatos::ejecutar('UPDATE empleados SET activo = 0 WHERE idempleado = ?', [$id]);
        BaseDatos::ejecutar('UPDATE usuarios SET activo = 0 WHERE idempleado = ?', [$id]);
        Cache::invalidar('personal');
    }

    public function guardarFoto(int $id): array
    {
        $this->obtener($id);
        $ruta = Archivos::guardar('archivo', 'empleados', $id, 'foto', ['jpg', 'jpeg', 'png', 'webp']);
        BaseDatos::ejecutar('UPDATE empleados SET foto = ? WHERE idempleado = ?', [$ruta, $id]);
        Cache::invalidar('personal');
        return ['foto' => $ruta, 'foto_url' => Archivos::url($ruta)];
    }

    // ----------------------------- Horarios -----------------------------
    public function horarios(int $id): array
    {
        return BaseDatos::filas('SELECT idhorario, dia_semana, TIME_FORMAT(hora_inicio, \'%H:%i\') AS hora_inicio,
                                        TIME_FORMAT(hora_fin, \'%H:%i\') AS hora_fin
                                   FROM horarios_empleado WHERE idempleado = ? ORDER BY dia_semana, hora_inicio', [$id]);
    }

    /** Reemplaza el horario semanal completo. */
    public function guardarHorarios(int $id, array $bloques): array
    {
        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            BaseDatos::ejecutar('DELETE FROM horarios_empleado WHERE idempleado = ?', [$id]);
            foreach ($bloques as $b) {
                BaseDatos::ejecutar('INSERT INTO horarios_empleado (idempleado, dia_semana, hora_inicio, hora_fin) VALUES (?,?,?,?)',
                    [$id, (int) $b['dia_semana'], $b['hora_inicio'], $b['hora_fin']]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('personal', 'citas');
        return $this->horarios($id);
    }

    // ----------------------------- Contratos -----------------------------
    public function contratos(array $f, Paginacion $p): array
    {
        $donde = 'FROM contratos c JOIN empleados e ON e.idempleado = c.idempleado WHERE 1=1';
        $params = [];
        if (!empty($f['estado'])) { $donde .= ' AND c.estado = ?'; $params[] = $f['estado']; }
        if (!empty($f['idempleado'])) { $donde .= ' AND c.idempleado = ?'; $params[] = (int) $f['idempleado']; }
        [$filas, $total] = BaseDatos::paginar(
            "c.*, CONCAT(e.nombres,' ',e.apellidos) AS empleado, e.cargo", $donde, $params, 'c.fecha_fin IS NULL, c.fecha_fin', $p);
        foreach ($filas as &$x) $x['documento_url'] = Archivos::url($x['documento']);
        return $p->respuesta($filas, $total);
    }

    public function crearContrato(array $d): array
    {
        BaseDatos::ejecutar('UPDATE contratos SET estado = \'renovado\' WHERE idempleado = ? AND estado IN (\'vigente\',\'por_vencer\')', [(int) $d['idempleado']]);
        BaseDatos::ejecutar('INSERT INTO contratos (idempleado, tipo, modalidad, fecha_inicio, fecha_fin, sueldo_mensual, tarifa_hora, horas_semanales)
                             VALUES (?,?,?,?,?,?,?,?)', [
            (int) $d['idempleado'], $d['tipo'], $d['modalidad'], $d['fecha_inicio'], ($d['fecha_fin'] ?? '') ?: null,
            (float) ($d['sueldo_mensual'] ?? 0), (float) ($d['tarifa_hora'] ?? 0), (int) $d['horas_semanales'],
        ]);
        Cache::invalidar('personal');
        return BaseDatos::fila('SELECT * FROM contratos WHERE idcontrato = ?', [BaseDatos::ultimoId()]);
    }

    /** Alta de trabajador con su contrato, usuario de acceso y planilla del mes (módulo Contratos de Personal). */
    public function crearContratoCompleto(array $d): array
    {
        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            [$nombres, $apellidos] = \Modulos\Entrenamiento\EntrenamientoServicio::separarNombre($d['nombre']);
            $dni = preg_match('/^\d{8}$/', (string) ($d['dni'] ?? '')) ? $d['dni'] : null;
            BaseDatos::ejecutar('INSERT INTO empleados (dni, nombres, apellidos, telefono, correo, cargo, titulo_cargo, especialidad, cuenta_bancaria, foto, fecha_ingreso)
                                 VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
                $dni, $nombres, $apellidos, $d['telefono'] ?? null, ($d['correo'] ?? '') ?: null, $d['cargo'], $d['titulo_cargo'] ?? null,
                $d['titulo_cargo'] ?? null, ($d['cuenta_bancaria'] ?? '') ?: null, ($d['foto'] ?? '') ?: null, $d['fecha_inicio'],
            ]);
            $idempleado = BaseDatos::ultimoId();
            if (in_array($d['cargo'], self::ROLES_USUARIO, true)) {
                $usuario = $dni ?? ('emp' . $idempleado);
                BaseDatos::ejecutar('INSERT INTO usuarios (usuario, clave, rol, idempleado) VALUES (?,?,?,?)',
                    [$usuario, password_hash($dni ?? $usuario, PASSWORD_BCRYPT), $d['cargo'], $idempleado]);
            }
            BaseDatos::ejecutar('INSERT INTO contratos (idempleado, tipo, modalidad, fecha_inicio, fecha_fin, sueldo_mensual, tarifa_hora, horas_semanales, notas)
                                 VALUES (?,?,?,?,?,?,?,?,?)', [
                $idempleado, $d['tipo'], $d['modalidad'], $d['fecha_inicio'], ($d['fecha_fin'] ?? '') ?: null,
                (float) ($d['sueldo_mensual'] ?? 0), (float) ($d['tarifa_hora'] ?? 0), (int) ($d['horas_semanales'] ?? 48), ($d['notas'] ?? '') ?: null,
            ]);
            $idcontrato = BaseDatos::ultimoId();
            $this->planillaDelMes($idcontrato);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('personal', 'caja');
        return ['idcontrato' => $idcontrato, 'idempleado' => $idempleado];
    }

    private function planillaDelMes(int $idcontrato): void
    {
        BaseDatos::ejecutar("INSERT IGNORE INTO planilla (idcontrato, periodo, sueldo_base, horas_trabajadas, tarifa_hora)
                             SELECT idcontrato, DATE_FORMAT(CURDATE(), '%Y-%m'), sueldo_mensual, 0, tarifa_hora FROM contratos WHERE idcontrato = ?", [$idcontrato]);
    }

    public function actualizarContrato(int $id, array $d): void
    {
        $c = BaseDatos::fila('SELECT idempleado FROM contratos WHERE idcontrato = ?', [$id]) ?? throw new ErrorHttp('Contrato no encontrado', 404);
        $mapaContrato = ['tipo', 'modalidad', 'fecha_inicio', 'fecha_fin', 'sueldo_mensual', 'tarifa_hora', 'horas_semanales', 'notas', 'estado'];
        $mapaEmpleado = ['telefono', 'correo', 'cargo', 'titulo_cargo', 'cuenta_bancaria', 'foto'];
        foreach ([['contratos', 'idcontrato', $id, $mapaContrato], ['empleados', 'idempleado', $c['idempleado'], $mapaEmpleado]] as [$tabla, $pk, $valorPk, $campos]) {
            $sets = [];
            $valores = [];
            foreach ($campos as $campo) {
                if (array_key_exists($campo, $d)) { $sets[] = "{$campo} = ?"; $valores[] = $d[$campo] === '' ? null : $d[$campo]; }
            }
            if ($sets) BaseDatos::ejecutar("UPDATE {$tabla} SET " . implode(', ', $sets) . " WHERE {$pk} = ?", [...$valores, $valorPk]);
        }
        if (!empty($d['nombre'])) {
            [$n, $a] = \Modulos\Entrenamiento\EntrenamientoServicio::separarNombre($d['nombre']);
            BaseDatos::ejecutar('UPDATE empleados SET nombres = ?, apellidos = ? WHERE idempleado = ?', [$n, $a, $c['idempleado']]);
        }
        Cache::invalidar('personal');
    }

    public function renovarContrato(int $id, string $tipo, ?float $sueldo): array
    {
        $c = BaseDatos::fila('SELECT * FROM contratos WHERE idcontrato = ?', [$id]) ?? throw new ErrorHttp('Contrato no encontrado', 404);
        BaseDatos::ejecutar("UPDATE contratos SET estado = 'renovado' WHERE idcontrato = ?", [$id]);
        BaseDatos::ejecutar('INSERT INTO contratos (idempleado, tipo, modalidad, fecha_inicio, sueldo_mensual, tarifa_hora, horas_semanales, documento, notas)
                             VALUES (?, ?, ?, CURDATE(), ?, 0, ?, ?, ?)', [
            $c['idempleado'], $tipo, $c['modalidad'], $sueldo ?: $c['sueldo_mensual'], $c['horas_semanales'], $c['documento'], $c['notas'],
        ]);
        $nuevo = BaseDatos::ultimoId();
        if ((float) $c['sueldo_mensual'] == 0) BaseDatos::ejecutar('UPDATE contratos SET tarifa_hora = ? WHERE idcontrato = ?', [$c['tarifa_hora'], $nuevo]);
        $this->planillaDelMes($nuevo);
        Cache::invalidar('personal', 'caja');
        return BaseDatos::fila('SELECT * FROM contratos WHERE idcontrato = ?', [$nuevo]);
    }

    public function eliminarContrato(int $id): void
    {
        $c = BaseDatos::fila('SELECT idempleado FROM contratos WHERE idcontrato = ?', [$id]) ?? throw new ErrorHttp('Contrato no encontrado', 404);
        BaseDatos::ejecutar('DELETE FROM contratos WHERE idcontrato = ?', [$id]);
        if (!BaseDatos::valor('SELECT COUNT(*) FROM contratos WHERE idempleado = ?', [$c['idempleado']])) {
            $this->desactivar((int) $c['idempleado']);
        }
        Cache::invalidar('personal', 'caja');
    }

    public function documentoContrato(int $id): array
    {
        if (!BaseDatos::valor('SELECT 1 FROM contratos WHERE idcontrato = ?', [$id])) throw new ErrorHttp('Contrato no encontrado', 404);
        $ruta = Archivos::guardar('archivo', 'contratos', $id, 'documento');
        BaseDatos::ejecutar('UPDATE contratos SET documento = ? WHERE idcontrato = ?', [$ruta, $id]);
        return ['documento' => $ruta, 'documento_url' => Archivos::url($ruta)];
    }

    // ----------------------------- Permisos -----------------------------
    public function permisos(array $f, Paginacion $p): array
    {
        $donde = 'FROM permisos x JOIN empleados e ON e.idempleado = x.idempleado WHERE 1=1';
        $params = [];
        if (!empty($f['estado'])) { $donde .= ' AND x.estado = ?'; $params[] = $f['estado']; }
        if (!empty($f['idempleado'])) { $donde .= ' AND x.idempleado = ?'; $params[] = (int) $f['idempleado']; }
        [$filas, $total] = BaseDatos::paginar(
            "x.*, CONCAT(e.nombres,' ',e.apellidos) AS empleado, e.cargo", $donde, $params, 'x.fecha_solicitud DESC', $p);
        foreach ($filas as &$r) $r['sustento_url'] = Archivos::url($r['sustento']);
        return $p->respuesta($filas, $total);
    }

    public function crearPermiso(array $d): array
    {
        BaseDatos::ejecutar('INSERT INTO permisos (idempleado, tipo, fecha_inicio, fecha_fin, motivo) VALUES (?,?,?,?,?)',
            [(int) $d['idempleado'], $d['tipo'], $d['fecha_inicio'], $d['fecha_fin'], $d['motivo']]);
        return BaseDatos::fila('SELECT * FROM permisos WHERE idpermiso = ?', [BaseDatos::ultimoId()]);
    }

    public function resolverPermiso(int $id, string $estado): void
    {
        if (!in_array($estado, ['aprobado', 'rechazado'], true)) throw new ErrorHttp('Estado no válido', 422);
        BaseDatos::ejecutar('UPDATE permisos SET estado = ? WHERE idpermiso = ? AND estado = \'pendiente\'', [$estado, $id]);
        Cache::invalidar('personal', 'asistencia');
    }

    public function sustentoPermiso(int $id): array
    {
        if (!BaseDatos::valor('SELECT 1 FROM permisos WHERE idpermiso = ?', [$id])) throw new ErrorHttp('Permiso no encontrado', 404);
        $ruta = Archivos::guardar('archivo', 'permisos', $id, 'sustento');
        BaseDatos::ejecutar('UPDATE permisos SET sustento = ? WHERE idpermiso = ?', [$ruta, $id]);
        return ['sustento' => $ruta, 'sustento_url' => Archivos::url($ruta)];
    }

    // ----------------------------- Resumen del trabajador -----------------------------
    public function resumen(int $id, int $anio, int $mes): array
    {
        $r = BaseDatos::procedimiento('sp_empleado_resumen_mes', [$id, $anio, $mes]);
        $resumen = $r[0][0] ?? throw new ErrorHttp('Empleado no encontrado', 404);
        $resumen['horario'] = $this->horarios($id);
        $resumen['asistencias'] = BaseDatos::filas(
            'SELECT fecha, TIME_FORMAT(hora_entrada, \'%H:%i\') AS hora_entrada, TIME_FORMAT(hora_salida, \'%H:%i\') AS hora_salida,
                    estado, horas_trabajadas, observacion
               FROM asistencias_empleado WHERE idempleado = ? AND YEAR(fecha) = ? AND MONTH(fecha) = ? ORDER BY fecha DESC',
            [$id, $anio, $mes]);
        $resumen['permisos'] = BaseDatos::filas(
            'SELECT idpermiso, tipo, fecha_inicio, fecha_fin, motivo, estado FROM permisos WHERE idempleado = ? ORDER BY fecha_solicitud DESC LIMIT 10', [$id]);
        return $resumen;
    }
}
