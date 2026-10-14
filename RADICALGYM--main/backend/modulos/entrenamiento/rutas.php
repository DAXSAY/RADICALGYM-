<?php
use Modulos\Entrenamiento\EntrenamientoServicio;
use Nucleo\Enrutador;
use Nucleo\Peticion;
use Nucleo\Respuesta;

return function (Enrutador $e): void {
    $s = new EntrenamientoServicio();
    $admin = ['administrador'];
    $coach = ['administrador', 'entrenador'];

    $e->post('/api/entrenadores', fn (Peticion $p) => Respuesta::creado($s->guardarEntrenador(null, $p->validar(['nombre']))), $admin);
    $e->put('/api/entrenadores/{id}', fn (Peticion $p) => Respuesta::ok($s->guardarEntrenador($p->id(), $p->validar(['nombre']))), $admin);
    $e->delete('/api/entrenadores/{id}', function (Peticion $p) use ($s) { $s->desactivarEntrenador($p->id()); Respuesta::ok(['mensaje' => 'Entrenador retirado']); }, $admin);

    $e->post('/api/ejercicios', fn (Peticion $p) => Respuesta::creado($s->guardarEjercicio(null, $p->validar(['nombre', 'grupo_muscular', 'equipo', 'dificultad']))), $coach);
    $e->put('/api/ejercicios/{id}', fn (Peticion $p) => Respuesta::ok($s->guardarEjercicio($p->id(), $p->validar(['nombre', 'grupo_muscular', 'equipo', 'dificultad']))), $coach);
    $e->delete('/api/ejercicios/{id}', function (Peticion $p) use ($s) { $s->eliminarEjercicio($p->id()); Respuesta::ok(['mensaje' => 'Ejercicio eliminado']); }, $coach);

    $e->post('/api/rutinas', fn (Peticion $p) => Respuesta::creado($s->guardarRutina(null, $p->validar(['titulo', 'nivel', 'objetivo']))), $coach);
    $e->put('/api/rutinas/{id}', fn (Peticion $p) => Respuesta::ok($s->guardarRutina($p->id(), $p->validar(['titulo', 'nivel', 'objetivo']))), $coach);
    $e->delete('/api/rutinas/{id}', function (Peticion $p) use ($s) { $s->eliminarRutina($p->id()); Respuesta::ok(['mensaje' => 'Rutina eliminada']); }, $coach);
};
