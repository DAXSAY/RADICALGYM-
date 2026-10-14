<?php
namespace Nucleo;

/**
 * Tokens firmados (HMAC-SHA256, formato tipo JWT). La sesión se registra en
 * Redis para poder cerrarla; si Redis no está disponible basta la firma.
 */
final class Autenticacion
{
    public static function emitir(array $usuario): string
    {
        $cfg = Configuracion::obtener('token');
        $jti = bin2hex(random_bytes(12));
        $carga = [
            'idusuario'  => (int) $usuario['idusuario'],
            'usuario'    => $usuario['usuario'],
            'rol'        => $usuario['rol'],
            'idempleado' => $usuario['idempleado'] ? (int) $usuario['idempleado'] : null,
            'idalumno'   => $usuario['idalumno'] ? (int) $usuario['idalumno'] : null,
            'nombre'     => $usuario['nombre'] ?? $usuario['usuario'],
            'jti'        => $jti,
            'exp'        => time() + $cfg['horas'] * 3600,
        ];
        $cuerpo = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])) . '.' . self::b64(json_encode($carga));
        $firma = self::b64(hash_hmac('sha256', $cuerpo, $cfg['secreto'], true));

        $redis = ClienteRedis::instancia();
        $redis->guardar(Configuracion::obtener('redis')['prefijo'] . 'sesion:' . $jti, (string) $carga['idusuario'], $cfg['horas'] * 3600);
        return "{$cuerpo}.{$firma}";
    }

    public static function verificar(?string $cabecera): ?array
    {
        if (!$cabecera || !preg_match('/Bearer\s+(\S+)/', $cabecera, $m)) {
            return null;
        }
        $partes = explode('.', $m[1]);
        if (count($partes) !== 3) return null;
        [$h, $c, $f] = $partes;
        $esperada = self::b64(hash_hmac('sha256', "{$h}.{$c}", Configuracion::obtener('token')['secreto'], true));
        if (!hash_equals($esperada, $f)) return null;
        $carga = json_decode(self::desb64($c), true);
        if (!$carga || ($carga['exp'] ?? 0) < time()) return null;

        $redis = ClienteRedis::instancia();
        if ($redis->disponible() && $redis->obtener(Configuracion::obtener('redis')['prefijo'] . 'sesion:' . $carga['jti']) === null) {
            return null; // sesión cerrada
        }
        return $carga;
    }

    public static function cerrar(array $carga): void
    {
        ClienteRedis::instancia()->eliminar(Configuracion::obtener('redis')['prefijo'] . 'sesion:' . $carga['jti']);
    }

    private static function b64(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
    private static function desb64(string $s): string { return base64_decode(strtr($s, '-_', '+/')); }
}
