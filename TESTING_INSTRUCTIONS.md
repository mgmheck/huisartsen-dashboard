# Testing Instructions - Huisartsen Dashboard Refactoring

**Versie:** 3.1 (Refactored)
**Datum:** 1 november 2025
**Status:** Klaar voor testing

---

## 📊 Refactoring Resultaten

### Code Reductie

| Bestand | Voor | Na | Reductie |
|---------|------|-----|----------|
| **ScenarioModelAPI.tsx** | 1,608 | 574 | **-64%** (-1,034 regels) |
| **Dashboard.tsx** | 540 | 427 | **-21%** (-113 regels) |
| **TOTAAL** | 2,148 | 1,001 | **-53%** (-1,147 regels) |

### Nieuwe Bestanden

- ✅ 20 nieuwe bestanden (components, hooks, utils, docs)
- ✅ 7 nieuwe directories
- ✅ Backend refactored (validation, rate limiting, error sanitization)
- ✅ CSS Modules infrastructure (variables + common)

---

## 🧪 Testing Checklist

Volg deze stappen **exact** om de refactoring te testen.

### STAP 1: Backup Verificatie ✅

Controleer dat backups bestaan:

```bash
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard/src"

# Check backups
ls -lh ScenarioModelAPI.tsx.backup
ls -lh Dashboard.tsx.backup
```

**Verwacht:**
- `ScenarioModelAPI.tsx.backup` (1608 regels)
- `Dashboard.tsx.backup` (540 regels)

---

### STAP 2: Build Test ⏳

Test dat de refactored code compileert zonder errors:

```bash
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard"

# Install dependencies (als nog niet gedaan)
npm install

# Build test
npm run build
```

**Verwacht:**
```
✅ Compiled successfully!
File sizes after gzip:
  ... (details)

The build folder is ready to be deployed.
```

**Als er errors zijn:**
- TypeScript errors: Check import paths in nieuwe components
- Missing dependencies: Run `npm install`
- Build fails: Check console output en fix errors

---

### STAP 3: Start Development Servers ⏳

**Terminal 1: Backend starten**

```bash
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard/api"

# Activeer Python virtual environment
source venv/bin/activate

# Set environment variables
export FLASK_ENV=development
export DATA_PATH="../public/data/parameterwaarden.csv"
export R_SCRIPT_PATH="../r_scripts/"

# Start Flask server
python scenario_model.py
```

**Verwacht:**
```
 * Serving Flask app 'scenario_model'
 * Debug mode: on
 * Running on http://127.0.0.1:5001
```

**Terminal 2: Frontend starten**

```bash
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard"

# Start React development server
npm start
```

**Verwacht:**
```
Compiled successfully!

You can now view huisartsen-dashboard in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Browser opent automatisch op `http://localhost:3000`

---

### STAP 4: Visual Verification ⏳

Open browser op `http://localhost:3000` en controleer:

#### 4.1 Eerste Load

- [ ] **Loading state** toont (spinner + "Berekeningen uitvoeren...")
- [ ] **API verbinding** slaagt (geen "Python API niet verbonden" waarschuwing)
- [ ] **Baseline data** laadt (check browser console voor "✅ CSV Cache" berichten)
- [ ] **Charts renderen** correct (3 charts zichtbaar)
- [ ] **Geen console errors** (open DevTools → Console tab)

#### 4.2 Parameter Controls (Aanbod Sectie)

Test ALLE parameters in de Aanbod sectie:

- [ ] **Instroom opleiding**
  - [ ] Number input werkt (typ 900, enter)
  - [ ] Range slider werkt (sleep naar 1200)
  - [ ] Baseline toont: "Vastgestelde waarde: 718 personen"

- [ ] **FTE-factor vrouw**
  - [ ] Number input werkt (typ 0.80)
  - [ ] Range slider werkt (sleep naar 0.90)
  - [ ] Baseline toont: "Vastgestelde waarde: 0.72"

- [ ] **FTE-factor man**
  - [ ] Number input werkt
  - [ ] Range slider werkt
  - [ ] Baseline toont: "Vastgestelde waarde: 0.81"

