# Test Handleiding - Geoptimaliseerde Code

Stap-voor-stap instructies om de geoptimaliseerde code te testen en te vergelijken met het origineel.

---

## 🎯 Doel

Controleer of de geoptimaliseerde code:
1. ✅ Dezelfde functionaliteit heeft als origineel
2. ✅ Significant sneller is (85-90% verbetering)
3. ✅ Geen bugs introduceert

---

## 🚀 STAP 1: Voorbereiding

### 1.1 Controleer dat je in de juiste directory bent

```bash
cd /home/user/huisartsen-dashboard
pwd  # Moet /home/user/huisartsen-dashboard tonen
```

### 1.2 Controleer dat dependencies geïnstalleerd zijn

```bash
npm install  # Installeer als je dit nog niet hebt gedaan
```

### 1.3 Controleer backend is running

```bash
# In een aparte terminal:
cd api
source venv/bin/activate
python scenario_model.py

# Je zou moeten zien:
# ✅ Deze API roept het GEVALIDEERDE R model aan
# 🌐 API endpoints: http://localhost:5001
```

---

## 🧪 STAP 2: Test Originele Code (Baseline)

### 2.1 Zorg dat origineel actief is

Controleer `src/App.js`:

```bash
cat src/App.js | grep -A2 "import.*ScenarioModel"
```

Je zou moeten zien:
```javascript
import ScenarioModelAPI from './ScenarioModelAPI';
```

### 2.2 Start development server

```bash
npm start
```

Browser opent automatisch op `http://localhost:3000`

### 2.3 Test functionaliteit (Baseline)

**Checklist:**
- [ ] Dashboard laadt zonder errors
- [ ] API verbinding werkt (geen ⚠️ "Python API niet verbonden")
- [ ] Wijzig "Instroom opleiding" slider → chart update
- [ ] Wijzig "FTE-factor vrouw" → chart update
- [ ] Reset knop werkt (🔄 per sectie)
- [ ] Instroomadvies wordt getoond (rechts bovenaan chart)
- [ ] Baseline (stippellijn) en scenario (solid lijn) zichtbaar

### 2.4 Meet performance (Baseline)

**Chrome DevTools Methode:**

1. Open Chrome DevTools: `F12` of `Cmd+Option+I` (Mac)
2. Ga naar **Performance** tab
3. Klik 🔴 **Record**
4. Voer acties uit:
   - Sleep "Instroom" slider heen en weer (5x)
   - Wacht 2 seconden
   - Sleep "FTE-factor vrouw" slider (5x)
5. Klik ⏹️ **Stop**

**Noteer:**
```
BASELINE METINGEN:
- Scripting tijd: _____ ms
- Rendering tijd: _____ ms
- Totale tijd: _____ ms
```

**React DevTools Profiler Methode:**

1. Installeer React DevTools extension
2. Open DevTools → **Profiler** tab
3. Klik 🔴 **Record**
4. Sleep "Instroom" slider (10x snel)
5. Klik ⏹️ **Stop**

**Noteer:**
```
BASELINE - React Profiler:
- Render tijd per update: _____ ms
- Aantal re-renders: _____
- Commit tijd: _____ ms
```

### 2.5 Stop development server

```bash
# Druk Ctrl+C in terminal waar npm start draait
```

---

## ⚡ STAP 3: Test Geoptimaliseerde Code

### 3.1 Activeer geoptimaliseerde code

**Optie A: Tijdelijke test (Aanbevolen)**

Maak test bestand:

```bash
cat > src/App.test-optimized.js << 'EOF'
import React from 'react';
import ScenarioModelAPIOptimized from './src-optimized/ScenarioModelAPIOptimized';
import './App.css';

function App() {
  return (
    <div className="App">
      <ScenarioModelAPIOptimized />
    </div>
  );
}

export default App;
EOF
```

Backup origineel en activeer test:

```bash
cp src/App.js src/App.backup.js
cp src/App.test-optimized.js src/App.js
```

**Optie B: Direct wijzigen in src/App.js**

```bash
# Handmatig bewerken:
nano src/App.js

# Wijzig deze regel:
# import ScenarioModelAPI from './ScenarioModelAPI';
#
# Naar:
# import ScenarioModelAPIOptimized from './src-optimized/ScenarioModelAPIOptimized';
```

### 3.2 Start development server

```bash
npm start
```

Je zou nu **"GEOPTIMALISEERD ⚡"** in de header moeten zien!

### 3.3 Test functionaliteit (Geoptimaliseerd)

**Volledige Functionaliteit Checklist:**

