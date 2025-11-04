# Huisartsen Dashboard

**Interactieve web applicatie voor capaciteitsplanning van huisartsen in Nederland**

**Versie:** 3.0
**Organisatie:** Capaciteitsorgaan
**Status:** 🟢 Live Productie

---

## 📊 Wat is dit?

Het Huisartsen Dashboard is een tool waarmee beleidsmakers en onderzoekers scenario's kunnen modelleren voor de capaciteitsplanning van huisartsen in Nederland tot 2043. Gebruikers kunnen parameters aanpassen (zoals instroom, rendement, uitstroom) en direct de impact zien op het aanbod en de vraag naar huisartsen.

### Key Features

- ✅ **Interactieve Scenario Modellering** - Real-time parameter aanpassingen
- ✅ **Gevalideerde Berekeningen** - Alle berekeningen STATA-gevalideerd
- ✅ **Visuele Analyses** - Interactive charts (Recharts)
- ✅ **Data-Driven** - Single source of truth (CSV parameterwaarden)
- ✅ **Productie Deployment** - Hosted op Render.com

---

## 🚀 Quick Start

### Voor Gebruikers

**Productie URL:** https://huisartsen-dashboard.onrender.com

Gebruik de applicatie direct in je browser - geen installatie nodig!

### Voor Developers

```bash
# Clone repository
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard"

# Install dependencies
npm install
cd api && pip3 install -r requirements.txt && cd ..

# Start development servers
# Terminal 1: Backend
cd api && flask run --port 5001

# Terminal 2: Frontend
npm start
# Opens http://localhost:3000
```

**Vereisten:**
- Node.js >= 18.x
- Python >= 3.11
- R >= 4.3

---

## 🏗️ Architectuur

```
┌─────────────────────────────────────┐
│         FRONTEND (React)            │
│  - Scenario parameters UI           │
│  - Interactive charts (Recharts)    │
│  - CSV data visualization           │
└────────────┬────────────────────────┘
             │ REST API
             ▼
┌─────────────────────────────────────┐
│      BACKEND (Python Flask)         │
│  - API wrapper                      │
│  - Input validation                 │
│  - CORS handling                    │
│  - R script execution               │
└────────────┬────────────────────────┘
             │ subprocess
             ▼
┌─────────────────────────────────────┐
│      ANALYTICS (R Scripts)          │
│  - Capaciteitsplan berekeningen     │
│  - Aanbod/Vraag projecties          │
│  - STATA-gevalideerd                │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│       DATA (CSV)                    │
│  - Parameterwaarden (2010-2025)     │
│  - Single source of truth           │
└─────────────────────────────────────┘
```

**Design Principes:**
- **Separation of Concerns**: Frontend (UI) | Backend (API) | R (Logic) | CSV (Data)
- **Single Source of Truth**: CSV file is master data
- **STATA Validatie**: Alle R berekeningen gevalideerd tegen STATA output
- **Performance First**: Memoization, caching, debouncing

