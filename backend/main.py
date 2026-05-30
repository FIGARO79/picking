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