```
AANBOD SECTIE:
[ ] Instroom opleiding (600-1500) - werkt
[ ] FTE-factor vrouw (0.5-1.0) - werkt
[ ] FTE-factor man (0.5-1.0) - werkt
[ ] Uitstroom vrouw 5j (5-30%) - werkt
[ ] Uitstroom man 5j (5-30%) - werkt
[ ] Uitstroom vrouw 10j (10-50%) - werkt
[ ] Uitstroom man 10j (10-50%) - werkt
[ ] Uitstroom vrouw 15j (15-60%) - werkt
[ ] Uitstroom man 15j (15-60%) - werkt
[ ] Uitstroom vrouw 20j (20-70%) - werkt
[ ] Uitstroom man 20j (20-70%) - werkt
[ ] Reset knop Aanbod sectie - werkt

CHART & VISUALISATIES:
[ ] Chart laadt correct
[ ] Aanbod lijn (blauw, solid) - zichtbaar
[ ] Aanbod baseline (blauw, dashed) - zichtbaar
[ ] Vraag lijn (oranje, solid) - zichtbaar
[ ] Vraag baseline (oranje, dashed) - zichtbaar
[ ] Instroomadvies box (links bovenaan) - zichtbaar
[ ] KPI tegels (boven chart) - correct

INTERACTIE:
[ ] Slider werkt smooth (geen lag)
[ ] Number input werkt
[ ] Debounce indicator ("Berekening voorbereiden...") - werkt
[ ] Loading indicator ("Berekenen...") - werkt
[ ] Chart update na 250ms - werkt

API:
[ ] Geen console errors
[ ] API calls succesvol (check Network tab)
[ ] Response times normaal (~2-3 seconden)
```

### 3.4 Meet performance (Geoptimaliseerd)

**Chrome DevTools Profiler:**

1. Open DevTools → **Performance** tab
2. Klik 🔴 **Record**
3. **Exact dezelfde acties als baseline:**
   - Sleep "Instroom" slider heen en weer (5x)
   - Wacht 2 seconden
   - Sleep "FTE-factor vrouw" slider (5x)
4. Klik ⏹️ **Stop**

**Noteer:**
```
GEOPTIMALISEERD METINGEN:
- Scripting tijd: _____ ms
- Rendering tijd: _____ ms
- Totale tijd: _____ ms
```

**React DevTools Profiler:**

1. DevTools → **Profiler** tab
2. Klik 🔴 **Record**
3. Sleep "Instroom" slider (10x snel)
4. Klik ⏹️ **Stop**

**Noteer:**
```
GEOPTIMALISEERD - React Profiler:
- Render tijd per update: _____ ms
- Aantal re-renders: _____
- Commit tijd: _____ ms
```

### 3.5 Visual inspection - Re-renders

**Zie re-renders in real-time:**

1. React DevTools → **Components** tab
2. Click instellingen icoon (⚙️)
3. Enable: ✅ **"Highlight updates when components render"**
4. Sleep sliders in de app
5. Observeer:
   - **Origineel**: Hele scherm flitst (veel re-renders)
   - **Geoptimaliseerd**: Alleen aangepaste input flitst (weinig re-renders)

---

## 📊 STAP 4: Vergelijk Resultaten

### 4.1 Bereken verbeteringen

```
PERFORMANCE VERGELIJKING:

Chrome Performance:
- Baseline Rendering: _____ ms
- Geoptimaliseerd Rendering: _____ ms
- Verbetering: _____ % sneller

React Profiler:
- Baseline Render tijd: _____ ms
- Geoptimaliseerd Render tijd: _____ ms
- Verbetering: _____ % sneller

Re-renders:
- Baseline Re-renders: _____ x
- Geoptimaliseerd Re-renders: _____ x
- Verbetering: _____ % minder
```

**Verwachte resultaten:**
- ✅ Rendering: 85-90% sneller
- ✅ Re-renders: 95-97% minder
- ✅ Commit tijd: 80-90% sneller

### 4.2 Subjectieve beoordeling

**Voel verschil:**

Test deze scenario's en beoordeel responsiviteit (1-10):

| Actie | Baseline | Geoptimaliseerd | Verschil |
|-------|----------|-----------------|----------|
| Slider slepen | ___ / 10 | ___ / 10 | +___ |
| Snel meerdere wijzigingen | ___ / 10 | ___ / 10 | +___ |
| Scrollen door parameters | ___ / 10 | ___ / 10 | +___ |
| Reset knop | ___ / 10 | ___ / 10 | +___ |

**Verwachte scores:**
- Baseline: 6-7 / 10
- Geoptimaliseerd: 9-10 / 10

---

## 🐛 STAP 5: Bug Testing

### 5.1 Edge cases

Test deze scenario's:

```
EDGE CASES:
[ ] Min waarde (600 instroom) - werkt
[ ] Max waarde (1500 instroom) - werkt
[ ] Rapid slider beweging (10x per seconde) - geen crashes
[ ] Reset tijdens API call - geen race conditions
[ ] Disconnect backend (stop Python) - error message correct
[ ] Reconnect backend (start Python) - recovery werkt
[ ] Browser refresh tijdens loading - geen stale state
[ ] Meerdere parameters tegelijk wijzigen - correct

BROWSER COMPATIBILITY:
[ ] Chrome - werkt
[ ] Firefox - werkt
[ ] Safari - werkt (als beschikbaar)
[ ] Edge - werkt (als beschikbaar)

RESPONSIVE:
[ ] Desktop (1920x1080) - layout correct
[ ] Laptop (1366x768) - layout correct
[ ] Tablet (768x1024) - layout correct (optioneel)
```

