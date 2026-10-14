<?php
use Modulos\Planes\PlanesControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new PlanesControlador();
    $e->get('/api/planes', [$c, 'listar']);
    $e->post('/api/planes', [$c, 'crear'], ['administrador']);
    $e->put('/api/planes/{id}', [$c, 'actualizar'], ['administrador']);
    $e->delete('/api/planes/{id}', [$c, 'eliminar'], ['administrador']);

    $e->get('/api/programas', [$c, 'programas']);
    $e->post('/api/programas', [$c, 'crearPrograma'], ['administrador', 'entrenador']);
    $e->put('/api/programas/{id}', [$c, 'actualizarPrograma'], ['administrador', 'entrenador']);
};
