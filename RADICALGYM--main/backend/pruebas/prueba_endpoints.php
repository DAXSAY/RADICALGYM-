<?php
/**
 * Prueba de endpoints de todos los módulos.
 * Uso:  php pruebas/prueba_endpoints.php [http://localhost:8000]
 * Requiere la API levantada y los datos de prueba cargados.
 */
$base = rtrim($argv[1] ?? 'http://localhost:8000', '/');
$clave = 'Radical2026';
$resultados = [];
$moduloActual = '';

function llamar(string $metodo, string $ruta, ?string $token = null, $cuerpo = null, array $archivo = null): array
{
    global $base;
    $ch = curl_init($base . $ruta);
    $cabeceras = [];
    if ($token) $cabeceras[] = "Authorization: Bearer {$token}";
    if ($archivo) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, ['archivo' => new CURLFile($archivo[0], $archivo[1], basename($archivo[0]))]);
    } elseif ($cuerpo !== null) {
        $cabeceras[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($cuerpo));
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $cabeceras,
        CURLOPT_HEADER => true, CURLOPT_TIMEOUT => 20,
    ]);
    $resp = curl_exec($ch);
    $codigo = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $tamCab = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    $cab = substr((string) $resp, 0, $tamCab);
    preg_match('/X-Cache:\s*(\w+)/i', $cab, $m);
    return ['codigo' => $codigo, 'json' => json_decode(substr((string) $resp, $tamCab), true), 'cache' => $m[1] ?? '-'];
}

function modulo(string $nombre): void { global $moduloActual; $moduloActual = $nombre; }

function verificar(string $descripcion, array $r, int $esperado, ?callable $extra = null): array
{
    global $resultados, $moduloActual;
    $ok = $r['codigo'] === $esperado && ($extra === null || $extra($r['json']));
    $resultados[] = [$moduloActual, $descripcion, $ok, $r['codigo'], $ok ? '' : ($r['json']['mensaje'] ?? json_encode($r['json']))];
    printf("  %s %-58s %d %s\n", $ok ? '[OK]  ' : '[FALLA]', $descripcion, $r['codigo'], $ok ? '' : '-> ' . substr(end($resultados)[4], 0, 90));
    return $r;
}

function ingresar(string $usuario): string
{
    global $clave;
    $r = llamar('POST', '/api/auth/ingresar', null, ['usuario' => $usuario, 'clave' => $clave]);
    verificar("Ingreso como {$usuario}", $r, 200, fn ($j) => !empty($j['datos']['token']));
    return $r['json']['datos']['token'] ?? '';
}

