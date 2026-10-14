<?php
namespace Nucleo;

final class Configuracion
{
    private static ?array $datos = null;

    public static function obtener(string $clave): mixed
    {
        if (self::$datos === null) {
            self::$datos = require __DIR__ . '/../config/configuracion.php';
        }
        return self::$datos[$clave] ?? null;
    }
}
