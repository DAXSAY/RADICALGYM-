<?php
use Modulos\Caja\CajaControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new CajaControlador();
    $admin = ['administrador'];
    $e->get('/api/caja/movimientos', [$c, 'movimientos'], $admin);
    $e->post('/api/caja/movimientos', [$c, 'movimiento'], $admin);
    $e->delete('/api/caja/movimientos/{id}', [$c, 'eliminarMovimiento'], $admin);
    $e->post('/api/caja/movimientos/{id}/adjunto', [$c, 'adjunto'], $admin);
    $e->get('/api/caja/resumen', [$c, 'resumen'], $admin);
    $e->post('/api/caja/egresos', [$c, 'egreso'], $admin);
    $e->post('/api/planilla', [$c, 'crearPlanilla'], $admin);
    $e->post('/api/planilla/{id}/pagar', [$c, 'pagarPlanilla'], $admin);
};
