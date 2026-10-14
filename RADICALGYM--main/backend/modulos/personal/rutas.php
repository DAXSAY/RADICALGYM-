<?php
use Modulos\Personal\PersonalControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new PersonalControlador();
    $admin = ['administrador'];
    $gestion = ['administrador', 'recepcion'];
    $personal = Enrutador::PERSONAL;

    $e->get('/api/empleados', [$c, 'listar'], $gestion);
    $e->get('/api/empleados/opciones', [$c, 'porCargo'], $personal);
    $e->get('/api/empleados/{id}', [$c, 'obtener'], $personal);
    $e->post('/api/empleados', [$c, 'crear'], $admin);
    $e->put('/api/empleados/{id}', [$c, 'actualizar'], $admin);
    $e->delete('/api/empleados/{id}', [$c, 'eliminar'], $admin);
    $e->post('/api/empleados/{id}/foto', [$c, 'subirFoto'], $admin);
    $e->get('/api/empleados/{id}/horarios', [$c, 'horarios'], $personal);
    $e->put('/api/empleados/{id}/horarios', [$c, 'guardarHorarios'], $admin);
    $e->get('/api/empleados/{id}/resumen', [$c, 'resumen'], $personal);

    $e->get('/api/contratos', [$c, 'contratos'], $personal);
    $e->post('/api/contratos', [$c, 'crearContrato'], $admin);
    $e->post('/api/contratos/{id}/documento', [$c, 'documentoContrato'], $admin);
    $s = new \Modulos\Personal\PersonalServicio();
    $e->post('/api/contratos/completo', fn (\Nucleo\Peticion $p) => \Nucleo\Respuesta::creado(
        $s->crearContratoCompleto($p->validar(['nombre', 'cargo', 'tipo', 'modalidad', 'fecha_inicio']))), $admin);
    $e->put('/api/contratos/{id}', function (\Nucleo\Peticion $p) use ($s) { $s->actualizarContrato($p->id(), $p->cuerpo()); \Nucleo\Respuesta::ok(['mensaje' => 'Contrato actualizado']); }, $admin);
    $e->post('/api/contratos/{id}/renovar', function (\Nucleo\Peticion $p) use ($s) {
        $d = $p->validar(['tipo']);
        \Nucleo\Respuesta::creado($s->renovarContrato($p->id(), $d['tipo'], isset($d['sueldo_mensual']) ? (float) $d['sueldo_mensual'] : null));
    }, $admin);
    $e->delete('/api/contratos/{id}', function (\Nucleo\Peticion $p) use ($s) { $s->eliminarContrato($p->id()); \Nucleo\Respuesta::ok(['mensaje' => 'Contrato eliminado']); }, $admin);

    $e->get('/api/permisos', [$c, 'permisos'], $personal);
    $e->post('/api/permisos', [$c, 'crearPermiso'], $personal);
    $e->put('/api/permisos/{id}/estado', [$c, 'resolverPermiso'], $admin);
    $e->post('/api/permisos/{id}/sustento', [$c, 'sustentoPermiso'], $personal);
};
