# Guía de Configuración y Despliegue en PythonAnywhere para whcol

Esta guía detalla los pasos definitivos para configurar, optimizar y ejecutar la aplicación **LOGIX WMS** (Auditoría de Picking) en tu cuenta de PythonAnywhere, utilizando nuestro adaptador síncrono personalizado para evitar bloqueos del GIL.

---

## 📋 Rutas del Proyecto en PythonAnywhere

* **Directorio Backend**: `/home/whcol/backend`
* **Directorio Frontend**: `/home/whcol/frontend`
* **Virtualenv (Entorno Virtual)**: `/home/whcol/.virtualenvs/picking-venv`

---

## 🐍 Paso 1: Instalar Dependencias en tu Entorno Virtual

Abre una consola **Bash** en PythonAnywhere y realiza los siguientes pasos para activar tu entorno e instalar las dependencias:

```bash
# Activar tu entorno virtual
source /home/whcol/.virtualenvs/picking-venv/bin/activate

# Navegar a la carpeta del backend
cd /home/whcol/backend

# Actualizar pip e instalar dependencias del proyecto
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 🗄️ Paso 2: Inicializar la Base de Datos SQLite

Con tu entorno virtual `picking-venv` activado en la consola Bash de PythonAnywhere, ejecuta el script de inicialización para crear la base de datos y sus tablas:

```bash
python init_db.py
```

> [!NOTE]
> Esto generará el archivo de la base de datos en `/home/whcol/backend/databases/picking.db`.
> Se ha desactivado la creación de base de datos en el ciclo de vida de FastAPI (`lifespan`) para prevenir un bloqueo de hilos de SQLite durante la inicialización del servidor uWSGI.

---

## 💻 Paso 3: Preparar el Frontend (React)

Dado que FastAPI sirve los archivos estáticos desde `/home/whcol/frontend/dist`, asegúrate de que el frontend esté compilado.

Si ya has subido la carpeta `/home/whcol/frontend/dist/` mediante Git o un archivo comprimido ZIP y contiene `index.html` y la carpeta `assets`, **no es necesario compilar de nuevo**.

En caso de realizar modificaciones futuras en la interfaz de React:
1. En tu máquina local, dentro de la carpeta `frontend`, ejecuta:
   ```bash
   npm run build
   ```
2. Sube la nueva carpeta `dist` resultante a `/home/whcol/frontend/dist/`.

---

## 🌐 Paso 4: Configurar la Aplicación Web en PythonAnywhere

1. Entra a la pestaña **Web** en el panel de control de PythonAnywhere.
2. Si aún no tienes creada la aplicación, haz clic en **Add a new web app**:
   * Selecciona **Manual Configuration** (no selecciones FastAPI ni Django).
   * Elige **Python 3.12** como versión.
3. Edita los siguientes campos en la sección de configuración de la pestaña **Web**:

### Code (Código)
* **Source code**: `/home/whcol/backend`
* **Working directory**: `/home/whcol` (puedes dejar el valor por defecto, ya que el archivo WSGI cambia el directorio de trabajo activamente en ejecución).

### Virtualenv (Entorno Virtual)
* **Path**: `/home/whcol/.virtualenvs/picking-venv`

### Static Files (Archivos Estáticos - Recomendado para rendimiento)
Para evitar que FastAPI gaste recursos sirviendo CSS/JS (lo cual también puede causar lentitud o bloqueos), configura a PythonAnywhere para que sirva los recursos del frontend de forma nativa mediante Nginx:
* **URL**: `/assets/`
* **Directory**: `/home/whcol/frontend/dist/assets`
* **URL**: `/favicon.svg`
* **Directory**: `/home/whcol/frontend/dist/favicon.svg`

---

## 📝 Paso 5: Configurar el Archivo WSGI

En la pestaña **Web**, busca la sección **Code** y haz clic en el enlace del archivo **WSGI configuration file** (`/var/www/whcol_pythonanywhere_com_wsgi.py`).

Reemplaza todo su contenido por el siguiente código:

```python
import sys
import os

# Definir la ruta al directorio del backend
path = '/home/whcol/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Asegurar que el directorio de trabajo activo sea el correcto
os.chdir(path)

# Importar el adaptador WSGI de FastAPI
from main import wsgi_app as application
```

---

## 💻 Paso 6: El Código de `main.py` (Adaptador Síncrono)

Para el funcionamiento fluido y sin bloqueos de la aplicación en PythonAnywhere, el archivo `/home/whcol/backend/main.py` debe utilizar nuestro adaptador síncrono personalizado en lugar de wrappers basados en hilos (como `a2wsgi` o `asgiref` clásico):

```python
import os
import uvicorn
import asyncio
import http.client
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.db import engine, Base
from app.routers import picking, shipment, config

