<?php
namespace Modulos\Nutricion;

use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class NutricionControlador
{
    private NutricionServicio $servicio;

    public function __construct()
    {
        $this->servicio = new NutricionServicio();
    }

    public function alimentos(Peticion $p): void
    {
        Respuesta::ok($this->servicio->alimentos((string) $p->query('buscar', '')));
    }

    public function crearAlimento(Peticion $p): void
    {
        $d = $p->validar(['nombre', 'kcal_100g']);
        Respuesta::creado($this->servicio->crearAlimento($d['nombre'], (float) $d['kcal_100g']));
    }

    public function dietas(Peticion $p): void
    {
        $idalumno = $p->idalumnoPermitido((int) $p->query('idalumno', 0));
        Respuesta::ok($this->servicio->dietas($idalumno, (string) $p->query('buscar', ''), Paginacion::desdePeticion()));
    }

    public function dieta(Peticion $p): void
    {
        $solo = $p->rol() === 'alumno' ? (int) $p->usuario['idalumno'] : null;
        Respuesta::ok($this->servicio->dieta($p->id(), $solo));
    }

    public function dietaActiva(Peticion $p): void
    {
        Respuesta::ok($this->servicio->dietaActiva((int) $p->usuario['idalumno']));
    }

    public function crearDieta(Peticion $p): void
    {
        $d = $p->validar(['idalumno', 'titulo', 'objetivo', 'calorias_meta', 'comidas']);
        $d['idnutricionista'] = $p->rol() === 'nutricionista' ? $p->usuario['idempleado'] : ($d['idnutricionista'] ?? $p->usuario['idempleado']);
        Respuesta::creado($this->servicio->crearDieta($d));
    }

    public function eliminarDieta(Peticion $p): void
    {
        $this->servicio->eliminarDieta($p->id());
        Respuesta::ok(['mensaje' => 'Dieta eliminada']);
    }

    public function medidas(Peticion $p): void
    {
        $idalumno = $p->idalumnoPermitido((int) $p->query('idalumno', 0));
        Respuesta::ok($this->servicio->medidas($idalumno, Paginacion::desdePeticion()));
    }

    public function crearMedida(Peticion $p): void
    {
        $d = $p->validar(['idalumno', 'fecha', 'peso_kg', 'talla_cm', 'cintura', 'cadera']);
        if ((float) $d['talla_cm'] < 100 || (float) $d['talla_cm'] > 230) {
            throw new ErrorHttp('La talla debe estar en centímetros (100 - 230)', 422, ['talla_cm' => 'Fuera de rango']);
        }
        $d['idevaluador'] = $d['idevaluador'] ?? $p->usuario['idempleado'];
        Respuesta::creado($this->servicio->crearMedida($d));
    }

    public function eliminarMedida(Peticion $p): void
    {
        $this->servicio->eliminarMedida($p->id());
        Respuesta::ok(['mensaje' => 'Medida eliminada']);
    }
}
