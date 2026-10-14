<?php
namespace Modulos\Alumnos;

use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class AlumnosControlador
{
    private AlumnosServicio $servicio;

    public function __construct()
    {
        $this->servicio = new AlumnosServicio();
    }

    public function listar(Peticion $p): void
    {
        $filtros = array_intersect_key($_GET, array_flip(['buscar', 'sexo', 'idplan', 'mes', 'idprograma', 'estado']));
        Respuesta::ok($this->servicio->listar($filtros, Paginacion::desdePeticion()));
    }

    public function opciones(Peticion $p): void
    {
        Respuesta::ok($this->servicio->opciones((string) $p->query('buscar', '')));
    }

    public function obtener(Peticion $p): void
    {
        $id = $p->idalumnoPermitido($p->id());
        Respuesta::ok($this->servicio->obtener($id));
    }

    public function crear(Peticion $p): void
    {
        $d = $p->validar(['dni', 'nombres', 'apellidos', 'sexo']);
        if (!preg_match('/^\d{8}$/', $d['dni'])) {
            throw new ErrorHttp('El DNI debe tener 8 dígitos', 422, ['dni' => 'Formato inválido']);
        }
        if (!in_array($d['sexo'], ['M', 'F', 'O'], true)) {
            throw new ErrorHttp('Sexo no válido', 422, ['sexo' => 'Use M, F u O']);
        }
        Respuesta::creado($this->servicio->crear($d));
    }

    public function actualizar(Peticion $p): void
    {
        Respuesta::ok($this->servicio->actualizar($p->id(), $p->cuerpo()));
    }

    public function eliminar(Peticion $p): void
    {
        $this->servicio->desactivar($p->id());
        Respuesta::ok(['mensaje' => 'Alumno dado de baja']);
    }

    public function subirFoto(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarFoto($p->id()));
    }

    public function matricular(Peticion $p): void
    {
        $d = $p->validar(['idalumno', 'idplan']);
        Respuesta::creado($this->servicio->matricular((int) $d['idalumno'], $d));
    }

    public function asignarEntrenador(Peticion $p): void
    {
        $this->servicio->asignarEntrenador($p->id(), (int) $p->entrada('identrenador', 0) ?: null);
        Respuesta::ok(['mensaje' => 'Entrenador asignado']);
    }

    public function estadoMatricula(Peticion $p): void
    {
        $d = $p->validar(['estado']);
        $this->servicio->cambiarEstadoMatricula($p->id(), $d['estado']);
        Respuesta::ok(['mensaje' => 'Matrícula actualizada']);
    }

    public function asistencias(Peticion $p): void
    {
        $id = $p->idalumnoPermitido($p->id());
        Respuesta::ok($this->servicio->asistencias($id, Paginacion::desdePeticion()));
    }
}
