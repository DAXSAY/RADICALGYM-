<?php
namespace Modulos\Caja;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

/** Movimientos de caja: ingresos (generados por triggers) y egresos manuales. */
final class CajaControlador
{
    public function movimientos(Peticion $p): void
    {
        $pag = Paginacion::desdePeticion(15);
        $f = ['tipo' => $p->query('tipo', ''), 'desde' => $p->query('desde', date('Y-m-01')), 'hasta' => $p->query('hasta', date('Y-m-d'))];
        Respuesta::ok(Cache::recordar('caja', [$f, $pag->pagina, $pag->cantidad], function () use ($f, $pag) {
            $donde = 'FROM movimientos_caja WHERE DATE(fecha) BETWEEN ? AND ?';
            $params = [$f['desde'], $f['hasta']];
            if ($f['tipo'] !== '') { $donde .= ' AND tipo = ?'; $params[] = $f['tipo']; }
            [$filas, $total] = BaseDatos::paginar('*', $donde, $params, 'fecha DESC, idmovimiento DESC', $pag);
            return $pag->respuesta($filas, $total);
        }));
    }

    public function resumen(Peticion $p): void
    {
        $desde = (string) $p->query('desde', date('Y-m-01'));
        $hasta = (string) $p->query('hasta', date('Y-m-d'));
        Respuesta::ok(Cache::recordar('caja', ['resumen', $desde, $hasta], function () use ($desde, $hasta) {
            $filas = BaseDatos::procedimiento('sp_caja_resumen', [$desde, $hasta])[0] ?? [];
            $ingresos = array_sum(array_map(fn ($f) => $f['tipo'] === 'ingreso' ? (float) $f['total'] : 0, $filas));
            $egresos = array_sum(array_map(fn ($f) => $f['tipo'] === 'egreso' ? (float) $f['total'] : 0, $filas));
            return ['categorias' => $filas, 'ingresos' => $ingresos, 'egresos' => $egresos, 'balance' => $ingresos - $egresos];
        }));
    }

