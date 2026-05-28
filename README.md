# 📦 LOGIX WMS — Sistema de Auditoría de Picking

> **[Español](#-español) · [Português Brasil](#-português-brasil)**

---

## 🇪🇸 Español

### ¿Qué es este sistema?

**LOGIX WMS** es una aplicación web de auditoría y empaque de pedidos de picking. Permite a los operadores de bodega:

- Cargar y verificar pedidos de picking por número de orden y despacho
- Escanear SKUs mediante cámara (QR/barras) o entrada manual
- Asignar artículos a bultos y registrar dimensiones y peso de cada caja
- Generar e imprimir Packing Lists por bulto con soporte multi-idioma
- Gestionar transportadoras y configuración de bodega
- Consultar el historial de auditorías realizadas

### 🛠️ Requisitos previos

| Herramienta | Versión mínima | ¿Auto-instalado? | Notas |
|-------------|----------------|-----------------|-------|
| **Python** | 3.10+ | ✅ Sí (Windows, vía UV) | En Linux/macOS debe estar instalado |
| **Node.js** | 18+ | ❌ No, manual | Descargar en https://nodejs.org |
| **npm** | 8+ | ✅ Sí | Se incluye con Node.js |

> ⚠️ **Windows**: El script `start.bat` instala Python automáticamente mediante [Astral UV](https://docs.astral.sh/uv/), pero **Node.js debe instalarse manualmente** antes de ejecutar el script.
> 👉 Descarga Node.js LTS aqui: **https://nodejs.org/es/download**

### 🚀 Instalación y ejecución

#### Linux / macOS

```bash
# 1. Clonar el repositorio
git clone https://github.com/FIGARO79/picking.git
cd picking

# 2. Dar permisos al script de inicio
chmod +x start.sh

# 3. Iniciar la aplicación (instala dependencias automáticamente)
./start.sh
```

#### Windows

**Opción A — Descargar ZIP (sin Git)**

1. Ve a **https://github.com/FIGARO79/picking**
2. Haz clic en el botón verde **`< > Code`** → **`Download ZIP`**
3. Extrae el ZIP en la carpeta que prefieras (ej: `C:\picking`)
4. Dentro de la carpeta extraída, haz **doble clic en `start.bat`**

**Opción B — Clonar con Git**

```bat
REM Desde CMD o PowerShell:
git clone https://github.com/FIGARO79/picking.git
cd picking
start.bat
```

> En ambos casos, el script `start.bat` instala Python automáticamente.
> ⚠️ **Node.js debe estar instalado previamente**: https://nodejs.org/es/download

### 🌐 URLs de acceso

| Servicio | URL |
|----------|-----|
| **Frontend** (interfaz web) | http://localhost:5173 |
| **Backend API** (FastAPI) | http://127.0.0.1:8000 |
| **Documentación API** | http://127.0.0.1:8000/docs |

### 📁 Estructura del proyecto

```
picking/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuración, base de datos, i18n
│   │   ├── models/        # Esquemas Pydantic y modelos SQL
│   │   └── routers/       # Endpoints: picking, config, shipments
│   ├── databases/         # Archivos CSV y base de datos SQLite
│   ├── main.py            # Punto de entrada FastAPI
│   └── requirements.txt   # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── components/    # ScannerModal, DimensionScanner, Layout
│   │   ├── context/       # Contexto de idioma (ES/PT)
│   │   ├── pages/         # Dashboard, PickingAudit, PackingListPrint...
│   │   └── utils/         # Traducciones
│   └── package.json
├── start.sh               # Script de inicio (Linux/macOS)
└── start.bat              # Script de inicio (Windows)
```

### ⚙️ Stack tecnológico

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Framework web asíncrono
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM con SQLite
- [Polars](https://pola.rs/) — Procesamiento de archivos CSV/Excel
- [Uvicorn](https://www.uvicorn.org/) — Servidor ASGI

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- CSS puro con variables de diseño (sin Tailwind)
- API de cámara nativa del navegador para escaneo QR/códigos de barras

### 🔧 Ejecución manual (sin scripts)

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

### 🛑 Detener la aplicación

- **Linux/macOS**: Presiona `Ctrl+C` en la terminal donde corre `start.sh`
- **Windows**: Cierra las dos ventanas de consola abiertas por `start.bat`

---

## 🇧🇷 Português Brasil

### O que é este sistema?

**LOGIX WMS** é uma aplicação web de auditoria e empacotamento de pedidos de picking. Permite aos operadores de armazém:

- Carregar e verificar pedidos de picking por número de ordem e despacho
- Escanear SKUs via câmera (QR/código de barras) ou entrada manual
- Atribuir itens a volumes e registrar dimensões e peso de cada caixa
- Gerar e imprimir Packing Lists por volume com suporte multi-idioma
- Gerenciar transportadoras e configuração do armazém
- Consultar o histórico de auditorias realizadas

### 🛠️ Pré-requisitos

| Ferramenta | Versão mínima | Instalado automaticamente? | Observações |
|------------|---------------|--------------------------|-------------|
| **Python** | 3.10+ | ✅ Sim (Windows, via UV) | No Linux/macOS deve estar instalado |
| **Node.js** | 18+ | ❌ Não, manual | Baixar em https://nodejs.org |
| **npm** | 8+ | ✅ Sim | Incluído com o Node.js |

> ⚠️ **Windows**: O script `start.bat` instala o Python automaticamente via [Astral UV](https://docs.astral.sh/uv/), mas o **Node.js deve ser instalado manualmente** antes de executar o script.
> 👉 Baixe o Node.js LTS aqui: **https://nodejs.org/pt/download**

### 🚀 Instalação e execução

#### Linux / macOS

```bash
# 1. Clonar o repositório
git clone https://github.com/FIGARO79/picking.git
cd picking

# 2. Dar permissão ao script de início
chmod +x start.sh

# 3. Iniciar a aplicação (instala dependências automaticamente)
./start.sh
```

#### Windows

**Opção A — Baixar ZIP (sem Git)**

1. Acesse **https://github.com/FIGARO79/picking**
2. Clique no botão verde **`< > Code`** → **`Download ZIP`**
3. Extraia o ZIP na pasta de sua preferência (ex: `C:\picking`)
4. Dentro da pasta extraída, dê **duplo clique em `start.bat`**

**Opção B — Clonar com Git**

```bat
REM Pelo CMD ou PowerShell:
git clone https://github.com/FIGARO79/picking.git
cd picking
start.bat
```

> Em ambos os casos, o script `start.bat` instala o Python automaticamente.
> ⚠️ **O Node.js deve estar instalado previamente**: https://nodejs.org/pt/download

### 🌐 URLs de acesso

| Serviço | URL |
|---------|-----|
| **Frontend** (interface web) | http://localhost:5173 |
| **Backend API** (FastAPI) | http://127.0.0.1:8000 |
| **Documentação da API** | http://127.0.0.1:8000/docs |

### 📁 Estrutura do projeto

```
picking/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuração, banco de dados, i18n
│   │   ├── models/        # Schemas Pydantic e modelos SQL
│   │   └── routers/       # Endpoints: picking, config, shipments
│   ├── databases/         # Arquivos CSV e banco de dados SQLite
│   ├── main.py            # Ponto de entrada FastAPI
│   └── requirements.txt   # Dependências Python
├── frontend/
│   ├── src/
│   │   ├── components/    # ScannerModal, DimensionScanner, Layout
│   │   ├── context/       # Contexto de idioma (ES/PT)
│   │   ├── pages/         # Dashboard, PickingAudit, PackingListPrint...
│   │   └── utils/         # Traduções
│   └── package.json
├── start.sh               # Script de início (Linux/macOS)
└── start.bat              # Script de início (Windows)
```

### ⚙️ Stack tecnológico

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Framework web assíncrono
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM com SQLite
- [Polars](https://pola.rs/) — Processamento de arquivos CSV/Excel
- [Uvicorn](https://www.uvicorn.org/) — Servidor ASGI

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- CSS puro com variáveis de design (sem Tailwind)
- API de câmera nativa do navegador para leitura de QR/código de barras

### 🔧 Execução manual (sem scripts)

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

### 🛑 Parar a aplicação

- **Linux/macOS**: Pressione `Ctrl+C` no terminal onde está rodando `start.sh`
- **Windows**: Feche as duas janelas de console abertas pelo `start.bat`

---

<div align="center">

**LOGIX WMS** · Auditoría de Picking / Auditoria de Picking  
Desarrollado con ❤️ para operaciones de bodega / Desenvolvido com ❤️ para operações de armazém

</div>
