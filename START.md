# 🚀 Scenario Model Dashboard - Startup Instructies

## 📋 Wat is dit?

Een interactief dashboard waarmee je scenario's kunt doorrekenen voor het capaciteitsplan Huisartsen 2025-2030. Het dashboard gebruikt het **gevalideerde R model** voor alle berekeningen, waardoor de resultaten 100% consistent zijn met de officiële capaciteitsplanningen.

## ✅ Vereisten

- **R** moet geïnstalleerd zijn (heb je al)
- **Node.js** en npm (heb je al voor het React dashboard)
- **Python 3** met virtual environment (al aanwezig in `api/venv/`)

## 🎯 Quick Start (2 terminals)

### Terminal 1: Python Backend API (localhost:5001)

```bash
cd ~/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040\ -\ 049\ HA/047\ Capaciteitsplan/Capaciteitsplan\ 2025-2030/Visuals/huisartsen-dashboard/api

# Activeer virtual environment
source venv/bin/activate

# Start Python API server
python scenario_model.py
```

**Je ziet:**
```
================================================================================
🚀 Scenario Model API Server v3.0 - R Wrapper
================================================================================
📊 R Script: /Users/mgmheck/.../run_scenario_api.R
   Exists: True
📁 Data source: /Users/mgmheck/.../2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv
   Exists: True

🌐 API endpoints:
   - http://localhost:5001/health (GET)
   - http://localhost:5001/api/baseline (GET)
   - http://localhost:5001/api/scenario (POST)
   - http://localhost:5001/api/test (GET) - debug endpoint
================================================================================

✅ Deze API roept het GEVALIDEERDE R model aan
   100% consistentie met VALIDATIE_RESULTATEN.txt
   Scenario 6 multiplicatieve formule
================================================================================

 * Running on http://0.0.0.0:5001
```

### Terminal 2: React Dashboard (localhost:3000)

```bash
cd ~/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040\ -\ 049\ HA/047\ Capaciteitsplan/Capaciteitsplan\ 2025-2030/Visuals/huisartsen-dashboard

# Start React development server
npm start
```

**Je ziet:**
```
Compiled successfully!

You can now view huisartsen-dashboard in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Browser

Open automatisch: **http://localhost:3000**

Of open handmatig in je browser.

---

## 🎮 Gebruik

1. **Navigatie:**
   - 📊 Dashboard - Historische data visualisatie (2010-2025)
   - 🔮 Scenario Model - Interactief model voor projecties (2025-2043)

2. **Scenario Model:**
   - Verstel parameters in het linkerpaneel:
     - **Instroom opleiding** - aantal personen dat vanaf 2027 de opleiding start
     - **FTE factor vrouw/man** - gemiddelde FTE per gender
     - **Extern rendement** - percentage dat in het beroep blijft

   - Real-time updates in grafieken:
     - **Projectie 2025-2043** - aanbod vs vraag
     - **Gap analyse** - tekort/overschot in FTE

   - KPI tiles tonen jaar 2043 (evenwichtsjaar):
     - Beschikbaar aanbod
     - Benodigde vraag (scenario 6)
     - Gap (tekort/overschot)

3. **Berekeningen:**
   - Elke parameter aanpassing triggert nieuwe berekening
   - Python API roept R model aan (~2 seconden)
   - 100% consistent met VALIDATIE_RESULTATEN.txt

---

## 🧪 Test de Setup

### Test 1: Health Check

Open in browser: **http://localhost:5001/health**

Verwacht resultaat:
```json
{
  "status": "healthy",
  "versie": "3.0 (R Wrapper)",
  "r_script_found": true,
  "data_found": true,
  "r_script_path": "/Users/mgmheck/.../run_scenario_api.R"
}
```

### Test 2: R Model Direct Test

Open in browser: **http://localhost:5001/api/test**

Verwacht resultaat (jaar 2043):
```json
{
  "status": "success",
  "rows": 19,
  "jaar_2043": {
    "aanbod_fte": 13790.2,
    "benodigd_fte_scen6": 16402.5,
    "gap_fte_scen6": -2612.3,
    "gap_percentage_scen6": -15.93
  }
}
```

**✅ Validatie:** De `benodigd_fte_scen6` moet **16,402.5 FTE** zijn (exact match met VALIDATIE_RESULTATEN.txt)

### Test 3: Dashboard Test

1. Open **http://localhost:3000**
2. Klik op **🔮 Scenario Model**
3. Check of de baseline data laadt
4. Verstel instroom slider naar 1000
5. Check of grafieken updaten (~2 sec wachten)

---

## 🛑 Stoppen

- **Terminal 1 (Python API):** `Ctrl+C`
- **Terminal 2 (React):** `Ctrl+C`

---

## 🔧 Troubleshooting

### Probleem: "R script failed"

**Oorzaak:** R script kan niet worden uitgevoerd

**Oplossing:**
```bash
# Test of Rscript werkt
which Rscript

