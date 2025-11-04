# Huisartsen Dashboard - Deployment Guide

**Versie:** 3.0
**Platform:** Render.com (Free Tier)
**Laatst bijgewerkt:** 1 november 2025

---

## 🎯 Quick Deploy

**Voor 90% van deploys (code wijzigingen):**
```bash
git add .
git commit -m "feat: beschrijving van wijziging"
git push origin main
# Render detecteert push en start automatic deploy
```

**Deployment Status:**
- Frontend: https://dashboard.render.com/static/...
- Backend: https://dashboard.render.com/web/...

---

## 🏗️ Architectuur

```
GitHub (main branch)
    │
    ├─→ Render Static Site (Frontend)
    │   └─→ huisartsen-dashboard.onrender.com
    │
    └─→ Render Web Service (Backend + Docker)
        └─→ huisartsen-dashboard-backend.onrender.com
```

---

## 📦 Frontend Deployment (Static Site)

### Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Publish Directory:**
```
build/
```

**Environment Variables:**
```bash
REACT_APP_API_URL=https://huisartsen-dashboard-backend.onrender.com
```

### Deployment Trigger

- **Auto**: Push naar `main` branch
- **Manual**: Render Dashboard → "Manual Deploy"

### Build Time

- **Target**: <2 minuten
- **Actual**: ~1-2 minuten

---

## 🐳 Backend Deployment (Docker Web Service)

### Dockerfile

**Base Image:** `rocker/tidyverse:4.3`

**Waarom rocker/tidyverse:**
- R 4.3 pre-installed
- tidyverse packages (dplyr) pre-installed
- Debian-based (apt-get werkt)

### Build Process

```dockerfile
# 1. System dependencies (rarely changes)
RUN apt-get update && apt-get install -y python3 python3-pip

# 2. R packages (rarely changes)
RUN R -e "install.packages(c('jsonlite', 'zoo'))"

# 3. Python dependencies (changes sometimes)
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# 4. Application code (changes often)
COPY . .
```

**Layer Caching:**
- Layers 1-2: Bijna nooit rebuilden (cache hit)
- Layer 3: Rebuild als requirements.txt wijzigt
- Layer 4: Altijd rebuild (code wijzigt)

### Environment Variables

```bash
FLASK_ENV=production
PORT=5001
DATA_PATH=/app/data/parameterwaarden.csv
R_SCRIPT_PATH=/app/r_scripts/
PYTHONUNBUFFERED=1
```

### Resource Limits (Free Tier)

| Resource | Limit |
|----------|-------|
| Build Time | 25 min max |
| Memory | 512 MB |
| CPU | Shared |
| Disk | Ephemeral |

**Implicaties:**
- Docker build MOET <25 min zijn
- Gunicorn: 1 worker, 4 threads (memory efficient)
- Geen file uploads persisteren (ephemeral disk)

### Build Optimizations

**Zie:** `BUILD_OPTIMIZATIONS.md` voor details

**Key Optimizations:**
1. rocker base image (R pre-installed)
2. Layer caching (dependencies eerst)
3. `--no-cache-dir` voor pip (bespaart ruimte)
4. Minimal R packages (alleen nodig)

**Current Build Time:** ~20 minuten ✅

---

## 🔄 Deployment Workflow

### Standard Deploy (Code Wijziging)

```bash
# 1. Test lokaal
npm start  # Frontend
flask run  # Backend

# 2. Commit en push
git add .
git commit -m "feat: nieuwe feature"
git push origin main

# 3. Monitor Render build
# Ga naar Render Dashboard
# Check "Events" tab voor build logs

# 4. Verify deployment
curl https://huisartsen-dashboard-backend.onrender.com/health
# Should return: {"status": "healthy", "versie": "3.0"}
```

### CSV Data Update

**Scenario:** Je wijzigt `parameterwaarden.csv`

```bash
# 1. Update CSV
# Edit: public/data/parameterwaarden.csv

# 2. Commit en push
git add public/data/parameterwaarden.csv
git commit -m "data: update parameterwaarden voor raming 2025"
git push origin main

# 3. Verify op productie
# Frontend zal automatisch cache invalideren (hash check)
# Geen manual cache clear nodig!
```

### R Script Wijziging

**⚠️ BELANGRIJK: STATA Validatie Verplicht**

```bash
# 1. Wijzig R script
# Edit: r_scripts/run_scenario_api_v2.R

# 2. STATA VALIDATIE (VERPLICHT!)
# Run scenario in R
# Run identiek scenario in STATA
# Vergelijk output (verschil moet <0.1% zijn)
# Documenteer in commit message

# 3. Commit met validatie bewijs
git add r_scripts/
git commit -m "fix(r-scripts): correctie uitstroom formule

STATA Validatie:
- Scenario: instroom=900, rendement=0.85
- R output: aanbod_fte_2043 = 12345.6
- STATA output: aanbod_fte_2043 = 12345.4
- Verschil: 0.016% ✅

Validated by: [naam]
Date: 2025-11-01"

git push origin main
```

---

## 🩺 Health Check Endpoint

