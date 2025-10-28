# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React dashboard application visualizing healthcare capacity planning data for Dutch general practitioners (Huisartsen) from 2010-2025. It displays trends in care supply (zorgaanbod), training (opleiding), and care demand (zorgvraag).

## Key Commands

### Development
```bash
npm start              # Start dev server at http://localhost:3000
npm test               # Run tests in watch mode
npm run build          # Create production build in /build folder
```

## Architecture

### Application Structure
- **Single-page dashboard**: The entire application is contained in `Dashboard.tsx`, which is a monolithic component rendering all visualizations
- **Entry point**: `src/index.js` → `App.js` → `Dashboard.tsx`
- **No routing**: Single view with dynamic content switching via state

### Data Model
- **Hardcoded data**: All data is embedded directly in `Dashboard.tsx` in the `rawData` object
- **Data structure**: Organized by categories (e.g., `zorgaanbod_personen`, `ftefactor`, `uitstroom`) with each containing metrics that have labels and data arrays for years 2010, 2013, 2016, 2019, 2022, 2025
- **No external data sources**: Data comes from `20251022_Parameterwaarden20102013201620192025_DEF.csv` but is hardcoded, not fetched

### UI Components
- **Navigation**: Two-level navigation system with main categories (Zorgaanbod, Opleiding, Zorgvraag) and subcategories
- **Visualizations**: Uses Recharts library for LineChart and BarChart components
- **KPI tiles**: Four summary metrics displayed at the top
- **Interactive features**: 
  - Click main categories to expand/collapse subcategories
  - Click legend items on zorgvraag and uitstroom charts to show/hide lines
  - State managed with `hiddenLines` object

### Color System
- **Primary brand colors**: `#006583` (teal), `#0F2B5B` (navy), `#006470` (dark teal), `#D76628` (orange)
- **Chart-specific palettes**: 
  - `zorgvraag` and `uitstroom` categories have custom color mappings with varied stroke styles (solid, dashed patterns)
  - Default categories use a standard 6-color palette
- **Style preference**: Gray grid lines should NOT be visible in bar charts (per user rules)

### TypeScript/JavaScript Mix
- Main dashboard component is TypeScript (`.tsx`)
- Entry files are JavaScript (`.js`)
- No strict type checking configured

## Data Updates

To update dashboard data:
1. Locate the `rawData` object in `Dashboard.tsx` (starts around line 10)
2. Each category contains an array of metrics with `var`, `label`, and `data` fields
3. Data arrays must have exactly 6 values (one per year: 2010, 2013, 2016, 2019, 2022, 2025)
4. Update the `years` array if time periods change

## Chart Customization

### Line Chart Styling
- Custom styles defined in `getLineStyle()` function
- For `zorgvraag` and `uitstroom`: colors and stroke patterns are hardcoded by variable name
- To modify: update the `styles` object in `getLineStyle()` for specific `varName` keys

### Bar Chart Adjustments
- Displays comparison for years 2019, 2022, 2025 only
- Grid lines should be subtle or hidden (follow user preference for no visible gray grid lines)
- Data transformation happens inline at render time

## Testing

- Testing framework: Jest with React Testing Library
- Test setup: `setupTests.js` configures `@testing-library/jest-dom`
- Currently minimal test coverage (only default App.test.js)
