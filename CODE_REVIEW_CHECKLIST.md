# Code Review Checklist - Huisartsen Dashboard

**Versie:** 3.0
**Laatst bijgewerkt:** 1 november 2025

---

## 📋 Gebruik van deze Checklist

Deze checklist gebruiken **VOOR** elke:
- Pull Request
- Git commit naar `main`
- Code refactoring
- Deployment naar productie

**Review Process:**
1. Open deze checklist
2. Doorloop ALLE secties
3. Check elke ✅ af als compliant
4. Fix alle ❌ items
5. Alleen mergen/deployen als ALLES ✅ is

---

## 🏗️ Architectuur & Design

### Separation of Concerns

- [ ] **Geen business logic in Python**
  - Python = ALLEEN API wrapper
  - Alle berekeningen in R scripts
  - Validatie OK, maar geen capaciteitsplan formules

- [ ] **Geen R berekeningen in Frontend**
  - Frontend = UI + user interactie
  - Geen replicatie van R formules in JavaScript
  - Derived data (useMemo) OK, maar geen business logic

- [ ] **Single Source of Truth**
  - Alle parameters komen uit CSV
  - Geen hardcoded data in code
  - Baseline waarden uit CSV, niet hardcoded

### R Scripts Validatie

- [ ] **STATA Validatie Uitgevoerd?**
  - Als R script gewijzigd: **VERPLICHT** STATA validatie
  - Output verschil moet <0.1% zijn
  - Documenteer validatie in commit message

- [ ] **R Dependencies Stabiel?**
  - Alleen jsonlite, dplyr, zoo (geen nieuwe packages zonder reden)
  - Versie locks in Dockerfile

---

## 📁 Code Organisatie

### Directory Structuur

- [ ] **Components in juiste directory**
  - Herbruikbare components → `/src/components/`
  - Page components → `/src/pages/`
  - Styles → `/src/styles/` (CSS Modules)

- [ ] **Backend Scripts Gescheiden**
  - Productie code → `/api/scenario_model.py`
  - Debug scripts → `/api/debug/`
  - Test scripts → `/api/tests/`
  - GEEN debug code in productie files

- [ ] **Geen Orphaned Files**
  - Ongebruikte components verwijderd
  - Oude debug scripts verwijderd
  - Commented-out code verwijderd

### File Size Limits

- [ ] **Component Files <200 Regels**
  - Als >200 regels: split in kleinere components
  - Extracteer herbruikbare logica

- [ ] **Function Length <50 Regels**
  - Lange functies splitsen
  - Extracteer helper functions

---

## 🎨 Code Quality

### DRY Principe (Don't Repeat Yourself)

- [ ] **Geen Code Duplicatie**
  - Duplicatie >3 keer = extracteer component/function
  - Config-driven rendering voor lijsten (PARAM_CONFIGS pattern)
  - Herbruikbare helpers voor veelvoorkomende operaties

- [ ] **CSS Hergebruik**
  - Gedeelde styles in `common.module.css`
  - Component-specific styles in `components.module.css`
  - Variables in `variables.module.css`

### Styling

- [ ] **GEEN Inline Styles**
  - Gebruik CSS Modules (ALTIJD!)
  - Exception: Dynamic values (bv. `width: ${percentage}%`)

```typescript
// ❌ BAD
<div style={{ backgroundColor: '#f8f8f8', padding: '1rem' }}>

// ✅ GOOD
import styles from '../styles/components.module.css';
<div className={styles.container}>
```

- [ ] **Consistent Naming**
  - CSS classes: camelCase (`.chartContainer`)
  - Components: PascalCase (`RangeInputControl.tsx`)
  - Files: kebab-case (`parameter-section.tsx`) OF PascalCase (kies één)

### TypeScript

- [ ] **Geen `any` Types**
  - Gebruik specifieke types
  - Interfaces voor props
  - Type voor API responses

```typescript
// ❌ BAD
const data: any = await response.json();

// ✅ GOOD
interface ProjectieData {
  jaar: number;
  aanbod_fte: number;
  benodigd_fte: number;
  gap_fte: number;
}
const data: ProjectieData[] = await response.json();
```

- [ ] **Props Interfaces Gedocumenteerd**
  - Elke component heeft interface
  - Optional vs required duidelijk
  - JSDoc comments voor complexe props

---

## ⚡ Performance

### Memoization

- [ ] **Chart Data Gememoized**
  - `useMemo` voor data transformations
  - Dependencies correct (geen missing deps)

