# 🚀 Render.com Deployment Instructies
# Huisartsen Dashboard - Capaciteitsplan 2025-2030

**Datum:** 29 oktober 2025
**Platform:** Render.com (Gratis Tier)
**Stack:** React + Python Flask + R

---

## 📋 Wat wordt gedeployed?

### Frontend (Static Site)
- **Type:** React applicatie
- **Build:** `npm run build`
- **Output:** Static HTML/CSS/JS in `build/` folder
- **Features:**
  - Dashboard met CSV data visualisaties
  - Scenario Model interface
  - Interactieve charts met Recharts

### Backend (Web Service)
- **Type:** Python Flask API
- **Runtime:** Docker container met R support
- **Features:**
  - 4 API endpoints (health, baseline, scenario, test)
  - R script integratie voor capaciteitsplan berekeningen
  - CSV data processing

---

## 🎯 Deployment Stappen

### **Stap 1: Render.com Account Setup**

1. Ga naar [https://render.com](https://render.com)
2. Klik op **"Get Started"**
3. Sign up met GitHub account (aanbevolen)
4. Verifieer je email adres

---

### **Stap 2: Connect GitHub Repository**

1. In Render Dashboard: Klik **"New +"** rechtsboven
2. Kies **"Blueprint"**
3. Selecteer **"Connect a repository"**
4. Autoriseer Render om toegang te krijgen tot je GitHub account
5. Selecteer repository: `mgmheck/huisartsen-dashboard`
6. Render detecteert automatisch de `render.yaml` configuratie

**Belangrijk:** Als je een private repository hebt, moet je Render expliciet toegang geven.

---

### **Stap 3: Review Blueprint Configuration**

Render leest automatisch de `render.yaml` en toont:

```yaml
Services to be created:
✅ huisartsen-dashboard-frontend (Static Site)
✅ huisartsen-dashboard-backend (Web Service - Docker)
```

Klik op **"Apply"** om beide services aan te maken.

---

### **Stap 4: Wait for Deployment**

**Frontend deployment:**
- ⏱️ Duurt ~3-5 minuten
- Status: Building → Deploying → Live

**Backend deployment:**
- ⏱️ Duurt ~8-12 minuten (Docker image met R moet worden gebouwd)
- Status: Building → Deploying → Live

Je kunt de logs live volgen in het Render dashboard.

---

### **Stap 5: Verify URLs**

Na succesvolle deployment krijg je twee URLs:

**Frontend:**
```
https://huisartsen-dashboard-frontend.onrender.com
```

**Backend:**
```
https://huisartsen-dashboard-backend.onrender.com
```

---

## ✅ Verificatie Checklist

### Test Frontend:
1. Open frontend URL in browser
2. ✅ Dashboard laadt zonder errors
3. ✅ CSV data wordt correct ingelezen
4. ✅ Visualisaties worden getoond
5. ✅ Navigatie tussen views werkt

### Test Backend:
1. Open `https://[backend-url]/health` in browser
2. ✅ Response: `{"status": "healthy"}`
3. Test API endpoint: `https://[backend-url]/api/baseline`
4. ✅ Response bevat projectie data

### Test Scenario Model:
1. In frontend: Ga naar **"Scenario Model"** tab
2. Wijzig parameters (bijv. instroom naar 800)
3. Klik **"Bereken Scenario"**
4. ✅ Scenario berekening werkt (cold start kan 30 sec duren!)
5. ✅ Resultaten worden getoond in charts

---

## 🔧 Troubleshooting

### ❌ Frontend build faalt
**Symptoom:** "Build failed" in Render logs

**Oplossing:**
```bash
# Lokaal testen of build werkt:
npm install
npm run build

# Als dit lokaal werkt maar op Render faalt:
# Check Node version in Render dashboard
# Pas aan naar Node 18+ (Settings → Environment)
```

---

### ❌ Backend faalt te starten
**Symptoom:** "Service Unhealthy" of timeout errors

**Oorzaken:**
1. **R script path is incorrect**
   - Check logs: `/app/r_scripts/` moet bestaan
   - Kopieer R scripts naar correcte locatie in Dockerfile

2. **CSV data ontbreekt**
   - Check: `/app/data/parameterwaarden.csv` moet bestaan
   - Zie Dockerfile `COPY public/data/ /app/data/`

3. **R packages niet geïnstalleerd**
   - Check Dockerfile regel met `install.packages()`
   - Voeg ontbrekende packages toe

**Debug met logs:**
```
Render Dashboard → Backend Service → Logs
Kijk naar startup messages
```

---

### 🥶 Cold Start is langzaam (>30 sec)
**Dit is normaal voor Render Free Tier!**

**Oplossingen:**
1. **Accepteren** - Communiceer naar gebruikers dat eerste load wat duurt
2. **Warm houden** (gratis hack):
   ```bash
   # Gebruik cron job of GitHub Action om elke 10 min te pingen
   curl https://[backend-url]/health
   ```
3. **Upgraden** naar Render Starter ($7/maand per service) voor always-on

---

### ❌ CORS errors in browser console
**Symptoom:** `Access-Control-Allow-Origin` errors

**Oplossing:**
Check dat Flask CORS correct is geconfigureerd in `scenario_model.py`:
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Moet HIER staan, niet later
```

---

## 🔄 Updates Deployen

**Automatische deployments zijn enabled!**

Elke keer dat je pusht naar `main` branch:
1. Render detecteert de wijziging
2. Triggered nieuwe build
3. Deployed automatisch na successvolle build

**Manual redeploy:**
1. Render Dashboard → Service
2. Klik **"Manual Deploy"** rechtsboven
3. Selecteer **"Deploy latest commit"**

---

## 💰 Kosten Overzicht

### Gratis Tier (Huidige Setup):
- ✅ Frontend: **€0/maand** (Unlimited bandwidth)
- ✅ Backend: **€0/maand** (750 uur/maand compute)
- ⚠️ Trade-off: Cold starts na 15 min inactiviteit

### Upgrade Opties:
- **Starter Plan:** $7/maand per service ($14 totaal)
  - Geen cold starts
  - Persistent storage
  - Priority support

- **Pro Plan:** $25/maand per service ($50 totaal)
  - Guaranteed uptime
  - Autoscaling
  - Advanced metrics

---

## 📞 Support & Hulp

**Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Email: support@render.com (alleen voor betaalde accounts)

**Project Maintainer:**
- Maurice Heck (mgmheck@capaciteitsorgaan.nl)
- GitHub Issues: https://github.com/mgmheck/huisartsen-dashboard/issues

---

## 🎉 Success!

Als alles werkt zie je:
- ✅ Frontend is live op Render URL
- ✅ Backend antwoordt op API calls
- ✅ Scenario Model berekent projecties
- ✅ Automatische deployments werken

**Volgende stappen:**
1. Deel URL's met collega's
2. Bookmark URLs voor makkelijke toegang
3. Monitor usage in Render dashboard
4. Overweeg custom domain (bijv. dashboard.capaciteitsorgaan.nl)

---

**Last updated:** 29 oktober 2025
**Version:** 1.0
**Generated with:** Claude Code
