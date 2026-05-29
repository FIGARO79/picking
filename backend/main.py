import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from a2wsgi import ASGIMiddleware

from app.core.db import engine, Base
from app.routers import picking, shipment, config

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida de la aplicación de picking (inicio y cierre)."""
    print("Iniciando aplicación de Auditoría de Picking...")
    
    # Crear las tablas automáticamente en la base de datos SQLite si no existen
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    print("Tablas de base de datos listas.")
    yield
    print("Cerrando aplicación de Auditoría de Picking...")

app = FastAPI(
    title="Picking Audit API",
    description="Backend API para Auditoría de Picking, Packing List y Consolidados",
    version="1.0.0",
    lifespan=lifespan,
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
    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        if catchall.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
            
        raise HTTPException(status_code=404, detail="Frontend no compilado. Ejecuta 'npm run build' en la carpeta frontend.")

# Adaptador WSGI para PythonAnywhere
wsgi_app = ASGIMiddleware(app)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