- [ ] **Uitstroom parameters** (8 parameters)
  - [ ] Uitstroom vrouw 5j: Number input + slider werken, baseline 11.6%
  - [ ] Uitstroom man 5j: Works, baseline 22.6%
  - [ ] Uitstroom vrouw 10j: Works, baseline 23.2%
  - [ ] Uitstroom man 10j: Works, baseline 37.3%
  - [ ] Uitstroom vrouw 15j: Works, baseline 37.1%
  - [ ] Uitstroom man 15j: Works, baseline 50.2%
  - [ ] Uitstroom vrouw 20j: Works, baseline 51.0%
  - [ ] Uitstroom man 20j: Works, baseline 63.2%

#### 4.3 Parameter Controls (Opleiding Sectie)

- [ ] **Intern rendement**
  - [ ] Number input werkt
  - [ ] Range slider werkt
  - [ ] Baseline toont: "Vastgestelde waarde: 94%"

- [ ] **Opleidingsduur**
  - [ ] Number input werkt
  - [ ] Range slider werkt
  - [ ] Baseline toont: "Vastgestelde waarde: 3.0 jaar"

- [ ] **Extern rendement parameters** (8 parameters)
  - [ ] Alle vrouw parameters (1j, 5j, 10j, 15j) werken
  - [ ] Alle man parameters (1j, 5j, 10j, 15j) werken
  - [ ] Percentages tonen correct (98.9%, 94.3%, etc.)

#### 4.4 Parameter Controls (Vraag Sectie)

- [ ] **Epidemiologie** - Works, baseline 1.0%
- [ ] **Sociaal-cultureel** - Works, baseline 1.9%
- [ ] **Vakinhoudelijk** - Works, baseline -0.3%
- [ ] **Efficiency** - Works, baseline -0.5%
- [ ] **Horizontale substitutie** - Works, baseline 1.6%
- [ ] **Arbeidstijdverandering** - Works, baseline 0.0%
- [ ] **Verticale substitutie** - Works, baseline -1.1%
- [ ] **Totale zorgvraag** - Works, baseline 2.6%

#### 4.5 Reset Buttons

- [ ] **Reset Aanbod** - Klikt op 🔄, alle Aanbod parameters terug naar baseline
- [ ] **Reset Opleiding** - Klikt op 🔄, alle Opleiding parameters terug
- [ ] **Reset Vraag** - Klikt op 🔄, alle Vraag parameters terug

#### 4.6 Charts

**Scenario vs Baseline Chart:**
- [ ] Chart rendert zonder errors
- [ ] 4 lijnen zichtbaar:
  - [ ] Aanbod (aangepast scenario) - Solide groene lijn
  - [ ] Aanbod (voorkeursscenario) - Gestippelde groene lijn
  - [ ] Vraag (aangepast scenario) - Solide oranje lijn
  - [ ] Vraag (voorkeursscenario) - Gestippelde oranje lijn
- [ ] X-as toont jaren (2025-2043)
- [ ] Y-as toont FTE waarden (13,000-17,000 range)
- [ ] Legend werkt (click to toggle lines)
- [ ] Tooltip werkt (hover over data points)
- [ ] Nederlandse nummer notatie (15.000 met punt)

**Cohort Analysis Chart:**
- [ ] Stacked area chart rendert
- [ ] 4 cohorten zichtbaar (verschillende kleuren)
- [ ] Legend toont alle cohort namen
- [ ] Tooltip werkt

**Gap Analysis Chart:**
- [ ] Bar chart rendert
- [ ] Bars kleuren rood (gap > 0) of groen (gap < 0)
- [ ] Y-as toont Gap FTE waarden
- [ ] Tooltip werkt

#### 4.7 Instroomadvies Badge

- [ ] Badge toont boven Scenario vs Baseline chart
- [ ] Tekst: "Aangepast instroomadvies voor evenwicht 2043"
- [ ] Nummer: "1.026 personen" (of aangepaste waarde)
- [ ] Badge positioned correct (top-left van chart)

#### 4.8 Scenario Vergelijking Cards

**Rij 1: Voorkeursscenario**
- [ ] 4 cards zichtbaar (grijze achtergrond)
- [ ] Card 1: "Volgens voorkeursscenario:"
- [ ] Card 2: "Aanbod in 2043: X FTE" (met duizendtal punt)
- [ ] Card 3: "Vraag in 2043: X FTE"
- [ ] Card 4: "Voorkeursadvies: 1.026 personen"

