from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import DATABASE_URL

# Crear motor de base de datos asíncrono
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} # Requerido para SQLite en múltiples hilos
)

# Creador de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Clase base declarativa para modelos ORM
class Base(DeclarativeBase):
    pass

# Dependencia de FastAPI para inyectar la sesión en los endpoints
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
