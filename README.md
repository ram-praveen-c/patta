# LandLens AI — AI-Based Smart Property Locator and Land Intelligence System

An AI-powered document-to-cadastral land intelligence platform designed to extract, validate, and georeference land identifiers from official land records (Patta / Chitta extracts, 7/12 records) and localize physical land boundaries using Cadastral GIS datasets.

---

## 🌟 Features

- **Document Ingestion**: Supports `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`, `.bmp`, and `.tiff`.
- **Image Quality Check**: Evaluates Laplacian blur variance, contrast, and resolution. Discards low-quality or corrupted documents with clear error feedback.
- **Computer Vision Preprocessing**: Automated deskewing, Otsu & adaptive threshold binarization, and CLAHE contrast enhancement.
- **Multilingual OCR Engine**: Dual-engine pipeline featuring ONNX-accelerated RapidOCR and Tesseract OCR with full support for **Tamil (`tam`)**, **English (`eng`)**, and **Hindi (`hin`)**.
- **Field-Level Visual Evidence**: Direct linking of extracted fields and survey tables to visual bounding boxes overlaid on the original scanned document.
- **Area Consistency Validation**: Mathematical verification comparing individual survey subdivision areas against the total document area with tolerance checks.
- **Deterministic Cadastral Localization**: Strict 3-tier matching hierarchy:
  - **Level 1 — Exact Parcel Located**: Genuine polygon boundary and centroid from digitized Cadastral survey maps.
  - **Level 2 — Administrative Location**: Village/Panchayat level centroid with clearly marked approximate boundaries.
  - **Level 3 — Location Unresolved**: No fabricated coordinates or random pins when cadastral maps are unavailable.
- **AI Land Intelligence**: Agro-terrain classification, soil type, irrigation sources, road access, and official sub-registrar guidance disclaimers.
- **Panchayat GIS Admin**: Web-based vector GeoJSON upload and scanned map Ground Control Point (GCP) georeferencing via Affine transformation.
- **Interactive UI**: Multilingual interface (`English | தமிழ் | हिन्दी`), Dark/Light mode, Raw OCR inspection modal, and Developer Diagnostics Drawer.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS, Radix UI primitives, Lucide Icons
- **GIS Mapping**: Leaflet & React-Leaflet
- **Mobile Container**: Capacitor 8 (Android build ready)

### Backend
- **Framework**: FastAPI (Python 3.11) with Uvicorn ASGI server
- **Computer Vision**: OpenCV (`opencv-python-headless`), Pillow, NumPy
- **OCR Engine**: RapidOCR ONNX (`rapidocr-onnxruntime`) & PyTesseract
- **GIS & Geometry**: Shapely, Affine georeferencing
- **PDF Processing**: `pypdfium2`
- **Database**: SQLite (relational audit & cadastral storage)

---

## 📐 Project Architecture

```text
landlens-ai/
├── backend/                        # FastAPI Python Backend
│   ├── main.py                     # API routing, CORS, endpoints & server runner
│   ├── cv_pipeline.py              # Quality checks, deskewing, layout & OCR
│   ├── extractor.py                # Regex, keyword parsing & evidence linker
│   ├── survey_normalizer.py        # Multilingual survey identifier normalization
│   ├── cadastral_engine.py         # 3-tier cadastral matching & area math
│   ├── database.py                 # SQLite schema, migrations & cadastral store
│   ├── test_suite.py               # Automated pipeline regression tests
│   ├── tessdata/                   # Trained OCR models (eng, tam, hin)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile                  # Containerized deployment specification
│   └── .env.example                # Backend environment configuration
│
├── src/                            # React + Vite Frontend
│   ├── lib/
│   │   ├── apiConfig.ts            # Dynamic API URL resolution (VITE_API_URL)
│   │   ├── cadastralApi.ts         # Backend GIS & parcel locator API client
│   │   ├── ocrExtract.ts           # 10-step progress extraction client
│   │   ├── LanguageContext.tsx     # Global i18n & debug mode state
│   │   └── i18n.ts                 # Multilingual translations (EN, TA, HI)
│   ├── components/                 # UI components
│   │   ├── DocumentUpload.tsx      # Multi-format uploader & progress monitor
│   │   ├── ExtractedData.tsx       # Interactive land data & field evidence
│   │   ├── DocumentEvidenceViewer.tsx # Visual bounding box scan viewer
│   │   ├── PropertyMap.tsx         # Cadastral polygon & satellite map
│   │   ├── CadastralLocatorResult.tsx # Tier 1/2/3 localization result card
│   │   ├── LandInsights.tsx        # Dynamic agro-terrain characteristics
│   │   ├── RawOcrModal.tsx         # Raw OCR text & token inspector
│   │   ├── DebugModeDrawer.tsx     # Full pipeline developer diagnostics
│   │   └── CadastralAdmin.tsx      # GeoJSON parcel & scanned map GCP manager
│   ├── pages/Index.tsx             # Main dashboard
│   └── App.tsx                     # Providers & router
│
├── android/                        # Capacitor Android native project
├── dist/                           # Production web bundle
├── docker-compose.yml              # Container orchestration
├── package.json                    # Frontend dependencies & scripts
├── .env.example                    # Frontend environment configuration
├── .gitignore                      # Git exclusion rules
└── README.md                       # Project documentation
```

