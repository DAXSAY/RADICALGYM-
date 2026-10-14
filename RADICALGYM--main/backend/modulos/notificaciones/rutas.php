<?php
use Modulos\Notificaciones\NotificacionesControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new NotificacionesControlador();
    $gestion = ['administrador', 'recepcion'];
    $e->get('/api/notificaciones', [$c, 'listar']);
    $e->post('/api/notificaciones', [$c, 'crear'], $gestion);
    $e->post('/api/notificaciones/lote', [$c, 'lote'], $gestion);
    $e->post('/api/notificaciones/vencimientos', [$c, 'generarVencimientos'], $gestion);
    $e->delete('/api/notificaciones', [$c, 'limpiar'], ['administrador']);
    $e->put('/api/notificaciones/{id}/leida', [$c, 'marcarLeida']);
    $e->delete('/api/notificaciones/{id}', [$c, 'eliminar'], $gestion);
    $e->put('/api/reglas/{id}', [$c, 'actualizarRegla'], $gestion);
    $e->post('/api/clases', [$c, 'crearClase'], [...$gestion, 'entrenador']);
    $e->delete('/api/clases/{id}', [$c, 'eliminarClase'], [...$gestion, 'entrenador']);
};
