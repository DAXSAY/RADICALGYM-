<?php
use Modulos\Datos\DatosServicio;
use Nucleo\Cache;
use Nucleo\Enrutador;
use Nucleo\Peticion;
use Nucleo\Respuesta;

return function (Enrutador $e): void {
    // Carga inicial del frontend, en caché Redis por usuario hasta la siguiente escritura
    $e->get('/api/datos', function (Peticion $p) {
        $clave = [$p->usuario['rol'], $p->usuario['idalumno'], $p->usuario['idempleado'], date('Y-m-d')];
        Respuesta::ok(Cache::recordar('datos', $clave, fn () => (new DatosServicio($p->usuario))->todo(), 300));
    });
};
