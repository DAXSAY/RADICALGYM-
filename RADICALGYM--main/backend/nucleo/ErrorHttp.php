<?php
namespace Nucleo;

/** Excepción con código HTTP que el enrutador convierte en respuesta JSON. */
final class ErrorHttp extends \RuntimeException
{
    public function __construct(string $mensaje, public int $estado = 400, public array $errores = [])
    {
        parent::__construct($mensaje);
    }
}
