# Railway + Cloudflare Pages Deployment Guide

**Versie:** 1.0
**Laatst bijgewerkt:** 5 november 2025
**Platform:** Railway (Backend) + Cloudflare Pages (Frontend)

---

## 🎯 Overview

Deze guide beschrijft de complete migratie van het Huisartsen Dashboard naar:
- **Backend**: Railway (Docker deployment met R + Python)
- **Frontend**: Cloudflare Pages (Static site met CDN)

**Waarom deze setup:**
- ✅ Geen cold starts (Railway Starter)
- ✅ Snellere builds (5-10 min vs 20 min op Render)
- ✅ Betere CPU allocation
- ✅ Frontend via wereldwijde CDN (Cloudflare)
- ✅ Kosten: ~€10-12/maand

---

## 📋 Pre-requisites

- [ ] GitHub repository met push access
- [ ] Railway account (maak aan op railway.app)
- [ ] Cloudflare account (maak aan op cloudflare.com)
- [ ] Credit card (voor Railway Starter plan)

---

## Part 1: Railway Backend Setup

### Step 1: Railway Account & Project

1. **Maak Railway account aan**
   - Ga naar https://railway.app
   - Sign up met GitHub account (aanbevolen)
   - Verify email

2. **Maak nieuw project**
   - Click "New Project"
   - Kies "Deploy from GitHub repo"
   - Selecteer `mgmheck/huisartsen-dashboard`
   - Railway detecteert automatisch Dockerfile ✅

3. **Upgrade naar Starter Plan**
   - Settings → Plan
   - Upgrade naar "Starter" ($5/maand + usage)
   - **Waarom:** Geen cold starts, unlimited builds

### Step 2: Service Configuration

1. **Klik op het gedeployede service**

2. **Environment Variables instellen**
   - Ga naar "Variables" tab
   - Voeg toe:
   ```bash
   FLASK_ENV=production
   PORT=5001
   DATA_PATH=/app/data/parameterwaarden.csv
   R_SCRIPT_PATH=/app/r_scripts/
   PYTHONUNBUFFERED=1
   ```

3. **Resource Limits (optioneel)**
   - Settings → Resources
   - CPU: Shared (default)
   - Memory: 2GB (default)
   - **Note:** Railway Starter heeft betere specs dan Render Free

4. **Health Check configureren**
   - Settings → Health Check
   - Path: `/health`
   - Timeout: 30 seconden
   - Interval: 60 seconden

### Step 3: Domain Setup

1. **Generate Domain**
   - Settings → Domains
   - Click "Generate Domain"
   - Je krijgt: `huisartsen-dashboard-backend.railway.app`
   - **Kopieer deze URL!** (nodig voor frontend)

2. **Custom Domain (optioneel)**
   - Settings → Domains → "Custom Domain"
   - Voer in: `api.jouw-domain.nl`
   - Volg DNS instructies in Cloudflare

### Step 4: Deploy & Verify

1. **Trigger Deploy**
   - Railway start automatisch build na configuratie
   - Monitor build logs in "Deployments" tab
   - Wacht tot status = "Active" (groen)

2. **Test Backend**
   ```bash
   # Health check
   curl https://huisartsen-dashboard-backend.railway.app/health

   # Moet returnen: {"status": "healthy", ...}
   ```

3. **Test Scenario Endpoint**
   ```bash
   curl -X POST https://huisartsen-dashboard-backend.railway.app/api/scenario \
     -H "Content-Type: application/json" \
     -d '{"instroom": 718, "intern_rendement": 0.94}'

   # Moet returnen: {"projectie": [...], "instroomadvies": {...}}
   ```

---

## Part 2: Cloudflare Pages Frontend Setup

### Step 1: Cloudflare Account

1. **Maak Cloudflare account aan**
   - Ga naar https://cloudflare.com
   - Sign up (gratis)
   - Verify email

2. **Navigeer naar Pages**
   - Dashboard → Workers & Pages
   - Click "Create Application"
   - Kies "Pages" tab
   - Click "Connect to Git"

### Step 2: GitHub Integration

1. **Connect GitHub**
   - Login met GitHub account
   - Authorize Cloudflare Pages
   - Selecteer repository: `mgmheck/huisartsen-dashboard`

2. **Build Configuration**
   ```
   Project name: huisartsen-dashboard-frontend
   Production branch: main
   Build command: npm install && npm run build
   Build output directory: build
   ```