**URL:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "versie": "3.0",
  "data_hash": "abc123...",
  "data_modified": 1698768000
}
```

**Gebruikt voor:**
- Render.com health checks
- Frontend cache invalidatie (`data_hash`)
- Monitoring/alerting

---

## 🚨 Troubleshooting

### Build Failed (Backend)

**Symptoom:** Docker build timeout (>25 min)

**Diagnose:**
```bash
# Check build logs in Render Dashboard
# Look for: "Step X/Y" - waar blijft het hangen?
```

**Common Fixes:**

1. **R Package Install Hangt:**
   ```dockerfile
   # Add timeout
   RUN R -e "options(timeout=300); install.packages(...)"
   ```

2. **Pip Install Traag:**
   ```dockerfile
   # Use --no-cache-dir
   RUN pip3 install --no-cache-dir -r requirements.txt
   ```

3. **Out of Memory:**
   - Reduce Gunicorn workers (1 worker max op Free Tier)
   - Check `requirements.txt` voor grote packages

---

### Runtime Error (Backend)

**Symptoom:** `/api/scenario` endpoint faalt

**Diagnose:**
```bash
# Check Render logs
# Render Dashboard → Service → "Logs" tab
```

**Common Errors:**

1. **R Script Not Found:**
   ```
   Error: R script not found at /app/r_scripts/run_scenario_api_v2.R
   ```
   **Fix:** Check `R_SCRIPT_PATH` environment variable

2. **CSV Not Found:**
   ```
   Error: Cannot find data file
   ```
   **Fix:** Check `DATA_PATH` environment variable

3. **R Package Missing:**
   ```
   Error in library(jsonlite): there is no package called 'jsonlite'
   ```
   **Fix:** Add to Dockerfile `RUN R -e "install.packages('jsonlite')"`

---

### Frontend Build Failed

**Symptoom:** `npm run build` faalt

**Diagnose:**
```bash
# Run lokaal
npm run build
# Check error output
```

**Common Errors:**

1. **TypeScript Error:**
   ```
   TS2322: Type 'string' is not assignable to type 'number'
   ```
   **Fix:** Fix type error, commit, push

2. **Missing Dependency:**
   ```
   Module not found: Can't resolve 'some-package'
   ```
   **Fix:**
   ```bash
   npm install some-package
   git add package.json package-lock.json
   git commit -m "build: add missing dependency"
   ```

---

### Frontend Can't Connect to Backend

**Symptoom:** API calls fail met CORS error of 404

**Diagnose:**
```javascript
// Open browser console
// Check Network tab
// Look for failed requests
```

**Fixes:**

1. **Wrong API URL:**
   - Check `REACT_APP_API_URL` in Render environment variables
   - Should be: `https://huisartsen-dashboard-backend.onrender.com`

2. **CORS Error:**
   ```python
   # api/scenario_model.py
   from flask_cors import CORS

   app = Flask(__name__)
   CORS(app, origins=[
       "http://localhost:3000",  # Development
       "https://huisartsen-dashboard.onrender.com"  # Production
   ])
   ```

---

## 🔧 Manual Deploy (Emergency)

**Scenario:** Git push werkt niet, je moet snel deployen

### Via Render Dashboard

1. Ga naar https://dashboard.render.com
2. Select service (frontend of backend)
3. Click "Manual Deploy"
4. Select branch (`main`)
5. Click "Deploy"

### Via Render CLI (Advanced)

```bash
# Install Render CLI
npm install -g @renderinc/cli

# Login
render login

# Deploy
render deploy --service=huisartsen-dashboard-backend
```

---

## 📊 Monitoring

### Check Deployment Status

```bash
# Health check
curl https://huisartsen-dashboard-backend.onrender.com/health

# Expected:
# {"status": "healthy", "versie": "3.0", ...}
```

### Check Build Logs

1. Render Dashboard → Service
2. "Events" tab → Latest deploy
3. Click "View Logs"

### Check Runtime Logs

1. Render Dashboard → Service
2. "Logs" tab
3. Filter voor errors: zoek naar `ERROR`, `Exception`, `Failed`

---

## 🔄 Rollback Procedure

**Scenario:** Nieuwe deploy is kapot, rollback naar vorige versie

### Via Render Dashboard

1. Render Dashboard → Service
2. "Deploys" tab
3. Find vorige working deploy
4. Click "Redeploy"
5. Confirm

**Rollback Time:** ~20 minuten (backend rebuild)

### Via Git Revert

```bash
# Find commit hash van working versie
git log

# Revert naar vorige commit
git revert <commit-hash>

# Push
git push origin main
```

---

## 📝 Deployment Checklist

Voor grote deploys (breaking changes, major refactor):

- [ ] **Lokaal Getest**
  - Frontend build succeeds (`npm run build`)
  - Backend werkt (`flask run`)
  - Docker build succeeds lokaal (`docker build .`)

- [ ] **Code Review**
  - Zie [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)

- [ ] **Commit Message**
  - Descriptive message
  - Breaking changes gedocumenteerd

- [ ] **Monitor Deploy**
  - Watch build logs in Render Dashboard
  - Verify health check na deploy

- [ ] **Post-Deploy Verification**
  - Test productie URL
  - Check all critical paths (scenario update, charts)
  - Monitor logs voor errors

---

## 🆘 Emergency Contacts

- **Render Status:** https://status.render.com
- **Render Docs:** https://render.com/docs
- **GitHub Issues:** https://github.com/.../issues

---

**Vragen?** Contact: Capaciteitsorgaan
