<?php
namespace Modulos\Ventas;

use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class VentasControlador
{
    private VentasServicio $servicio;

    public function __construct()
    {
        $this->servicio = new VentasServicio();
    }

    public function productos(Peticion $p): void
    {
        $f = array_intersect_key($_GET, array_flip(['categoria', 'buscar', 'stock_bajo']));
        Respuesta::ok($this->servicio->productos($f, Paginacion::desdePeticion(12)));
    }

    public function crearProducto(Peticion $p): void
    {
        Respuesta::creado($this->servicio->guardarProducto(null, $p->validar(['nombre', 'categoria', 'precio_compra', 'precio_venta'])));
    }

    public function actualizarProducto(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarProducto($p->id(), $p->validar(['nombre', 'categoria', 'precio_compra', 'precio_venta'])));
    }

    public function imagenProducto(Peticion $p): void
    {
        Respuesta::ok($this->servicio->guardarImagen($p->id()));
    }

    public function eliminarProducto(Peticion $p): void
    {
        $this->servicio->desactivarProducto($p->id());
        Respuesta::ok(['mensaje' => 'Producto retirado']);
    }

    public function ventas(Peticion $p): void
    {
        Respuesta::ok($this->servicio->ventas(['fecha' => $p->query('fecha')], Paginacion::desdePeticion()));
    }

    public function venta(Peticion $p): void
    {
        Respuesta::ok($this->servicio->venta($p->id()));
    }

    public function registrar(Peticion $p): void
    {
        $d = $p->validar(['metodo_pago', 'items']);
        if (!is_array($d['items'])) throw new ErrorHttp('Lista de productos inválida', 422);
        Respuesta::creado($this->servicio->registrar(
            (int) $p->usuario['idempleado'], (int) ($d['idalumno'] ?? 0) ?: null, $d['metodo_pago'], $d['items']));
    }
}
