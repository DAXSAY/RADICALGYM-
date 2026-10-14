<?php
use Modulos\Autenticacion\AutenticacionControlador;
use Nucleo\Enrutador;

return function (Enrutador $e): void {
    $c = new AutenticacionControlador();
    $e->post('/api/auth/ingresar', [$c, 'ingresar'], null);
    $e->get('/api/auth/yo', [$c, 'yo']);
    $e->post('/api/auth/salir', [$c, 'salir']);
    $e->get('/api/salud', [$c, 'salud'], null);
    $e->post('/api/usuarios', [$c, 'crearUsuario'], ['administrador']);
    $e->put('/api/auth/clave', [$c, 'cambiarClave']);
};
