import asyncio
import os
import sys

# Agregar el directorio actual al path para importar correctamente app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import engine, Base
# Importar modelos para que SQLAlchemy los reconozca al crear las tablas
from app.models.sql_models import PickingAudit, PickingAuditItem, PickingPackage, PickingPackageItem

async def init_models():
    print("Inicializando base de datos SQLite y creando tablas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tablas de base de datos creadas con éxito.")

if __name__ == "__main__":
    asyncio.run(init_models())