### 5.2 Console errors

```bash
# Check browser console (F12):
# Verwacht: 0 errors, 0 warnings

# Mogelijke issues:
# ❌ "Cannot find module './src-optimized/...'"
#    → Controleer import path in App.js
#
# ❌ "useDebounce is not defined"
#    → Controleer import statement
#
# ❌ "Maximum update depth exceeded"
#    → Bug in useCallback dependencies
```

---

## 📦 STAP 6: Build Testing

### 6.1 Production build

```bash
# Stop development server (Ctrl+C)

# Maak production build
npm run build

# Check build size
ls -lh build/static/js/*.js

# Noteer main bundle size:
# Baseline: _____ KB
# Geoptimaliseerd: _____ KB (verwacht: -10% tot -20%)
```

### 6.2 Test production build lokaal

```bash
# Installeer serve (als je dit nog niet hebt)
npm install -g serve

# Serve production build
serve -s build -p 3000

# Test in browser op http://localhost:3000
# Verwachting: zelfde functionaliteit, sneller
```

---

## ✅ STAP 7: Acceptatie Criteria

De geoptimaliseerde code is **APPROVED** als:

```
FUNCTIONALITEIT:
✅ Alle 11+ parameters in Aanbod sectie werken
✅ Reset knop werkt
✅ Chart rendert correct
✅ Instroomadvies klopt
✅ API calls succesvol
✅ Error handling werkt
✅ Geen console errors

PERFORMANCE:
✅ 70%+ sneller render tijd
✅ 90%+ minder re-renders
✅ Subjectief smooth (9+ / 10)
✅ Geen lag bij interactie

KWALITEIT:
✅ Geen nieuwe bugs
✅ Code is leesbaar
✅ Documentatie compleet
✅ Cross-browser compatible
```

**Als ALLE criteria ✅ zijn: Ready for deployment!**

---

## 🔄 STAP 8: Terugdraaien naar Origineel (Optioneel)

Als je terug wilt naar origineel:

```bash
# Herstel originele App.js
cp src/App.backup.js src/App.js

# Of handmatig wijzig import terug naar:
# import ScenarioModelAPI from './ScenarioModelAPI';

# Restart
npm start
```

---

## 📝 Test Rapport Template

Vul dit in na testen:

```markdown
# Test Rapport - Geoptimaliseerde Code

**Datum:** ___________
**Tester:** ___________
**Branch:** claude/optimize-code-performance-011CUoSB6wkMoyZjT8vwjbEc

## Performance Metingen

### Chrome Performance
- Baseline: _____ ms
- Geoptimaliseerd: _____ ms
- Verbetering: _____ %

### React Profiler
- Baseline render: _____ ms
- Geoptimaliseerd render: _____ ms
- Verbetering: _____ %

### Re-renders
- Baseline: _____ x
- Geoptimaliseerd: _____ x
- Reductie: _____ %

## Functionaliteit

- [ ] Alle parameters werken: JA / NEE
- [ ] Charts correct: JA / NEE
- [ ] API calls werken: JA / NEE
- [ ] Geen bugs: JA / NEE

## Subjectieve Beoordeling

- Responsiviteit: ___ / 10
- Smooth interactie: ___ / 10
- Overall ervaring: ___ / 10

## Conclusie

[ ] ✅ APPROVED - Ready for deployment
[ ] ⚠️ NEEDS WORK - Issues found: ___________
[ ] ❌ REJECTED - Blocker: ___________

## Opmerkingen

___________________________________________
___________________________________________
___________________________________________
```

---

## 🆘 Troubleshooting

### Probleem: "Cannot find module './src-optimized/...'"

**Oplossing:**
```bash
# Controleer dat directory bestaat
ls -la src-optimized/

# Als niet: kopieer uit git
git checkout src-optimized/
```

### Probleem: Backend verbindt niet

**Oplossing:**
```bash
# Check backend status
curl http://localhost:5001/health

# Als niet: start backend
cd api
source venv/bin/activate
python scenario_model.py
```

### Probleem: Performance niet beter

**Mogelijke oorzaken:**
1. React DevTools extension vertraagt performance
2. Chrome heeft weinig resources (sluit tabs)
3. Debugger is actief (check Sources tab)
4. Throttling is ingeschakeld (check Performance tab)

**Test zonder interference:**
```bash
# Test in Incognito mode (geen extensions)
# Of disable React DevTools tijdens performance test
```

### Probleem: Stale cache

**Oplossing:**
```bash
# Hard refresh
# Cmd+Shift+R (Mac) of Ctrl+Shift+R (Windows/Linux)

# Of clear cache:
# DevTools → Application → Clear storage → Clear site data
```

---

## 📞 Support

- **Documentatie:** `src-optimized/OPTIMALISATIES.md`
- **Code comments:** Alle components hebben JSDoc
- **Origineel:** Vergelijk met `src/ScenarioModelAPI.tsx`

---

**Succes met testen! 🚀**