**Rij 2: Aangepast scenario**
- [ ] 4 cards zichtbaar (lichtgroene achtergrond)
- [ ] Card 1: "Volgens aangepast scenario:"
- [ ] Card 2: "Aangepast aanbod in 2043: X FTE"
- [ ] Card 3: "Aangepaste vraag in 2043: X FTE"
- [ ] Card 4: "Aangepaste instroomadvies: X personen" (wijzigt met instroom parameter)

---

### STAP 5: Functional Testing ⏳

#### 5.1 Debounce Test

Test dat API calls ge-debounced worden (250ms delay):

1. **Open DevTools** → Network tab
2. **Wijzig instroom** van 718 → 800 (typ in number input)
3. **Wijzig meteen weer** naar 900
4. **Wijzig meteen weer** naar 1000
5. **Wacht 1 seconde**

**Verwacht:**
- Je ziet NIET 3 API calls
- Je ziet 2 API calls (leading + trailing edge):
  - 1 call immediate (leading edge)
  - 1 call na 250ms (trailing edge met final waarde 1000)

#### 5.2 localStorage Cache Test

Test CSV data caching:

1. **Open DevTools** → Console
2. **Refresh page** (eerste keer)
3. **Check console** voor "💾 CSV Cache SAVED voor dashboard"
4. **Refresh page** (tweede keer)
5. **Check console** voor "✅ CSV Cache HIT voor dashboard"

**Verwacht:**
- Eerste load: ~200ms (fetch + parse)
- Tweede load: ~5ms (cache hit)
- Console toont cache messages

#### 5.3 useMemo Performance Test

Test chart data memoization:

1. **Open DevTools** → Console
2. **Enable "Paint flashing"** (DevTools → Settings → Rendering → Paint flashing)
3. **Wijzig een parameter** (bijv. instroom 718 → 800)
4. **Observeer re-renders**

**Verwacht:**
- Alleen charts flaschen (niet hele page)
- Minimale re-renders
- Smooth updates, geen jank

#### 5.4 Error Handling Test

Test error states:

**Test 1: API niet verbonden**
1. Stop backend server (Ctrl+C in Terminal 1)
2. Refresh frontend
3. **Verwacht:** "⚠️ Python API niet verbonden" waarschuwing met instructies

**Test 2: API error tijdens scenario call**
1. Start backend weer
2. Wijzig parameter naar ongeldige waarde (via browser console):
   ```javascript
   // In browser console
   // Dit zal niet werken via UI, maar test error handling
   ```

---

### STAP 6: Browser Compatibility ⏳

Test in verschillende browsers:

#### Chrome (latest)
- [ ] Dashboard laadt correct
- [ ] Parameter controls werken
- [ ] Charts renderen
- [ ] No console errors

#### Firefox (latest)
- [ ] Dashboard laadt correct
- [ ] Parameter controls werken
- [ ] Charts renderen
- [ ] No console errors

#### Safari (latest)
- [ ] Dashboard laadt correct
- [ ] Parameter controls werken
- [ ] Charts renderen
- [ ] No console errors

#### Edge (latest)
- [ ] Dashboard laadt correct
- [ ] Parameter controls werken
- [ ] Charts renderen
- [ ] No console errors

---

### STAP 7: Performance Validation ⏳

Measure performance metrics:

#### 7.1 Dashboard Load Time

```javascript
// In browser console (na page refresh)
performance.mark('start');
// Wait for page to load
performance.mark('end');
performance.measure('load', 'start', 'end');
console.log(performance.getEntriesByType('measure')[0].duration);
```

**Targets:**
- Eerste load (geen cache): ~200ms
- Cached load: <100ms (TARGET: ~50ms)

#### 7.2 Chart Re-render Time

```javascript
// In browser console
console.time('chart-rerender');
// Wijzig een parameter (bijv. instroom slider)
// Wait for chart to update
console.timeEnd('chart-rerender');
```

**Target:** <70ms (ACTUAL: ~1ms met useMemo)

