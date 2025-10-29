# Architectuur Documentatie

## Projectoverzicht

Dit is een React dashboard applicatie voor het visualiseren van capaciteitsplanning data voor Nederlandse huisartsen (2010-2025). Het systeem bestaat uit twee hoofdcomponenten:

1. **Dashboard** - Historische data visualisatie (2010-2025)
2. **Scenario Model** - Interactief voorspellingsmodel (2025-2043) met Python API backend

## Technologie Stack

### Frontend
- **React 19.2.0** - UI framework
- **TypeScript** - Type veiligheid voor complexe data
- **Recharts 3.3.0** - Grafiek visualisaties
- **PapaParse 5.5.3** - CSV parsing (ScenarioModel alleen)

### Backend (Scenario Model)
- **Python 3.x** met Flask - API server
- **Pandas & NumPy** - Data processing
- **Officiële Stata methodologie** - Berekeningen identiek aan Capaciteitsorgaan

## Project Structuur

```
huisartsen-dashboard/
├── src/
│   ├── components/           # Herbruikbare UI componenten
│   │   ├── NumberInputWithSlider.tsx
│   │   ├── KPICard.tsx
│   │   └── SectionHeader.tsx
│   ├── data/                 # Data configuratie
│   │   ├── capacity-data.ts  # Historische CSV data
│   │   └── baseline-config.ts # Voorkeursscenario parameters
│   ├── styles/               # Style constanten
│   │   └── constants.ts      # Kleuren, componenten styles, chart config
│   ├── utils/                # Utility functies
│   │   ├── formatters.ts     # Number formatting (NL notatie)
│   │   └── chartHelpers.ts   # Chart data transformaties
│   ├── Dashboard.tsx         # Historische data view
│   ├── ScenarioModelAPI.tsx  # Interactief scenario model
│   ├── ScenarioModel.tsx     # [DEPRECATED] JS-only model
│   └── App.js                # Main app met navigatie
├── api/                      # Python backend
│   └── scenario_model.py     # Flask API + Stata methodologie
└── public/
    └── data.csv              # Raw CSV data

```

## Component Hiërarchie

### App.js (Root)
```
App.js
├── Navigation Bar (Dashboard / Scenario Model tabs)
├── Dashboard (conditional render)
└── ScenarioModelAPI (conditional render)
```

### Dashboard Component
```
Dashboard.tsx
├── Header (Title + beschrijving)
├── Sidebar Navigation
│   ├── Main Categories (Zorgaanbod, Opleiding, Zorgvraag)
│   └── Sub Categories (dynamisch per main category)
├── KPI Cards (4× summary metrics)
├── Line Chart (tijdlijn data met interactieve legenda)
└── Bar Chart (vergelijking 2019/2022/2025)
```

### ScenarioModelAPI Component
```
ScenarioModelAPI.tsx
├── Header
├── Left Sidebar (35% width)
│   ├── Section: Aanbod
│   │   ├── Instroom (NumberInputWithSlider)
│   │   ├── FTE factors M/V (2× NumberInputWithSlider)
│   │   └── Uitstroom 5/10/15/20j (8× NumberInputWithSlider)
│   ├── Section: Opleiding
│   │   ├── Intern rendement (NumberInputWithSlider)
│   │   └── Extern rendement 1/5/10/15j (8× NumberInputWithSlider)
│   ├── Section: Vraag
│   │   └── 7× niet-demografische componenten (NumberInputWithSlider)
│   └── Reset button
└── Right Content (65% width)
    ├── KPI Cards (2 rijen: baseline vs scenario)
    ├── Line Chart (projectie 2025-2043)
    └── Data Table (FTE waardes per jaar)
```

## Data Flow

### Dashboard (Statisch)
```
data.csv
  → capacity-data.ts (hardcoded transformatie)
  → Dashboard.tsx
  → chartHelpers.ts transformaties
  → Recharts rendering
```

### Scenario Model (Dynamisch)
```
User Input (ScenarioModelAPI.tsx)
  → State update (scenario parameters)
  → Debounced API call (500ms)
  → Python API (POST /api/scenario)
  → Stata methodologie berekening
  → Response (projectie data)
  → State update
  → Recharts rendering
```

## State Management

### Dashboard
- **selectedMainCategory**: huidige hoofdcategorie ('zorgaanbod' | 'opleiding' | 'zorgvraag')
- **selectedSubCategory**: huidige subcategorie (bijv. 'zorgaanbod_personen')
- **hiddenLines**: object met verborgen chart lijnen (voor interactieve legenda)

### ScenarioModelAPI
- **scenario**: alle aanpasbare parameters (33 waardes)
- **projectie**: berekende aanbod/vraag data 2025-2043
- **baseline**: voorkeursscenario projectie (voor vergelijking)
- **instroomadvies**: berekende instroom voor evenwicht in 2043
- **loading**: API call status
- **error**: error message (indien API call mislukt)
- **apiConnected**: health check status

