# Radical Gym

Sistema de gestión del gimnasio: frontend React + Vite y backend PHP 8.3 con MySQL y Redis (Memurai).

## Puesta en marcha

1. **Base de datos** (MySQL local, usuario `root` / clave `root`):
   `backend\base_datos\instalar.bat` crea la base `radicalgym` con tablas, triggers, procedimientos y datos de prueba.
2. **Redis**: inicia el servicio Memurai (como administrador) o ejecuta `"C:\Program Files\Memurai\memurai.exe"`.
   Si Redis no está disponible la API sigue funcionando, solo sin caché.
3. **API PHP**: `backend\iniciar_servidor.bat` → http://localhost:8000
4. **Frontend**: `npm install` y `npm run dev` → http://localhost:3000 (redirige `/api` y `/uploads` a la API).
5. **Prueba de endpoints**: `php backend\pruebas\prueba_endpoints.php` (142 verificaciones por módulo).
   La prueba crea registros (alumno, empleado, venta…); vuelve a ejecutar `instalar.bat` para dejar los datos limpios.

Los usuarios de prueba y su clave están documentados al inicio de `backend/base_datos/04_datos_prueba.sql`.
Los alumnos ingresan con su DNI; al registrar un alumno o trabajador su clave inicial es su DNI.

## Base de datos

- Tablas y columnas en español; los identificadores son `idalumno`, `idempleado`, `idnutricionista`, etc.
- Alumnos y empleados se numeran desde **1000**.
- Sin vistas: solo consultas `SELECT` y procedimientos almacenados (`sp_*`).
- Triggers: fechas de fin de matrícula y contrato, ingresos automáticos en caja, stock y totales de ventas,
  IMC e índice cintura/cadera, kcal por gramos en dietas, número de sesión de fisioterapia, cruces de citas,
  estado puntual/tarde y horas trabajadas, días de permiso aprobados, aviso de stock bajo y auditoría.

## Backend (`backend/`)

```
public/index.php          front controller (CORS, rutas, archivos subidos)
public/uploads/<tabla>/   archivos subidos: {id}_{tabla}_{tipo}.ext   ej. 1003_alumnos_foto.jpg
public/uploads/productos/ imágenes de productos: {idproducto}_productos_{nombre}.ext
nucleo/                   BD, enrutador con roles, tokens, caché Redis, paginación, archivos
modulos/<modulo>/         rutas.php + Controlador (+ Servicio)
base_datos/               01_esquema, 02_triggers, 03_procedimientos, 04_datos_prueba
pruebas/                  prueba_endpoints.php
```

Todas las listas aceptan `?pagina=` y `?por_pagina=` (máx. 50). Las lecturas se guardan en Redis y se invalidan por módulo al escribir (cabecera `X-Cache: HIT|MISS`).

## Frontend (`src/`)

Diseño y pantallas del frontend original (respaldo en `../respaldo_frontend_original.zip`), conectados a la API.

```
nucleo/contexto/          GymContext: carga inicial (/api/datos) y acciones de cada módulo
nucleo/diseno/            Header y Sidebar originales (menú filtrado por rol)
nucleo/ui/Paginador.tsx   paginación de listados grandes
modulos/<modulo>/
  servicio.ts             llamadas a la API y adaptación de datos (español <-> pantalla)
  controlador.ts          acciones del módulo (actualiza la pantalla y guarda en la API)
  ui/                     pantallas y diálogos
  router.tsx              pestaña del módulo y roles que la ven
```

Roles: administrador, recepción, entrenador, nutricionista, fisioterapeuta y alumno; el sidebar muestra solo los módulos de cada rol.