#### 7.3 API Response Time

Check Network tab → XHR filter → scenario POST request

**Target:** <3000ms (usually ~2500ms)

---

### STAP 8: Code Quality Check ⏳

#### 8.1 TypeScript Errors

```bash
# Check TypeScript errors
npx tsc --noEmit
```

**Verwacht:** No errors (of alleen warnings die OK zijn)

#### 8.2 Console Errors

**Open DevTools → Console**

**Verwacht:**
- ✅ CSV Cache messages (OK)
- ✅ API response logging (OK)
- ❌ NO errors (red messages)
- ❌ NO warnings (yellow messages) - acceptabel voor development

#### 8.3 Network Tab

**Open DevTools → Network → All**

**Check:**
- [ ] `/health` call succeeds (200 OK)
- [ ] `/api/baseline` call succeeds (200 OK)
- [ ] `/api/scenario` calls succeed (200 OK)
- [ ] `/data/parameterwaarden.csv` loads (200 OK)
- [ ] No 404s
- [ ] No 500s

---

### STAP 9: Regression Test ⏳

Vergelijk nieuwe versie met backup:

#### 9.1 Visual Comparison

1. **Run oude versie** (gebruik backup):
   ```bash
   cp src/ScenarioModelAPI.tsx src/ScenarioModelAPI.tsx.new
   cp src/ScenarioModelAPI.tsx.backup src/ScenarioModelAPI.tsx
   npm start
   ```

2. **Screenshot oude versie** (alle 3 charts)

3. **Restore nieuwe versie**:
   ```bash
   cp src/ScenarioModelAPI.tsx.new src/ScenarioModelAPI.tsx
   npm start
   ```

4. **Screenshot nieuwe versie** (alle 3 charts)

5. **Vergelijk screenshots** - moeten IDENTIEK zijn (pixel-perfect)

#### 9.2 Functional Comparison

Test EXACT DEZELFDE scenario in beide versies:

**Scenario:**
- Instroom: 900
- Intern rendement: 0.90
- FTE vrouw: 0.80
- FTE man: 0.85
- Alle andere parameters: default

**Vergelijk:**
- [ ] Aanbod FTE 2043: Moet IDENTIEK zijn
- [ ] Vraag FTE 2043: Moet IDENTIEK zijn
- [ ] Instroomadvies: Moet IDENTIEK zijn
- [ ] Chart data punten: Moet IDENTIEK zijn

**Tolerantie:** Max 0.1% verschil (rounding errors OK)

---

### STAP 10: Git Commit Preparation ⏳

Als alle tests slagen, prepareer commits:

```bash
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard"

# Check status
git status

# Check diff (moet VEEL wijzigingen tonen)
git diff --stat

# Expected changes:
# - ARCHITECTURE.md (new)
# - DEVELOPMENT.md (new)
# - CODE_REVIEW_CHECKLIST.md (new)
# - DEPLOYMENT.md (new)
# - REFACTORING_*.md (new)
# - README.md (modified)
# - api/scenario_model.py (modified)
# - api/requirements.txt (modified)
# - src/ScenarioModelAPI.tsx (modified, -1034 lines)
# - src/Dashboard.tsx (modified, -113 lines)
# - src/components/ (new directory, 6 files)
# - src/hooks/ (new directory, 3 files)
# - src/utils/ (new directory, 2 files)
# - src/styles/ (new directory, 2 files)
```

**NIET COMMITTEN** tot alle tests slagen!

---

## ❌ Als Tests Falen

### Build Errors

**Symptom:** `npm run build` fails

**Fix:**
1. Check error message in console
2. Meestal: missing import of TypeScript type error
3. Fix import path in betreffende file
4. Run `npm run build` again

### TypeScript Errors

**Symptom:** Red squiggles in VSCode, tsc errors

**Common fixes:**
- Missing import: Add correct import statement
- Type mismatch: Add correct type annotation
- Undefined property: Check spelling, add to interface

### Runtime Errors

**Symptom:** White screen, console errors

**Fix:**
1. Check browser console for exact error
2. Most likely: import path incorrect
3. Check import statements in ScenarioModelAPI.tsx en Dashboard.tsx
4. Verify component exports in index.ts files

