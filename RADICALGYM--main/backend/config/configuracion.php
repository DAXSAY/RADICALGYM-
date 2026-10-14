<?php
// Configuración general. Cada valor puede sobrescribirse con variables de entorno.
return [
    'bd' => [
        'host'     => getenv('RG_BD_HOST') ?: '127.0.0.1',
        'puerto'   => getenv('RG_BD_PUERTO') ?: '3306',
        'nombre'   => getenv('RG_BD_NOMBRE') ?: 'radicalgym',
        'usuario'  => getenv('RG_BD_USUARIO') ?: 'root',
        'clave'    => getenv('RG_BD_CLAVE') !== false ? getenv('RG_BD_CLAVE') : 'root',
    ],
    'redis' => [
        'host'     => getenv('RG_REDIS_HOST') ?: '127.0.0.1',
        'puerto'   => (int) (getenv('RG_REDIS_PUERTO') ?: 6379),
        'prefijo'  => 'rg:',
        'ttl'      => 120, // segundos de vida de las consultas en caché
    ],
    'token' => [
        'secreto'  => getenv('RG_TOKEN_SECRETO') ?: 'radicalgym-cambiar-este-secreto-en-produccion',
        'horas'    => 8,
    ],
    'subidas' => [
        'carpeta'  => __DIR__ . '/../public/uploads',
        'url'      => '/uploads',
        'max_mb'   => 8,
        'tipos'    => ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    ],
    'cors_origen' => getenv('RG_CORS_ORIGEN') ?: '*',
];
