<?php
namespace Nucleo;

final class Respuesta
{
    public static function json(mixed $datos, int $estado = 200): never
    {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Cache: ' . Cache::$estado);
        echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
        exit;
    }

    public static function ok(mixed $datos = null, int $estado = 200): never
    {
        // Las respuestas paginadas ya traen {datos, paginacion}
        if (is_array($datos) && array_key_exists('paginacion', $datos)) {
            self::json(['ok' => true] + $datos, $estado);
        }
        self::json(['ok' => true, 'datos' => $datos], $estado);
    }

    public static function creado(mixed $datos = null): never
    {
        self::ok($datos, 201);
    }

    public static function error(string $mensaje, int $estado = 400, array $errores = []): never
    {
        $cuerpo = ['ok' => false, 'mensaje' => $mensaje];
        if ($errores) $cuerpo['errores'] = $errores;
        self::json($cuerpo, $estado);
    }
}