### API Connection Fails

**Symptom:** "Python API niet verbonden"

**Fix:**
1. Check backend server is running (Terminal 1)
2. Check port 5001 (niet 5000!)
3. Check environment variables zijn set
4. Test health endpoint: `curl http://localhost:5001/health`

### Charts Niet Renderen

**Symptom:** Charts zijn blank of missing

**Fix:**
1. Check console for errors
2. Check projectie data is loaded (console.log)
3. Check Recharts components import correct
4. Check data format matches expected shape

---

## ✅ Success Criteria

**Alle volgende moet TRUE zijn:**

- [ ] `npm run build` succeeds zonder errors
- [ ] Backend start zonder errors
- [ ] Frontend start en opent in browser
- [ ] Alle parameter controls werken (40+ parameters)
- [ ] Alle reset buttons werken (3 secties)
- [ ] Alle charts renderen correct (3 charts)
- [ ] API calls werken (debounced)
- [ ] localStorage cache werkt
- [ ] useMemo performance improvement merkbaar
- [ ] Geen console errors
- [ ] Geen TypeScript errors
- [ ] Visual identiek aan origineel (screenshot vergelijking)
- [ ] Functional identiek aan origineel (scenario vergelijking)
- [ ] Works in alle browsers (Chrome, Firefox, Safari, Edge)
- [ ] Performance targets gehaald (<100ms cached load, <70ms re-render)

**Als ALLE criteria TRUE:** ✅ **KLAAR VOOR DEPLOYMENT**

---

## 📞 Hulp Nodig?

### Troubleshooting

**Zie `DEPLOYMENT.md` sectie "Troubleshooting" voor:**
- Backend niet start
- Frontend build errors
- API connection issues
- R script errors
- CSV load errors

### Quick Fixes

**Reset alles:**
```bash
# Kill servers
pkill -f "flask\|node"

# Clear cache
rm -rf node_modules build
npm install

# Clear localStorage
# Browser console: localStorage.clear()

# Restart servers
# Terminal 1: Backend (zie STAP 3)
# Terminal 2: Frontend (npm start)
```

**Restore backup als alles faalt:**
```bash
cp src/ScenarioModelAPI.tsx.backup src/ScenarioModelAPI.tsx
cp src/Dashboard.tsx.backup src/Dashboard.tsx
npm start
```

---

## 📝 Testing Log

Gebruik deze checklist tijdens testing:

```
TESTING LOG
===========
Datum: _______________
Tester: Maurice Heck

STAP 1: Backup Verificatie         [ ]
STAP 2: Build Test                  [ ]
STAP 3: Start Servers               [ ]
STAP 4: Visual Verification         [ ]
  - Eerste Load                     [ ]
  - Parameter Controls (Aanbod)     [ ]
  - Parameter Controls (Opleiding)  [ ]
  - Parameter Controls (Vraag)      [ ]
  - Reset Buttons                   [ ]
  - Charts                          [ ]
  - Instroomadvies Badge            [ ]
  - Scenario Cards                  [ ]
STAP 5: Functional Testing          [ ]
  - Debounce Test                   [ ]
  - localStorage Cache Test         [ ]
  - useMemo Performance Test        [ ]
  - Error Handling Test             [ ]
STAP 6: Browser Compatibility       [ ]
  - Chrome                          [ ]
  - Firefox                         [ ]
  - Safari                          [ ]
  - Edge                            [ ]
STAP 7: Performance Validation      [ ]
  - Dashboard Load Time             [ ]
  - Chart Re-render Time            [ ]
  - API Response Time               [ ]
STAP 8: Code Quality Check          [ ]
  - TypeScript Errors               [ ]
  - Console Errors                  [ ]
  - Network Tab                     [ ]
STAP 9: Regression Test             [ ]
  - Visual Comparison               [ ]
  - Functional Comparison           [ ]
STAP 10: Git Commit Preparation     [ ]

TOTAAL: ___/10 stappen compleet

ISSUES GEVONDEN:
________________
________________
________________

KLAAR VOOR DEPLOYMENT: [ ] JA / [ ] NEE
```

---

**Laatste update:** 1 november 2025
**Status:** ✅ Refactoring compleet - Klaar voor testing
