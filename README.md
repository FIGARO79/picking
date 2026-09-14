# 📦 LOGIX WMS — Sistema de Auditoría de Picking

> **[Español](#-español) · [Português Brasil](#-português-brasil)**

---

## 🇪🇸 Español

### ¿Qué es este sistema?

**LOGIX WMS** es una aplicación web empresarial de auditoría de pedidos, control dimensional y empaque de despacho (Packing List). Diseñada con la filosofía visual **Microsoft Fluent UI**, permite a los operadores de bodega gestionar de manera ágil y rigurosa todo el ciclo de verificación previo al envío.

### 🌟 Funcionalidades Principales

- **Auditoría de Picking Ciega**: Verificación de artículos sin mostrar cantidades requeridas ni diferencias en pantalla, garantizando un control físico objetivo y libre de sesgos.
- **Cálculo Automático de Pesos**:
  - Peso unitario sincronizado automáticamente desde el maestro o reporte logístico 240 (`AURRSGLBD0240.csv`).
  - **Peso de Línea**: Cálculo dinámico en tiempo real (`cantidad escaneada × peso unitario`).
  - **Peso Neto**: Sumatoria del peso físico de todos los artículos escaneados.
  - **Peso Bruto**: Peso de báscula registrado por el operador para cada caja o bulto.
  - **Peso Requerido**: Peso teórico de referencia según la orden original.
  - Indicador de tara/diferencia entre báscula y peso neto.
- **Registro Dimensional y Volumétrico de Bultos**:
  - Captura de **Largo × Ancho × Alto (cm)** y peso por bulto.
  - Cálculo automático de volumen en decímetros cúbicos (dm³).
- **Packing List Imprimible por Bulto**:
  - Generación de etiquetas y hojas de empaque paginadas (`PÁG 1 / N`).
  - Tabla detallada con columna de **PESO LÍNEA** y pie de tabla con totales.
  - Resumen inferior con **PESO NETO DEL BULTO**, **PESO BRUTO** y **MEDIDAS DEL BULTO**.
  - Estilos de impresión física optimizados (`@media print`) para formato carta o térmico sin cortes.
- **Envíos Consolidados (Shipments)**:
  - Agrupación de múltiples auditorías para un mismo transportista o ruta.
  - Packing List consolidado multi-orden.
- **Historial Completo y Exportación a Excel**:
  - Tabla histórica con desglose expandible de pesos, medidas de bultos y artículos auditados.
  - Exportación a `.xlsx` estilizado profesionalmente con todas las métricas de peso (bruto, neto, requerido y por línea).
- **Gestión y Actualización de Archivos**:
  - Página dedicada (`/update`) accesible desde el menú de Configuración para subir reportes actualizados.
- **Diseño Microsoft Fluent UI**:
  - Interfaz de alto contraste, tipografía optimizada, navegación fluida con Drawer lateral y componentes modales accesibles.
- **Bilingüe (i18n)**:
  - Soporte nativo para Español (`es`) y Portugués de Brasil (`pt-BR`).

### 🛠️ Requisitos previos

| Herramienta | Versión mínima | ¿Auto-instalado? | Notas |
|-------------|----------------|-----------------|-------|
| **Python** | 3.10+ | ✅ Sí (Windows, vía UV) | En Linux/macOS debe estar instalado |
| **Node.js** | 18+ | ❌ No, manual | Descargar en https://nodejs.org |
| **npm** | 8+ | ✅ Sí | Se incluye con Node.js |

> ⚠️ **Windows**: El script `start.bat` instala Python automáticamente mediante [Astral UV](https://docs.astral.sh/uv/), pero **Node.js debe instalarse manualmente** antes de ejecutar el script.  
> 👉 Descarga Node.js LTS aquí: **https://nodejs.org/es/download**

### 🚀 Instalación y ejecución

#### Linux / macOS

```bash
# 1. Clonar el repositorio
git clone https://github.com/FIGARO79/picking.git
cd picking

# 2. Dar permisos al script de inicio
chmod +x start.sh

# 3. Iniciar la aplicación (instala dependencias y arranca backend y frontend)
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

> ⚠️ **Node.js debe estar instalado previamente**: https://nodejs.org/es/download

### 🌐 URLs de acceso

| Servicio | URL |
|----------|-----|
| **Frontend** (interfaz web) | http://localhost:5173 |
| **Backend API** (FastAPI) | http://127.0.0.1:8000 |
| **Documentación API** (Swagger) | http://127.0.0.1:8000/docs |

### 📁 Estructura del proyecto

```
picking/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuración, SQLite asíncrono, i18n
│   │   ├── models/        # Esquemas Pydantic y modelos SQLAlchemy
│   │   └── routers/       # Endpoints: picking, shipments, config
│   ├── databases/         # CSV maestro (AURRSGLBD0240.csv) y SQLite (picking.db)
│   ├── main.py            # Entrada FastAPI
│   └── requirements.txt   # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── components/    # Layout, ScannerModal, DimensionScanner, Spinner
│   │   ├── context/       # LanguageContext (ES / PT)
│   │   ├── pages/         # Dashboard, PickingAudit, PickingAuditHistory,
│   │   │                  # PackingListPrint, Shipments, Settings, FileUploadPage
│   │   ├── styles/        # FluentPages.css (Diseño Microsoft Fluent UI)
│   │   └── utils/         # Diccionario de traducciones (translations.js)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── start.sh               # Script de inicio (Linux/macOS)
└── start.bat              # Script de inicio (Windows)
```

### ⚙️ Stack tecnológico

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — API web asíncrona de alto rendimiento
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM asíncrono con base de datos SQLite
- [Polars](https://pola.rs/) — Lectura ultrarrápida y normalización de archivos de picking
- [OpenPyXL](https://openpyxl.readthedocs.io/) — Generación de informes Excel con formato institucional
- [Uvicorn](https://www.uvicorn.org/) — Servidor ASGI

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + Hoja de estilos **Fluent UI** (`FluentPages.css`)
- [Lucide React](https://lucide.dev/) — Iconografía moderna
- API nativa de cámara / MediaDevices para escaneo de códigos QR y barras
- [React-Toastify](https://fkhadra.github.io/react-toastify/) — Notificaciones contextuales

### 🔧 Ejecución manual (desarrollo)

```bash
# Terminal 1: Backend
cd backend
python3 -m venv venv
source venv/bin/activate          # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 🇧🇷 Português Brasil

### O que é este sistema?

**LOGIX WMS** é uma aplicação web corporativa para auditoria de pedidos de picking, medição volumétrica e emissão de listas de embalagem (Packing List). Desenvolvida sob o padrão visual **Microsoft Fluent UI**, proporciona agilidade, precisão e rastreabilidade total às operações logísticas de armazém.

### 🌟 Principais Funcionalidades

- **Auditoria de Picking Cega**: Contagem física sem exibir quantidades requisitadas ou diferenças na tela, prevenindo vícios e garantindo máxima conformidade.
- **Cálculo Automático de Pesos**:
  - Peso unitário obtido automaticamente da base ou relatório 240 (`AURRSGLBD0240.csv`).
  - **Peso por Linha**: Multiplicação em tempo real (`quantidade lida × peso unitário`).
  - **Peso Líquido**: Soma do peso de todos os itens conferidos.
  - **Peso Bruto**: Peso de balança informado pelo operador para cada volume.
  - **Peso Requisitado**: Peso teórico de referência do pedido original.
- **Medições e Cubagem dos Volumes**:
  - Registro de **Comprimento × Largura × Altura (cm)** e peso por caixa/volume.
  - Cálculo automático de cubagem em decímetros cúbicos (dm³).
- **Packing List Imprimível por Volume**:
  - Emissão paginada por volume (`PÁG 1 / N`).
  - Tabela com coluna **PESO LINHA** e rodapé com totalizadores.
  - Bloco de resumo inferior com **PESO LÍQUIDO DO VOLUME**, **PESO BRUTO** e **MEDIDAS DO VOLUME**.
  - Otimizado para impressão direta ou geração de PDF (`@media print`).
- **Despachos Consolidados (Shipments)**:
  - Agrupamento de pedidos em remessas por transportadora com Packing List unificado.
- **Histórico Completo e Exportação para Excel**:
  - Painel com detalhamento expansível de pesos, medidas e itens auditados.
  - Exportação para `.xlsx` estilizado profissionalmente com métricas completas de peso.
- **Atualização de Arquivos**:
  - Tela dedicada (`/update`) acessível pelo menu de Configurações para upload de planilhas.
- **Interface Microsoft Fluent UI**:
  - Alto contraste, navegação fluida com Drawer lateral, tipografia corporativa e excelente usabilidade.
- **Suporte Bilíngue**:
  - Disponível em Espanhol (`es`) e Português do Brasil (`pt-BR`).

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

# 3. Iniciar a aplicação
./start.sh
```

#### Windows

**Opção A — Baixar ZIP (sem Git)**

1. Acesse **https://github.com/FIGARO79/picking**
2. Clique em **`< > Code`** → **`Download ZIP`**
3. Extraia o arquivo ZIP (ex: `C:\picking`)
4. Dê **duplo clique em `start.bat`**

**Opção B — Clonar com Git**

```bat
git clone https://github.com/FIGARO79/picking.git
cd picking
start.bat
```

### 🌐 URLs de acesso

| Serviço | URL |
|---------|-----|
| **Frontend** (interface web) | http://localhost:5173 |
| **Backend API** (FastAPI) | http://127.0.0.1:8000 |
| **Documentação da API** (Swagger) | http://127.0.0.1:8000/docs |

### ⚙️ Stack tecnológico

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — Framework web assíncrono
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM assíncrono com SQLite
- [Polars](https://pola.rs/) — Processamento eficiente de dados e CSVs
- [OpenPyXL](https://openpyxl.readthedocs.io/) — Relatórios em Excel (.xlsx)
- [Uvicorn](https://www.uvicorn.org/) — Servidor ASGI

**Frontend**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + Estilos **Fluent UI**
- [Lucide React](https://lucide.dev/) — Conjunto de ícones
- Scanner de códigos via API nativa de câmera

---

<div align="center">

**LOGIX WMS** · Auditoría de Picking / Auditoria de Picking  
Desarrollado para operaciones de bodega / Desenvolvido para operações de armazém

</div>
