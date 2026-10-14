<?php
namespace Modulos\Asistencia;

use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class AsistenciaControlador
{
    private AsistenciaServicio $servicio;

    public function __construct()
    {
        $this->servicio = new AsistenciaServicio();
    }

    public function alumnos(Peticion $p): void
    {
        Respuesta::ok($this->servicio->alumnosDelDia(
            (string) $p->query('fecha', date('Y-m-d')), (string) $p->query('buscar', ''), Paginacion::desdePeticion()));
    }

    public function registrarAlumno(Peticion $p): void
    {
        Respuesta::creado($this->servicio->registrarAlumno((string) $p->validar(['valor'])['valor']));
    }

    public function personal(Peticion $p): void
    {
        Respuesta::ok($this->servicio->personalDelDia((string) $p->query('fecha', date('Y-m-d')), Paginacion::desdePeticion(20)));
    }

    public function marcarPersonal(Peticion $p): void
    {
        // Recepción y administración pueden marcar a cualquier trabajador; sin idempleado se marca a sí mismo
        $solicitado = (int) $p->entrada('idempleado', 0);
        $id = in_array($p->rol(), ['recepcion', 'administrador'], true) && $solicitado
            ? $solicitado
            : (int) $p->usuario['idempleado'];
        Respuesta::ok($this->servicio->marcarPersonal($id));
    }

    public function falta(Peticion $p): void
    {
        $d = $p->validar(['idempleado', 'fecha']);
        $this->servicio->registrarFalta((int) $d['idempleado'], $d['fecha'], $d['observacion'] ?? null);
        Respuesta::ok(['mensaje' => 'Falta registrada']);
    }
}