3. **Environment Variables**
   - Click "Add variable"
   - Key: `REACT_APP_API_URL`
   - Value: `https://huisartsen-dashboard-backend.railway.app`
   - **BELANGRIJK:** Gebruik Railway domain van Part 1 Step 3

4. **Advanced Settings**
   - Root directory: `/` (default)
   - Build watch paths: `src/**`, `public/**`
   - Node version: 18 (default)

### Step 3: Deploy & Verify

1. **Trigger Deploy**
   - Click "Save and Deploy"
   - Cloudflare start build (2-3 minuten)
   - Wacht tot status = "Success"

2. **View Deployment**
   - Je krijgt URL: `https://huisartsen-dashboard-frontend.pages.dev`
   - Open in browser
   - Navigeer naar "🚀 Fast Dashboard"

3. **Test Functionaliteit**
   - [ ] Dashboard laadt (<2 seconden)
   - [ ] Navigatie buttons werken
   - [ ] API connected badge = groen
   - [ ] Parameter slider veranderen → Chart update
   - [ ] No console errors (F12 → Console)

### Step 4: Custom Domain (optioneel)

1. **Add Custom Domain**
   - Pages project → Custom domains
   - Add: `dashboard.jouw-domain.nl`
   - Volg DNS instructies

2. **SSL Certificate**
   - Cloudflare activeert automatisch SSL
   - Wacht 2-5 minuten voor certificate provisioning

---

## Part 3: CORS Configuration Update

**BELANGRIJK:** Railway domain verschilt van Render, dus CORS moet ge-update worden.

### Update Flask Backend

1. **Open lokaal:** `api/scenario_model.py`

2. **Find CORS configuratie:**
   ```python
   CORS(app, resources={
       r"/api/*": {
           "origins": [
               "http://localhost:3000",
               "https://huisartsen-dashboard-frontend.onrender.com",  # OUD
               # NIEUW toevoegen:
               "https://huisartsen-dashboard-frontend.pages.dev",
               "https://dashboard.jouw-domain.nl"  # indien custom domain
           ]
       }
   })
   ```

3. **Commit en push**
   ```bash
   git add api/scenario_model.py
   git commit -m "Update CORS for Cloudflare Pages domain"
   git push origin main
   ```

4. **Railway redeploy**
   - Railway detecteert push en redeploy automatisch
   - Wacht 5-10 minuten voor nieuwe build

---

## Part 4: Testing & Validation

### Backend Tests

```bash
# 1. Health check
curl https://huisartsen-dashboard-backend.railway.app/health

# 2. Cache stats
curl https://huisartsen-dashboard-backend.railway.app/api/cache/stats

# 3. Scenario calculation (baseline)
curl -X POST https://huisartsen-dashboard-backend.railway.app/api/scenario \
  -H "Content-Type: application/json" \
  -d '{"instroom": 718}'

# 4. Performance test (moet <5s zijn na cache)
time curl -X POST https://huisartsen-dashboard-backend.railway.app/api/scenario \
  -H "Content-Type: application/json" \
  -d '{"instroom": 718}'
```

### Frontend Tests

1. **Open Cloudflare Pages URL**
2. **Test alle views:**
   - [ ] 🚀 Fast Dashboard (JavaScript calculator)
   - [ ] 📊 Dashboard (R Backend)
   - [ ] 🔮 Scenario Model (Stata-accurate)

3. **Test parameter wijzigingen:**
   - [ ] Instroom slider: 718 → 800
   - [ ] Check chart update
   - [ ] Check KPI tiles update
   - [ ] Check table update

4. **Test baseline comparison:**
   - [ ] Wijzig parameters
   - [ ] Check "Baseline" lijn in chart
   - [ ] Check percentage verschil in KPI

5. **Performance check:**
   - [ ] Frontend load: <2 seconden
   - [ ] API calls: <5 seconden (cache miss)
   - [ ] API calls: <1 seconden (cache hit)

### Load Test (optioneel)

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: apt-get install apache2-utils

# Test 100 requests
ab -n 100 -c 10 https://huisartsen-dashboard-backend.railway.app/health

