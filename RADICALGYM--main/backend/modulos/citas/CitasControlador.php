<?php
namespace Modulos\Citas;

use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class CitasControlador
{
    private CitasServicio $servicio;

    public function __construct()
    {
        $this->servicio = new CitasServicio();
    }

    public function agenda(Peticion $p): void
    {
        $servicio = (string) $p->query('servicio', '');
        $idempleado = (int) $p->query('idempleado', 0);
        // Nutricionista y fisioterapeuta ven su propia agenda
        if (in_array($p->rol(), ['nutricionista', 'fisioterapeuta'], true)) {
            $idempleado = (int) $p->usuario['idempleado'];
            $servicio = $p->rol() === 'nutricionista' ? 'nutricion' : 'fisioterapia';
        }
        Respuesta::ok($this->servicio->agenda($servicio, $idempleado, (string) $p->query('fecha', date('Y-m-d'))));
    }

    public function horarios(Peticion $p): void
    {
        Respuesta::ok($this->servicio->horarios((string) $p->query('servicio', 'nutricion')));
    }

    public function crear(Peticion $p): void
    {
        Respuesta::creado($this->servicio->crear($p->validar(['servicio', 'idalumno', 'idempleado', 'fecha', 'hora_inicio'])));
    }

    public function estado(Peticion $p): void
    {
        $this->servicio->cambiarEstado($p->id(), (string) $p->validar(['estado'])['estado']);
        Respuesta::ok(['mensaje' => 'Cita actualizada']);
    }

    public function delAlumno(Peticion $p): void
    {
        $id = $p->idalumnoPermitido($p->id());
        Respuesta::ok($this->servicio->delAlumno($id, Paginacion::desdePeticion()));
    }
}
