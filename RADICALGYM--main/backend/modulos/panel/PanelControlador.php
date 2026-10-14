<?php
namespace Modulos\Panel;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class PanelControlador
{
    public function resumen(Peticion $p): void
    {
        $datos = Cache::recordar('panel', date('Y-m-d H:i'), function () {
            BaseDatos::procedimiento('sp_estados_actualizar');
            [$indicadores, $meses] = BaseDatos::procedimiento('sp_panel_resumen');
            $vencimientos = BaseDatos::filas(
                "SELECT a.idalumno, CONCAT(a.nombres,' ',a.apellidos) AS alumno, a.telefono, p.nombre AS plan,
                        m.fecha_fin, DATEDIFF(m.fecha_fin, CURDATE()) AS dias
                   FROM matriculas m
                   JOIN alumnos a ON a.idalumno = m.idalumno
                   JOIN planes p ON p.idplan = m.idplan
                  WHERE m.estado = 'activa' AND m.fecha_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                  ORDER BY m.fecha_fin LIMIT 6");
            return ['indicadores' => $indicadores[0] ?? [], 'meses' => $meses, 'vencimientos' => $vencimientos];
        }, 60);
        Respuesta::ok($datos);
    }
}