    /** Movimiento manual (ingreso o egreso) con todos los datos del formulario de finanzas. */
    public function movimiento(Peticion $p): void
    {
        $d = $p->validar(['tipo', 'categoria', 'monto', 'descripcion']);
        if ((float) $d['monto'] <= 0) throw new ErrorHttp('El monto debe ser mayor a cero', 422);
        BaseDatos::ejecutar('INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, metodo_pago, idalumno, nombre_relacionado, idempleado,
                               descuento_tardanza, equipo, detalle_averia, comentario, fecha)
                             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [
            $d['tipo'], $d['categoria'], (float) $d['monto'], $d['descripcion'], $d['metodo_pago'] ?? 'efectivo',
            ((int) ($d['idalumno'] ?? 0)) ?: null, ($d['nombre_relacionado'] ?? '') ?: null, ((int) ($d['idempleado'] ?? 0)) ?: null,
            ($d['descuento_tardanza'] ?? '') === '' ? null : (float) $d['descuento_tardanza'], ($d['equipo'] ?? '') ?: null,
            ($d['detalle_averia'] ?? '') ?: null, ($d['comentario'] ?? '') ?: null,
            ($d['fecha'] ?? '') ? $d['fecha'] . (strlen($d['fecha']) === 10 ? ' ' . date('H:i:s') : '') : date('Y-m-d H:i:s'),
        ]);
        Cache::invalidar('caja', 'panel');
        Respuesta::creado(BaseDatos::fila('SELECT * FROM movimientos_caja WHERE idmovimiento = ?', [BaseDatos::ultimoId()]));
    }

    /** Solo se eliminan movimientos manuales; los de matrículas, ventas y sueldos dependen de su origen. */
    public function eliminarMovimiento(Peticion $p): void
    {
        $m = BaseDatos::fila('SELECT categoria, idreferencia FROM movimientos_caja WHERE idmovimiento = ?', [$p->id()])
            ?? throw new ErrorHttp('Movimiento no encontrado', 404);
        if ($m['idreferencia'] && in_array($m['categoria'], ['matricula', 'venta', 'sueldo', 'spinning'], true)) {
            throw new ErrorHttp('Este movimiento se generó automáticamente; anula la matrícula, venta o pago de origen', 422);
        }
        BaseDatos::ejecutar('DELETE FROM movimientos_caja WHERE idmovimiento = ?', [$p->id()]);
        Cache::invalidar('caja', 'panel');
        Respuesta::ok(['mensaje' => 'Movimiento eliminado']);
    }

    /** Comprobante adjunto: uploads/movimientos_caja/{idmovimiento}_movimientos_caja_adjunto.ext */
    public function adjunto(Peticion $p): void
    {
        if (!BaseDatos::valor('SELECT 1 FROM movimientos_caja WHERE idmovimiento = ?', [$p->id()])) throw new ErrorHttp('Movimiento no encontrado', 404);
        $ruta = \Nucleo\Archivos::guardar('archivo', 'movimientos_caja', $p->id(), 'adjunto');
        BaseDatos::ejecutar('UPDATE movimientos_caja SET adjunto = ?, adjunto_nombre = ? WHERE idmovimiento = ?',
            [$ruta, $_FILES['archivo']['name'] ?? basename($ruta), $p->id()]);
        Cache::invalidar('caja');
        Respuesta::ok(['adjunto' => $ruta, 'adjunto_url' => \Nucleo\Archivos::url($ruta)]);
    }

    public function pagarPlanilla(Peticion $p): void
    {
        $d = $p->cuerpo();
        $n = BaseDatos::ejecutar("UPDATE planilla SET estado = 'pagado', metodo_pago = ?, comprobante = ?, fecha_pago = CURDATE()
                                   WHERE idplanilla = ? AND estado = 'pendiente'",
            [$d['metodo_pago'] ?? 'transferencia', ($d['comprobante'] ?? '') ?: null, $p->id()]);
        if (!$n) throw new ErrorHttp('El pago no existe o ya fue realizado', 422);
        Cache::invalidar('caja', 'panel', 'personal');
        Respuesta::ok(BaseDatos::fila('SELECT * FROM planilla WHERE idplanilla = ?', [$p->id()]));
    }

    public function crearPlanilla(Peticion $p): void
    {
        $d = $p->validar(['idcontrato', 'periodo']);
        BaseDatos::ejecutar('INSERT INTO planilla (idcontrato, periodo, sueldo_base, horas_trabajadas, tarifa_hora, bonificacion, descuentos)
                             VALUES (?,?,?,?,?,?,?)', [(int) $d['idcontrato'], $d['periodo'], (float) ($d['sueldo_base'] ?? 0),
            (float) ($d['horas_trabajadas'] ?? 0), (float) ($d['tarifa_hora'] ?? 0), (float) ($d['bonificacion'] ?? 0), (float) ($d['descuentos'] ?? 0)]);
        Cache::invalidar('caja', 'personal');
        Respuesta::creado(BaseDatos::fila('SELECT * FROM planilla WHERE idplanilla = ?', [BaseDatos::ultimoId()]));
    }

    public function egreso(Peticion $p): void
    {
        $d = $p->validar(['categoria', 'monto', 'descripcion']);
        if ((float) $d['monto'] <= 0) throw new ErrorHttp('El monto debe ser mayor a cero', 422);
        if (in_array($d['categoria'], ['matricula', 'venta'], true)) throw new ErrorHttp('Categoría reservada para ingresos', 422);
        BaseDatos::ejecutar("INSERT INTO movimientos_caja (tipo, categoria, monto, descripcion, fecha) VALUES ('egreso', ?, ?, ?, ?)",
            [$d['categoria'], (float) $d['monto'], $d['descripcion'], ($d['fecha'] ?? '') ?: date('Y-m-d H:i:s')]);
        Cache::invalidar('caja', 'panel');
        Respuesta::creado(BaseDatos::fila('SELECT * FROM movimientos_caja WHERE idmovimiento = ?', [BaseDatos::ultimoId()]));
    }
}
