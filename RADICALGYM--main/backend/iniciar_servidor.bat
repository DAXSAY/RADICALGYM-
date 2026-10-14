@echo off
REM Inicia la API de Radical Gym en http://localhost:8000
cd /d "%~dp0"
php -S localhost:8000 -t public public/index.php