```typescript
const chartData = useMemo(() => {
  return projectie.map(item => /* transform */);
}, [projectie, baseline]);  // ✅ Dependencies compleet
```

- [ ] **Event Handlers Stable**
  - `useCallback` voor event handlers passed aan child components
  - Voorkomt unnecessary re-renders

### API Calls

- [ ] **Debouncing Aanwezig**
  - 250ms debounce voor scenario updates
  - Geen API call bij elke keystroke

- [ ] **Loading States**
  - Skeleton loaders voor charts
  - Loading spinner voor API calls
  - Disable inputs tijdens loading

### Data Caching

- [ ] **CSV Data Cached**
  - localStorage cache met versie key
  - Hash check voor cache invalidatie
  - Fallback naar fetch bij cache miss

---

## 🔒 Security

### Input Validation

- [ ] **Frontend Validation**
  - Min/max constraints op inputs
  - Type checking (number vs string)
  - UI feedback voor invalid input

- [ ] **Backend Validation**
  - Alle parameters gevalideerd
  - Range checks (min/max)
  - Type validation
  - Return 400 errors met duidelijke messages

### Error Handling

- [ ] **Error Sanitization**
  - Production: generieke error messages
  - Development: detailed stack traces
  - Geen sensitive data in errors

```python
# ✅ GOOD
except Exception as e:
    if app.config.get('DEBUG'):
        return jsonify({'error': str(e)}), 500  # Development
    else:
        return jsonify({'error': 'Internal server error'}), 500  # Production
```

- [ ] **CORS Configured**
  - Flask-CORS aanwezig
  - Alleen toegestane origins
  - Credentials handling correct

### Rate Limiting

- [ ] **Rate Limits Aanwezig** (als geïmplementeerd)
  - Zware endpoints beschermd
  - 429 responses correct
  - Retry-After headers

---

## 🧪 Testing

### Manual Testing

- [ ] **Scenario Berekeningen Getest**
  - Test met baseline parameters (moet baseline output geven)
  - Test met extreme waarden (min/max)
  - Vergelijk met verwachte STATA output

- [ ] **UI Testing**
  - Alle controls werkend
  - Reset buttons werken
  - Charts renderen correct
  - Responsive layout (desktop + tablet)

### Visual Regression

- [ ] **Screenshots Gemaakt** (voor grote UI changes)
  - VOOR screenshot
  - NA screenshot
  - Side-by-side vergelijking
  - Geen onbedoelde visuele wijzigingen

### Console Checks

- [ ] **Geen Console Errors**
  - Geen React warnings
  - Geen 404s voor assets
  - Geen failed API calls

- [ ] **Console.logs Verwijderd**
  - Debug logs verwijderd
  - Alleen intentional logging (errors)

---

## 📦 Build & Deployment

### Frontend Build

- [ ] **Build Succeeds**
  ```bash
  npm run build
  # Should complete without errors
  ```

- [ ] **Build Size Check**
  - Geen significante toename zonder reden
  - Check voor accidental large dependencies

### Backend

- [ ] **Python Dependencies Up-to-Date**
  - `requirements.txt` accuraat
  - Geen missing imports
  - Versie locks waar nodig

- [ ] **R Script Paths Correct**
  - Environment variables correct
  - Paths werken in Docker container
  - No hardcoded absolute paths

### Docker

- [ ] **Docker Build Test**
  ```bash
  docker build -t huisartsen-dashboard .
  # Should complete in <25 minutes
  ```

- [ ] **Container Start Test**
  ```bash
  docker run -p 5001:5001 huisartsen-dashboard
  curl http://localhost:5001/health
  # Should return {"status": "healthy"}
  ```

### Environment Variables

- [ ] **`.env.example` Up-to-Date**
  - Alle required variables gedocumenteerd
  - Example values (niet productie secrets!)

- [ ] **Render.yaml Correct**
  - Environment variables compleet
  - Service names correct
  - Health check endpoint correct

---

## 📝 Documentatie

### Code Comments

- [ ] **Complexe Logica Gedocumenteerd**
  - Waarom, niet wat
  - Formules uitgelegd
  - Edge cases gedocumenteerd

```typescript
// ✅ GOOD - Explains WHY
// Using 250ms debounce as balance between responsiveness (not >500ms)
// and avoiding excessive API calls (not <100ms)
const debounceTimer = setTimeout(() => loadScenario(), 250);

// ❌ BAD - Explains WHAT (obvious from code)
// Set timeout to 250ms
const debounceTimer = setTimeout(() => loadScenario(), 250);
```

