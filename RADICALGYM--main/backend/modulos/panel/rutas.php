<?php
use Modulos\Panel\PanelControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new PanelControlador();
    $e->get('/api/panel', [$c, 'resumen'], ['administrador', 'recepcion']);
};