# Test R script direct
cd ~/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040\ -\ 049\ HA/047\ Capaciteitsplan/Capaciteitsplan\ 2025-2030/Visuals/Scripts
Rscript run_scenario_api.R 718 0.72 0.81 /tmp/test_output.csv

# Check output
cat /tmp/test_output.csv
```

### Probleem: "Python API niet verbonden"

**Oorzaak:** Backend draait niet op localhost:5001

**Oplossing:**
1. Check of Terminal 1 draait
2. Check of je het juiste venv geactiveerd hebt
3. Check poort 5001: `lsof -i :5001`

### Probleem: "Module not found"

**Oorzaak:** Python dependencies ontbreken

**Oplossing:**
```bash
cd api
source venv/bin/activate
pip install flask flask-cors pandas
```

### Probleem: React start niet

**Oorzaak:** Node modules ontbreken

**Oplossing:**
```bash
npm install
npm start
```

---

## 📊 Architectuur

```
┌─────────────────┐
│  React Frontend │  localhost:3000
│  (Browser)      │
└────────┬────────┘
         │ HTTP POST /api/scenario
         │ {instroom: 1000, fte_vrouw: 0.72, ...}
         ↓
┌─────────────────┐
│  Python Flask   │  localhost:5001
│  API Server     │
└────────┬────────┘
         │ subprocess
         │ Rscript run_scenario_api.R 1000 0.72 0.81 output.csv
         ↓
┌─────────────────┐
│  R Model        │
│  (Gevalideerd)  │  Scripts/run_scenario_api.R
│                 │  → beschikbaar_aanbod.R
│                 │  → benodigd_aanbod.R
└────────┬────────┘
         │ CSV output
         ↓
┌─────────────────┐
│  Python parses  │
│  CSV → JSON     │
└────────┬────────┘
         │ JSON response
         │ {projectie: [{jaar: 2025, aanbod_fte: ...}, ...]}
         ↓
┌─────────────────┐
│  React renders  │
│  Charts         │
└─────────────────┘
```

---

## ✅ Waarom deze aanpak?

1. **100% Accurate** - Gebruikt exact dezelfde R code als VALIDATIE_RESULTATEN.txt
2. **Betrouwbaar** - Geen vertaalfouten tussen R en Python mogelijk
3. **Single Source of Truth** - R model is leidend
4. **Makkelijk te onderhouden** - Als R model verandert, werkt dashboard automatisch met nieuwe versie
5. **Officieel** - Dezelfde code als gebruikt voor capaciteitsplanningen

---

## 📚 Gerelateerde Bestanden

- **R Model Scripts:**
  - `Scripts/run_scenario_api.R` - API wrapper
  - `Scripts/beschikbaar_aanbod.R` - Supply berekening (7 stappen)
  - `Scripts/benodigd_aanbod.R` - Demand berekening (6 scenarios)
  - `Scripts/VALIDATIE_RESULTATEN.txt` - Validatie bewijs

- **Python Backend:**
  - `api/scenario_model.py` - Flask API (R wrapper)
  - `api/venv/` - Virtual environment

- **React Frontend:**
  - `src/App.js` - Navigatie
  - `src/Dashboard.tsx` - Historische data
  - `src/ScenarioModelAPI.tsx` - Scenario model (gebruikt API)
  - `public/data.csv` - Historische parameterwaarden

---

## 🎉 Veel plezier met het scenario model!

Bij vragen of problemen: check de troubleshooting sectie hierboven.
