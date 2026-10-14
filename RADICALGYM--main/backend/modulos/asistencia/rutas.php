<?php
use Modulos\Asistencia\AsistenciaControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new AsistenciaControlador();
    $gestion = ['administrador', 'recepcion'];
    $e->get('/api/asistencias/alumnos', [$c, 'alumnos'], $gestion);
    $e->post('/api/asistencias/alumnos', [$c, 'registrarAlumno'], $gestion);
    $e->get('/api/asistencias/personal', [$c, 'personal'], $gestion);
    $e->post('/api/asistencias/personal', [$c, 'marcarPersonal'], Enrutador::PERSONAL);
    $e->post('/api/asistencias/personal/falta', [$c, 'falta'], $gestion);
    $e->post('/api/asistencias', fn (\Nucleo\Peticion $p) => \Nucleo\Respuesta::creado(
        (new \Modulos\Asistencia\AsistenciaServicio())->registrar($p->validar(['categoria', 'id']))), $gestion);
    $e->delete('/api/asistencias/{id}', function (\Nucleo\Peticion $p) {
        (new \Modulos\Asistencia\AsistenciaServicio())->eliminar((string) $p->parametros['id']);
        \Nucleo\Respuesta::ok(['mensaje' => 'Registro eliminado']);
    }, $gestion);
};