// Imagen PNG mínima para pruebas de subida
$png = sys_get_temp_dir() . '/rg_prueba.png';
file_put_contents($png, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='));
$pdf = sys_get_temp_dir() . '/rg_prueba.pdf';
file_put_contents($pdf, "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
$sufijo = substr((string) time(), -6);

echo "\nRADICAL GYM - Prueba de endpoints ({$base})\n";

modulo('Autenticación');
echo "\n[Autenticación]\n";
verificar('Salud: MySQL y Redis', llamar('GET', '/api/salud'), 200, fn ($j) => $j['datos']['mysql'] && $j['datos']['redis']);
verificar('Clave incorrecta rechazada', llamar('POST', '/api/auth/ingresar', null, ['usuario' => 'admin', 'clave' => 'x']), 401);
verificar('Sin token => 401', llamar('GET', '/api/alumnos'), 401);
$admin = ingresar('admin');
$recepcion = ingresar('recepcion');
$entrenador = ingresar('entrenador');
$nutri = ingresar('nutricionista');
$fisio = ingresar('fisioterapeuta');
$alumno = ingresar('70000001');
verificar('Perfil del usuario (yo)', llamar('GET', '/api/auth/yo', $admin), 200, fn ($j) => $j['datos']['rol'] === 'administrador');
$temporal = ingresar('sofia');
verificar('Cerrar sesión', llamar('POST', '/api/auth/salir', $temporal), 200);
verificar('Token cerrado ya no sirve', llamar('GET', '/api/auth/yo', $temporal), 401);

modulo('Panel');
echo "\n[Panel]\n";
verificar('Indicadores del panel', llamar('GET', '/api/panel', $admin), 200, fn ($j) => isset($j['datos']['indicadores']['alumnos_activos']));
verificar('Alumno no accede al panel => 403', llamar('GET', '/api/panel', $alumno), 403);

modulo('Alumnos');
echo "\n[Alumnos]\n";
verificar('Listado paginado (página 1, 5 por página)', llamar('GET', '/api/alumnos?pagina=1&por_pagina=5', $recepcion), 200,
    fn ($j) => count($j['datos']) === 5 && $j['paginacion']['total'] >= 24);
$r1 = llamar('GET', '/api/alumnos?pagina=2&por_pagina=5', $recepcion);
$r2 = llamar('GET', '/api/alumnos?pagina=2&por_pagina=5', $recepcion);
verificar('Caché Redis: segunda consulta = HIT', $r2, 200, fn () => $r2['cache'] === 'HIT');
verificar('Filtro por sexo F', llamar('GET', '/api/alumnos?sexo=F&por_pagina=50', $recepcion), 200,
    fn ($j) => $j['datos'] && !array_filter($j['datos'], fn ($a) => $a['sexo'] !== 'F'));
verificar('Filtro por plan (Mensual)', llamar('GET', '/api/alumnos?idplan=1&por_pagina=50', $recepcion), 200,
    fn ($j) => $j['datos'] && !array_filter($j['datos'], fn ($a) => (int) $a['idplan'] !== 1));
verificar('Filtro por programa afiliado', llamar('GET', '/api/alumnos?idprograma=2&por_pagina=50', $recepcion), 200,
    fn ($j) => $j['datos'] && !array_filter($j['datos'], fn ($a) => (int) $a['idprograma'] !== 2));
verificar('Filtro por mes de inscripción', llamar('GET', '/api/alumnos?mes=' . date('Y-m') . '&por_pagina=50', $recepcion), 200,
    fn ($j) => !array_filter($j['datos'], fn ($a) => substr($a['fecha_inicio'], 0, 7) !== date('Y-m')));
verificar('Filtro estado sin plan', llamar('GET', '/api/alumnos?estado=sin_plan', $recepcion), 200, fn ($j) => $j['paginacion']['total'] >= 1);
$nuevo = verificar('Registrar alumno con matrícula', llamar('POST', '/api/alumnos', $recepcion, [
    'dni' => '7' . str_pad($sufijo, 7, '0', STR_PAD_LEFT), 'nombres' => 'Prueba', 'apellidos' => 'Automática ' . $sufijo, 'sexo' => 'M',
    'telefono' => '999888777', 'objetivo' => 'fuerza', 'idplan' => 2, 'idprograma' => 3, 'identrenador' => 1002, 'metodo_pago' => 'efectivo',
]), 201, fn ($j) => $j['datos']['idalumno'] >= 1000 && count($j['datos']['matriculas']) === 1);
$idNuevo = $nuevo['json']['datos']['idalumno'] ?? 0;
verificar('DNI duplicado rechazado (procedimiento)', llamar('POST', '/api/alumnos', $recepcion, [
    'dni' => '70000001', 'nombres' => 'X', 'apellidos' => 'Y', 'sexo' => 'M']), 422);
verificar('Actualizar alumno', llamar('PUT', "/api/alumnos/{$idNuevo}", $recepcion, ['telefono' => '911222333']), 200,
    fn ($j) => $j['datos']['telefono'] === '911222333');
verificar('Subir foto (id_alumnos_foto.png)', llamar('POST', "/api/alumnos/{$idNuevo}/foto", $recepcion, null, [$png, 'image/png']), 200,
    fn ($j) => $j['datos']['foto'] === "alumnos/{$idNuevo}_alumnos_foto.png");
verificar('Detalle con historial de matrículas', llamar('GET', "/api/alumnos/{$idNuevo}", $recepcion), 200, fn ($j) => isset($j['datos']['matriculas']));
verificar('Renovar matrícula', llamar('POST', '/api/matriculas', $recepcion, ['idalumno' => $idNuevo, 'idplan' => 1]), 201,
    fn ($j) => !empty($j['datos']['fecha_fin']));
verificar('Alumno solo ve su ficha (forzado a su id)', llamar('GET', '/api/alumnos/1005', $alumno), 200, fn ($j) => (int) $j['datos']['idalumno'] === 1000);
verificar('Alumno no lista alumnos => 403', llamar('GET', '/api/alumnos', $alumno), 403);

modulo('Planes y programas');
echo "\n[Planes y programas]\n";
verificar('Listar planes y tarifas', llamar('GET', '/api/planes', $recepcion), 200, fn ($j) => count($j['datos']) >= 5);
$plan = verificar('Crear plan', llamar('POST', '/api/planes', $admin, ['nombre' => 'Plan prueba ' . $sufijo, 'duracion_meses' => 2, 'precio' => 210]), 201);
$idPlan = $plan['json']['datos']['idplan'] ?? 0;
verificar('Editar plan', llamar('PUT', "/api/planes/{$idPlan}", $admin, ['nombre' => 'Plan prueba ' . $sufijo, 'duracion_meses' => 2, 'precio' => 199]), 200,
    fn ($j) => (float) $j['datos']['precio'] === 199.0);
verificar('Desactivar plan', llamar('DELETE', "/api/planes/{$idPlan}", $admin), 200);
verificar('Recepción no crea planes => 403', llamar('POST', '/api/planes', $recepcion, ['nombre' => 'x', 'duracion_meses' => 1, 'precio' => 1]), 403);
verificar('Listar programas de entrenamiento', llamar('GET', '/api/programas', $entrenador), 200, fn ($j) => count($j['datos']) >= 5);

modulo('Personal');
echo "\n[Personal]\n";
verificar('Listar empleados (paginado)', llamar('GET', '/api/empleados?por_pagina=5', $admin), 200, fn ($j) => count($j['datos']) === 5);
verificar('Filtro por cargo entrenador', llamar('GET', '/api/empleados?cargo=entrenador', $admin), 200,
    fn ($j) => !array_filter($j['datos'], fn ($e) => $e['cargo'] !== 'entrenador'));
$emp = verificar('Registrar empleado (+ usuario)', llamar('POST', '/api/empleados', $admin, [
    'dni' => '4' . str_pad($sufijo, 7, '0', STR_PAD_LEFT), 'nombres' => 'Empleado', 'apellidos' => 'Prueba', 'sexo' => 'F', 'cargo' => 'entrenador',
]), 201, fn ($j) => $j['datos']['idempleado'] >= 1000 && $j['datos']['usuario'] !== null);
$idEmp = $emp['json']['datos']['idempleado'] ?? 0;
verificar('Guardar horario semanal', llamar('PUT', "/api/empleados/{$idEmp}/horarios", $admin, ['bloques' => [
    ['dia_semana' => 1, 'hora_inicio' => '08:00', 'hora_fin' => '12:00'], ['dia_semana' => 3, 'hora_inicio' => '08:00', 'hora_fin' => '12:00']]]), 200,
    fn ($j) => count($j['datos']) === 2);
$con = verificar('Crear contrato (fin calculado por trigger)', llamar('POST', '/api/contratos', $admin, [
    'idempleado' => $idEmp, 'tipo' => '3_meses', 'modalidad' => 'medio_tiempo', 'fecha_inicio' => date('Y-m-d'), 'sueldo_mensual' => 1200, 'horas_semanales' => 20,
]), 201, fn ($j) => !empty($j['datos']['fecha_fin']) && (float) $j['datos']['tarifa_hora'] > 0);
$idCon = $con['json']['datos']['idcontrato'] ?? 0;
verificar('Subir contrato PDF (id_contratos_documento.pdf)', llamar('POST', "/api/contratos/{$idCon}/documento", $admin, null, [$pdf, 'application/pdf']), 200,
    fn ($j) => $j['datos']['documento'] === "contratos/{$idCon}_contratos_documento.pdf");
verificar('Listar contratos', llamar('GET', '/api/contratos', $admin), 200, fn ($j) => $j['paginacion']['total'] >= 8);
verificar('Entrenador ve solo sus contratos', llamar('GET', '/api/contratos', $entrenador), 200,
    fn ($j) => !array_filter($j['datos'], fn ($c) => (int) $c['idempleado'] !== 1002));
verificar('Resumen mensual del entrenador (horas, faltas)', llamar('GET', '/api/empleados/1002/resumen', $entrenador), 200,
    fn ($j) => isset($j['datos']['horas_trabajadas'], $j['datos']['faltas'], $j['datos']['horario']));
$perm = verificar('Solicitar permiso (entrenador)', llamar('POST', '/api/permisos', $entrenador, [
    'tipo' => 'personal', 'fecha_inicio' => date('Y-m-d', strtotime('+20 day')), 'fecha_fin' => date('Y-m-d', strtotime('+21 day')), 'motivo' => 'Prueba automática',
]), 201);
$idPerm = $perm['json']['datos']['idpermiso'] ?? 0;
verificar('Subir sustento del permiso', llamar('POST', "/api/permisos/{$idPerm}/sustento", $entrenador, null, [$pdf, 'application/pdf']), 200);
verificar('Aprobar permiso (trigger marca días)', llamar('PUT', "/api/permisos/{$idPerm}/estado", $admin, ['estado' => 'aprobado']), 200);
verificar('Entrenador no aprueba permisos => 403', llamar('PUT', "/api/permisos/{$idPerm}/estado", $entrenador, ['estado' => 'aprobado']), 403);
verificar('Listar permisos pendientes', llamar('GET', '/api/permisos?estado=pendiente', $admin), 200);

modulo('Asistencia');
echo "\n[Asistencia]\n";
verificar('Registrar asistencia de alumno por DNI', llamar('POST', '/api/asistencias/alumnos', $recepcion, ['valor' => '70000002']), 201,
    fn ($j) => $j['datos']['idalumno'] === 1001);
verificar('Alumno sin plan no ingresa (procedimiento)', llamar('POST', '/api/asistencias/alumnos', $recepcion, ['valor' => '70000024']), 422);
verificar('Asistencias de alumnos de hoy', llamar('GET', '/api/asistencias/alumnos', $recepcion), 200, fn ($j) => $j['paginacion']['total'] >= 1);
verificar('Marcar entrada del personal', llamar('POST', '/api/asistencias/personal', $recepcion, ['idempleado' => $idEmp]), 200,
    fn ($j) => !empty($j['datos']['hora_entrada']));
verificar('Registrar falta', llamar('POST', '/api/asistencias/personal/falta', $recepcion, [
    'idempleado' => 1006, 'fecha' => date('Y-m-d', strtotime('-1 day')), 'observacion' => 'Prueba']), 200);
verificar('Estado del personal del día', llamar('GET', '/api/asistencias/personal', $recepcion), 200, fn ($j) => $j['paginacion']['total'] >= 8);

modulo('Citas');
echo "\n[Citas nutrición / fisioterapia]\n";
verificar('Horarios de nutricionistas', llamar('GET', '/api/citas/horarios?servicio=nutricion', $recepcion), 200, fn ($j) => !empty($j['datos'][0]['horario']));
verificar('Agenda del día de la nutricionista', llamar('GET', '/api/citas', $nutri), 200,
    fn ($j) => count($j['datos']) >= 4 && !array_filter($j['datos'], fn ($c) => $c['servicio'] !== 'nutricion'));
verificar('Agenda del día del fisioterapeuta', llamar('GET', '/api/citas', $fisio), 200,
    fn ($j) => !array_filter($j['datos'], fn ($c) => $c['servicio'] !== 'fisioterapia'));
$cita = verificar('Programar cita', llamar('POST', '/api/citas', $recepcion, [
    'servicio' => 'nutricion', 'idalumno' => 1003, 'idempleado' => 1004, 'fecha' => date('Y-m-d', strtotime('+3 day')), 'hora_inicio' => '16:' . str_pad((string) ((int) $sufijo % 6 * 10), 2, '0', STR_PAD_LEFT),
]), 201);
$c0 = $cita['json']['datos'] ?? [];
verificar('Cruce de horario rechazado (trigger)', llamar('POST', '/api/citas', $recepcion, [
    'servicio' => 'nutricion', 'idalumno' => 1004, 'idempleado' => 1004, 'fecha' => $c0['fecha'] ?? date('Y-m-d'), 'hora_inicio' => substr($c0['hora_inicio'] ?? '09:00', 0, 5),
]), 422);
verificar('Marcar cita como atendida', llamar('PUT', '/api/citas/' . ($c0['idcita'] ?? 0) . '/estado', $nutri, ['estado' => 'atendida']), 200);
verificar('Citas del alumno (portal)', llamar('GET', '/api/alumnos/1000/citas', $alumno), 200);

modulo('Nutrición y medidas');
echo "\n[Nutrición y medidas]\n";
verificar('Buscar alimentos del catálogo', llamar('GET', '/api/alimentos?buscar=pollo', $nutri), 200, fn ($j) => count($j['datos']) >= 1);
$dieta = verificar('Crear dieta con 5 comidas (incluye horas extra)', llamar('POST', '/api/dietas', $nutri, [
    'idalumno' => 1004, 'titulo' => 'Dieta prueba', 'objetivo' => 'tonificacion', 'calorias_meta' => 1900, 'proteinas_g' => 110,
    'carbohidratos_g' => 210, 'grasas_g' => 60, 'agua_litros' => 2.5,
    'comidas' => [
        ['nombre' => 'Desayuno', 'hora' => '07:00', 'alimentos' => [['alimento' => 'Avena', 'gramos' => 60], ['alimento' => 'Plátano', 'gramos' => 100]]],
        ['nombre' => 'Almuerzo', 'hora' => '13:00', 'alimentos' => [['alimento' => 'Pechuga de pollo', 'gramos' => 150]]],
        ['nombre' => 'Merienda', 'hora' => '17:00', 'alimentos' => [['alimento' => 'Yogur griego', 'gramos' => 150]]],
        ['nombre' => 'Cena', 'hora' => '20:00', 'alimentos' => [['alimento' => 'Atún en agua', 'gramos' => 120]]],
        ['nombre' => 'Extra 23:00', 'hora' => '23:00', 'alimentos' => [['alimento' => 'Batido casero', 'gramos' => 300, 'kilocalorias' => 210]]],
    ],
]), 201, fn ($j) => $j['datos']['comidas_por_dia'] === 5 && (int) $j['datos']['calorias_totales'] > 0
    && (float) $j['datos']['comidas'][0]['alimentos'][0]['kilocalorias'] === 233.4);
verificar('Listar dietas (paginado)', llamar('GET', '/api/dietas?por_pagina=5', $nutri), 200, fn ($j) => $j['paginacion']['total'] >= 3);
verificar('Detalle de dieta', llamar('GET', '/api/dietas/' . ($dieta['json']['datos']['iddieta'] ?? 0), $nutri), 200);
verificar('Alumno ve su dieta activa', llamar('GET', '/api/dietas/activa', $alumno), 200, fn ($j) => (int) $j['datos']['idalumno'] === 1000);
verificar('Alumno no ve dieta ajena => 404', llamar('GET', '/api/dietas/2', $alumno), 404);
verificar('Registrar medidas con pares der/izq (IMC por trigger)', llamar('POST', '/api/medidas', $nutri, [
    'idalumno' => 1004, 'fecha' => date('Y-m-d'), 'peso_kg' => 57.9, 'talla_cm' => 160, 'cintura' => 65.5, 'cadera' => 95,
    'biceps_relajado_der' => 26, 'biceps_relajado_izq' => 25.8, 'muslo_der' => 53, 'muslo_izq' => 52.6, 'pantorrilla_der' => 34, 'pantorrilla_izq' => 33.9,
    'antebrazo_der' => 22, 'antebrazo_izq' => 21.9, 'grasa_porcentaje' => 23.5,
]), 201, fn ($j) => (float) $j['datos']['imc'] === 22.62 && $j['datos']['clasificacion_imc'] === 'Normal');
verificar('Talla fuera de rango rechazada', llamar('POST', '/api/medidas', $nutri, [
    'idalumno' => 1004, 'fecha' => date('Y-m-d'), 'peso_kg' => 57, 'talla_cm' => 1.6, 'cintura' => 65, 'cadera' => 95]), 422);
verificar('Historial de medidas del alumno', llamar('GET', '/api/medidas?idalumno=1000', $nutri), 200, fn ($j) => $j['paginacion']['total'] >= 3);
verificar('Alumno ve sus reportes de medidas', llamar('GET', '/api/medidas', $alumno), 200,
    fn ($j) => !array_filter($j['datos'], fn ($m) => (int) $m['idalumno'] !== 1000));

modulo('Fisioterapia');
echo "\n[Fisioterapia]\n";
verificar('Buscar técnicas', llamar('GET', '/api/tecnicas?buscar=terapia', $fisio), 200, fn ($j) => count($j['datos']) >= 2);
$tec = verificar('Agregar técnica', llamar('POST', '/api/tecnicas', $fisio, ['nombre' => 'Técnica prueba ' . $sufijo, 'descripcion' => 'Creada por el test']), 201);
$idTec = $tec['json']['datos']['idtecnica'] ?? 0;
verificar('Editar técnica', llamar('PUT', "/api/tecnicas/{$idTec}", $fisio, ['nombre' => 'Técnica editada ' . $sufijo]), 200,
    fn ($j) => str_starts_with($j['datos']['nombre'], 'Técnica editada'));
$ses = verificar('Sesión con varias zonas y dolor por zona', llamar('POST', '/api/fisioterapia/sesiones', $fisio, [
    'idalumno' => 1015, 'motivo_consulta' => 'Dolor de tobillo y rodilla',
    'zonas' => [['zona' => 'tobillo_pie', 'nivel_dolor' => 6], ['zona' => 'rodilla', 'nivel_dolor' => 3]],
    'tecnicas' => [2, 6, $idTec], 'evaluacion' => 'Inestabilidad lateral', 'indicaciones_casa' => 'Propiocepción',
]), 201, fn ($j) => count($j['datos']['zonas']) === 2 && count($j['datos']['tecnicas']) === 3 && $j['datos']['numero_sesion'] >= 1);
verificar('Eliminar técnica usada => se archiva', llamar('DELETE', "/api/tecnicas/{$idTec}", $fisio), 200,
    fn ($j) => str_contains($j['datos']['mensaje'], 'archivada'));
verificar('Zona inválida rechazada', llamar('POST', '/api/fisioterapia/sesiones', $fisio, [
    'idalumno' => 1015, 'motivo_consulta' => 'x', 'zonas' => [['zona' => 'oreja', 'nivel_dolor' => 3]]]), 422);
verificar('Historial de sesiones (paginado)', llamar('GET', '/api/fisioterapia/sesiones?idalumno=1002', $fisio), 200, fn ($j) => $j['paginacion']['total'] >= 2);
verificar('Detalle de sesión', llamar('GET', '/api/fisioterapia/sesiones/' . ($ses['json']['datos']['idsesion_fisioterapia'] ?? 0), $fisio), 200);
verificar('Nutricionista no registra fisioterapia => 403', llamar('POST', '/api/fisioterapia/sesiones', $nutri, ['idalumno' => 1, 'motivo_consulta' => 'x', 'zonas' => []]), 403);

modulo('Ventas');
echo "\n[Productos y ventas]\n";
verificar('Listar productos (paginado)', llamar('GET', '/api/productos?por_pagina=4', $recepcion), 200, fn ($j) => count($j['datos']) === 4);
$prod = verificar('Crear producto', llamar('POST', '/api/productos', $admin, [
    'nombre' => 'Producto Prueba ' . $sufijo, 'categoria' => 'snacks', 'precio_compra' => 2, 'precio_venta' => 4, 'stock' => 10, 'stock_minimo' => 2,
]), 201);
$idProd = $prod['json']['datos']['idproducto'] ?? 0;
verificar('Imagen en carpeta productos (id_productos_nombre)', llamar('POST', "/api/productos/{$idProd}/imagen", $admin, null, [$png, 'image/png']), 200,
    fn ($j) => $j['datos']['imagen'] === "productos/{$idProd}_productos_producto_prueba_{$sufijo}.png");
$venta = verificar('Registrar venta (trigger descuenta stock)', llamar('POST', '/api/ventas', $recepcion, [
    'metodo_pago' => 'efectivo', 'idalumno' => 1000, 'items' => [['idproducto' => $idProd, 'cantidad' => 3], ['idproducto' => 1, 'cantidad' => 1]],
]), 201, fn ($j) => (float) $j['datos']['total'] === 14.5);
verificar('Stock actualizado a 7', llamar('GET', '/api/productos?buscar=Producto%20Prueba%20' . $sufijo, $recepcion), 200,
    fn ($j) => (int) ($j['datos'][0]['stock'] ?? -1) === 7);
verificar('Stock insuficiente rechazado (trigger)', llamar('POST', '/api/ventas', $recepcion, [
    'metodo_pago' => 'efectivo', 'items' => [['idproducto' => $idProd, 'cantidad' => 999]]]), 422);
verificar('Listar ventas', llamar('GET', '/api/ventas', $recepcion), 200, fn ($j) => $j['paginacion']['total'] >= 4);
verificar('Detalle de venta', llamar('GET', '/api/ventas/' . ($venta['json']['datos']['idventa'] ?? 0), $recepcion), 200,
    fn ($j) => count($j['datos']['detalle']) === 2);

modulo('Caja');
echo "\n[Caja]\n";
verificar('Movimientos del mes', llamar('GET', '/api/caja/movimientos', $admin), 200, fn ($j) => $j['paginacion']['total'] >= 1);
verificar('Registrar egreso', llamar('POST', '/api/caja/egresos', $admin, ['categoria' => 'mantenimiento', 'monto' => 80, 'descripcion' => 'Prueba']), 201);
verificar('Resumen de caja', llamar('GET', '/api/caja/resumen?desde=' . date('Y-m-01') . '&hasta=' . date('Y-m-d'), $admin), 200,
    fn ($j) => isset($j['datos']['balance']));
verificar('Recepción no ve caja => 403', llamar('GET', '/api/caja/movimientos', $recepcion), 403);

modulo('Notificaciones');
echo "\n[Notificaciones]\n";
$not = verificar('Enviar notificación a un alumno', llamar('POST', '/api/notificaciones', $recepcion, [
    'titulo' => 'Prueba', 'mensaje' => 'Mensaje de prueba', 'destino' => 'alumno', 'idalumno' => 1000]), 201);
verificar('Generar avisos de vencimiento', llamar('POST', '/api/notificaciones/vencimientos', $recepcion), 200);
verificar('Bandeja de recepción', llamar('GET', '/api/notificaciones', $recepcion), 200, fn ($j) => $j['paginacion']['total'] >= 4);
verificar('Alumno recibe la suya', llamar('GET', '/api/notificaciones', $alumno), 200,
    fn ($j) => (bool) array_filter($j['datos'], fn ($n) => $n['idnotificacion'] === ($not['json']['datos']['idnotificacion'] ?? -1)));
verificar('Marcar como leída', llamar('PUT', '/api/notificaciones/' . ($not['json']['datos']['idnotificacion'] ?? 0) . '/leida', $alumno), 200);

modulo('Portal');
echo "\n[Portal del alumno]\n";
verificar('Mi plan, asistencias y próximas citas', llamar('GET', '/api/portal/alumno', $alumno), 200,
    fn ($j) => $j['datos']['plan']['plan'] === 'Anual');
verificar('Personal no usa el portal de alumno => 403', llamar('GET', '/api/portal/alumno', $admin), 403);

modulo('Carga inicial');
echo "\n[Carga inicial del frontend]\n";
$datosAdmin = verificar('Datos completos para administrador', llamar('GET', '/api/datos', $admin), 200,
    fn ($j) => count($j['datos']['alumnos']) >= 24 && count($j['datos']['bicicletas']) === 24 && count($j['datos']['ejercicios']) >= 28);
$rh = llamar('GET', '/api/datos', $admin);
verificar('Datos en caché Redis (HIT)', $rh, 200, fn () => $rh['cache'] === 'HIT');
verificar('Alumno solo recibe sus datos', llamar('GET', '/api/datos', $alumno), 200,
    fn ($j) => count($j['datos']['alumnos']) === 1 && !$j['datos']['movimientos'] && !$j['datos']['contratos']);

modulo('Entrenamiento');
echo "\n[Entrenadores, ejercicios y rutinas]\n";
$ent = verificar('Registrar entrenador', llamar('POST', '/api/entrenadores', $admin, [
    'nombre' => 'Coach Prueba ' . $sufijo, 'especialidad' => 'Crossfit', 'calificacion' => 4.8, 'horario_disponible' => 'Lun - Vie 6am']), 201,
    fn ($j) => $j['datos']['idempleado'] >= 1000);
$idEnt = $ent['json']['datos']['idempleado'] ?? 0;
verificar('Editar entrenador', llamar('PUT', "/api/entrenadores/{$idEnt}", $admin, ['nombre' => 'Coach Prueba ' . $sufijo, 'biografia' => 'Bio']), 200);
$ej = verificar('Crear ejercicio', llamar('POST', '/api/ejercicios', $entrenador, [
    'nombre' => 'Ejercicio prueba ' . $sufijo, 'grupo_muscular' => 'pecho', 'equipo' => 'barra', 'dificultad' => 'intermedio']), 201);
$idEj = $ej['json']['datos']['idejercicio'] ?? 0;
$rut = verificar('Crear rutina con días y ejercicios', llamar('POST', '/api/rutinas', $entrenador, [
    'titulo' => 'Rutina prueba ' . $sufijo, 'nivel' => 'principiante', 'objetivo' => 'fuerza', 'identrenador' => 1002, 'idalumno' => 1003,
    'dias' => [['nombre' => 'Día 1', 'enfoque' => 'Pecho', 'ejercicios' => [['idejercicio' => $idEj, 'series' => 4, 'repeticiones' => '8-10', 'descanso_seg' => 90]]]],
]), 201);
$idRut = $rut['json']['datos']['idrutina'] ?? 0;
verificar('Editar rutina', llamar('PUT', "/api/rutinas/{$idRut}", $entrenador, ['titulo' => 'Rutina editada', 'nivel' => 'intermedio', 'objetivo' => 'fuerza', 'dias' => []]), 200);
verificar('Eliminar rutina', llamar('DELETE', "/api/rutinas/{$idRut}", $entrenador), 200);
verificar('Eliminar ejercicio', llamar('DELETE', "/api/ejercicios/{$idEj}", $entrenador), 200);
verificar('Retirar entrenador', llamar('DELETE', "/api/entrenadores/{$idEnt}", $admin), 200);
verificar('Asignar entrenador a alumno', llamar('PUT', '/api/alumnos/1004/entrenador', $recepcion, ['identrenador' => 1006]), 200);

modulo('Spinning');
echo "\n[Spinning]\n";
$ses = verificar('Crear sesión de spinning', llamar('POST', '/api/spinning/sesiones', $entrenador, [
    'titulo' => 'Sesión prueba', 'idinstructor' => 1002, 'fecha' => date('Y-m-d', strtotime('+1 day')), 'hora_inicio' => '06:00', 'hora_fin' => '06:45',
    'intensidad' => 'alta', 'capacidad' => 24, 'sala' => 'Studio', 'precio_externo' => 15]), 201);
$idSes = $ses['json']['datos']['idsesion_spinning'] ?? 0;
$res = verificar('Reservar bicicleta (alumno)', llamar('POST', '/api/spinning/reservas', $alumno, [
    'idsesion_spinning' => $idSes, 'numero_bicicleta' => 5, 'nombre' => 'Luis Ramírez Ortega']), 201, fn ($j) => (int) $j['datos']['idalumno'] === 1000);
verificar('Bicicleta ocupada rechazada (trigger)', llamar('POST', '/api/spinning/reservas', $recepcion, [
    'idsesion_spinning' => $idSes, 'numero_bicicleta' => 5, 'nombre' => 'Otro', 'es_externo' => 1, 'monto' => 15]), 422);
verificar('Visitante paga y reserva (ingreso por trigger)', llamar('POST', '/api/spinning/reservas', $recepcion, [
    'idsesion_spinning' => $idSes, 'numero_bicicleta' => 6, 'nombre' => 'Visitante', 'es_externo' => 1, 'monto' => 15, 'metodo_pago' => 'yape_plin']), 201,
    fn ($j) => str_starts_with((string) $j['datos']['comprobante'], 'REC-SPIN'));
verificar('Check-in de la reserva', llamar('PUT', '/api/spinning/reservas/' . ($res['json']['datos']['idreserva_spinning'] ?? 0) . '/checkin', $recepcion), 200);
verificar('Bicicleta en mantenimiento', llamar('PUT', '/api/spinning/bicicletas/24/mantenimiento', $recepcion, ['notas' => 'Cambio de pedal']), 200);
verificar('No se reserva bici en mantenimiento', llamar('POST', '/api/spinning/reservas', $recepcion, [
    'idsesion_spinning' => $idSes, 'numero_bicicleta' => 24, 'nombre' => 'X', 'es_externo' => 1]), 422);
llamar('PUT', '/api/spinning/bicicletas/24/mantenimiento', $recepcion, ['notas' => '']);
$cod = verificar('Generar código de pase', llamar('POST', '/api/spinning/codigos', $recepcion, [
    'nombre' => 'Invitado Yape', 'metodo_pago' => 'yape_plin', 'monto' => 20, 'emitido_por' => 'Recepción', 'idsesion_spinning' => $idSes]), 201,
    fn ($j) => str_starts_with($j['datos']['codigo'], 'YAPE-'));
verificar('Canjear código', llamar('POST', '/api/spinning/codigos/canjear', $alumno, ['codigo' => $cod['json']['datos']['codigo'] ?? '', 'numero_bicicleta' => 7]), 201);
verificar('Código ya canjeado rechazado', llamar('POST', '/api/spinning/codigos/canjear', $alumno, ['codigo' => $cod['json']['datos']['codigo'] ?? '', 'numero_bicicleta' => 8]), 422);
verificar('Eliminar sesión', llamar('DELETE', "/api/spinning/sesiones/{$idSes}", $entrenador), 200);

modulo('Finanzas y planilla');
echo "\n[Finanzas y planilla]\n";
$mov = verificar('Registrar egreso por avería', llamar('POST', '/api/caja/movimientos', $admin, [
    'tipo' => 'egreso', 'categoria' => 'averia_equipo', 'monto' => 120, 'descripcion' => 'Reparación prueba', 'equipo' => 'Prensa', 'metodo_pago' => 'efectivo']), 201,
    fn ($j) => str_starts_with((string) $j['datos']['comprobante'], 'EGR-'));
$idMov = $mov['json']['datos']['idmovimiento'] ?? 0;
verificar('Adjuntar comprobante (id_movimientos_caja_adjunto)', llamar('POST', "/api/caja/movimientos/{$idMov}/adjunto", $admin, null, [$pdf, 'application/pdf']), 200,
    fn ($j) => $j['datos']['adjunto'] === "movimientos_caja/{$idMov}_movimientos_caja_adjunto.pdf");
verificar('Eliminar movimiento manual', llamar('DELETE', "/api/caja/movimientos/{$idMov}", $admin), 200);
$pend = array_values(array_filter($datosAdmin['json']['datos']['planilla'] ?? [], fn ($p) => $p['estado'] === 'pendiente'));
verificar('Pagar sueldo (egreso por trigger)', llamar('POST', '/api/planilla/' . ($pend[0]['idplanilla'] ?? 0) . '/pagar', $admin, ['metodo_pago' => 'transferencia']), 200,
    fn ($j) => $j['datos']['estado'] === 'pagado');

modulo('Personal ampliado');
echo "\n[Contratos completos y asistencia]\n";
$cc = verificar('Alta de trabajador con contrato y usuario', llamar('POST', '/api/contratos/completo', $admin, [
    'nombre' => 'Trabajadora Prueba Uno', 'dni' => '5' . str_pad($sufijo, 7, '0', STR_PAD_LEFT), 'cargo' => 'recepcion', 'titulo_cargo' => 'Recepcionista',
    'tipo' => '6_meses', 'modalidad' => 'medio_tiempo', 'fecha_inicio' => date('Y-m-d'), 'sueldo_mensual' => 1200, 'horas_semanales' => 24]), 201);
$idCc = $cc['json']['datos']['idcontrato'] ?? 0;
verificar('Actualizar contrato', llamar('PUT', "/api/contratos/{$idCc}", $admin, ['notas' => 'Turno tarde', 'telefono' => '999000111']), 200);
verificar('Renovar contrato', llamar('POST', "/api/contratos/{$idCc}/renovar", $admin, ['tipo' => '1_anio', 'sueldo_mensual' => 1300]), 201);
$asis = verificar('Marca de asistencia del personal (genérica)', llamar('POST', '/api/asistencias', $recepcion, [
    'categoria' => 'empleado', 'id' => $cc['json']['datos']['idempleado'] ?? 0, 'tipo' => 'entrada', 'estado' => 'tarde']), 201);
sleep(1); // la salida debe ser posterior a la entrada (regla del trigger)
verificar('Segunda marca = salida', llamar('POST', '/api/asistencias', $recepcion, [
    'categoria' => 'empleado', 'id' => $cc['json']['datos']['idempleado'] ?? 0, 'tipo' => 'entrada']), 201, fn ($j) => str_ends_with($j['datos']['clave'], '-salida'));
$ia = verificar('Ingreso de alumno (genérico)', llamar('POST', '/api/asistencias', $recepcion, ['categoria' => 'alumno', 'id' => 1005, 'metodo' => 'pase_rapido']), 201);
verificar('Eliminar marca', llamar('DELETE', '/api/asistencias/' . ($ia['json']['datos']['clave'] ?? 'x'), $recepcion), 200);

modulo('Avisos y cuentas');
echo "\n[Reglas, clases, campañas y cuentas]\n";
verificar('Desactivar regla de notificación', llamar('PUT', '/api/reglas/1', $recepcion, ['activa' => 0]), 200, fn ($j) => (int) $j['datos']['activa'] === 0);
$cl = verificar('Publicar clase', llamar('POST', '/api/clases', $recepcion, ['nombre' => 'Zumba', 'instructor' => 'Andrea', 'horario' => '7pm', 'sala' => 'Sala 1', 'fecha' => date('Y-m-d')]), 201);
verificar('Eliminar clase', llamar('DELETE', '/api/clases/' . ($cl['json']['datos']['idclase'] ?? 0), $recepcion), 200);
verificar('Campaña en lote', llamar('POST', '/api/notificaciones/lote', $recepcion, ['notificaciones' => [
    ['titulo' => 'Promo', 'mensaje' => 'Hola', 'destino' => 'alumno', 'idalumno' => 1000, 'canal' => 'whatsapp', 'tipo' => 'promocion'],
    ['titulo' => 'Promo', 'mensaje' => 'Hola', 'destino' => 'alumno', 'idalumno' => 1001, 'canal' => 'correo', 'tipo' => 'promocion']]]), 201,
    fn ($j) => $j['datos']['enviadas'] === 2);
verificar('Editar dieta (reemplaza comidas)', llamar('PUT', '/api/dietas/2', $nutri, ['titulo' => 'Déficit ajustado', 'comidas' => [
    ['nombre' => 'Desayuno', 'hora' => '07:00', 'alimentos' => [['alimento' => 'Avena', 'gramos' => 50]]],
    ['nombre' => 'Extra nocturna', 'hora' => '22:30', 'alimentos' => [['alimento' => 'Yogur griego', 'gramos' => 150]]]]]), 200,
    fn ($j) => (int) $j['datos']['comidas_por_dia'] === 2 && (int) $j['datos']['calorias_totales'] === 340);
verificar('Crear cuenta de acceso (admin)', llamar('POST', '/api/usuarios', $admin, [
    'usuario' => 'cuenta' . $sufijo, 'clave' => 'Clave123', 'rol' => 'entrenador', 'idempleado' => $idEnt]), 201);
verificar('Clave actual incorrecta rechazada', llamar('PUT', '/api/auth/clave', $alumno, ['actual' => 'x', 'nueva' => 'Nueva123']), 422);

// Resumen
$total = count($resultados);
$fallas = array_filter($resultados, fn ($r) => !$r[2]);
echo "\n" . str_repeat('=', 70) . "\n";
$porModulo = [];
foreach ($resultados as $r) {
    $porModulo[$r[0]] ??= [0, 0];
    $porModulo[$r[0]][0]++;
    if ($r[2]) $porModulo[$r[0]][1]++;
}
foreach ($porModulo as $m => [$t, $ok]) printf("  %-22s %2d/%2d %s\n", $m, $ok, $t, $ok === $t ? 'OK' : 'CON FALLAS');
printf("\nTotal: %d pruebas, %d correctas, %d fallidas\n", $total, $total - count($fallas), count($fallas));
exit($fallas ? 1 : 0);
