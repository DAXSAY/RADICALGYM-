<?php
use Modulos\Citas\CitasControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new CitasControlador();
    $agenda = ['administrador', 'recepcion', 'nutricionista', 'fisioterapeuta'];
    $e->get('/api/citas', [$c, 'agenda'], $agenda);
    $e->get('/api/citas/horarios', [$c, 'horarios']);
    $e->post('/api/citas', [$c, 'crear'], $agenda);
    $e->put('/api/citas/{id}/estado', [$c, 'estado'], $agenda);
    $e->delete('/api/citas/{id}', function (\Nucleo\Peticion $p) {
        (new \Modulos\Citas\CitasServicio())->eliminar($p->id());
        \Nucleo\Respuesta::ok(['mensaje' => 'Cita eliminada']);
    }, $agenda);
    $e->get('/api/alumnos/{id}/citas', [$c, 'delAlumno']);
};
