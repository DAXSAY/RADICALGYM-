<?php
namespace Nucleo;

/**
 * Guarda archivos subidos con la nomenclatura del proyecto:
 *   {id}_{tabla}_{tipo}.{ext}            ej. 1003_alumnos_foto.jpg, 4_contratos_documento.pdf
 *   {idproducto}_productos_{nombre}.{ext} ej. 3_productos_proteina_whey_2_lb.png (carpeta propia)
 */
final class Archivos
{
    public static function guardar(string $campo, string $tabla, int $id, string $tipo, ?array $permitidos = null): string
    {
        $cfg = Configuracion::obtener('subidas');
        $archivo = $_FILES[$campo] ?? null;
        if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
            throw new ErrorHttp('No se recibió el archivo "' . $campo . '"', 422);
        }
        if ($archivo['size'] > $cfg['max_mb'] * 1024 * 1024) {
            throw new ErrorHttp("El archivo supera {$cfg['max_mb']} MB", 422);
        }
        $ext = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
        $permitidos ??= $cfg['tipos'];
        if (!in_array($ext, $permitidos, true)) {
            throw new ErrorHttp('Tipo de archivo no permitido: ' . $ext, 422);
        }
        $nombre = "{$id}_{$tabla}_" . self::slug($tipo) . ".{$ext}";
        $carpeta = $cfg['carpeta'] . '/' . $tabla;
        if (!is_dir($carpeta)) mkdir($carpeta, 0775, true);

        // Elimina versiones previas con otra extensión
        foreach (glob($carpeta . "/{$id}_{$tabla}_" . self::slug($tipo) . '.*') ?: [] as $previo) {
            @unlink($previo);
        }
        $destino = "{$carpeta}/{$nombre}";
        if (!move_uploaded_file($archivo['tmp_name'], $destino) && !rename($archivo['tmp_name'], $destino)) {
            throw new ErrorHttp('No se pudo guardar el archivo', 500);
        }
        return "{$tabla}/{$nombre}";
    }

    public static function url(?string $ruta): ?string
    {
        return $ruta ? Configuracion::obtener('subidas')['url'] . '/' . $ruta : null;
    }

    public static function slug(string $texto): string
    {
        $texto = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto) ?: $texto;
        $texto = strtolower(preg_replace('/[^A-Za-z0-9]+/', '_', $texto));
        return trim($texto, '_');
    }
}
