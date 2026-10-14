<?php
namespace Nucleo;

/**
 * Caché de consultas sobre Redis con invalidación por módulo.
 * Cada módulo tiene un número de versión (rg:ver:{modulo}); al escribir se
 * incrementa y todas las claves anteriores del módulo quedan obsoletas.
 */
final class Cache
{
    public static string $estado = 'OFF';

    public static function recordar(string $modulo, mixed $clave, callable $calcular, ?int $ttl = null): mixed
    {
        $redis = ClienteRedis::instancia();
        if (!$redis->disponible()) {
            self::$estado = 'OFF';
            return $calcular();
        }
        $cfg = Configuracion::obtener('redis');
        $version = $redis->obtener($cfg['prefijo'] . 'ver:' . $modulo) ?? '0';
        $llave = $cfg['prefijo'] . "cache:{$modulo}:v{$version}:" . md5(json_encode($clave));

        $guardado = $redis->obtener($llave);
        if ($guardado !== null) {
            self::$estado = 'HIT';
            return json_decode($guardado, true);
        }
        $valor = $calcular();
        $redis->guardar($llave, json_encode($valor, JSON_UNESCAPED_UNICODE), $ttl ?? $cfg['ttl']);
        self::$estado = 'MISS';
        return $valor;
    }

    /** Invalida la caché de uno o varios módulos. */
    public static function invalidar(string ...$modulos): void
    {
        $redis = ClienteRedis::instancia();
        $prefijo = Configuracion::obtener('redis')['prefijo'];
        // Toda escritura invalida también la carga inicial de datos del frontend
        foreach (array_unique([...$modulos, 'datos']) as $m) {
            $redis->incrementar($prefijo . 'ver:' . $m);
        }
    }
}
