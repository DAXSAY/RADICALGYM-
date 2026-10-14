<?php
namespace Modulos\Personal;

use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class PersonalControlador
{
    private PersonalServicio $servicio;

    public function __construct()
    {
        $this->servicio = new PersonalServicio();
    }

    /** Un trabajador que no es administrador solo puede ver su propia información. */
    private function idPermitido(Peticion $p, int $solicitado): int
    {
        if (in_array($p->rol(), ['administrador', 'recepcion'], true)) return $solicitado;
        return (int) $p->usuario['idempleado'];
    }

    public function listar(Peticion $p): void
    {
        $f = array_intersect_key($_GET, array_flip(['cargo', 'buscar']));
        Respuesta::ok($this->servicio->listar($f, Paginacion::desdePeticion()));
    }

    public function porCargo(Peticion $p): void
    {
        Respuesta::ok($this->servicio->porCargo((string) $p->query('cargo', '')));
    }

    public function obtener(Peticion $p): void
    {
        Respuesta::ok($this->servicio->obtener($this->idPermitido($p, $p->id())));
    }

    public function crear(Peticion $p): void
    {
        $d = $p->validar(['dni', 'nombres', 'apellidos', 'sexo', 'cargo']);
        if (!preg_match('/^\d{8}$/', $d['dni'])) throw new ErrorHttp('El DNI debe tener 8 dígitos', 422);
        Respuesta::creado($this->servicio->crear($d));
    }

    public function actualizar(Peticion $p): void
    {
        Respuesta::ok($this->servicio->actualizar($p->id(), $p->validar(['nombres', 'apellidos', 'sexo', 'cargo'])));
    }

    public function eliminar(Peticion $p): void
    {
        $this->servicio->desactivar($p->id());
        Respuesta::ok(['mensaje' => 'Empleado dado de baja']);
    }

    public function subirFoto(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarFoto($p->id()));
    }

    public function horarios(Peticion $p): void
    {
        Respuesta::ok($this->servicio->horarios($this->idPermitido($p, $p->id())));
    }

    public function guardarHorarios(Peticion $p): void
    {
        $bloques = $p->cuerpo()['bloques'] ?? null;
        if (!is_array($bloques)) throw new ErrorHttp('Envíe la lista "bloques"', 422);
        Respuesta::ok($this->servicio->guardarHorarios($p->id(), $bloques));
    }

    public function resumen(Peticion $p): void
    {
        Respuesta::ok($this->servicio->resumen(
            $this->idPermitido($p, $p->id()),
            (int) $p->query('anio', date('Y')),
            (int) $p->query('mes', date('n'))));
    }

    public function contratos(Peticion $p): void
    {
        $f = array_intersect_key($_GET, array_flip(['estado', 'idempleado']));
        if (!in_array($p->rol(), ['administrador', 'recepcion'], true)) $f['idempleado'] = $p->usuario['idempleado'];
        Respuesta::ok($this->servicio->contratos($f, Paginacion::desdePeticion()));
    }

    public function crearContrato(Peticion $p): void
    {
        Respuesta::creado($this->servicio->crearContrato(
            $p->validar(['idempleado', 'tipo', 'modalidad', 'fecha_inicio', 'horas_semanales'])));
    }

    public function documentoContrato(Peticion $p): void
    {
        Respuesta::ok($this->servicio->documentoContrato($p->id()));
    }

    public function permisos(Peticion $p): void
    {
        $f = array_intersect_key($_GET, array_flip(['estado', 'idempleado']));
        if (!in_array($p->rol(), ['administrador', 'recepcion'], true)) $f['idempleado'] = $p->usuario['idempleado'];
        Respuesta::ok($this->servicio->permisos($f, Paginacion::desdePeticion()));
    }

    public function crearPermiso(Peticion $p): void
    {
        $d = $p->validar(['tipo', 'fecha_inicio', 'fecha_fin', 'motivo']);
        $d['idempleado'] = $this->idPermitido($p, (int) ($d['idempleado'] ?? 0)) ?: $p->usuario['idempleado'];
        Respuesta::creado($this->servicio->crearPermiso($d));
    }

    public function resolverPermiso(Peticion $p): void
    {
        $this->servicio->resolverPermiso($p->id(), (string) $p->validar(['estado'])['estado']);
        Respuesta::ok(['mensaje' => 'Permiso actualizado']);
    }

    public function sustentoPermiso(Peticion $p): void
    {
        Respuesta::ok($this->servicio->sustentoPermiso($p->id()));
    }
}
