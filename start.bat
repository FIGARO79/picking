@echo off
:: Script de inicio rápido de Picking con instalación automática de Python e i18n mediante Astral UV
chcp 65001 >nul

set "PROJECT_ROOT=%~dp0"
set "BACKEND_DIR=%PROJECT_ROOT%backend"
set "FRONTEND_DIR=%PROJECT_ROOT%frontend"

echo ==========================================================
echo 🚀 INICIANDO APLICACIÓN CON INSTALACIÓN AUTOMÁTICA (UV)
echo ==========================================================

:: 1. Verificar o instalar Astral UV
echo 🔍 Verificando si Astral UV está disponible...
where uv >nul 2>&1
if %errorlevel% neq 0 (
    :: Agregar la ruta estándar de instalación de uv por si ya está instalado pero no en el PATH actual
    set "PATH=%USERPROFILE%\.local\bin;%PATH%"
    where uv >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📥 UV no detectado. Instalando Astral UV de forma automática mediante PowerShell...
        powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
        set "PATH=%USERPROFILE%\.local\bin;%PATH%"
        
        :: Doble verificación de instalación exitosa
        where uv >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ No se pudo instalar Astral UV de forma automática.
            echo Por favor, instala Python o UV manualmente.
            pause
            exit /b 1
        )
        echo ✅ Astral UV instalado con éxito.
    ) else (
        echo ✅ Astral UV detectado en la ruta local del usuario.
    )
) else (
    echo ✅ Astral UV ya está disponible en el sistema.
)

:: 2. Crear entorno virtual y descargar Python automáticamente con UV
echo 📦 2. Configurando entorno de Python con UV...
cd /d "%BACKEND_DIR%"

:: Si no existe el entorno virtual, crearlo. UV descargará Python automáticamente si no está instalado
if not exist "venv" (
    echo   -^> Creando entorno virtual venv y descargando Python portable automáticamente...
    uv venv venv --python 3.12
)

echo   -^> Instalando dependencias de Python de forma ultra-rápida con UV...
uv pip install -r requirements.txt

:: 3. Verificar dependencias de Node (Frontend)
echo 📦 3. Verificando dependencias del Frontend...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo   -^> Instalando paquetes de node...
    call npm install
)

:: 4. Lanzar servicios concurrentes con UV
echo ⚡ 4. Arrancando servicios de desarrollo...

:: Arrancar Backend (FastAPI) usando uv run
echo   -^> Iniciando Backend (FastAPI) con UV en el puerto 8000...
start "FastAPI Backend - Picking" /D "%BACKEND_DIR%" cmd /c "set PATH=%USERPROFILE%\.local\bin;%PATH% && uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Esperar 2 segundos para dar estabilidad al Backend
timeout /t 2 /nobreak >nul

:: Arrancar Frontend (Vite)
echo   -^> Iniciando Frontend (React + Vite) en el puerto 5173...
start "Vite Frontend - Picking" /D "%FRONTEND_DIR%" cmd /c "npm run dev"

:: Esperar 2.5 segundos para dar estabilidad al Frontend y abrir el navegador predeterminado
timeout /t 3 /nobreak >nul
echo   -^> Abriendo la aplicación en tu navegador predeterminado...
start http://localhost:5173

echo ==========================================================
echo 🎯 APLICACIÓN DE PICKING ARRANCADA CON ÉXITO
echo 👉 Frontend disponible en: http://localhost:5173
echo 👉 Backend disponible en: http://127.0.0.1:8000
echo ==========================================================
echo Se han abierto dos consolas en segundo plano:
echo - Una consola para el Backend (FastAPI) corriendo bajo UV
echo - Una consola para el Frontend (Vite)
echo.
echo Puedes cerrar esta terminal principal. Para detener la app,
echo simplemente cierra las dos ventanas secundarias abiertas.
pause
