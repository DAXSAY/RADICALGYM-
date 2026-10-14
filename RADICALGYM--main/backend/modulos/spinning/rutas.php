<?php
use Modulos\Spinning\SpinningServicio;
use Nucleo\Enrutador;
use Nucleo\Peticion;
use Nucleo\Respuesta;

return function (Enrutador $e): void {
    $s = new SpinningServicio();
    $gestion = ['administrador', 'recepcion', 'entrenador'];

    $e->post('/api/spinning/sesiones', fn (Peticion $p) => Respuesta::creado($s->crearSesion(
        $p->validar(['titulo', 'idinstructor', 'fecha', 'hora_inicio', 'hora_fin']))), $gestion);
    $e->delete('/api/spinning/sesiones/{id}', function (Peticion $p) use ($s) { $s->eliminarSesion($p->id()); Respuesta::ok(['mensaje' => 'Sesión eliminada']); }, $gestion);

    // Los alumnos pueden reservar su propia bicicleta
    $e->post('/api/spinning/reservas', function (Peticion $p) use ($s) {
        $d = $p->validar(['idsesion_spinning', 'numero_bicicleta', 'nombre']);
        if ($p->rol() === 'alumno') {
            $d['idalumno'] = $p->usuario['idalumno'];
            $d['es_externo'] = 0;
            $d['monto'] = 0;
        }
        Respuesta::creado($s->reservar($d));
    });
    $e->delete('/api/spinning/reservas/{id}', function (Peticion $p) use ($s) { $s->cancelar($p->id()); Respuesta::ok(['mensaje' => 'Reserva cancelada']); }, $gestion);
    $e->put('/api/spinning/reservas/{id}/checkin', function (Peticion $p) use ($s) { $s->checkin($p->id()); Respuesta::ok(['mensaje' => 'Ingreso confirmado']); }, $gestion);
    $e->put('/api/spinning/bicicletas/{id}/mantenimiento', function (Peticion $p) use ($s) {
        $s->mantenimiento($p->id(), $p->entrada('notas'));
        Respuesta::ok(['mensaje' => 'Bicicleta actualizada']);
    }, $gestion);

    $e->post('/api/spinning/codigos', fn (Peticion $p) => Respuesta::creado($s->generarCodigo($p->validar(['nombre', 'metodo_pago', 'emitido_por']))), $gestion);
    $e->post('/api/spinning/codigos/canjear', function (Peticion $p) use ($s) {
        $d = $p->validar(['codigo', 'numero_bicicleta']);
        Respuesta::creado($s->canjear($d['codigo'], (int) $d['numero_bicicleta'], $d['nombre'] ?? null, $d['telefono'] ?? null));
    });
};
