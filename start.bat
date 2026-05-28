@echo off
:: Script de inicio rápido de Picking con instalación automática de Python, i18n y npm
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
    set "PATH=%USERPROFILE%\.local\bin;%PATH%"
    where uv >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📥 UV no detectado. Instalando Astral UV mediante PowerShell...
        powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"
        set "PATH=%USERPROFILE%\.local\bin;%PATH%"
        
        where uv >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ No se pudo instalar Astral UV de forma automática.
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

if not exist "venv" (
    echo   -^> Creando entorno virtual venv y descargando Python portable automáticamente...
    uv venv venv --python 3.12
)

echo   -^> Instalando dependencias de Python de forma ultra-rápida con UV...
uv pip install -r requirements.txt

:: --- INTEGRACIÓN DE NODEENV (AUTOINSTALACIÓN DE NPM EN VENV) ---
echo 🔍 Verificando npm dentro del entorno virtual...
call venv\Scripts\activate.bat
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo   -^> npm no encontrado en el entorno virtual. Instalando Node.js / npm mediante nodeenv...
    uv pip install nodeenv
    nodeenv -p
    echo   -^> ✅ Node.js y npm instalados correctamente en el entorno virtual.
)
:: ---------------------------------------------------------------

:: 3. Verificar dependencias de Node (Frontend)
echo 📦 3. Verificando dependencias del Frontend...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo   -^> Instalando paquetes de node usando npm del entorno virtual...
    call npm install
)

:: 4. Lanzar servicios concurrentes con UV
echo ⚡ 4. Arrancando servicios de desarrollo...

echo   -^> Iniciando Backend (FastAPI) con UV en el puerto 8000...
start "FastAPI Backend - Picking" /D "%BACKEND_DIR%" cmd /c "set PATH=%USERPROFILE%\.local\bin;%PATH% && uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

:: OJO: Activamos el venv en la nueva ventana antes de correr npm para que use el npm local
echo   -^> Iniciando Frontend (React + Vite) en el puerto 5173...
start "Vite Frontend - Picking" /D "%FRONTEND_DIR%" cmd /c "call ""%BACKEND_DIR%\venv\Scripts\activate.bat"" && npm run dev"

timeout /t 3 /nobreak >nul
echo   -^> Abriendo la aplicación en tu navegador predeterminado...
start http://localhost:5173

echo ==========================================================
echo 🎯 APLICACIÓN DE PICKING ARRANCADA CON ÉXITO
echo ==========================================================
pause
