<?php
use Modulos\Portal\PortalControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new PortalControlador();
    $e->get('/api/portal/alumno', [$c, 'alumno'], ['alumno']);
};
