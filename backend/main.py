import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

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

@app.get("/")
async def root():
    return {
        "message": "Picking Audit API is running",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
