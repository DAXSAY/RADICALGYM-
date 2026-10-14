<?php
namespace Modulos\Ventas;

use Nucleo\Archivos;
use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;

/** Productos (con carpeta propia de imágenes) y ventas. */
final class VentasServicio
{
    public function productos(array $f, Paginacion $p): array
    {
        return Cache::recordar('ventas', ['productos', $f, $p->pagina, $p->cantidad], function () use ($f, $p) {
            $donde = 'FROM productos WHERE activo = 1';
            $params = [];
            if (!empty($f['categoria'])) { $donde .= ' AND categoria = ?'; $params[] = $f['categoria']; }
            if (!empty($f['buscar'])) { $donde .= ' AND nombre LIKE ?'; $params[] = '%' . $f['buscar'] . '%'; }
            if (!empty($f['stock_bajo'])) { $donde .= ' AND stock <= stock_minimo'; }
            [$filas, $total] = BaseDatos::paginar('*', $donde, $params, 'categoria, nombre', $p);
            foreach ($filas as &$x) $x['imagen_url'] = Archivos::url($x['imagen']);
            return $p->respuesta($filas, $total);
        });
    }

    public function guardarProducto(?int $id, array $d): array
    {
        $v = [$d['nombre'], $d['categoria'], (float) $d['precio_compra'], (float) $d['precio_venta'],
            (int) ($d['stock'] ?? 0), (int) ($d['stock_minimo'] ?? 5), ($d['marca'] ?? '') ?: null,
            ($d['codigo_barras'] ?? '') ?: null, ($d['descripcion'] ?? '') ?: null];
        if ($v[3] < $v[2]) throw new ErrorHttp('El precio de venta no puede ser menor al de compra', 422);
        if ($id) {
            BaseDatos::ejecutar('UPDATE productos SET nombre=?, categoria=?, precio_compra=?, precio_venta=?, stock=?, stock_minimo=?,
                                 marca=?, codigo_barras=?, descripcion=? WHERE idproducto=?', [...$v, $id]);
        } else {
            BaseDatos::ejecutar('INSERT INTO productos (nombre, categoria, precio_compra, precio_venta, stock, stock_minimo, marca, codigo_barras, descripcion)
                                 VALUES (?,?,?,?,?,?,?,?,?)', $v);
            $id = BaseDatos::ultimoId();
        }
        // Imagen por URL externa (la subida de archivo usa /imagen)
        if (!empty($d['imagen']) && preg_match('#^https?://#', $d['imagen'])) {
            BaseDatos::ejecutar('UPDATE productos SET imagen = ? WHERE idproducto = ?', [$d['imagen'], $id]);
        }
        Cache::invalidar('ventas', 'panel', 'notificaciones');
        return $this->producto($id);
    }

    public function producto(int $id): array
    {
        $x = BaseDatos::fila('SELECT * FROM productos WHERE idproducto = ?', [$id]) ?? throw new ErrorHttp('Producto no encontrado', 404);
        $x['imagen_url'] = Archivos::url($x['imagen']);
        return $x;
    }

    /** Imagen en uploads/productos con nombre {idproducto}_productos_{nombreproducto}.ext */
    public function guardarImagen(int $id): array
    {
        $prod = $this->producto($id);
        if ($prod['imagen'] && !preg_match('#^https?://#', $prod['imagen'])) @unlink(\Nucleo\Configuracion::obtener('subidas')['carpeta'] . '/' . $prod['imagen']);
        $ruta = Archivos::guardar('archivo', 'productos', $id, $prod['nombre'], ['jpg', 'jpeg', 'png', 'webp']);
        BaseDatos::ejecutar('UPDATE productos SET imagen = ? WHERE idproducto = ?', [$ruta, $id]);
        Cache::invalidar('ventas');
        return ['imagen' => $ruta, 'imagen_url' => Archivos::url($ruta)];
    }

    public function ajustarStock(int $id, int $stock): void
    {
        BaseDatos::ejecutar('UPDATE productos SET stock = ? WHERE idproducto = ?', [max(0, $stock), $id]);
        Cache::invalidar('ventas', 'panel', 'notificaciones');
    }

    public function desactivarProducto(int $id): void
    {
        BaseDatos::ejecutar('UPDATE productos SET activo = 0 WHERE idproducto = ?', [$id]);
        Cache::invalidar('ventas');
    }

    public function ventas(array $f, Paginacion $p): array
    {
        $donde = 'FROM ventas v JOIN empleados e ON e.idempleado = v.idempleado LEFT JOIN alumnos a ON a.idalumno = v.idalumno WHERE 1=1';
        $params = [];
        if (!empty($f['fecha'])) { $donde .= ' AND DATE(v.fecha) = ?'; $params[] = $f['fecha']; }
        [$filas, $total] = BaseDatos::paginar(
            "v.idventa, v.comprobante, v.fecha, v.metodo_pago, v.total, CONCAT(e.nombres,' ',e.apellidos) AS vendedor,
             IFNULL(CONCAT(a.nombres,' ',a.apellidos), 'Cliente general') AS cliente,
             (SELECT SUM(cantidad) FROM venta_detalle d WHERE d.idventa = v.idventa) AS unidades",
            $donde, $params, 'v.fecha DESC', $p);
        return $p->respuesta($filas, $total);
    }

    public function venta(int $id): array
    {
        $v = BaseDatos::fila('SELECT * FROM ventas WHERE idventa = ?', [$id]) ?? throw new ErrorHttp('Venta no encontrada', 404);
        $v['detalle'] = BaseDatos::filas(
            'SELECT d.idproducto, p.nombre, d.cantidad, d.precio_unitario, d.subtotal
               FROM venta_detalle d JOIN productos p ON p.idproducto = d.idproducto WHERE d.idventa = ?', [$id]);
        return $v;
    }

    public function registrar(int $idempleado, ?int $idalumno, string $metodo, array $items): array
    {
        $items = array_values(array_filter(array_map(fn ($i) => [
            'idproducto' => (int) ($i['idproducto'] ?? 0), 'cantidad' => (int) ($i['cantidad'] ?? 0),
        ], $items), fn ($i) => $i['idproducto'] > 0 && $i['cantidad'] > 0));
        $r = BaseDatos::procedimiento('sp_venta_registrar', [$idempleado, $idalumno ?: 0, $metodo, json_encode($items)]);
        Cache::invalidar('ventas', 'panel', 'caja', 'notificaciones');
        return $r[0][0];
    }
}
