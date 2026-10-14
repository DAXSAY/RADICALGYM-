<?php
namespace Nucleo;

final class Paginacion
{
    public function __construct(public int $pagina, public int $cantidad, public int $desde) {}

    public static function desdePeticion(int $porDefecto = 10): self
    {
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $cantidad = min(50, max(1, (int) ($_GET['por_pagina'] ?? $porDefecto)));
        return new self($pagina, $cantidad, ($pagina - 1) * $cantidad);
    }

    /** Estructura estándar de respuesta paginada. */
    public function respuesta(array $filas, int $total): array
    {
        return [
            'datos' => $filas,
            'paginacion' => [
                'pagina' => $this->pagina,
                'por_pagina' => $this->cantidad,
                'total' => $total,
                'total_paginas' => max(1, (int) ceil($total / $this->cantidad)),
            ],
        ];
    }
}
