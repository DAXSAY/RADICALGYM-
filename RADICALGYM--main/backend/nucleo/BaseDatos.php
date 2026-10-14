<?php
namespace Nucleo;

use PDO;

/** Conexión PDO única y ayudantes para consultas SELECT y procedimientos almacenados. */
final class BaseDatos
{
    private static ?PDO $pdo = null;

    public static function conexion(): PDO
    {
        if (self::$pdo === null) {
            $c = Configuracion::obtener('bd');
            $dsn = "mysql:host={$c['host']};port={$c['puerto']};dbname={$c['nombre']};charset=utf8mb4";
            self::$pdo = new PDO($dsn, $c['usuario'], $c['clave'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
            self::$pdo->exec("SET time_zone = '-05:00'");
        }
        return self::$pdo;
    }

    /** Ejecuta un SELECT y devuelve todas las filas. */
    public static function filas(string $sql, array $parametros = []): array
    {
        $st = self::conexion()->prepare($sql);
        $st->execute($parametros);
        return $st->fetchAll();
    }

    /** Ejecuta un SELECT y devuelve la primera fila o null. */
    public static function fila(string $sql, array $parametros = []): ?array
    {
        $st = self::conexion()->prepare($sql);
        $st->execute($parametros);
        $fila = $st->fetch();
        return $fila === false ? null : $fila;
    }

    public static function valor(string $sql, array $parametros = []): mixed
    {
        $st = self::conexion()->prepare($sql);
        $st->execute($parametros);
        $v = $st->fetchColumn();
        return $v === false ? null : $v;
    }

    /** INSERT/UPDATE/DELETE. Devuelve filas afectadas. */
    public static function ejecutar(string $sql, array $parametros = []): int
    {
        $st = self::conexion()->prepare($sql);
        $st->execute($parametros);
        return $st->rowCount();
    }

    public static function ultimoId(): int
    {
        return (int) self::conexion()->lastInsertId();
    }

    /**
     * Llama a un procedimiento almacenado y devuelve todos sus conjuntos de resultados.
     * @return array<int, array<int, array>>
     */
    public static function procedimiento(string $nombre, array $parametros = []): array
    {
        $marcas = implode(',', array_fill(0, count($parametros), '?'));
        $st = self::conexion()->prepare("CALL {$nombre}({$marcas})");
        $st->execute(array_values($parametros));
        $resultados = [];
        do {
            if ($st->columnCount() > 0) {
                $resultados[] = $st->fetchAll();
            }
        } while ($st->nextRowset());
        $st->closeCursor();
        return $resultados;
    }

    /** Paginación genérica para un SELECT: devuelve [filas, total]. */
    public static function paginar(string $select, string $desdeDonde, array $parametros, string $orden, Paginacion $p): array
    {
        $total = (int) self::valor("SELECT COUNT(*) {$desdeDonde}", $parametros);
        $filas = self::filas("SELECT {$select} {$desdeDonde} ORDER BY {$orden} LIMIT {$p->cantidad} OFFSET {$p->desde}", $parametros);
        return [$filas, $total];
    }
}
