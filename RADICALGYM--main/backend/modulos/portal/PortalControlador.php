<?php
namespace Modulos\Portal;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\Peticion;
use Nucleo\Respuesta;

/** Datos propios del usuario que inicia sesión (alumno o trabajador). */
final class PortalControlador
{
    public function alumno(Peticion $p): void
    {
        $id = (int) $p->usuario['idalumno'];
        Respuesta::ok(Cache::recordar('alumnos', ['portal', $id], function () use ($id) {
            [$plan, $asistencia, $citas] = BaseDatos::procedimiento('sp_alumno_portal', [$id]);
            $ultimaMedida = BaseDatos::fila(
                'SELECT fecha, peso_kg, imc, clasificacion_imc, grasa_porcentaje, masa_muscular_kg FROM medidas
                  WHERE idalumno = ? ORDER BY fecha DESC LIMIT 1', [$id]);
            return [
                'plan' => $plan[0] ?? null,
                'asistencias_mes' => (int) ($asistencia[0]['asistencias_mes'] ?? 0),
                'proximas_citas' => $citas,
                'ultima_medida' => $ultimaMedida,
            ];
        }, 60));
    }
}
