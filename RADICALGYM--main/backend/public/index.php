<?php
declare(strict_types=1);

// Los avisos de PHP van al log, nunca dentro de la respuesta JSON
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Servidor embebido: entrega directamente los archivos subidos (fotos, documentos, productos)
if (PHP_SAPI === 'cli-server') {
    $archivo = __DIR__ . urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    if (is_file($archivo) && !str_ends_with($archivo, '.php')) {
        return false;
    }
}

spl_autoload_register(function (string $clase): void {
    // Nucleo\Cache => nucleo/Cache.php ; Modulos\Alumnos\AlumnosServicio => modulos/alumnos/AlumnosServicio.php
    $partes = explode('\\', $clase);
    $archivo = array_pop($partes);
    $ruta = __DIR__ . '/../' . strtolower(implode('/', $partes)) . '/' . $archivo . '.php';
    if (is_file($ruta)) require $ruta;
});

use Nucleo\Configuracion;
use Nucleo\Enrutador;
use Nucleo\Peticion;

header('Access-Control-Allow-Origin: ' . Configuracion::obtener('cors_origen'));
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Expose-Headers: X-Cache');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$ruta = preg_replace('#^.*?/api#', '/api', $ruta);

$enrutador = new Enrutador();
foreach (glob(__DIR__ . '/../modulos/*/rutas.php') as $archivoRutas) {
    (require $archivoRutas)($enrutador);
}
$enrutador->despachar(new Peticion($_SERVER['REQUEST_METHOD'], $ruta));
