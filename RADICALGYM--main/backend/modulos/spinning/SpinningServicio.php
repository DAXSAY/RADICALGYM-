<?php
namespace Modulos\Spinning;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;

/** Salón de spinning: sesiones, reservas por bicicleta, mantenimiento y códigos de pase. */
final class SpinningServicio
{
    public function crearSesion(array $d): array
    {
        BaseDatos::ejecutar('INSERT INTO sesiones_spinning (titulo, idinstructor, fecha, hora_inicio, hora_fin, intensidad, genero_musical, capacidad, sala, precio_externo)
                             VALUES (?,?,?,?,?,?,?,?,?,?)', [
            $d['titulo'], (int) $d['idinstructor'], $d['fecha'], $d['hora_inicio'], $d['hora_fin'], $d['intensidad'] ?? 'alta',
            $d['genero_musical'] ?? null, (int) ($d['capacidad'] ?? 24), $d['sala'] ?? 'Studio Spinning', ($d['precio_externo'] ?? '') === '' ? null : (float) $d['precio_externo'],
        ]);
        Cache::invalidar('spinning');
        return BaseDatos::fila('SELECT * FROM sesiones_spinning WHERE idsesion_spinning = ?', [BaseDatos::ultimoId()]);
    }

    public function eliminarSesion(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM sesiones_spinning WHERE idsesion_spinning = ?', [$id]);
        Cache::invalidar('spinning');
    }

    public function reservar(array $d): array
    {
        $externo = !empty($d['es_externo']);
        BaseDatos::ejecutar('INSERT INTO reservas_spinning (idsesion_spinning, numero_bicicleta, idalumno, nombre, telefono, correo, calzado, notas, es_externo, monto, metodo_pago)
                             VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
            (int) $d['idsesion_spinning'], (int) $d['numero_bicicleta'], $externo ? null : ((int) ($d['idalumno'] ?? 0) ?: null),
            $d['nombre'], $d['telefono'] ?? null, $d['correo'] ?? null, $d['calzado'] ?? 'zapatilla_comun', $d['notas'] ?? null,
            $externo ? 1 : 0, (float) ($d['monto'] ?? 0), ($d['metodo_pago'] ?? '') ?: null,
        ]);
        Cache::invalidar('spinning', 'caja');
        return BaseDatos::fila('SELECT * FROM reservas_spinning WHERE idreserva_spinning = ?', [BaseDatos::ultimoId()]);
    }

    public function cancelar(int $id): void
    {
        BaseDatos::ejecutar('DELETE FROM reservas_spinning WHERE idreserva_spinning = ?', [$id]);
        Cache::invalidar('spinning');
    }

    public function checkin(int $id): void
    {
        BaseDatos::ejecutar("UPDATE reservas_spinning SET estado = 'asistio', hora_checkin = NOW() WHERE idreserva_spinning = ? AND estado = 'confirmada'", [$id]);
        Cache::invalidar('spinning');
    }

    public function mantenimiento(int $numero, ?string $notas): void
    {
        BaseDatos::ejecutar('UPDATE bicicletas_spinning SET notas = ? WHERE numero = ?', [($notas ?? '') === '' ? null : $notas, $numero]);
        Cache::invalidar('spinning');
    }

    public function generarCodigo(array $d): array
    {
        $prefijo = ($d['metodo_pago'] ?? '') === 'yape_plin' ? 'YAPE' : 'SPIN';
        // El frontend puede proponer el código que ya mostró al usuario
        $codigo = strtoupper(trim((string) ($d['codigo'] ?? '')));
        if (!preg_match('/^(YAPE|SPIN)-\d{4}$/', $codigo) || BaseDatos::valor('SELECT 1 FROM codigos_spinning WHERE codigo = ?', [$codigo])) {
            do {
                $codigo = $prefijo . '-' . random_int(1000, 9999);
            } while (BaseDatos::valor('SELECT 1 FROM codigos_spinning WHERE codigo = ?', [$codigo]));
        }
        BaseDatos::ejecutar('INSERT INTO codigos_spinning (codigo, idsesion_spinning, nombre, telefono, correo, idalumno, es_externo, monto, metodo_pago, emitido_por, notas)
                             VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
            $codigo, ((int) ($d['idsesion_spinning'] ?? 0)) ?: null, $d['nombre'], $d['telefono'] ?? null, $d['correo'] ?? null,
            ((int) ($d['idalumno'] ?? 0)) ?: null, !empty($d['es_externo']) ? 1 : 0, (float) ($d['monto'] ?? 0),
            $d['metodo_pago'] ?? 'yape_plin', $d['emitido_por'], $d['notas'] ?? null,
        ]);
        Cache::invalidar('spinning', 'caja');
        return BaseDatos::fila('SELECT * FROM codigos_spinning WHERE codigo = ?', [$codigo]);
    }

    /** Canjea un código: crea la reserva en la bicicleta elegida y marca el código como canjeado. */
    public function canjear(string $codigo, int $bicicleta, ?string $nombre, ?string $telefono): array
    {
        $c = BaseDatos::fila('SELECT * FROM codigos_spinning WHERE UPPER(codigo) = UPPER(?)', [trim($codigo)]);
        if (!$c) throw new ErrorHttp("El código \"{$codigo}\" no existe o es inválido", 422);
        if ($c['estado'] === 'canjeado') throw new ErrorHttp("El código ya fue canjeado el {$c['fecha_canje']}", 422);
        if ($c['estado'] === 'vencido') throw new ErrorHttp('El código ha expirado', 422);
        $sesion = $c['idsesion_spinning'] ?: BaseDatos::valor(
            'SELECT idsesion_spinning FROM sesiones_spinning WHERE fecha >= CURDATE() ORDER BY fecha, hora_inicio LIMIT 1');
        if (!$sesion) throw new ErrorHttp('No hay sesiones de spinning disponibles para canjear el pase', 422);

        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            BaseDatos::ejecutar('INSERT INTO reservas_spinning (idsesion_spinning, numero_bicicleta, idalumno, nombre, telefono, correo, es_externo, monto, metodo_pago, comprobante, codigo_usado, notas)
                                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [
                $sesion, $bicicleta, $c['idalumno'], ($nombre ?: $c['nombre']), ($telefono ?: $c['telefono']), $c['correo'], $c['es_externo'],
                $c['monto'], $c['metodo_pago'], 'REC-' . $c['codigo'], $c['codigo'], "Canjeado vía código {$c['codigo']}. Verificado por {$c['emitido_por']}.",
            ]);
            $id = BaseDatos::ultimoId();
            BaseDatos::ejecutar("UPDATE codigos_spinning SET estado = 'canjeado', fecha_canje = NOW(), bicicleta_canje = ? WHERE idcodigo_spinning = ?",
                [$bicicleta, $c['idcodigo_spinning']]);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('spinning');
        return BaseDatos::fila('SELECT * FROM reservas_spinning WHERE idreserva_spinning = ?', [$id]);
    }
}