# Instancia principal de FastAPI
app = FastAPI(
    title="Picking Audit API",
    description="Backend API para Auditoría de Picking, Packing List y Consolidados",
    version="1.0.0",
    default_response_class=ORJSONResponse
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir cualquier origen para facilitar despliegue local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar enrutadores de la API
app.include_router(picking.router)
app.include_router(shipment.router)
app.include_router(config.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "picking_audit_api",
        "version": "1.0.0"
    }

@app.get("/api")
async def root():
    return {
        "message": "Picking Audit API is running",
        "health": "/health"
    }

# Servir archivos estáticos del frontend en producción
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIR):
    # Montar la carpeta de recursos estáticos (CSS, JS, imágenes) generados por Vite
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    # Catch-all para que cualquier ruta que no sea de la API retorne el index.html de React
    # Usamos lectura síncrona tradicional y HTMLResponse para evitar el pool de hilos de anyio (FileResponse) que causa deadlocks en uWSGI
    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        if catchall.startswith("api") or catchall.startswith("health"):
            raise HTTPException(status_code=404, detail="Not Found")

        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            with open(index_file, "r", encoding="utf-8") as f:
                content = f.read()
            return HTMLResponse(content=content, status_code=200)

        raise HTTPException(status_code=404, detail="Frontend no compilado. Ejecuta 'npm run build' en la carpeta frontend.")


# Adaptador WSGI personalizado y síncrono para PythonAnywhere
# Ejecuta el bucle de eventos asíncrono de FastAPI en el mismo hilo de la petición de uWSGI.
# Esto evita por completo el GIL Deadlock al no crear hilos secundarios.
class SyncASGIMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        headers = []
        for k, v in environ.items():
            if k.startswith("HTTP_"):
                header_name = k[5:].lower().replace("_", "-").encode("latin1")
                headers.append((header_name, v.encode("latin1")))
            elif k in ("CONTENT_TYPE", "CONTENT_LENGTH"):
                header_name = k.lower().replace("_", "-").encode("latin1")
                headers.append((header_name, v.encode("latin1")))

        scope = {
            "type": "http",
            "wsgi.environ": environ,
            "method": environ["REQUEST_METHOD"],
            "path": environ.get("PATH_INFO", ""),
            "raw_path": environ.get("PATH_INFO", "").encode("latin1"),
            "query_string": environ.get("QUERY_STRING", "").encode("latin1"),
            "headers": headers,
        }

        try:
            content_length = int(environ.get("CONTENT_LENGTH") or 0)
        except ValueError:
            content_length = 0

        body = environ.get("wsgi.input").read(content_length) if content_length > 0 else b""

        async def receive():
            return {
                "type": "http.request",
                "body": body,
                "more_body": False
            }

        response_status = 200
        response_headers = []
        response_body = []

        async def send(message):
            nonlocal response_status, response_headers
            if message["type"] == "http.response.start":
                response_status = message["status"]
                response_headers = [
                    (k.decode("latin1"), v.decode("latin1"))
                    for k, v in message["headers"]
                ]
            elif message["type"] == "http.response.body":
                response_body.append(message.get("body", b""))

        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            loop.run_until_complete(self.app(scope, receive, send))
        finally:
            loop.close()

        status_text = http.client.responses.get(response_status, "OK")
        status_msg = f"{response_status} {status_text}"

        start_response(status_msg, response_headers)
        return response_body


# Instanciar el WSGI app usando nuestro adaptador síncrono ultraestable
wsgi_app = SyncASGIMiddleware(app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
```

---

## 🚀 Paso 7: Recargar y Probar

1. Ve a la pestaña **Web** en PythonAnywhere.
2. Haz clic en **Reload whcol.pythonanywhere.com**.
3. Abre tu sitio web en `http://whcol.pythonanywhere.com/`.

---

## 💡 ¿Por qué funciona esta solución? (Explicación Técnica)

1. **Evita Hilos de Segundo Plano**: En PythonAnywhere, los procesos de uWSGI corren bajo "múltiples intérpretes" y con configuraciones de un solo núcleo de procesamiento (`cores: 1`). Los adaptadores tradicionales (`a2wsgi` o `asgiref`) intentan ejecutar FastAPI creando un hilo secundario (`threading.Thread`) y forzando al hilo WSGI a esperar. En este entorno, el hilo secundario nunca logra obtener turnos del GIL (Global Interpreter Lock), resultando en un cuelgue indefinido (deadlock).
2. **Bucle en el Mismo Hilo**: `SyncASGIMiddleware` crea y ejecuta el bucle de eventos de `asyncio` directamente en el mismo hilo de la petición que maneja uWSGI. Al no haber hilos secundarios compitiendo por el GIL, la ejecución es inmediata.
3. **Servicio Síncrono de HTML**: Servir el HTML con lectura síncrona clásica y `HTMLResponse` previene que FastAPI tenga que invocar el pool de hilos de `anyio` (el cual es requerido internamente por `FileResponse` y causa el mismo tipo de bloqueo del GIL).
4. **Nginx para Estáticos**: Delegar la carpeta `/assets` a la sección **Static Files** de PythonAnywhere remueve la carga de servir imágenes, CSS y JS de FastAPI, haciendo que el sitio sea extremadamente rápido y 100% inmune a bloqueos.
