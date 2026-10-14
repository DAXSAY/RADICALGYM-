<?php
namespace Modulos\Fisioterapia;

use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class FisioterapiaControlador
{
    private FisioterapiaServicio $servicio;

    public function __construct()
    {
        $this->servicio = new FisioterapiaServicio();
    }

    public function tecnicas(Peticion $p): void
    {
        Respuesta::ok($this->servicio->tecnicas((string) $p->query('buscar', '')));
    }

    public function crearTecnica(Peticion $p): void
    {
        $d = $p->validar(['nombre']);
        Respuesta::creado($this->servicio->guardarTecnica(null, $d['nombre'], $d['descripcion'] ?? null));
    }

    public function actualizarTecnica(Peticion $p): void
    {
        $d = $p->validar(['nombre']);
        Respuesta::ok($this->servicio->guardarTecnica($p->id(), $d['nombre'], $d['descripcion'] ?? null));
    }

    public function eliminarTecnica(Peticion $p): void
    {
        Respuesta::ok(['mensaje' => $this->servicio->eliminarTecnica($p->id())]);
    }

    public function sesiones(Peticion $p): void
    {
        $idalumno = $p->idalumnoPermitido((int) $p->query('idalumno', 0));
        Respuesta::ok($this->servicio->sesiones($idalumno, (string) $p->query('buscar', ''), Paginacion::desdePeticion()));
    }

    public function sesion(Peticion $p): void
    {
        $solo = $p->rol() === 'alumno' ? (int) $p->usuario['idalumno'] : null;
        Respuesta::ok($this->servicio->sesion($p->id(), $solo));
    }

    public function crearSesion(Peticion $p): void
    {
        $d = $p->validar(['idalumno', 'motivo_consulta', 'zonas']);
        $d['idfisioterapeuta'] = $p->rol() === 'fisioterapeuta' ? $p->usuario['idempleado'] : ($d['idfisioterapeuta'] ?? $p->usuario['idempleado']);
        Respuesta::creado($this->servicio->crearSesion($d));
    }
}
