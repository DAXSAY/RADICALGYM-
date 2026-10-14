<?php
use Modulos\Ventas\VentasControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new VentasControlador();
    $caja = ['administrador', 'recepcion'];

    $e->get('/api/productos', [$c, 'productos'], $caja);
    $e->post('/api/productos', [$c, 'crearProducto'], ['administrador']);
    $e->put('/api/productos/{id}', [$c, 'actualizarProducto'], ['administrador']);
    $e->delete('/api/productos/{id}', [$c, 'eliminarProducto'], ['administrador']);
    $e->post('/api/productos/{id}/imagen', [$c, 'imagenProducto'], ['administrador']);
    $e->put('/api/productos/{id}/stock', function (\Nucleo\Peticion $p) {
        (new \Modulos\Ventas\VentasServicio())->ajustarStock($p->id(), (int) $p->validar(['stock'])['stock']);
        \Nucleo\Respuesta::ok(['mensaje' => 'Stock actualizado']);
    }, $caja);

    $e->get('/api/ventas', [$c, 'ventas'], $caja);
    $e->get('/api/ventas/{id}', [$c, 'venta'], $caja);
    $e->post('/api/ventas', [$c, 'registrar'], $caja);
};