## API Endpoints

### Python Backend (Port 5001)

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

#### `GET /api/baseline`
Haal voorkeursscenario projectie op (gebruikt CSV defaults).

**Response:**
```json
{
  "projectie": [
    {
      "jaar": 2025,
      "aanbod_fte": 10769,
      "benodigd_fte": 11500,
      "gap_fte": 731,
      "gap_percentage": 6.8,
      ...
    },
    ...
  ]
}
```

#### `POST /api/scenario`
Bereken aangepast scenario met custom parameters.

**Request Body:** (alle parameters optioneel)
```json
{
  "instroom": 800,
  "fte_vrouw": 0.75,
  "fte_man": 0.85,
  "uitstroom_vrouw_5j": 0.10,
  ...
}
```

**Response:**
```json
{
  "projectie": [...],
  "instroomadvies_2043": 1050
}
```

## Herbruikbare Componenten

### NumberInputWithSlider
Geïntegreerde nummer input + slider met baseline indicator.

**Props:**
- `label`: string - Input label
- `value`: number - Huidige waarde
- `onChange`: (v: number) => void - Update handler
- `min/max/step`: number - Range configuratie
- `baseline`: number - Baseline waarde voor referentie
- `unit?`: string - Eenheid (bijv. '%')
- `decimals?`: number - Aantal decimalen (default: 0)
- `multiplier?`: number - Voor percentage conversie (default: 1)

**Use case:** Alle 33 input velden in ScenarioModelAPI

### KPICard
Card component voor Key Performance Indicators.

**Props:**
- `label`: string - KPI naam
- `value`: string - KPI waarde
- `subtext?`: string - Extra info
- `backgroundColor?`: string - Card achtergrond
- `textColor?`: string - Text kleur

**Use case:** KPI tegels in beide views

### SectionHeader
Header met optionele reset button.

**Props:**
- `icon`: string - Emoji icon
- `title`: string - Section titel
- `onReset?`: () => void - Reset handler (optioneel)

**Use case:** Aanbod/Opleiding/Vraag secties in ScenarioModelAPI

## Style Systeem

Alle styles zijn gecentraliseerd in `src/styles/constants.ts`:

### STYLES object
- **colors**: Brand kleuren (primary, navy, teal, orange, etc.)
- **card**: Card component styling
- **inputContainer/inputLabel/numberInput**: Form elementen
- **kpiLabel/kpiValue**: KPI componenten
- **sectionHeader**: Section headers
- **buttons**: Button varianten
- **layout helpers**: row, halfWidth, etc.

### CHART_COLORS object
- **default**: Standaard kleurenpalet (6 kleuren)
- **zorgvraag**: Custom kleuren + stroke patterns voor zorgvraag chart
- **uitstroom**: Custom kleuren + stroke patterns voor uitstroom chart

## Waarom deze Architectuur?

### Scheiding van Concerns
1. **Data** (src/data/) - Alle configuratie op 1 plek
2. **Views** (Dashboard/ScenarioModel) - Presentatie logica
3. **Components** (src/components/) - Herbruikbare UI
4. **Utils** (src/utils/) - Business logica
5. **Styles** (src/styles/) - Visual design system

### Voordelen
- **Onderhoudbaarheid**: Wijzigingen op 1 plek ipv verspreid
- **Testbaarheid**: Utilities en components apart testbaar
- **Herbruikbaarheid**: Components werken in elke context
- **Performance**: useMemo voorkomt onnodige berekeningen
- **Type Safety**: TypeScript vangt fouten tijdens development

### Python API Rationale
- **Complexe berekeningen**: 3-cohorten tracking moeilijk in JavaScript
- **Nauwkeurigheid**: Exacte replicatie van Stata methodologie
- **Performance**: NumPy/Pandas optimalisaties
- **Validatie**: Backend kan input valideren en fouten teruggeven

## Performance Optimalisaties

1. **useMemo** voor chart data transformaties (Dashboard)
2. **Debounced API calls** (500ms delay in ScenarioModelAPI)
3. **Conditional rendering** (alleen actieve view wordt gemount)
4. **Lazy data loading** (baseline wordt apart geladen)
5. **Sticky positioning** (navigatie blijft zichtbaar bij scrollen)

## Toekomstige Uitbreidingen

Mogelijke verbeteringen:
1. **CSS Modules** of **Styled Components** (ipv inline styles)
2. **React Query** voor API state management
3. **Zod** of **Yup** voor runtime validatie
4. **Storybook** voor component documentation
5. **Jest + RTL** tests voor critical paths
6. **Error boundaries** voor graceful error handling
7. **Internationalization** (i18n) voor multi-language support
