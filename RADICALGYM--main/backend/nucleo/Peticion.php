<?php
namespace Nucleo;

/** Datos de la petición actual: cuerpo JSON, query string, parámetros de ruta y usuario autenticado. */
final class Peticion
{
    public array $parametros = [];
    public ?array $usuario = null;
    private ?array $cuerpo = null;

    public function __construct(public string $metodo, public string $ruta) {}

    public function cuerpo(): array
    {
        if ($this->cuerpo === null) {
            $tipo = $_SERVER['CONTENT_TYPE'] ?? '';
            if (str_contains($tipo, 'application/json')) {
                $this->cuerpo = json_decode(file_get_contents('php://input') ?: '[]', true) ?? [];
            } else {
                $this->cuerpo = $_POST;
            }
        }
        return $this->cuerpo;
    }

    public function entrada(string $clave, mixed $porDefecto = null): mixed
    {
        $v = $this->cuerpo()[$clave] ?? $porDefecto;
        return is_string($v) ? trim($v) : $v;
    }

    public function query(string $clave, mixed $porDefecto = null): mixed
    {
        $v = $_GET[$clave] ?? $porDefecto;
        return is_string($v) ? trim($v) : $v;
    }

    public function id(string $nombre = 'id'): int
    {
        return (int) ($this->parametros[$nombre] ?? 0);
    }

    public function rol(): string
    {
        return $this->usuario['rol'] ?? '';
    }

    /** Si quien consulta es alumno, solo puede ver sus propios datos. */
    public function idalumnoPermitido(?int $solicitado): ?int
    {
        if ($this->rol() === 'alumno') {
            return (int) $this->usuario['idalumno'];
        }
        return $solicitado ?: null;
    }

    /** Valida campos requeridos del cuerpo y devuelve el cuerpo. */
    public function validar(array $requeridos): array
    {
        $datos = $this->cuerpo();
        $errores = [];
        foreach ($requeridos as $campo) {
            if (!isset($datos[$campo]) || $datos[$campo] === '' || $datos[$campo] === null) {
                $errores[$campo] = 'Campo obligatorio';
            }
        }
        if ($errores) {
            throw new ErrorHttp('Faltan campos obligatorios', 422, $errores);
        }
        return $datos;
    }
}
