<?php
namespace Nucleo;

use PDOException;
use Throwable;

/** Enrutador REST con control de roles por ruta. */
final class Enrutador
{
    public const TODOS = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta', 'alumno'];
    public const PERSONAL = ['administrador', 'recepcion', 'entrenador', 'nutricionista', 'fisioterapeuta'];

    private array $rutas = [];

    /**
     * @param string[]|null $roles null = pública
     */
    public function agregar(string $metodo, string $patron, callable $accion, ?array $roles = self::TODOS): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', rtrim($patron, '/')) . '$#';
        $this->rutas[] = compact('metodo', 'regex', 'accion', 'roles');
    }

    public function get(string $p, callable $a, ?array $r = self::TODOS): void { $this->agregar('GET', $p, $a, $r); }
    public function post(string $p, callable $a, ?array $r = self::TODOS): void { $this->agregar('POST', $p, $a, $r); }
    public function put(string $p, callable $a, ?array $r = self::TODOS): void { $this->agregar('PUT', $p, $a, $r); }
    public function delete(string $p, callable $a, ?array $r = self::TODOS): void { $this->agregar('DELETE', $p, $a, $r); }

    public function despachar(Peticion $peticion): never
    {
        try {
            $rutaEncontrada = false;
            foreach ($this->rutas as $r) {
                if (!preg_match($r['regex'], rtrim($peticion->ruta, '/') ?: '/', $m)) continue;
                $rutaEncontrada = true;
                if ($r['metodo'] !== $peticion->metodo) continue;

                $peticion->parametros = array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
                if ($r['roles'] !== null) {
                    $peticion->usuario = Autenticacion::verificar($_SERVER['HTTP_AUTHORIZATION'] ?? null);
                    if (!$peticion->usuario) {
                        Respuesta::error('Sesión no válida o expirada', 401);
                    }
                    if (!in_array($peticion->usuario['rol'], $r['roles'], true)) {
                        Respuesta::error('No tienes permiso para esta acción', 403);
                    }
                }
                ($r['accion'])($peticion);
                Respuesta::ok();
            }
            Respuesta::error($rutaEncontrada ? 'Método no permitido' : 'Ruta no encontrada', $rutaEncontrada ? 405 : 404);
        } catch (ErrorHttp $e) {
            Respuesta::error($e->getMessage(), $e->estado, $e->errores);
        } catch (PDOException $e) {
            $info = $e->errorInfo ?? [];
            // SIGNAL desde triggers/procedimientos => error de negocio
            if (($info[0] ?? '') === '45000') {
                Respuesta::error($info[2] ?? 'Operación no permitida', 422);
            }
            if (($info[0] ?? '') === '23000') {
                $msg = str_contains($info[2] ?? '', 'Duplicate') ? 'Ya existe un registro con esos datos' : 'El registro está relacionado con otros datos';
                Respuesta::error($msg, 409);
            }
            error_log($e->getMessage());
            Respuesta::error('Error de base de datos', 500);
        } catch (Throwable $e) {
            error_log($e->getMessage() . ' ' . $e->getFile() . ':' . $e->getLine());
            Respuesta::error('Error interno del servidor', 500);
        }
    }
}