---

## 📋 Prerequisites

- **Node.js**: v18+ or v20+
- **npm** or **bun**
- **Python**: 3.10+ or 3.11+
- **Tesseract OCR**: Optional locally (RapidOCR ONNX runs out-of-the-box in-process; Tesseract is installed in Docker).
- **Docker** (Optional, for containerized deployment)

---

## ⚙️ Environment Variables

### Frontend (`.env`)
Create a `.env` file in the project root:
```env
# Point to your local or deployed backend API
VITE_API_URL=http://localhost:8000
```
*Note: In production deployments on Vercel, Netlify, or Render, set `VITE_API_URL` in the platform environment settings.*

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=8000
HOST=0.0.0.0

# Allowed frontend origin (comma-separated for multiple domains)
FRONTEND_URL=http://localhost:5173

# Optional custom paths for persistent cloud storage:
# DATABASE_PATH=/data/land_intelligence.db
# MAPS_DIR=/data/uploads/maps
# TESSDATA_PREFIX=/app/tessdata
```

---

## 🚀 Running Locally

### 1. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated test suite to verify pipeline
python test_suite.py

# Start FastAPI development server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API documentation is available at: `http://localhost:8000/docs`
Health check endpoint: `http://localhost:8000/health`

### 2. Frontend Setup
In a separate terminal:
```powershell
# Navigate to project root
cd landlens-ai

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🌐 OCR & Language Setup

The backend comes pre-configured with multilingual support:
- **Trained Language Files**: Located in `backend/tessdata/`:
  - `eng.traineddata` (English)
  - `tam.traineddata` (Tamil)
  - `hin.traineddata` (Hindi)
- **Primary Engine**: `rapidocr-onnxruntime` runs automatically without external OS binaries and supports English, Tamil, and Hindi character sets.
- **Secondary Engine**: `pytesseract` automatically discovers Tesseract from system `PATH` on Linux/Docker and standard Windows installation paths.

---

## 🐳 Docker Deployment

The backend includes a production-ready `backend/Dockerfile` configured with Debian slim, Tesseract OCR, system language packages, and OpenCV dependencies.

### Running with Docker Compose:
```bash
# Build and launch backend container
docker-compose up --build -d

# Verify health
curl http://localhost:8000/health
```

### Building & Running Backend Docker Image standalone:
```bash
cd backend
docker build -t landlens-backend:latest .
docker run -p 8000:8000 -e FRONTEND_URL="https://your-frontend.vercel.app" landlens-backend:latest
```

---

## ☁️ Online Deployment Instructions

### Option A: Backend on Render.com / Railway
1. **Repository**: Push the project to GitHub.
2. **Create New Web Service**:
   - Select your GitHub repository.
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (Render will automatically detect `backend/Dockerfile`).
3. **Environment Variables**:
   - `PORT`: `8000`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
4. **Health Check Path**: `/health`
5. **Disk (Optional)**: Mount a persistent disk to `/app/data` and set `DATABASE_PATH=/app/data/land_intelligence.db` if you wish to retain uploaded cadastral maps across restarts.

### Option B: Frontend on Vercel / Netlify
1. **Import Project**: Select the GitHub repository.
2. **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com` (Your deployed backend URL)

---

## 🧪 Testing Checklist

Before deploying, run the following commands to ensure all checks pass:

- [x] **Backend Health Check**: `GET /health` returns `{"status": "ok"}`
- [x] **Backend Regression Tests**: `python test_suite.py` passes all 5 tests (Blurry rejection, OCR extraction, Visual evidence linking, Area math validation, Cadastral localization).
- [x] **Frontend Unit Tests**: `npm run test` executes cleanly.
- [x] **Frontend Production Build**: `npm run build` creates `dist/` with 0 errors and no hardcoded localhost endpoints.
- [x] **Capacitor Android Sync**: `npx cap sync android` syncs bundle into native mobile wrapper.

---

## 🔍 Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **CORS Error in Browser** | `FRONTEND_URL` mismatch on backend | Add your frontend domain to `FRONTEND_URL` in backend `.env` (comma-separated). |
| **"Unable to connect to LandLens server"** | Backend is offline or `VITE_API_URL` is wrong | Verify backend is running and `curl https://<backend>/health` responds with `{"status":"ok"}`. |
| **"Document quality is too low"** | Document image is blurry or unreadable | Ensure document has good lighting and is not blurred (Laplacian variance > 35). |
| **Tesseract not found on Windows** | Tesseract installed in custom directory | Add Tesseract directory to system `PATH` or place in standard `C:\Program Files\Tesseract-OCR\`. |

---

## 📄 License
Academic and Research Use © 2026 SmartLand AI Team.
