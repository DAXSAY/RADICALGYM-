<?php
use Modulos\Fisioterapia\FisioterapiaControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new FisioterapiaControlador();
    $fisio = ['administrador', 'fisioterapeuta'];
    $ver = ['administrador', 'fisioterapeuta', 'entrenador', 'alumno'];

    $e->get('/api/tecnicas', [$c, 'tecnicas'], $fisio);
    $e->post('/api/tecnicas', [$c, 'crearTecnica'], $fisio);
    $e->put('/api/tecnicas/{id}', [$c, 'actualizarTecnica'], $fisio);
    $e->delete('/api/tecnicas/{id}', [$c, 'eliminarTecnica'], $fisio);

    $e->get('/api/fisioterapia/sesiones', [$c, 'sesiones'], $ver);
    $e->get('/api/fisioterapia/sesiones/{id}', [$c, 'sesion'], $ver);
    $e->post('/api/fisioterapia/sesiones', [$c, 'crearSesion'], $fisio);
    $e->delete('/api/fisioterapia/sesiones/{id}', function (\Nucleo\Peticion $p) {
        (new \Modulos\Fisioterapia\FisioterapiaServicio())->eliminarSesion($p->id());
        \Nucleo\Respuesta::ok(['mensaje' => 'Sesión eliminada']);
    }, $fisio);
};
