# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React dashboard application visualizing healthcare capacity planning data for Dutch general practitioners (Huisartsen) from 2010-2043. It displays trends in care supply (zorgaanbod), training (opleiding), and care demand (zorgvraag).

The application has been **recently refactored** (October 2025) for better maintainability, reusability, and code quality.

## Key Commands

### Development
```bash
npm start              # Start dev server at http://localhost:3000
npm test               # Run tests in watch mode
npm run build          # Create production build in /build folder
```

### Python API (for Scenario Model)
```bash
cd api
source venv/bin/activate
python scenario_model.py   # Start Flask API on port 5001
```

## Architecture Overview

### Application Structure (REFACTORED - Oct 2025)

The codebase is now organized in a **modular architecture**:

```
src/
├── components/           # Reusable UI components (NEW)
├── data/                 # Data configuration (NEW)
├── styles/               # Style constants (NEW)
├── utils/                # Utility functions (NEW)
├── Dashboard.tsx         # Historical data view (REFACTORED)
├── ScenarioModelAPI.tsx  # Interactive scenario model (REFACTORED)
└── App.js                # Main app with navigation
```

### Entry Point
```
src/index.js → App.js → Dashboard.tsx | ScenarioModelAPI.tsx
```

### Routing
- **No routing library**: Single view with tab-based navigation
- **App.js** manages view switching between Dashboard and Scenario Model

## Code Organization

### Components (`src/components/`)

**Reusable UI components** extracted from original monolithic files:

1. **`NumberInputWithSlider.tsx`** - Integrated number input + range slider (used 33× in ScenarioModelAPI)
2. **`KPICard.tsx`** - Card component for Key Performance Indicators
3. **`SectionHeader.tsx`** - Section header with optional reset button

### Data (`src/data/`)

**Centralized data configuration**:

1. **`capacity-data.ts`** - All historical data from CSV (2010-2025)
2. **`baseline-config.ts`** - Baseline scenario parameters (2025 defaults)

### Styles (`src/styles/`)

**Centralized style system**:

1. **`constants.ts`** - STYLES object (colors, components) + CHART_COLORS

### Utils (`src/utils/`)

**Helper functions**:

1. **`formatters.ts`** - Dutch number formatting
2. **`chartHelpers.ts`** - Chart data transformations

## UI Components

### Navigation System
- **Main categories**: Zorgaanbod, Opleiding, Zorgvraag (sidebar)
- **Sub categories**: Dynamically rendered based on selected main category
- **Interactive legend** for zorgvraag/uitstroom charts

### Chart Types
1. **LineChart** - Historical trends (2010-2025) or projections (2025-2043)
2. **BarChart** - Comparison of years 2019, 2022, 2025

### Color System
Brand colors from `STYLES.colors`: Primary (#006583), Navy (#0F2B5B), Teal (#006470), Orange (#D76628)

## Code Quality Improvements

### Before Refactor
- ScenarioModelAPI.tsx: **1467 lines**
- Dashboard.tsx: **368 lines**
- Inline styles everywhere, duplicated code

### After Refactor
- ScenarioModelAPI.tsx: **800 lines** (**-45%**)
- Dashboard.tsx: **255 lines** (**-31%**)
- **Total lines saved: ~780 lines**

## Data Updates

### Historical Data (Dashboard)
Update file: `src/data/capacity-data.ts`
- Locate `rawData` object
- Update data arrays (must have exactly 6 values)

### Baseline Configuration (Scenario Model)
Update file: `src/data/baseline-config.ts`
- All 2025 default values centralized here

## Chart Customization

### Line Chart Styling
Defined in `src/utils/chartHelpers.ts` → `getLineStyle()`
- Edit `CHART_COLORS.zorgvraag` or `CHART_COLORS.uitstroom` in `styles/constants.ts`

## Testing
- Framework: Jest with React Testing Library
- Current coverage: Minimal (only default App.test.js)

## Documentation

Comprehensive docs available:

1. **ARCHITECTURE.md**: System design, data flow, component hierarchy
2. **CALCULATIONS.md**: All formulas, Stata methodology, validation rules
3. **DATA-MAPPING.md**: CSV → TypeScript mapping, API contracts
4. **WARP.md**: This file (quick reference)

## Quick Reference

### Import Examples

```typescript
// Old way (before refactor)
const styles = { /* inline styles */ };

// New way (after refactor)
import { STYLES } from './styles/constants';
import { rawData } from './data/capacity-data';
import NumberInputWithSlider from './components/NumberInputWithSlider';
```

---

**Last Updated**: October 2025 (Post-refactor)
**Questions**: Check ARCHITECTURE.md, CALCULATIONS.md, DATA-MAPPING.md
