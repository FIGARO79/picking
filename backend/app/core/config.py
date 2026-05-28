import os

# Raíz del proyecto backend
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Carpeta de bases de datos y CSV
DATABASES_DIR = os.path.join(BACKEND_DIR, 'databases')

# Rutas de archivos
PICKING_CSV_PATH = os.path.join(DATABASES_DIR, 'AURRSGLBD0240.csv')
SQLITE_DB_PATH = os.path.join(DATABASES_DIR, 'picking.db')

DATABASE_URL = f"sqlite+aiosqlite:///{SQLITE_DB_PATH}"
