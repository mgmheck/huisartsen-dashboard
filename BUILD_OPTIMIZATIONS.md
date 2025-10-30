# 🚀 Docker Build Optimalisaties

**Doel:** Build tijd verlagen van 30+ minuten naar <25 minuten
**Status:** Geoptimaliseerd voor Render Free Tier (30 min timeout)

---

## 📊 Optimalisaties Overzicht

### **1. Dockerfile Optimalisaties**

| Optimalisatie | Voor | Na | Geschatte Besparing |
|---------------|------|-----|---------------------|
| R packages | 4 packages | 2 packages | ~8-10 minuten |
| Layer caching | Slecht | Geoptimaliseerd | ~3-5 minuten |
| Parallel builds | Nee | Ja (Ncpus=2) | ~2-3 minuten |
| Dependencies | Alle | Alleen essentieel | ~5-7 minuten |
| Workers | 2 workers | 1 worker + 4 threads | Runtime optimalisatie |

**Totale verwachte besparing:** 18-25 minuten

---

### **2. Specifieke Wijzigingen**

#### **R Packages Reductie**
```dockerfile
# VOOR (4 packages):
install.packages(c('dplyr', 'tidyr', 'readr', 'jsonlite'))

# NA (2 packages):
install.packages(c('jsonlite', 'dplyr'))
```

**Rationale:**
- `jsonlite`: Essentieel voor JSON I/O
- `dplyr`: Essentieel voor data manipulatie
- `tidyr`: Meestal niet nodig (dplyr heeft reshape functies)
- `readr`: Python pandas doet CSV reading (niet nodig in R)

---

#### **Dependency Installatie**
```dockerfile
# VOOR:
install.packages(c('...'))  # Installeert alles

# NA:
install.packages(c('...'), dependencies = FALSE)
```

**Besparing:** 5-7 minuten (geen transitive dependencies)

---

#### **Parallel Compilation**
```dockerfile
# NA:
install.packages(c('...'), Ncpus = 2)
```

**Besparing:** 2-3 minuten (2x sneller compileren)

---

#### **Layer Caching Optimalisatie**
```dockerfile
# Volgorde geoptimaliseerd voor caching:
1. COPY requirements.txt  # Wijzigt zelden
2. RUN pip install        # Gecached als requirements.txt niet wijzigt
3. RUN R packages         # Gecached als R code niet wijzigt
4. COPY code              # Wijzigt vaak, maar cached layers blijven
```

---

### **3. .dockerignore Optimalisaties**

**Uitgesloten van Docker image:**
- `node_modules/` (kan >200MB zijn)
- `build/` (niet nodig in backend)
- `.git/` (kan groot zijn)
- Test files (*.test.js, etc)
- Documentation (*.md, *.pdf)
- Large Excel files (alleen CSV's)

**Geschatte image size reductie:** 100-300MB

---

### **4. Gunicorn Optimalisatie**

```dockerfile
# VOOR:
--workers 2

# NA:
--workers 1 --threads 4
```

**Rationale:**
- Lage traffic verwacht
- 1 worker met 4 threads = lagere memory footprint
- Snellere startup tijd
- Voldoende voor intern gebruik

---

## 🎯 Verwachte Build Timeline

**Geschatte nieuwe build tijd:**

```
┌─────────────────────────────────────────────┐
│ Build Phase            │ Tijd      │ %      │
├────────────────────────┼───────────┼────────┤
│ Git clone              │ 0-1 min   │  5%    │
│ Base image pull        │ 1-3 min   │ 15%    │
│ System packages        │ 2-4 min   │ 20%    │
│ Python packages        │ 3-5 min   │ 25%    │
│ R packages (2x only)   │ 8-10 min  │ 45%    │
│ Copy code & finalize   │ 1-2 min   │ 10%    │
├────────────────────────┼───────────┼────────┤
│ TOTAAL                 │ 15-25 min │ 100%   │
└─────────────────────────────────────────────┘

✅ Binnen 30 minuten timeout!
```

---

## 🔍 Monitoring & Fallback

### **Als Build Toch Faalt:**

**Scenario A: Build > 25 min maar < 30 min**
- ✅ Success, maar op het randje
- Overweeg: Nog meer R packages verwijderen

**Scenario B: Build > 30 min**
- ❌ Render Free Tier timeout
- **Opties:**
  1. Upgrade naar Render Starter ($7/maand)
  2. Deploy alleen frontend (gratis)
  3. Probeer alternatief platform (Fly.io)

---

## 📝 Testing Checklist

**Na deployment:**
- [ ] Backend `/health` endpoint reageert
- [ ] Backend `/api/baseline` endpoint werkt
- [ ] R script kan worden aangeroepen (indien nodig)
- [ ] Frontend kan backend bereiken
- [ ] Scenario Model functionaliteit werkt

---

## 🔄 Volgende Iteratie (Als Nodig)

**Verdere optimalisaties mogelijk:**
1. Multi-stage Docker build
2. Pre-compiled R binary packages
3. Alpine Linux base (kleiner)
4. Custom R base image met pre-installed packages

**Niet aanbevolen tenzij:**
- Build blijft >30 minuten
- Wil niet betalen voor Render Starter

---

**Laatst geüpdatet:** 29 oktober 2025
**Versie:** 2.0 (Geoptimaliseerd)
**Generated with:** Claude Code