- [ ] **TODO Comments Tracked**
  - Geen orphaned TODOs
  - TODOs linken naar GitHub issues
  - Of verwijderen als niet meer relevant

### Commit Messages

- [ ] **Descriptive Commit Message**
  - Subject line <50 chars
  - Body explains what en waarom
  - References issues (bv. `Fixes #123`)

```bash
# ✅ GOOD
feat(components): add RangeInputControl component

- Extracts dual input (number + range slider)
- Config-driven rendering reduces duplication by 88%
- Adds baseline value comparison
- Implements Dutch number formatting

# ❌ BAD
updated files
```

### README Updates

- [ ] **README Accurate**
  - Setup instructions werken
  - Dependencies up-to-date
  - Screenshots actueel (bij UI changes)

---

## 🔄 Git Workflow

### Branch Naming

- [ ] **Descriptive Branch Name**
  - Format: `<type>/<description>`
  - Types: `feature/`, `bugfix/`, `refactor/`, `docs/`
  - Example: `refactor/extract-components`

### Pull Request

- [ ] **PR Beschrijving Compleet**
  - **Wat:** Wat is veranderd
  - **Waarom:** Motivatie voor wijziging
  - **Testing:** Hoe getest
  - **Screenshots:** Voor UI changes

- [ ] **PR Size Redelijk**
  - <500 regels wijzigingen ideaal
  - Grote PR's splitsen in kleinere
  - Één feature/fix per PR

### Merge Checklist

- [ ] **Alle Checks Passing**
  - Build succeeds
  - Tests passing (als aanwezig)
  - Geen merge conflicts

- [ ] **Reviewed by Other Developer** (indien beschikbaar)
  - Code review gedaan
  - Feedback addressed
  - Approved voor merge

---

## 🎯 Performance Targets

Verify dat deze targets gehaald worden:

### Frontend

- [ ] **Dashboard Load <100ms** (met cache)
- [ ] **Chart Re-render <70ms**
- [ ] **API Call Debounce 250ms**
- [ ] **No Layout Shifts** (CLS <0.1)

### Backend

- [ ] **Health Endpoint <100ms**
- [ ] **Scenario Endpoint <3000ms** (R berekeningen)
- [ ] **CSV Load <50ms** (cached)

### Build

- [ ] **Frontend Build <2 minuten**
- [ ] **Docker Build <25 minuten**

---

## 🚨 Blocker Issues

Deze issues **MOETEN** gefixed voor merge/deploy:

### Critical

- ❌ **Console Errors**: Moet 0 zijn
- ❌ **Failed API Calls**: Moet 0 zijn (in happy path)
- ❌ **Broken Functionality**: Niets kapot door wijziging
- ❌ **Security Issues**: Geen XSS, SQL injection, etc.

### High Priority

- ⚠️ **Performance Regression**: >20% slower = fix
- ⚠️ **Missing Validation**: User input moet gevalideerd
- ⚠️ **Inline Styles**: Gebruik CSS Modules
- ⚠️ **Code Duplicatie**: DRY principe violated

### Nice to Have

- 💡 **Missing Tests**: Code coverage verhogen
- 💡 **Suboptimal Patterns**: Betere approach mogelijk
- 💡 **Documentatie**: Meer comments kunnen helpen

---

## ✅ Final Sign-Off

Alleen mergen/deployen als **ALLE** onderstaande ✅ zijn:

- [ ] Alle secties van deze checklist doorlopen
- [ ] Alle ❌ Critical issues gefixed
- [ ] Alle ⚠️ High Priority issues gefixed
- [ ] Code review gedaan (als team >1 persoon)
- [ ] Lokaal getest en werkend
- [ ] Commit message descriptive
- [ ] PR beschrijving compleet (als PR)
- [ ] Build succeeds (frontend + Docker)
- [ ] Geen console errors
- [ ] Performance targets gehaald

**Reviewer:** _________________
**Datum:** ____ / ____ / ______
**Goedgekeurd:** ✅ / ❌

---

## 📚 Gerelateerde Documentatie

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Architectuur principes
- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Development patterns
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Deployment procedures
- **[README.md](./README.md)**: Project overview

---

**Vragen over deze checklist?**
Contact: Capaciteitsorgaan
