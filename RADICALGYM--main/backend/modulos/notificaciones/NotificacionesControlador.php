<?php
namespace Modulos\Notificaciones;

use Nucleo\BaseDatos;
use Nucleo\Cache;
use Nucleo\ErrorHttp;
use Nucleo\Paginacion;
use Nucleo\Peticion;
use Nucleo\Respuesta;

final class NotificacionesControlador
{
    /** Cada rol ve solo las notificaciones dirigidas a su público. */
    public function listar(Peticion $p): void
    {
        $pag = Paginacion::desdePeticion();
        if ($p->rol() === 'alumno') {
            $donde = "FROM notificaciones n WHERE (n.destino IN ('todos','alumnos') OR (n.destino = 'alumno' AND n.idalumno = ?))";
            $params = [(int) $p->usuario['idalumno']];
        } elseif ($p->rol() === 'administrador' || $p->rol() === 'recepcion') {
            $donde = 'FROM notificaciones n WHERE 1=1';
            $params = [];
            if ($p->query('destino')) { $donde .= ' AND n.destino = ?'; $params[] = $p->query('destino'); }
        } else {
            $donde = "FROM notificaciones n WHERE n.destino IN ('todos','personal')";
            $params = [];
        }
        $clave = [$p->rol(), $params, $p->query('destino'), $pag->pagina, $pag->cantidad];
        Respuesta::ok(Cache::recordar('notificaciones', $clave, function () use ($donde, $params, $pag) {
            [$filas, $total] = BaseDatos::paginar(
                "n.*, (SELECT CONCAT(a.nombres,' ',a.apellidos) FROM alumnos a WHERE a.idalumno = n.idalumno) AS alumno",
                $donde, $params, 'n.fecha DESC', $pag);
            return $pag->respuesta($filas, $total);
        }));
    }

    public function crear(Peticion $p): void
    {
        $d = $p->validar(['titulo', 'mensaje', 'destino']);
        if ($d['destino'] === 'alumno' && empty($d['idalumno'])) throw new ErrorHttp('Selecciona el alumno', 422);
        $this->insertar($d);
        Cache::invalidar('notificaciones');
        Respuesta::creado(BaseDatos::fila('SELECT * FROM notificaciones WHERE idnotificacion = ?', [BaseDatos::ultimoId()]));
    }

    private function insertar(array $d): void
    {
        BaseDatos::ejecutar('INSERT INTO notificaciones (titulo, mensaje, destino, idalumno, tipo, canal, estado_envio,
                               destinatario_nombre, destinatario_correo, destinatario_telefono, publico) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [
            $d['titulo'], $d['mensaje'], $d['destino'], $d['destino'] === 'alumno' ? (int) $d['idalumno'] : null, $d['tipo'] ?? 'aviso',
            $d['canal'] ?? 'push', $d['estado_envio'] ?? 'entregado', ($d['destinatario_nombre'] ?? '') ?: null,
            ($d['destinatario_correo'] ?? '') ?: null, ($d['destinatario_telefono'] ?? '') ?: null, ($d['publico'] ?? '') ?: null,
        ]);
    }

    /** Campaña: varias notificaciones en una sola transacción. */
    public function lote(Peticion $p): void
    {
        $lista = $p->cuerpo()['notificaciones'] ?? null;
        if (!is_array($lista) || !$lista) throw new ErrorHttp('Envíe la lista "notificaciones"', 422);
        if (count($lista) > 2000) throw new ErrorHttp('Máximo 2000 notificaciones por campaña', 422);
        $pdo = BaseDatos::conexion();
        $pdo->beginTransaction();
        try {
            foreach ($lista as $n) $this->insertar($n + ['destino' => 'todos']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
        Cache::invalidar('notificaciones');
        Respuesta::creado(['enviadas' => count($lista)]);
    }

    public function limpiar(Peticion $p): void
    {
        BaseDatos::ejecutar('DELETE FROM notificaciones');
        Cache::invalidar('notificaciones');
        Respuesta::ok(['mensaje' => 'Historial de notificaciones vaciado']);
    }

    public function actualizarRegla(Peticion $p): void
    {
        $d = $p->cuerpo();
        $campos = ['nombre', 'categoria', 'activa', 'canales', 'momento', 'dias', 'titulo_plantilla', 'cuerpo_plantilla', 'etiqueta'];
        $sets = [];
        $valores = [];
        foreach ($campos as $c) {
            if (array_key_exists($c, $d)) { $sets[] = "{$c} = ?"; $valores[] = is_bool($d[$c]) ? (int) $d[$c] : $d[$c]; }
        }
        if (!$sets) throw new ErrorHttp('Nada que actualizar', 422);
        BaseDatos::ejecutar('UPDATE reglas_notificacion SET ' . implode(', ', $sets) . ' WHERE idregla = ?', [...$valores, $p->id()]);
        Cache::invalidar('notificaciones');
        Respuesta::ok(BaseDatos::fila('SELECT * FROM reglas_notificacion WHERE idregla = ?', [$p->id()]));
    }

    public function crearClase(Peticion $p): void
    {
        $d = $p->validar(['nombre', 'instructor', 'horario', 'sala', 'fecha']);
        BaseDatos::ejecutar('INSERT INTO clases (nombre, instructor, horario, sala, inscritos, capacidad, fecha) VALUES (?,?,?,?,?,?,?)',
            [$d['nombre'], $d['instructor'], $d['horario'], $d['sala'], (int) ($d['inscritos'] ?? 0), (int) ($d['capacidad'] ?? 20), $d['fecha']]);
        Cache::invalidar('notificaciones');
        Respuesta::creado(BaseDatos::fila('SELECT * FROM clases WHERE idclase = ?', [BaseDatos::ultimoId()]));
    }

    public function eliminarClase(Peticion $p): void
    {
        BaseDatos::ejecutar('DELETE FROM clases WHERE idclase = ?', [$p->id()]);
        Cache::invalidar('notificaciones');
        Respuesta::ok(['mensaje' => 'Clase eliminada']);
    }

    public function marcarLeida(Peticion $p): void
    {
        BaseDatos::ejecutar('UPDATE notificaciones SET leida = 1 WHERE idnotificacion = ?', [$p->id()]);
        Cache::invalidar('notificaciones');
        Respuesta::ok(['mensaje' => 'Marcada como leída']);
    }

    public function eliminar(Peticion $p): void
    {
        BaseDatos::ejecutar('DELETE FROM notificaciones WHERE idnotificacion = ?', [$p->id()]);
        Cache::invalidar('notificaciones');
        Respuesta::ok(['mensaje' => 'Notificación eliminada']);
    }

    /** Genera avisos de vencimiento (procedimiento) y devuelve cuántos se crearon. */
    public function generarVencimientos(Peticion $p): void
    {
        $antes = (int) BaseDatos::valor('SELECT COUNT(*) FROM notificaciones');
        BaseDatos::procedimiento('sp_estados_actualizar');
        Cache::invalidar('notificaciones', 'alumnos', 'panel');
        Respuesta::ok(['generadas' => (int) BaseDatos::valor('SELECT COUNT(*) FROM notificaciones') - $antes]);
    }
}
