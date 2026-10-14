<?php
namespace Nucleo;

/**
 * Cliente Redis mínimo (protocolo RESP) sobre sockets, para no depender
 * de la extensión phpredis. Compatible con Redis y Memurai.
 * Si Redis no está disponible, todas las operaciones devuelven null en silencio.
 */
final class ClienteRedis
{
    private static ?self $instancia = null;
    /** @var resource|null */
    private $socket = null;
    private bool $disponible = false;

    public static function instancia(): self
    {
        return self::$instancia ??= new self();
    }

    private function __construct()
    {
        $c = Configuracion::obtener('redis');
        $socket = @fsockopen($c['host'], $c['puerto'], $errno, $errstr, 0.3);
        if ($socket) {
            stream_set_timeout($socket, 1);
            $this->socket = $socket;
            $this->disponible = true;
        }
    }

    public function disponible(): bool
    {
        return $this->disponible;
    }

    public function comando(string ...$partes): mixed
    {
        if (!$this->disponible) {
            return null;
        }
        $msg = '*' . count($partes) . "\r\n";
        foreach ($partes as $p) {
            $msg .= '$' . strlen($p) . "\r\n" . $p . "\r\n";
        }
        if (@fwrite($this->socket, $msg) === false) {
            $this->disponible = false;
            return null;
        }
        return $this->leer();
    }

    private function leer(): mixed
    {
        $linea = fgets($this->socket);
        if ($linea === false) {
            $this->disponible = false;
            return null;
        }
        $tipo = $linea[0];
        $dato = substr($linea, 1, -2);
        switch ($tipo) {
            case '+': return $dato;
            case '-': return null;
            case ':': return (int) $dato;
            case '$':
                $largo = (int) $dato;
                if ($largo < 0) return null;
                $contenido = '';
                while (strlen($contenido) < $largo + 2) {
                    $contenido .= fread($this->socket, $largo + 2 - strlen($contenido));
                }
                return substr($contenido, 0, $largo);
            case '*':
                $n = (int) $dato;
                if ($n < 0) return null;
                $lista = [];
                for ($i = 0; $i < $n; $i++) $lista[] = $this->leer();
                return $lista;
        }
        return null;
    }

    public function obtener(string $clave): ?string { return $this->comando('GET', $clave); }
    public function guardar(string $clave, string $valor, int $ttl): void { $this->comando('SET', $clave, $valor, 'EX', (string) $ttl); }
    public function eliminar(string $clave): void { $this->comando('DEL', $clave); }
    public function incrementar(string $clave): ?int { return $this->comando('INCR', $clave); }
}
