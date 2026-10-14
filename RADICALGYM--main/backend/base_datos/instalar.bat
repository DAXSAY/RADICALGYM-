@echo off
REM Crea (o recrea) la base radicalgym con tablas, triggers, procedimientos y datos de prueba.
REM Uso: instalar.bat [usuario] [clave]   (por defecto root / root)
set USUARIO=%1
set CLAVE=%2
if "%USUARIO%"=="" set USUARIO=root
if "%CLAVE%"=="" set CLAVE=root
cd /d "%~dp0"
for %%f in (01_esquema.sql 02_triggers.sql 03_procedimientos.sql 04_datos_prueba.sql 05_datos_modulos.sql) do (
  echo Ejecutando %%f
  mysql -u%USUARIO% -p%CLAVE% --default-character-set=utf8mb4 < %%f || exit /b 1
)
echo Base radicalgym lista.
