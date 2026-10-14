<?php
namespace Modulos\Datos;

use Nucleo\Archivos;
use Nucleo\BaseDatos;

/**
 * Carga inicial de datos para el frontend (una sola petición al iniciar sesión).
 * Devuelve las filas tal como están en la base; el frontend las adapta en cada módulo.
 * Un alumno solo recibe sus propios registros.
 */
final class DatosServicio
{
    private ?int $alumno;

    public function __construct(private array $usuario)
    {
        $this->alumno = $usuario['rol'] === 'alumno' ? (int) $usuario['idalumno'] : null;
    }

    public function todo(): array
    {
        BaseDatos::procedimiento('sp_estados_actualizar');
        $esPersonal = $this->alumno === null;
        $esAdmin = $this->usuario['rol'] === 'administrador';
        $verCaja = in_array($this->usuario['rol'], ['administrador', 'recepcion'], true);

        return [
            'alumnos'        => $this->alumnos(),
            'planes'         => BaseDatos::filas('SELECT * FROM planes WHERE activo = 1 ORDER BY duracion_meses, precio'),
            'empleados'      => $this->empleados(),
            'ejercicios'     => BaseDatos::filas('SELECT * FROM ejercicios WHERE activo = 1 ORDER BY idejercicio DESC'),
            'rutinas'        => $this->rutinas(),
            'productos'      => $esPersonal ? $this->productos() : [],
            'movimientos'    => $verCaja ? $this->movimientos() : [],
            'reglas'         => $esPersonal ? BaseDatos::filas('SELECT * FROM reglas_notificacion ORDER BY idregla') : [],
            'notificaciones' => $this->notificaciones(),
            'clases'         => BaseDatos::filas('SELECT * FROM clases ORDER BY fecha DESC, idclase DESC'),
            'dietas'         => $this->dietas(),
            'medidas'        => $this->medidas(),
            'bicicletas'     => BaseDatos::filas('SELECT * FROM bicicletas_spinning ORDER BY numero'),
            'sesiones_spinning' => BaseDatos::filas(
                "SELECT s.*, CONCAT(e.nombres,' ',e.apellidos) AS instructor, e.foto AS foto_instructor
                   FROM sesiones_spinning s JOIN empleados e ON e.idempleado = s.idinstructor
                  WHERE s.fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY s.fecha, s.hora_inicio"),
            'reservas_spinning' => BaseDatos::filas(
                'SELECT * FROM reservas_spinning WHERE idsesion_spinning IN
                   (SELECT idsesion_spinning FROM sesiones_spinning WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY))'),
            'codigos_spinning' => $esPersonal ? BaseDatos::filas('SELECT * FROM codigos_spinning ORDER BY fecha_emision DESC')
                : BaseDatos::filas('SELECT * FROM codigos_spinning WHERE idalumno = ?', [$this->alumno]),
            'usuarios'       => $esAdmin ? $this->usuarios() : [],
            'asistencias'    => $this->asistencias(),
            'contratos'      => $esPersonal ? $this->contratos() : [],
            'fisioterapia'   => $this->fisioterapia(),
            'tecnicas'       => BaseDatos::filas('SELECT idtecnica, nombre, descripcion FROM tecnicas_fisioterapia WHERE activo = 1 ORDER BY nombre'),
            'citas'          => $this->citas(),
            'planilla'       => $esAdmin ? $this->planilla() : [],
            'alimentos'      => BaseDatos::filas('SELECT nombre, kcal_100g FROM alimentos ORDER BY nombre'),
        ];
    }

    private function filtroAlumno(string $columna): array
    {
        return $this->alumno ? [" AND {$columna} = ?", [$this->alumno]] : ['', []];
    }

    private function alumnos(): array
    {
        [$f, $p] = $this->filtroAlumno('a.idalumno');
        $filas = BaseDatos::filas(
            "SELECT a.*, m.idmatricula, m.idplan, p.nombre AS plan, m.fecha_inicio, m.fecha_fin, m.monto, m.metodo_pago,
                    DATE(m.fecha_registro) AS fecha_pago, m.identrenador, m.idprograma, m.estado AS estado_matricula
               FROM alumnos a
               LEFT JOIN matriculas m ON m.idmatricula = (
                    SELECT m2.idmatricula FROM matriculas m2 WHERE m2.idalumno = a.idalumno AND m2.estado <> 'anulada'
                     ORDER BY m2.fecha_fin DESC LIMIT 1)
               LEFT JOIN planes p ON p.idplan = m.idplan
              WHERE a.activo = 1{$f}
              ORDER BY a.idalumno DESC", $p);
        foreach ($filas as &$x) $x['foto_url'] = $this->url($x['foto']);
        return $filas;
    }

    private function empleados(): array
    {
        $filas = BaseDatos::filas('SELECT idempleado, dni, nombres, apellidos, sexo, telefono, correo, cargo, titulo_cargo, especialidad,
                                          biografia, calificacion, horario_disponible, foto, fecha_ingreso
                                     FROM empleados WHERE activo = 1 ORDER BY idempleado');
        foreach ($filas as &$x) $x['foto_url'] = $this->url($x['foto']);
        return $filas;
    }

    private function rutinas(): array
    {
        $rutinas = BaseDatos::filas(
            "SELECT r.*, CONCAT(e.nombres,' ',e.apellidos) AS entrenador, CONCAT(a.nombres,' ',a.apellidos) AS alumno
               FROM rutinas r LEFT JOIN empleados e ON e.idempleado = r.identrenador LEFT JOIN alumnos a ON a.idalumno = r.idalumno
              ORDER BY r.idrutina DESC");
        $dias = BaseDatos::filas('SELECT * FROM rutina_dias ORDER BY idrutina, orden');
        $ejercicios = BaseDatos::filas(
            'SELECT re.*, ej.nombre, ej.grupo_muscular, ej.video_url FROM rutina_ejercicios re
               JOIN ejercicios ej ON ej.idejercicio = re.idejercicio ORDER BY re.idrutina_dia, re.orden');
        $porDia = [];
        foreach ($ejercicios as $e) $porDia[$e['idrutina_dia']][] = $e;
        $porRutina = [];
        foreach ($dias as $d) {
            $d['ejercicios'] = $porDia[$d['idrutina_dia']] ?? [];
            $porRutina[$d['idrutina']][] = $d;
        }
        foreach ($rutinas as &$r) $r['dias'] = $porRutina[$r['idrutina']] ?? [];
        return $rutinas;
    }

    private function productos(): array
    {
        $filas = BaseDatos::filas('SELECT * FROM productos WHERE activo = 1 ORDER BY categoria, nombre');
        foreach ($filas as &$x) $x['imagen_url'] = $this->url($x['imagen']);
        return $filas;
    }

    private function movimientos(): array
    {
        $movs = BaseDatos::filas('SELECT * FROM movimientos_caja ORDER BY fecha DESC, idmovimiento DESC LIMIT 1000');
        $detalle = BaseDatos::filas('SELECT d.idventa, d.idproducto, p.nombre, d.cantidad, d.precio_unitario, d.subtotal
                                       FROM venta_detalle d JOIN productos p ON p.idproducto = d.idproducto');
        $porVenta = [];
        foreach ($detalle as $d) $porVenta[$d['idventa']][] = $d;
        foreach ($movs as &$m) {
            $m['items'] = $m['categoria'] === 'venta' ? ($porVenta[$m['idreferencia']] ?? []) : [];
            $m['adjunto_url'] = $this->url($m['adjunto']);
        }
        return $movs;
    }

    private function notificaciones(): array
    {
        if ($this->alumno) {
            return BaseDatos::filas("SELECT * FROM notificaciones WHERE destino IN ('todos','alumnos') OR (destino = 'alumno' AND idalumno = ?)
                                      ORDER BY fecha DESC LIMIT 200", [$this->alumno]);
        }
        return BaseDatos::filas('SELECT * FROM notificaciones ORDER BY fecha DESC, idnotificacion DESC LIMIT 500');
    }

    private function dietas(): array
    {
        [$f, $p] = $this->filtroAlumno('d.idalumno');
        $dietas = BaseDatos::filas(
            "SELECT d.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, CONCAT(e.nombres,' ',e.apellidos) AS nutricionista
               FROM dietas d JOIN alumnos a ON a.idalumno = d.idalumno JOIN empleados e ON e.idempleado = d.idnutricionista
              WHERE 1=1{$f} ORDER BY d.iddieta DESC", $p);
        if (!$dietas) return [];
        $ids = implode(',', array_map('intval', array_column($dietas, 'iddieta')));
        $comidas = BaseDatos::filas("SELECT * FROM dieta_comidas WHERE iddieta IN ({$ids}) ORDER BY iddieta, orden");
        $alimentos = BaseDatos::filas("SELECT da.* FROM dieta_alimentos da JOIN dieta_comidas c ON c.iddieta_comida = da.iddieta_comida
                                        WHERE c.iddieta IN ({$ids}) ORDER BY da.iddieta_alimento");
        $porComida = [];
        foreach ($alimentos as $a) $porComida[$a['iddieta_comida']][] = $a;
        $porDieta = [];
        foreach ($comidas as $c) {
            $c['alimentos'] = $porComida[$c['iddieta_comida']] ?? [];
            $porDieta[$c['iddieta']][] = $c;
        }
        foreach ($dietas as &$d) $d['comidas'] = $porDieta[$d['iddieta']] ?? [];
        return $dietas;
    }

    private function medidas(): array
    {
        [$f, $p] = $this->filtroAlumno('m.idalumno');
        return BaseDatos::filas(
            "SELECT m.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, CONCAT(e.nombres,' ',e.apellidos) AS evaluador
               FROM medidas m JOIN alumnos a ON a.idalumno = m.idalumno JOIN empleados e ON e.idempleado = m.idevaluador
              WHERE 1=1{$f} ORDER BY m.fecha, m.idmedida", $p);
    }

    private function usuarios(): array
    {
        return BaseDatos::filas(
            "SELECT u.idusuario, u.usuario, u.rol, u.idempleado, u.idalumno, u.activo,
                    COALESCE(CONCAT(e.nombres,' ',e.apellidos), CONCAT(a.nombres,' ',a.apellidos)) AS nombre,
                    COALESCE(e.correo, a.correo) AS correo, COALESCE(e.telefono, a.telefono) AS telefono
               FROM usuarios u LEFT JOIN empleados e ON e.idempleado = u.idempleado LEFT JOIN alumnos a ON a.idalumno = u.idalumno
              WHERE u.rol <> 'alumno' OR u.idalumno IN (SELECT idalumno FROM alumnos WHERE activo = 1)
              ORDER BY FIELD(u.rol,'administrador','recepcion','entrenador','nutricionista','fisioterapeuta','alumno'), nombre");
    }

    private function asistencias(): array
    {
        [$f, $p] = $this->filtroAlumno('s.idalumno');
        $alumnos = BaseDatos::filas(
            "SELECT s.*, CONCAT(a.nombres,' ',a.apellidos) AS nombre, a.dni,
                    (SELECT p.nombre FROM matriculas m JOIN planes p ON p.idplan = m.idplan
                      WHERE m.idalumno = s.idalumno AND m.estado <> 'anulada' ORDER BY m.fecha_fin DESC LIMIT 1) AS plan
               FROM asistencias_alumno s JOIN alumnos a ON a.idalumno = s.idalumno
              WHERE s.fecha >= DATE_SUB(CURDATE(), INTERVAL 60 DAY){$f}
              ORDER BY s.fecha DESC, s.hora_entrada DESC", $p);
        if ($this->alumno) return ['alumnos' => $alumnos, 'empleados' => []];
        $empleados = BaseDatos::filas(
            "SELECT s.*, CONCAT(e.nombres,' ',e.apellidos) AS nombre, e.dni, e.cargo,
                    (SELECT MAX(idcontrato) FROM contratos c WHERE c.idempleado = s.idempleado) AS idcontrato,
                    (SELECT TIME_FORMAT(MIN(h.hora_inicio),'%H:%i') FROM horarios_empleado h
                      WHERE h.idempleado = s.idempleado AND h.dia_semana = WEEKDAY(s.fecha) + 1) AS hora_programada
               FROM asistencias_empleado s JOIN empleados e ON e.idempleado = s.idempleado
              WHERE s.fecha >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
              ORDER BY s.fecha DESC, s.hora_entrada DESC");
        return ['alumnos' => $alumnos, 'empleados' => $empleados];
    }

    private function contratos(): array
    {
        $filas = BaseDatos::filas(
            "SELECT c.*, e.idempleado, e.dni, e.nombres, e.apellidos, e.cargo, e.titulo_cargo, e.telefono, e.correo, e.foto,
                    e.cuenta_bancaria,
                    IFNULL((SELECT SUM(s.horas_trabajadas) FROM asistencias_empleado s WHERE s.idempleado = e.idempleado
                             AND DATE_FORMAT(s.fecha,'%Y-%m') = DATE_FORMAT(CURDATE(),'%Y-%m')), 0) AS horas_mes,
                    (SELECT MAX(pl.fecha_pago) FROM planilla pl WHERE pl.idcontrato = c.idcontrato AND pl.estado = 'pagado') AS ultimo_pago,
                    (SELECT COUNT(*) FROM planilla pl WHERE pl.idcontrato = c.idcontrato AND pl.estado = 'pendiente'
                       AND pl.periodo < DATE_FORMAT(CURDATE(),'%Y-%m')) AS pagos_atrasados
               FROM contratos c JOIN empleados e ON e.idempleado = c.idempleado
              WHERE e.activo = 1 AND c.estado <> 'renovado'
              ORDER BY c.idcontrato DESC");
        foreach ($filas as &$x) {
            $x['foto_url'] = $this->url($x['foto']);
            $x['documento_url'] = $this->url($x['documento']);
        }
        return $filas;
    }

    private function fisioterapia(): array
    {
        [$f, $p] = $this->filtroAlumno('s.idalumno');
        $sesiones = BaseDatos::filas(
            "SELECT s.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, a.dni, a.telefono, a.restricciones_medicas,
                    CONCAT(e.nombres,' ',e.apellidos) AS fisioterapeuta
               FROM sesiones_fisioterapia s JOIN alumnos a ON a.idalumno = s.idalumno JOIN empleados e ON e.idempleado = s.idfisioterapeuta
              WHERE 1=1{$f} ORDER BY s.fecha DESC, s.idsesion_fisioterapia DESC", $p);
        $zonas = BaseDatos::filas('SELECT * FROM sesion_zonas ORDER BY nivel_dolor DESC');
        $tecnicas = BaseDatos::filas('SELECT st.idsesion_fisioterapia, t.idtecnica, t.nombre FROM sesion_tecnicas st
                                        JOIN tecnicas_fisioterapia t ON t.idtecnica = st.idtecnica');
        $z = $t = [];
        foreach ($zonas as $x) $z[$x['idsesion_fisioterapia']][] = ['zona' => $x['zona'], 'nivel_dolor' => (int) $x['nivel_dolor']];
        foreach ($tecnicas as $x) $t[$x['idsesion_fisioterapia']][] = $x['nombre'];
        foreach ($sesiones as &$s) {
            $s['zonas'] = $z[$s['idsesion_fisioterapia']] ?? [];
            $s['tecnicas'] = $t[$s['idsesion_fisioterapia']] ?? [];
        }
        return $sesiones;
    }

    private function citas(): array
    {
        [$f, $p] = $this->filtroAlumno('c.idalumno');
        return BaseDatos::filas(
            "SELECT c.*, CONCAT(a.nombres,' ',a.apellidos) AS alumno, a.dni, a.telefono, CONCAT(e.nombres,' ',e.apellidos) AS profesional
               FROM citas c JOIN alumnos a ON a.idalumno = c.idalumno JOIN empleados e ON e.idempleado = c.idempleado
              WHERE c.fecha >= DATE_SUB(CURDATE(), INTERVAL 60 DAY){$f}
              ORDER BY c.fecha, c.hora_inicio", $p);
    }

    private function planilla(): array
    {
        return BaseDatos::filas(
            "SELECT pl.*, c.idempleado, CONCAT(e.nombres,' ',e.apellidos) AS empleado, e.cargo, e.titulo_cargo
               FROM planilla pl JOIN contratos c ON c.idcontrato = pl.idcontrato JOIN empleados e ON e.idempleado = c.idempleado
              ORDER BY pl.periodo DESC, empleado");
    }

    private function url(?string $ruta): ?string
    {
        if (!$ruta) return null;
        return preg_match('#^https?://#', $ruta) ? $ruta : Archivos::url($ruta);
    }
}
