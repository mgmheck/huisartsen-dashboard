# Huisartsen Dashboard - Development Guide

**Versie:** 3.0
**Laatst bijgewerkt:** 1 november 2025

---

## 📋 Inhoudsopgave

1. [Development Setup](#development-setup)
2. [Code Organisatie](#code-organisatie)
3. [Component Patterns](#component-patterns)
4. [State Management](#state-management)
5. [Styling Guidelines](#styling-guidelines)
6. [Testing Strategy](#testing-strategy)
7. [Performance Best Practices](#performance-best-practices)
8. [Git Workflow](#git-workflow)

---

## 🚀 Development Setup

### Prerequisites

```bash
# Required
- Node.js >= 18.x
- Python >= 3.11
- R >= 4.3
- Docker (optional, voor local testing)

# macOS (Homebrew)
brew install node python@3.11 r

# Verify installations
node --version    # v18.x of hoger
python3 --version # 3.11.x
R --version       # 4.3.x
```

### Initial Setup

```bash
# Clone repository
cd "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/huisartsen-dashboard"

# Install frontend dependencies
npm install

# Install backend dependencies
cd api
pip3 install -r requirements.txt
cd ..

# Install R packages (in R console)
R
> install.packages(c("jsonlite", "dplyr", "zoo"))
> q()
```

### Development Workflow

```bash
# Terminal 1: Start backend
cd api
export FLASK_ENV=development
export PORT=5001
export DATA_PATH="../public/data/parameterwaarden.csv"
export R_SCRIPT_PATH="../r_scripts/"
flask run --port 5001

# Terminal 2: Start frontend
npm start
# Opens http://localhost:3000 automatically
```

### Environment Variables

Create `.env` file in project root:

```bash
# Frontend
REACT_APP_API_URL=http://localhost:5001

# Backend (set in terminal or .env)
FLASK_ENV=development
PORT=5001
DATA_PATH=../public/data/parameterwaarden.csv
R_SCRIPT_PATH=../r_scripts/
```

---

## 📁 Code Organisatie

### Directory Structure

```
huisartsen-dashboard/
├── api/                          # Backend (Python Flask)
│   ├── scenario_model.py         # Main API endpoints
│   ├── requirements.txt          # Python dependencies
│   ├── debug/                    # Debug scripts (NIET in productie)
│   │   ├── compare_scenario6_exact.py
│   │   ├── debug_aanbod_646.py
│   │   └── ...
│   └── tests/                    # Test scripts
│       ├── test_aanbod_components.py
│       └── ...
├── r_scripts/                    # R analytics
│   ├── run_scenario_api_v2.R     # Main scenario berekening
│   └── ...
├── src/                          # Frontend (React)
│   ├── components/               # Herbruikbare components
│   │   ├── forms/
│   │   │   ├── RangeInputControl.tsx
│   │   │   ├── ParameterSection.tsx
│   │   │   └── ResetButton.tsx
│   │   ├── charts/
│   │   │   ├── ChartContainer.tsx
│   │   │   └── ChartLegend.tsx
│   │   └── layout/
│   │       ├── Card.tsx
│   │       └── Section.tsx
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx
│   │   └── ScenarioModelAPI.tsx
│   ├── styles/                   # CSS Modules
│   │   ├── common.module.css
│   │   ├── variables.module.css
│   │   └── components.module.css
│   ├── App.tsx                   # Main app component
│   └── index.tsx                 # Entry point
├── public/
│   └── data/
│       └── parameterwaarden.csv  # Single source of truth
├── ARCHITECTURE.md               # High-level design
├── DEVELOPMENT.md                # Dit bestand
├── DEPLOYMENT.md                 # Deployment guide
├── CODE_REVIEW_CHECKLIST.md      # PR checklist
└── README.md                     # Project overview
```

### Organisatie Regels

#### ✅ DO

- Herbruikbare components in `/src/components/`
- CSS Modules in `/src/styles/` (GEEN inline styles)
- Debug scripts in `/api/debug/` (NIET in root)
- Test scripts in `/api/tests/`
- Een component = één bestand
- Maximaal 200 regels per component

#### ❌ DON'T

- Inline styles (gebruik CSS Modules)
- Business logic in frontend (alleen R scripts)
- Debug code in productie files
- Hardcoded data (gebruik CSV)
- Components >200 regels (split op!)

---

## 🧩 Component Patterns

### Pattern 1: Config-Driven Forms

**Probleem:** 16 parameters = 1200+ regels duplicatie

**Oplossing:** Config array + mapping

**VOOR (BAD - 80 regels per parameter × 16):**
```typescript
{/* Uitstroom vrouw 5j */}
<div style={{ width: 'calc(50% - 0.25rem)' }}>
  <label>Uitstroom vrouw (5 jaar)</label>
  <input
    type="number"
    value={(scenario.uitstroom_vrouw_5j * 100).toFixed(1)}
    onChange={(e) => setScenario({
      ...scenario,
      uitstroom_vrouw_5j: parseFloat(e.target.value) / 100
    })}
  />
  {/* ... 70 meer regels ... */}
</div>

{/* Uitstroom man 5j - EXACTE DUPLICATIE */}
{/* Uitstroom vrouw 10j - EXACTE DUPLICATIE */}
{/* ... 13 meer */}
```

**NA (GOOD - ~80 regels totaal):**
```typescript
// 1. Definieer config
interface ParamConfig {
  key: keyof ScenarioParameters;
  label: string;
  min: number;
  max: number;
  step: number;
  transform?: (val: number) => number;
  format?: (val: number) => string;
  baseline: number;
  unit?: string;
}

const PARAM_CONFIGS: ParamConfig[] = [
  {
    key: 'uitstroom_vrouw_5j',
    label: 'Uitstroom vrouw (5 jaar)',
    min: 5,
    max: 30,
    step: 0.1,
    transform: (v) => v * 100,  // Internal: 0.116 → Display: 11.6%
    format: (v) => `${v.toFixed(1)}%`,
    baseline: 11.6,
    unit: '%'
  },
  {
    key: 'uitstroom_man_5j',
    label: 'Uitstroom man (5 jaar)',
    min: 5,
    max: 30,
    step: 0.1,
    transform: (v) => v * 100,
    format: (v) => `${v.toFixed(1)}%`,
    baseline: 22.6,
    unit: '%'
  },
  // ... 14 meer
];

// 2. Map over config
{PARAM_CONFIGS.map(config => (
  <RangeInputControl
    key={config.key}
    label={config.label}
    value={scenario[config.key]}
    onChange={(val) => setScenario({...scenario, [config.key]: val})}
    min={config.min}
    max={config.max}
    step={config.step}
    transform={config.transform}
    baseline={config.baseline}
    unit={config.unit}
  />
))}
```

**Voordelen:**
- 1200 regels → 80 regels = **93% reductie**
- Nieuwe parameter toevoegen = 1 regel in config
- Consistent gedrag over alle parameters
- Type-safe (TypeScript checks)

---

### Pattern 2: Herbruikbare RangeInputControl Component

**Gebruik:** Dual input (number + range slider) met baseline vergelijking

**Component Design:**

```typescript
// components/forms/RangeInputControl.tsx
import React from 'react';
import styles from '../../styles/components.module.css';

interface RangeInputControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  transform?: (val: number) => number;  // Voor % conversies
  baseline: number;
  unit?: string;
  className?: string;
}

export const RangeInputControl: React.FC<RangeInputControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  transform = (v) => v,  // Default: no transform
  baseline,
  unit = '',
  className = ''
}) => {
  const displayValue = transform(value);
  const displayBaseline = transform(baseline);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayVal = parseFloat(e.target.value);
    // Reverse transform voor internal state
    const internalVal = transform === ((v) => v * 100)
      ? displayVal / 100
      : displayVal;
    onChange(internalVal);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const displayVal = parseFloat(e.target.value);
    const internalVal = transform === ((v) => v * 100)
      ? displayVal / 100
      : displayVal;
    onChange(internalVal);
  };

  return (
    <div className={`${styles.rangeInputControl} ${className}`}>
      <label className={styles.label}>
        {label}
      </label>

      <input
        type="number"
        className={styles.numberInput}
        min={min}
        max={max}
        step={step}
        value={displayValue.toFixed(step < 1 ? 1 : 0)}
        onChange={handleNumberChange}
      />

      <input
        type="range"
        className={styles.rangeInput}
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={handleRangeChange}
      />

      <div className={styles.baseline}>
        Vastgestelde waarde: {displayBaseline.toFixed(1)}{unit}
      </div>
    </div>
  );
};
```

**Styling (components.module.css):**

```css
.rangeInputControl {
  width: calc(50% - 0.25rem);
  margin-bottom: 0.75rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.numberInput {
  width: 100%;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
}

.rangeInput {
  width: 100%;
  display: block;
  margin-bottom: 0.25rem;
}

.baseline {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
}
```

---

### Pattern 3: ParameterSection Component

**Gebruik:** Sectie wrapper met titel en reset knop

```typescript
// components/forms/ParameterSection.tsx
import React from 'react';
import styles from '../../styles/components.module.css';

interface ParameterSectionProps {
  title: string;
  onReset: () => void;
  children: React.ReactNode;
}

export const ParameterSection: React.FC<ParameterSectionProps> = ({
  title,
  onReset,
  children
}) => {
  return (
    <div className={styles.parameterSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        <button
          onClick={onReset}
          className={styles.resetButton}
          aria-label={`Reset ${title}`}
        >
          ↺ Reset
        </button>
      </div>

      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  );
};
```

**Gebruik:**

```typescript
<ParameterSection
  title="Aanbod Parameters"
  onReset={() => resetAanbodParameters()}
>
  {AANBOD_CONFIGS.map(config => (
    <RangeInputControl key={config.key} {...config} />
  ))}
</ParameterSection>
```

---

### Pattern 4: ChartContainer Component

**Gebruik:** Consistent chart wrapper met styling

```typescript
// components/charts/ChartContainer.tsx
import React from 'react';
import styles from '../../styles/components.module.css';

interface ChartContainerProps {
  title?: string;
  height?: number;
  children: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  height = 400,
  children
}) => {
  return (
    <div className={styles.chartContainer}>
      {title && <h4 className={styles.chartTitle}>{title}</h4>}
      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};
```

---

## 🔄 State Management

### Principes

1. **Single Source of Truth**: Scenario state in parent component
2. **Unidirectional Data Flow**: Props down, events up
3. **Derived State**: Compute van state, niet opslaan
4. **Memoization**: useMemo voor expensive computations

### State Organisatie

```typescript
// ScenarioModelAPI.tsx
const [scenario, setScenario] = useState<ScenarioParameters>(BASELINE);
const [projectie, setProjectie] = useState<ProjectieData[]>([]);
const [baseline, setBaseline] = useState<ProjectieData[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [apiConnected, setApiConnected] = useState(false);
```

### State Update Patterns

#### ✅ GOOD - Immutable Updates

```typescript
// Single property update
setScenario({
  ...scenario,
  instroom: newValue
});

// Multiple properties
setScenario({
  ...scenario,
  instroom: newInstroom,
  intern_rendement: newRendement
});

// Nested update
setScenario(prev => ({
  ...prev,
  metadata: {
    ...prev.metadata,
    lastModified: Date.now()
  }
}));
```

#### ❌ BAD - Mutation

```typescript
// DON'T mutate state directly
scenario.instroom = newValue;  // ❌ React detecteert wijziging NIET
setScenario(scenario);         // ❌ Geen re-render!

// DON'T mutate nested objects
scenario.metadata.lastModified = Date.now();  // ❌
```

### Derived State met useMemo

```typescript
// Chart data is DERIVED van projectie
const combinedData = useMemo(() => {
  return projectie.map((item, idx) => ({
    jaar: item.jaar,
    aanbod_fte: item.aanbod_fte,
    benodigd_fte: item.benodigd_fte,
    gap_fte: item.gap_fte,
    aanbod_baseline: baseline?.[idx]?.aanbod_fte || null,
    benodigd_baseline: baseline?.[idx]?.benodigd_fte || null,
  }));
}, [projectie, baseline]);  // Re-compute alleen als dependencies wijzigen
```

**Waarom useMemo:**
- Vermijdt re-computation bij elke render
- ~30% snellere renders (gemeten)
- Belangrijk voor complexe transformaties

### API Calls met Debouncing

```typescript
// Debounce API calls (250ms)
useEffect(() => {
  if (!apiConnected) return;

  const debounceTimer = setTimeout(() => {
    loadScenario();
  }, 250);  // 250ms = balans tussen responsiveness en load

  return () => clearTimeout(debounceTimer);
}, [scenario, apiConnected]);
```

**Waarom 250ms:**
- 500ms = te traag (gebruiker voelt lag)
- 100ms = te snel (te veel API calls bij slider gebruik)
- 250ms = sweet spot

---

## 🎨 Styling Guidelines

### CSS Modules (VERPLICHT)

**Regel:** Gebruik CSS Modules voor ALLE styling. GEEN inline styles.

#### ✅ GOOD

```typescript
import styles from '../styles/components.module.css';

function MyComponent() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Title</h2>
    </div>
  );
}
```

```css
/* components.module.css */
.container {
  background-color: #f8f8f8;
  padding: 1rem;
  border-radius: 0.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}
```

#### ❌ BAD

```typescript
// DON'T use inline styles
function MyComponent() {
  return (
    <div style={{
      backgroundColor: '#f8f8f8',
      padding: '1rem',
      borderRadius: '0.5rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Title</h2>
    </div>
  );
}
```

### CSS Modules Structuur

```
src/styles/
├── variables.module.css    # Kleuren, spacing, font sizes
├── common.module.css       # Gedeelde utilities (flex, grid, etc)
└── components.module.css   # Component-specific styles
```

### Kleurenpalet (Capaciteitsorgaan)

```css
/* variables.module.css */
:root {
  --color-primary: #0F2B5B;      /* Donkerblauw */
  --color-secondary: #006470;     /* PMS 315 */
  --color-accent: #D76628;        /* PMS 717 */

  --color-text: #333;
  --color-text-light: #666;
  --color-border: #ddd;
  --color-bg: #f8f8f8;

  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

---

## 🧪 Testing Strategy

### Levels of Testing

#### 1. Manual Testing (Huidige Aanpak)

**Scope:** Functional testing van scenario berekeningen

**Process:**
1. Wijzig parameter in UI
2. Vergelijk output met verwacht resultaat (STATA)
3. Visueel inspecteer charts
4. Check console voor errors

**Beperkingen:**
- Tijdrovend
- Niet reproduceerbaar
- Geen regression protection

#### 2. R Unit Tests (Toekomstig)

**Doel:** Valideer R berekeningen tegen STATA output

```r
# r_scripts/test_scenario.R
library(testthat)
source("run_scenario_api_v2.R")

test_that("Aanbod FTE berekening klopt", {
  params <- list(
    instroom = 900,
    intern_rendement = 0.85,
    # ... alle params
  )

  result <- run_scenario(params)

  # Vergelijk met STATA output
  expect_equal(result$projectie[[1]]$aanbod_fte, 12345.6, tolerance = 0.1)
})
```

#### 3. Frontend Component Tests (Toekomstig)

**Doel:** Verify UI components renderen correct

```typescript
// components/forms/__tests__/RangeInputControl.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RangeInputControl } from '../RangeInputControl';

test('RangeInputControl updates value on change', () => {
  const onChange = jest.fn();

  render(
    <RangeInputControl
      label="Test Parameter"
      value={0.5}
      onChange={onChange}
      min={0}
      max={1}
      step={0.1}
      baseline={0.5}
    />
  );

  const numberInput = screen.getByRole('spinbutton');
  fireEvent.change(numberInput, { target: { value: '0.7' } });

  expect(onChange).toHaveBeenCalledWith(0.7);
});
```

#### 4. Integration Tests (Toekomstig)

**Doel:** Verify frontend ↔ backend communication

```typescript
// e2e/scenario.test.ts
test('Scenario update triggers API call and updates charts', async () => {
  render(<ScenarioModelAPI />);

  // Change parameter
  const instroomInput = screen.getByLabelText('Instroom');
  fireEvent.change(instroomInput, { target: { value: '950' } });

  // Wait for debounce
  await waitFor(() => {
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  }, { timeout: 300 });

  // Wait for API response
  await waitFor(() => {
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
  }, { timeout: 5000 });

  // Verify chart updated
  expect(screen.getByText(/Aanbod FTE/i)).toBeInTheDocument();
});
```

---

## ⚡ Performance Best Practices

### 1. Memoization van Expensive Computations

#### ✅ useMemo voor Data Transformaties

```typescript
const chartData = useMemo(() => {
  // Expensive transformation
  return projectie.map((item, idx) => ({
    ...item,
    gap_percentage: (item.gap_fte / item.benodigd_fte) * 100,
    baseline_gap: baseline[idx] ? item.gap_fte - baseline[idx].gap_fte : 0
  }));
}, [projectie, baseline]);
```

#### ✅ useCallback voor Event Handlers

```typescript
const handleReset = useCallback(() => {
  setScenario(BASELINE);
}, []);

// Geef stable reference aan child components
<ParameterSection onReset={handleReset}>
```

### 2. Lazy Loading van Routes

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ScenarioModel = lazy(() => import('./pages/ScenarioModelAPI'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scenario" element={<ScenarioModel />} />
      </Routes>
    </Suspense>
  );
}
```

### 3. CSV Data Caching

```typescript
// Dashboard.tsx
useEffect(() => {
  const loadCSVData = async () => {
    // Check localStorage cache
    const cachedData = localStorage.getItem('csvData_v1');
    const cachedHash = localStorage.getItem('csvHash_v1');

    if (cachedData && cachedHash) {
      // Verify hash met server
      const response = await fetch('/health');
      const { data_hash } = await response.json();

      if (data_hash === cachedHash) {
        // Cache hit! Load van localStorage
        setCsvData(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }
    }

    // Cache miss: fetch en cache
    const response = await fetch('/data/parameterwaarden.csv');
    const csvText = await response.text();
    // ... parse CSV ...
    localStorage.setItem('csvData_v1', JSON.stringify(parsedData));
    localStorage.setItem('csvHash_v1', hash);
  };

  loadCSVData();
}, []);
```

**Performance Win:** 2000ms → 50ms load tijd

---

## 🌿 Git Workflow

### Branch Strategy

```
main
├── refactor/complete-optimization  (huidige refactor)
├── feature/user-scenarios
└── bugfix/chart-rendering
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: Nieuwe feature
- `fix`: Bug fix
- `refactor`: Code refactor (geen functionaliteit wijziging)
- `docs`: Documentatie wijziging
- `style`: Formatting, CSS wijzigingen
- `test`: Tests toevoegen/wijzigen
- `perf`: Performance improvement

**Voorbeelden:**

```bash
# Feature
git commit -m "feat(components): add RangeInputControl component

- Extracts dual input (number + range slider)
- Config-driven rendering
- Reduces code duplication by 88%"

# Refactor
git commit -m "refactor(api): extract validation to helper function

- Creates VALIDATION_RULES config
- Reduces validation code by 67%
- No functionality change"

# Docs
git commit -m "docs: add ARCHITECTURE.md and DEVELOPMENT.md

- Documents high-level design decisions
- Adds component patterns and best practices
- Updates README with project overview"
```

### PR Checklist

Zie [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)

---

## 📚 Gerelateerde Documentatie

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: High-level design en beslissingen
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Deployment procedures
- **[CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)**: Quality checklist
- **[README.md](./README.md)**: Project overview

---

**Vragen?** Contact: Capaciteitsorgaan
**Laatst bijgewerkt:** 1 november 2025
