<?php
use Modulos\Nutricion\NutricionControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new NutricionControlador();
    $nutri = ['administrador', 'nutricionista'];
    $ver = ['administrador', 'nutricionista', 'entrenador', 'alumno'];

    $e->get('/api/alimentos', [$c, 'alimentos'], $nutri);
    $e->post('/api/alimentos', [$c, 'crearAlimento'], $nutri);

    $e->get('/api/dietas', [$c, 'dietas'], $ver);
    $e->get('/api/dietas/activa', [$c, 'dietaActiva'], ['alumno']);
    $e->get('/api/dietas/{id}', [$c, 'dieta'], $ver);
    $e->post('/api/dietas', [$c, 'crearDieta'], $nutri);
    $e->delete('/api/dietas/{id}', [$c, 'eliminarDieta'], $nutri);
    $e->put('/api/dietas/{id}', fn (\Nucleo\Peticion $p) => \Nucleo\Respuesta::ok(
        (new \Modulos\Nutricion\NutricionServicio())->actualizarDieta($p->id(), $p->cuerpo())), $nutri);

    $e->get('/api/medidas', [$c, 'medidas'], $ver);
    $e->post('/api/medidas', [$c, 'crearMedida'], ['administrador', 'nutricionista', 'entrenador']);
    $e->delete('/api/medidas/{id}', [$c, 'eliminarMedida'], $nutri);
};