**📖 Details:** Zie [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📁 Project Structuur

```
huisartsen-dashboard/
├── api/                        # Backend (Python Flask)
│   ├── scenario_model.py       # API endpoints
│   ├── debug/                  # Debug scripts
│   └── tests/                  # Test scripts
├── r_scripts/                  # R analytics
│   └── run_scenario_api_v2.R   # Scenario berekeningen
├── src/                        # Frontend (React)
│   ├── components/             # Herbruikbare components
│   ├── pages/                  # Page components
│   └── styles/                 # CSS Modules
├── public/
│   └── data/
│       └── parameterwaarden.csv  # Source of truth
├── ARCHITECTURE.md             # High-level design
├── DEVELOPMENT.md              # Development guide
├── DEPLOYMENT.md               # Deployment procedures
└── CODE_REVIEW_CHECKLIST.md    # Quality checklist
```

---

## 🛠️ Technology Stack

### Frontend
- **React** 19.2 - UI framework
- **Recharts** 2.x - Interactive charts
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling

### Backend
- **Python** 3.11 - Runtime
- **Flask** 3.0 - Web framework
- **R** 4.3 - Analytics engine
- **Docker** - Containerization

### Deployment
- **Render.com** - Cloud hosting (Free Tier)
- **GitHub** - Version control + CI/CD

---

## 💻 Development Workflow

### Lokale Development

```bash
# Start backend
export FLASK_ENV=development
export DATA_PATH="../public/data/parameterwaarden.csv"
export R_SCRIPT_PATH="../r_scripts/"
cd api && flask run --port 5001

# Start frontend (nieuwe terminal)
npm start
```

### Code Wijzigingen

```bash
# 1. Maak feature branch
git checkout -b feature/nieuwe-functie

# 2. Maak wijzigingen
# ... code ...

# 3. Test lokaal
npm start && flask run

# 4. Commit met descriptive message
git add .
git commit -m "feat(components): add nieuwe functie

- Beschrijving van wijziging
- Waarom deze wijziging nodig was"

# 5. Push naar GitHub
git push origin feature/nieuwe-functie

# 6. Create Pull Request
# Review checklist: CODE_REVIEW_CHECKLIST.md

# 7. Merge naar main
# Render detecteert push en deployed automatisch
```

**📖 Details:** Zie [DEVELOPMENT.md](./DEVELOPMENT.md)

---

## 🧪 Testing

### Manual Testing (Current)

```bash
# Frontend
npm start
# Test scenario parameter wijzigingen
# Verify charts renderen correct
# Check console voor errors

# Backend
curl http://localhost:5001/health
# Should return: {"status": "healthy"}

curl -X POST http://localhost:5001/api/scenario \
  -H "Content-Type: application/json" \
  -d '{"instroom": 900, "intern_rendement": 0.85, ...}'
```

### R Script Validatie

**⚠️ BELANGRIJK:** Alle R script wijzigingen MOETEN STATA-gevalideerd worden

```r
# 1. Run scenario in R
source("r_scripts/run_scenario_api_v2.R")
result <- run_scenario(params)

# 2. Run identiek scenario in STATA
# ... STATA code ...

# 3. Vergelijk output
# Verschil moet <0.1% zijn

# 4. Documenteer in commit message
```

---

## 🚀 Deployment

### Productie URLs

- **Frontend:** https://huisartsen-dashboard.onrender.com
- **Backend:** https://huisartsen-dashboard-backend.onrender.com
- **Health Check:** https://huisartsen-dashboard-backend.onrender.com/health

### Deploy Process

```bash
# Simpel: push naar main
git push origin main

# Render detecteert push
# → Triggers automatic deploy
# → Build time: ~20 min (backend), ~2 min (frontend)
# → Health check validates deployment
```

### Rollback

```bash
# Via Render Dashboard
# 1. Go to Deploys tab
# 2. Find working deploy
# 3. Click "Redeploy"

# Of via git revert
git revert <commit-hash>
git push origin main
```

**📖 Details:** Zie [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📊 Data Management

### CSV Parameterwaarden

**Locatie:** `public/data/parameterwaarden.csv`

**Format:**
```csv
parameter,raming_2010,raming_2013,raming_2016,raming_2019,raming_2025
aanbod_personen,12345,12678,13012,13400,13850
fte_vrouw_basis,0.75,0.76,0.77,0.78,0.79
...
```

**Update Workflow:**
```bash
# 1. Edit CSV
# 2. Commit
git add public/data/parameterwaarden.csv
git commit -m "data: update parameterwaarden raming 2025"

# 3. Push
git push origin main

# Frontend detecteert automatisch nieuwe data via hash check
# Geen manual cache clear nodig!
```

---

## 🎯 Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| Dashboard Load (cached) | <100ms | ~50ms ✅ |
| Chart Re-render | <70ms | ~50ms ✅ |
| API Response (scenario) | <3000ms | ~2500ms ✅ |
| Build Time (Docker) | <25min | ~20min ✅ |

**Optimalisaties:**
- useMemo voor chart data transformations
- localStorage caching voor CSV data
- 250ms debounce voor API calls
- CSS Modules voor style deduplication

---

## 🔒 Security

- ✅ **Input Validation**: Frontend + Backend parameter validation
- ✅ **CORS Configured**: Alleen toegestane origins
- ✅ **Error Sanitization**: Production errors geen stack traces
- ✅ **Rate Limiting**: Bescherming tegen API abuse (optional)
- ✅ **Environment Variables**: Geen secrets in code

---

## 📝 Code Quality Standards

### Verplichte Regels

#### ✅ DO

- Gebruik CSS Modules (GEEN inline styles)
- Components <200 regels (split op!)
- Config-driven forms (GEEN duplicatie)
- useMemo voor expensive computations
- TypeScript types (GEEN `any`)

#### ❌ DON'T

- Inline styles (gebruik CSS Modules)
- Business logic in Python (alleen R scripts)
- Hardcoded data (gebruik CSV)
- Code duplicatie (DRY principe)
- Missing validation

**📖 Checklist:** Zie [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)

---

## 🐛 Troubleshooting

### Frontend Build Failed

```bash
# Check error
npm run build

# Common fix: missing dependency
npm install

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Backend API Not Responding

```bash
# Check health endpoint
curl http://localhost:5001/health

# Check logs
# Render Dashboard → Logs tab

# Common issues:
# - R script path incorrect (check R_SCRIPT_PATH env var)
# - CSV not found (check DATA_PATH env var)
# - R package missing (check Dockerfile)
```

### CSV Data Not Loading

```bash
# Clear localStorage cache
# Browser console:
localStorage.clear()
location.reload()

# Verify CSV accessible
curl http://localhost:3000/data/parameterwaarden.csv
```

**📖 Volledige Guide:** Zie [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

---

## 📚 Documentatie

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - High-level design en architectuur beslissingen
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow, patterns, en best practices
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment procedures en troubleshooting
- **[CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)** - Quality checklist voor PR's

---

## 🤝 Contributing

### Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/beschrijving
   ```

2. **Make Changes**
   - Follow development patterns (zie DEVELOPMENT.md)
   - Run lokaal en test

3. **Commit**
   ```bash
   git commit -m "feat(scope): beschrijving"
   ```

4. **Create Pull Request**
   - Review CODE_REVIEW_CHECKLIST.md
   - Ensure alle checks passing

5. **Merge**
   - Na approval, merge naar main
   - Auto-deploy naar productie

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `perf`

---

## 📞 Contact & Support

- **Organisatie:** Capaciteitsorgaan
- **Website:** https://capaciteitsorgaan.nl
- **GitHub Issues:** (voeg repository URL toe)

---

## 📄 License

Eigendom van Capaciteitsorgaan. Alle rechten voorbehouden.

---

**Laatst bijgewerkt:** 1 november 2025
**Versie:** 3.0
