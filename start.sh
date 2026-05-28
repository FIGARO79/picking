#!/bin/bash

# Script de inicio rápido concurrente para la aplicación de Auditoría de Picking
# Detener el script completo si falla algún comando crítico
set -e

PROJECT_ROOT="/home/fabio/picking"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "=========================================================="
echo "🚀 INICIANDO APLICACIÓN DE AUDITORÍA DE PICKING"
echo "=========================================================="

# 1. Configurar Entorno Virtual de Python (Backend)
echo "📦 1. Configurando entorno virtual del Backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "  -> Creando entorno virtual venv..."
    python3 -m venv venv
fi

# Activar venv e instalar dependencias
source venv/bin/activate
echo "  -> Instalando / actualizando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

# 2. Verificar dependencias de Node (Frontend)
echo "📦 2. Verificando dependencias del Frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  -> Instalando paquetes de node..."
    npm install
fi

# 3. Lanzar servicios concurrentes
echo "⚡ 3. Arrancando servicios de desarrollo..."

# Handler para apagar todo al presionar Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Apagando servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servicios apagados correctamente. ¡Buen turno!"
    exit 0
}
trap cleanup INT TERM

# Arrancar Backend (FastAPI) en el puerto 8000
echo "  -> Iniciando Backend (FastAPI) en el puerto 8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!

# Esperar un segundo a que el backend monte
sleep 1.5

# Arrancar Frontend (Vite) en el puerto 5173
echo "  -> Iniciando Frontend (React + Vite) en el puerto 5173..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

# Esperar a que el frontend levante y abrir navegador automáticamente
sleep 2.5
echo "  -> Abriendo la aplicación en tu navegador predeterminado..."
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173 >/dev/null 2>&1 &
elif command -v open > /dev/null; then
    open http://localhost:5173 >/dev/null 2>&1 &
fi

echo "=========================================================="
echo "🎯 APLICACIÓN DE PICKING ARRANCADA CON ÉXITO"
echo "👉 Frontend disponible en: http://localhost:5173"
echo "👉 Backend disponible en: http://127.0.0.1:8000"
echo "📝 Logs de Backend guardados en: $PROJECT_ROOT/backend.log"
echo "=========================================================="
echo "Presiona Ctrl+C para detener ambos servicios."

# Mantener el script activo esperando los procesos de fondo
wait
