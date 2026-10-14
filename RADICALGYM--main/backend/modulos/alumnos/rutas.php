<?php
use Modulos\Alumnos\AlumnosControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new AlumnosControlador();
    $gestion = ['administrador', 'recepcion'];
    $ver = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta'];

    $e->get('/api/alumnos', [$c, 'listar'], $ver);
    $e->get('/api/alumnos/opciones', [$c, 'opciones'], $ver);
    $e->get('/api/alumnos/{id}', [$c, 'obtener']);
    $e->get('/api/alumnos/{id}/asistencias', [$c, 'asistencias']);
    $e->post('/api/alumnos', [$c, 'crear'], $gestion);
    $e->put('/api/alumnos/{id}', [$c, 'actualizar'], [...$gestion, 'entrenador']);
    $e->delete('/api/alumnos/{id}', [$c, 'eliminar'], ['administrador']);
    $e->post('/api/alumnos/{id}/foto', [$c, 'subirFoto'], $gestion);
    $e->put('/api/alumnos/{id}/entrenador', [$c, 'asignarEntrenador'], [...$gestion, 'entrenador']);

    $e->post('/api/matriculas', [$c, 'matricular'], $gestion);
    $e->put('/api/matriculas/{id}/estado', [$c, 'estadoMatricula'], $gestion);
};