# Check:
# - No failed requests
# - Average response time <100ms
# - No 502/503 errors
```

---

## Part 5: Monitoring Setup

### Railway Monitoring

1. **Metrics Dashboard**
   - Railway project → Metrics
   - Monitor: CPU, Memory, Network
   - Set alerts (Settings → Notifications)

2. **Logs**
   - Deployments → Logs
   - Filter: errors, warnings
   - Set up Slack/email notifications

3. **Budget Alerts**
   - Settings → Usage
   - Set monthly budget: $15
   - Email alert at 80%

### Cloudflare Analytics

1. **Pages Analytics**
   - Pages project → Analytics
   - Monitor: Requests, Bandwidth, Build time

2. **Performance Insights**
   - Core Web Vitals
   - Geographic distribution
   - Browser/device breakdown

---

## Part 6: Render Cleanup

**WACHT 48 UUR** voordat je Render services verwijdert!

### After 48 Hours Stable Operation

1. **Pause Render Services** (niet verwijderen!)
   - Render Dashboard → Services
   - Backend: Settings → Pause Service
   - Frontend: Settings → Pause Service

2. **Monitor 1 Week**
   - Check Railway costs
   - Check uptime/reliability
   - Check geen user complaints

3. **Delete Render Services** (na 1 week)
   - Render Dashboard → Services
   - Settings → Delete Service
   - Confirm deletion

---

## 🔄 Rollback Plan

Indien problemen met Railway/Cloudflare:

### Immediate Rollback

1. **Re-activate Render services**
   ```bash
   # Render Dashboard → Services → Resume
   ```

2. **Update Cloudflare environment variable**
   ```bash
   REACT_APP_API_URL=https://huisartsen-dashboard-backend.onrender.com
   ```

3. **Trigger Cloudflare rebuild**
   - Deployments → Retry deployment

**Rollback tijd:** <10 minuten

---

## 💰 Cost Estimation

### Railway Backend

| Item | Cost |
|------|------|
| Starter Plan | $5/maand |
| CPU Usage | ~$2-3/maand (estimated) |
| RAM Usage | ~$1-2/maand (estimated) |
| Network | ~$1/maand (estimated) |
| **Total** | **~$9-11/maand** |

### Cloudflare Pages

| Item | Cost |
|------|------|
| Free Tier | $0/maand |
| Builds (500/maand) | $0/maand |
| Bandwidth (unlimited) | $0/maand |
| **Total** | **$0/maand** |

### **Grand Total: ~€9-11/maand (~$9-11/maand)**

---

## 📞 Support

### Railway
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

### Cloudflare
- Docs: https://developers.cloudflare.com/pages
- Community: https://community.cloudflare.com
- Status: https://www.cloudflarestatus.com

---

## ✅ Success Checklist

Deployment is succesvol als:

- [x] Railway backend status = "Active"
- [x] Railway health check: 200 OK
- [x] Cloudflare Pages deployment = "Success"
- [x] Frontend loads in <2 seconden
- [x] API connected badge = groen
- [x] Parameter wijzigingen werken
- [x] Chart/tabel updates correct
- [x] Geen console errors
- [x] Geen cold starts (<5s response)
- [x] Build tijd <10 minuten
- [x] Costs within budget (<$15/maand)

---

## 🚨 Troubleshooting

### Railway Build Fails

**Error:** "Dockerfile not found"
- **Fix:** Ensure Dockerfile is in repo root
- **Check:** Railway Settings → Source → Root Directory = "/"

**Error:** "Out of memory during build"
- **Fix:** Increase Railway memory limit (Settings → Resources)
- **Cost:** +$2-3/maand for 4GB RAM

**Error:** "R package installation timeout"
- **Fix:** Use `--timeout=600` in Dockerfile R install commands

### Cloudflare Build Fails

**Error:** "Build command failed"
- **Fix:** Check Node version (must be 18+)
- **Check:** Environment variables zijn correct ingesteld

**Error:** "npm ERR! missing script: build"
- **Fix:** Verify `package.json` has `"build": "react-scripts build"`

### CORS Errors

**Error:** "Access-Control-Allow-Origin"
- **Fix:** Add Cloudflare domain to CORS origins in `api/scenario_model.py`
- **Verify:** Railway deployment re-deployed after CORS update

### API Not Responding

**Error:** "Failed to fetch" / "Network error"
- **Check:** Railway service status = "Active"
- **Check:** `REACT_APP_API_URL` is correct in Cloudflare
- **Test:** `curl https://railway-url/health`

---

**Laatste update:** 5 november 2025
**Contact:** maurice.heck@capaciteitsorgaan.nl
