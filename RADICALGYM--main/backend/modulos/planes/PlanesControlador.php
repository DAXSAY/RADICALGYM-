<?php
namespace Modulos\Planes;

use Nucleo\Peticion;
use Nucleo\Respuesta;

final class PlanesControlador
{
    private PlanesServicio $servicio;

    public function __construct()
    {
        $this->servicio = new PlanesServicio();
    }

    public function listar(Peticion $p): void
    {
        Respuesta::ok($this->servicio->planes($p->query('todos') !== '1'));
    }

    public function crear(Peticion $p): void
    {
        Respuesta::creado($this->servicio->guardarPlan(null, $p->validar(['nombre', 'precio']) + ['duracion_meses' => 0]));
    }

    public function actualizar(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarPlan($p->id(), $p->validar(['nombre', 'precio']) + ['duracion_meses' => 0]));
    }

    public function eliminar(Peticion $p): void
    {
        $this->servicio->desactivarPlan($p->id());
        Respuesta::ok(['mensaje' => 'Plan desactivado']);
    }

    public function programas(Peticion $p): void
    {
        Respuesta::ok($this->servicio->programas());
    }

    public function crearPrograma(Peticion $p): void
    {
        Respuesta::creado($this->servicio->guardarPrograma(null, $p->validar(['nombre', 'objetivo', 'nivel'])));
    }

    public function actualizarPrograma(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarPrograma($p->id(), $p->validar(['nombre', 'objetivo', 'nivel'])));
    }
}
