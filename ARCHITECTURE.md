# Huisartsen Dashboard - Architectuur Documentatie

**Versie:** 3.0
**Laatst bijgewerkt:** 1 november 2025
**Auteur:** Capaciteitsorgaan

---

## 📋 Inhoudsopgave

1. [High-Level Overzicht](#high-level-overzicht)
2. [Architectuur Beslissingen](#architectuur-beslissingen)
3. [Component Diagram](#component-diagram)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Design Principes](#design-principes)
7. [Deployment Architectuur](#deployment-architectuur)

---

## 🎯 High-Level Overzicht

Het Huisartsen Dashboard is een interactieve web applicatie voor capaciteitsplanning van huisartsen in Nederland. De applicatie stelt gebruikers in staat om scenario's te modelleren en de impact op het aanbod en de vraag naar huisartsen te visualiseren tot 2043.

### Doelen

- **Interactieve Scenariomodellering**: Gebruikers kunnen parameters aanpassen en direct de impact zien
- **Gevalideerde Berekeningen**: Alle berekeningen zijn STATA-gevalideerd en reproduceerbaar
- **Data-Driven**: Single source of truth (CSV parameterwaarden)
- **Productie-Ready**: Deployed op Render.com, altijd beschikbaar

---

## 🏗️ Architectuur Beslissingen

### Beslissing 1: Drie-Laags Architectuur

**Keuze:** Frontend (React) ↔ Backend (Python Flask) ↔ Analytics (R Scripts)

**Waarom:**
1. **Scheiding van Verantwoordelijkheden**
   - React: UI en user interactie
   - Python: API wrapper, CORS, validatie, error handling
   - R: Alle statistische berekeningen (gevalideerd tegen STATA)

2. **Deployment Flexibiliteit**
   - Frontend en Backend kunnen separaat schalen
   - R scripts blijven ongewijzigd (validatie blijft geldig)
   - Python wrapper abstraheert R complexiteit

3. **Onderhoudbaarheid**
   - Business logic (R) is gescheiden van API logic (Python)
   - Frontend kan UI updates krijgen zonder R code te raken
   - R scripts kunnen ge-update worden zonder frontend changes

**Alternatieven overwogen:**
- ❌ **Direct R via Shiny**: Geen flexibiliteit voor custom UI, moeilijk te deployen
- ❌ **Node.js backend**: Geen native R integratie, zou R proces spawnen (complex)
- ❌ **All-in-One Flask**: Business logic in Python zou R validatie invalideren

---

### Beslissing 2: Geen Database, CSV als Single Source of Truth

**Keuze:** CSV parameterwaarden file in `/data/` directory

**Waarom:**
1. **Eenvoud**: Geen database setup, migraties, of ORM complexity
2. **Versiebeheer**: CSV in git = volledige history van parameterwijzigingen
3. **Transparantie**: Data is human-readable en inspecteerbaar
4. **Performance**: Statische data, geen queries nodig, kan cachen
5. **Deployment**: Geen database credentials, environment variables minimaal

**Alternatieven overwogen:**
- ❌ **PostgreSQL**: Overkill voor statische reference data
- ❌ **SQLite**: Adds complexity zonder voordelen voor dit use case
- ❌ **JSON/Excel**: CSV is standaard, universeel, eenvoudig

**Wanneer WÉÉL een database nodig:**
- User authentication/authorization
- Opslaan van user-created scenarios
- Audit logging van parameter changes
- Multi-tenant data isolation

---

### Beslissing 3: React (niet Vue/Svelte/Angular)

**Keuze:** React 19.2 met Create React App

**Waarom:**
1. **Recharts Bibliotheek**: Beste declarative charts voor React
2. **Component Ecosystem**: Grote library van bestaande components
3. **Team Expertise**: Team kent React al
4. **Create React App**: Zero-config setup, snelle start

**Alternatieven overwogen:**
- ❌ **Vue.js**: Minder mature chart libraries
- ❌ **Svelte**: Kleinere ecosystem, minder libraries
- ❌ **Angular**: Te heavy, te veel boilerplate voor dit project

---

### Beslissing 4: Python Flask (niet FastAPI/Django)

**Keuze:** Flask 3.0

**Waarom:**
1. **Lichtgewicht**: Minimale overhead, alleen API endpoints nodig
2. **R Integratie**: `subprocess` voor R script execution werkt goed
3. **CORS Support**: Flask-CORS voor cross-origin requests
4. **Deployment**: Eenvoudig te deployen met Gunicorn

**Alternatieven overwogen:**
- ❌ **FastAPI**: Async niet nodig, R calls zijn sync
- ❌ **Django**: Te veel features (ORM, admin, templates) die we niet gebruiken

---

### Beslissing 5: Docker Deployment

**Keuze:** Dockerfile met `rocker/tidyverse:4.3` base image

**Waarom:**
1. **R Pre-installed**: rocker images hebben R + common packages
2. **Reproduceerbaar**: Exacte environment voor development en productie
3. **Deployment**: Render.com native Docker support
4. **Isolatie**: Geen dependency conflicts tussen projecten

**Layer Caching Strategy:**
```dockerfile
# 1. System dependencies (changes zelden)
RUN apt-get update && apt-get install -y ...

# 2. R packages (changes zelden)
RUN R -e "install.packages(...)"

# 3. Python dependencies (changes soms)
COPY requirements.txt .
RUN pip install -r requirements.txt

# 4. Application code (changes vaak)
COPY . .
```

**Build Time Target:** <25 minuten (Render Free Tier limit)

---

## 🔄 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      (React 19.2)                           │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │  Dashboard  │  │  Scenario    │  │   Charts    │       │
│  │             │  │  Model API   │  │  (Recharts) │       │
│  └─────────────┘  └──────────────┘  └─────────────┘       │
│         │                  │                  │            │
│         └──────────────────┴──────────────────┘            │
│                            │                               │
│                    HTTP REST API                           │
│                  (localhost:3000 dev)                      │
│              (huisartsen-dashboard.onrender.com prod)     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND API                           │
│                    (Python Flask 3.0)                       │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │            scenario_model.py                    │        │
│  │  ┌──────────────┐  ┌───────────────┐          │        │
│  │  │  /health     │  │  /api/scenario│          │        │
│  │  │  endpoint    │  │  endpoint     │          │        │
│  │  └──────────────┘  └───────────────┘          │        │
│  │         │                   │                  │        │
│  │         │                   │                  │        │
│  │         │            ┌──────▼──────┐          │        │
│  │         │            │  Validate   │          │        │
│  │         │            │  Parameters │          │        │
│  │         │            └──────┬──────┘          │        │
│  │         │                   │                  │        │
│  │         │            ┌──────▼──────┐          │        │
│  │         │            │  Execute    │          │        │
│  │         │            │  R Script   │          │        │
│  │         │            │  (subprocess)│         │        │
│  │         │            └──────┬──────┘          │        │
│  │         │                   │                  │        │
│  │         │            ┌──────▼──────┐          │        │
│  │         │            │  Parse JSON │          │        │
│  │         │            │  Response   │          │        │
│  │         │            └──────┬──────┘          │        │
│  │         │                   │                  │        │
│  └─────────┴───────────────────┴──────────────────┘        │
│                (localhost:5001 dev)                        │
│       (huisartsen-dashboard-backend.onrender.com prod)    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    R ANALYTICS ENGINE                       │
│                         (R 4.3)                             │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │       run_scenario_api_v2.R                    │        │
│  │                                                 │        │
│  │  1. Read parameters from stdin (JSON)         │        │
│  │  2. Load CSV data                              │        │
│  │  3. Run capaciteitsplan berekeningen          │        │
│  │     - Aanbod berekeningen (cohorten)          │        │
│  │     - Vraag berekeningen (demografie)         │        │
│  │     - Gap analyse (aanbod - vraag)            │        │
│  │  4. Return JSON response to stdout            │        │
│  │                                                 │        │
│  │  Libraries: jsonlite, dplyr, zoo              │        │
│  └────────────────────────────────────────────────┘        │
│                            │                               │
│                            ▼                               │
│                  ┌──────────────────┐                      │
│                  │  parameterwaarden │                      │
│                  │  .csv (data/)     │                      │
│                  └──────────────────┘                      │
│                 (Single Source of Truth)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### 1. User Interactie Flow

```
┌──────────┐
│ Gebruiker│
│  past    │
│parameter │
│   aan    │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│ React Component │
│  (onChange)     │
└────┬────────────┘
     │
     │ Update state
     ▼
┌─────────────────┐
│  setScenario({  │
│    ...scenario, │
│    param: value │
│  })             │
└────┬────────────┘
     │
     │ useEffect triggered
     ▼
┌─────────────────┐
│  Debounce 250ms │ ← Vermijdt te veel API calls
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ POST /api/      │
│   scenario      │
│ {parameters}    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Python Flask    │
│ - Validate      │
│ - Execute R     │
│ - Return JSON   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Update UI       │
│ - Charts        │
│ - Tables        │
│ - Metrics       │
└─────────────────┘
```

### 2. CSV Data Loading Flow

```
┌──────────────┐
│ Application  │
│   Startup    │
└──────┬───────┘
       │
       ▼
┌───────────────┐
│ Check         │
│ localStorage  │  ← Eerste check cache
│ for CSV cache │
└──────┬────────┘
       │
       ├─── Cache Hit ───────┐
       │                     │
       │                     ▼
       │            ┌──────────────┐
       │            │ Verify Hash  │
       │            │ (data versie)│
       │            └──────┬───────┘
       │                   │
       │                   ├─ Hash Match ──→ Use Cache ✓
       │                   │
       │                   └─ Hash Mismatch ──┐
       │                                       │
       └─── Cache Miss ─────────────────────┐ │
                                             │ │
                                             ▼ ▼
                                    ┌─────────────────┐
                                    │ Fetch CSV from  │
                                    │  /data/params   │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Parse CSV       │
                                    │ (PapaParse)     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Build Lookup    │
                                    │ Object          │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Store in        │
                                    │ localStorage    │
                                    │ (with hash)     │
                                    └────────┬────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Render UI       │
                                    └─────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Versie | Doel |
|-----------|--------|------|
| **React** | 19.2 | UI framework |
| **Recharts** | 2.x | Declarative charts |
| **React Router** | 6.x | Client-side routing |
| **PapaParse** | 5.x | CSV parsing |
| **Axios** | 1.x | HTTP client |

### Backend

| Technology | Versie | Doel |
|-----------|--------|------|
| **Python** | 3.11 | Runtime |
| **Flask** | 3.0 | Web framework |
| **Flask-CORS** | 4.x | CORS handling |
| **Gunicorn** | 20.x | WSGI server (production) |
| **R** | 4.3 | Analytics engine |

### R Libraries

| Package | Doel |
|---------|------|
| **jsonlite** | JSON parsing/serialization |
| **dplyr** | Data manipulation |
| **zoo** | Time series (rolgemiddelde) |

### Infrastructure

| Technology | Doel |
|-----------|------|
| **Docker** | Containerization |
| **Render.com** | Cloud hosting (Free Tier) |
| **GitHub** | Version control + CI/CD |

---

## 🎨 Design Principes

### 1. Single Source of Truth

**Principe:** CSV parameterwaarden file is de ENIGE bron van waarheid

**Implementatie:**
- Alle parameters komen uit CSV
- Geen hardcoded waarden in code
- Bij wijzigingen: update CSV, commit to git
- Frontend cacht CSV (met versie check)

**Voordeel:**
- Geen data inconsistenties
- Volledige audit trail (git history)
- Eenvoudig te valideren tegen STATA

---

### 2. Separation of Concerns

**Principe:** Elke laag heeft één verantwoordelijkheid

**Implementatie:**

```
Frontend:   UI + user interactie
            ↓
Backend:    API wrapper + validatie + error handling
            ↓
Analytics:  Berekeningen (STATA-gevalideerd)
            ↓
Data:       CSV (single source of truth)
```

**Verboden:**
- ❌ Business logic in Python
- ❌ R berekeningen dupliceren in JavaScript
- ❌ Database queries in frontend

---

### 3. Performance First

**Principe:** Optimaliseer voor user experience

**Implementatie:**
- **Debouncing**: 250ms API call delay
- **Memoization**: `useMemo` voor chart data
- **Caching**: localStorage voor CSV data
- **Code Splitting**: React lazy loading voor routes

**Targets:**
- Dashboard load: <100ms (met cache)
- Re-render tijd: <70ms
- API response: <2000ms (R berekeningen)

---

### 4. Fail Fast, Fail Loud

**Principe:** Valideer input vroeg, geef duidelijke errors

**Implementatie:**
- **Frontend validatie**: UI constraints (min/max)
- **Backend validatie**: Parameter ranges check
- **R validatie**: Implicit (data types, NA checks)

**Error Handling:**
- Development: Detailed stack traces
- Production: Sanitized error messages
- Logging: stderr voor debugging

---

### 5. Zero Configuration

**Principe:** Minimale environment setup

**Implementatie:**
- Environment variables alleen voor deployment
- Sensible defaults voor development
- Create React App = zero config frontend
- Docker = reproduceerbare environment

**Environment Variables:**
```bash
FLASK_ENV=development          # development | production
PORT=5001                      # Backend port
DATA_PATH=/app/data/params.csv # CSV locatie
R_SCRIPT_PATH=/app/r_scripts/  # R scripts directory
```

---

## 🚀 Deployment Architectuur

### Development

```
┌──────────────────┐         ┌──────────────────┐
│  localhost:3000  │ ──────→ │  localhost:5001  │
│   (React Dev)    │  CORS   │   (Flask Dev)    │
└──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │  R Script        │
                             │  (local exec)    │
                             └──────────────────┘
```

**Setup:**
```bash
# Terminal 1: Start backend
cd api
flask run --port 5001

# Terminal 2: Start frontend
npm start
```

---

### Production (Render.com)

```
┌───────────────────────────────────────────┐
│     Render.com (Free Tier)                │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │  Static Site Service               │  │
│  │  (Frontend Build)                  │  │
│  │  huisartsen-dashboard.onrender.com│  │
│  └──────────────┬─────────────────────┘  │
│                 │                         │
│                 │ API calls               │
│                 ▼                         │
│  ┌────────────────────────────────────┐  │
│  │  Web Service (Docker)              │  │
│  │  - Python Flask                    │  │
│  │  - R 4.3                           │  │
│  │  - Gunicorn (1 worker, 4 threads) │  │
│  │  ...backend.onrender.com          │  │
│  └────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

**Deployment Trigger:** Git push naar main branch

**Build Process:**
1. GitHub webhook triggers Render build
2. Render clones repo
3. Runs Dockerfile:
   - Install system deps
   - Install R packages
   - Install Python deps
   - Copy application code
4. Starts Gunicorn server
5. Health check: `GET /health`
6. Traffic cutover

**Build Time:** ~20 minuten (binnen Free Tier limit van 25min)

---

### Resource Limits (Render Free Tier)

| Resource | Limit |
|----------|-------|
| **Build Time** | 25 minuten max |
| **Memory** | 512 MB |
| **CPU** | Shared (limited) |
| **Disk** | Ephemeral (container restart = data loss) |
| **Bandwidth** | 100 GB/maand |

**Implicaties:**
- Geen user data opslag (stateless)
- Geen file uploads persisteren
- R berekeningen moeten <30s zijn
- Gunicorn: 1 worker, 4 threads = optimal voor memory

---

## 📝 Belangrijke Constraints

### 1. STATA Validatie Vereiste

**Regel:** Alle R berekeningen zijn gevalideerd tegen STATA output

**Implicatie:**
- ❌ **Wijzig R scripts NOOIT** zonder re-validatie tegen STATA
- ✅ Python wrapper wijzigingen zijn OK (geen business logic impact)
- ✅ Frontend wijzigingen zijn OK (geen berekening impact)

**Validatie Proces:**
1. Wijzig R script
2. Run scenario in R
3. Run identiek scenario in STATA
4. Vergelijk output (moet <0.1% verschil zijn)
5. Documenteer validatie in git commit

---

### 2. CSV Schema Contract

**Regel:** CSV kolommen mogen NIET wijzigen zonder backend update

**Huidige Schema:**
```csv
parameter,raming_2010,raming_2013,raming_2016,raming_2019,raming_2025
aanbod_personen,12345,12678,13012,...
fte_vrouw_basis,0.75,0.76,0.77,...
...
```

**Bij nieuwe kolom toevoegen:**
1. Update CSV
2. Update R script (lees nieuwe kolom)
3. Update Frontend (toon nieuwe kolom in UI)
4. Update validatie logic

---

### 3. API Response Format Contract

**Regel:** `/api/scenario` response format is stabiel

**Huidige Format:**
```json
{
  "projectie": [
    {
      "jaar": 2025,
      "aanbod_fte": 12345.6,
      "benodigd_fte": 13000.0,
      "gap_fte": -654.4,
      "aanbod_personen": 15000
    },
    ...
  ],
  "baseline": [ /* zelfde structuur */ ]
}
```

**Bij wijziging:**
- Backend + Frontend moeten SAMEN ge-update worden
- Versioned API endpoint overwegen (`/api/v2/scenario`)

---

## 🔮 Toekomstige Uitbreidingen

### Potentiële Features (Not Yet Implemented)

1. **User Scenarios Opslaan**
   - Database toevoegen (PostgreSQL)
   - User authentication (OAuth)
   - Save/Load scenario functionaliteit

2. **Scenario Vergelijking**
   - Side-by-side scenario views
   - Diff highlighting
   - Batch scenario runs

3. **Export Functionaliteit**
   - PDF rapport generatie
   - Excel export van projecties
   - PNG/SVG chart downloads

4. **Admin Dashboard**
   - CSV upload interface
   - Bulk parameter updates
   - Audit logging

---

## 📚 Gerelateerde Documentatie

- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Development workflow en code patterns
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Deployment procedures en troubleshooting
- **[CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)**: Quality checklist voor PR's
- **[README.md](./README.md)**: Project overview en quick start

---

**Laatste update:** 1 november 2025
**Vragen?** Contact: Capaciteitsorgaan
