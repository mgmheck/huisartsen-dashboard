# UI/UX Differences Analysis: Original vs Refactored

## Executive Summary

Tijdens het refactoring proces zijn er significante UI/UX verschillen ontstaan tussen de originele versie (ori-app) en de gerefactorde versie (refactoring-app). Dit document analyseert alle verschillen per component.

---

## Dashboard.tsx

### 🔴 CRITICAL ISSUE 1: Layout Structuur

**ORIGINEEL:**
```tsx
<div style={{ display: 'flex', gap: '1.5rem' }}>
  {/* Linkerzijbalk: 224px width, flexShrink: 0 */}
  <div style={{ width: '224px', flexShrink: 0 }}>
    {/* Navigation tiles hier */}
  </div>

  {/* Rechter content area: flex: 1 */}
  <div style={{ flex: 1 }}>
    {/* KPI tiles + Charts hier */}
  </div>
</div>
```

**GEREFACTORD:**
```tsx
<div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: 'var(--spacing-lg)' }}>
  {/* Horizontale navigatie BOVEN */}
  <div>{/* Main categories */}</div>
  <div>{/* Sub categories */}</div>

  {/* Chart ONDER */}
  <div>{/* Charts */}</div>
</div>
```

**PROBLEEM:** Navigatie-tegels staan nu BOVEN de grafieken in plaats van LINKS ervan.

**FIX VEREIST:** Restore `display: flex` layout met left sidebar (224px) + rechter content area.

---

### 🔴 CRITICAL ISSUE 2: Collapsible/Expandable Functionaliteit

**ORIGINEEL:**
- Hoofdcategorieën hebben een pijltje (▼) dat roteert bij selectie
- Subcategorieën verschijnen ALLEEN als de hoofdcategorie geselecteerd is
- Arrow rotatie: `transform: selectedMainCategory === mainCat.id ? 'rotate(180deg)' : 'rotate(0deg)'`
- Conditionele rendering: `{selectedMainCategory === mainCat.id && ( ... )}`

**GEREFACTORD:**
- GEEN expandable functionaliteit
- Alle categorieën zijn altijd zichtbaar als horizontale buttons
- GEEN arrow indicatie
- GEEN collapsing behavior

**FIX VEREIST:** Restore collapsible sidebar navigation met:
1. Arrow icon met rotatie animatie
2. Conditionele rendering van subcategorieën
3. Verticale layout in sidebar

---

### 🔴 CRITICAL ISSUE 3: Kleurenschema

**ORIGINEEL (Specifieke hex waarden):**
- Donkerblauw (primair): `#0F2B5B`
- Teal/groen-blauw (secundair): `#006470`
- Oranje (accent): `#D76628`
- Header teal: `#006583`
- Achtergrond: `#f8f8f8`

**Details:**
- Geselecteerde hoofdcategorie: background `#0F2B5B`, color `white`
- Niet-geselecteerde hoofdcategorie: background `#f8f8f8`, color `#006583`
- Geselecteerde subcategorie: background `#006470`, color `white`
- Niet-geselecteerde subcategorie: background `#f8f8f8`, color `#006583`

**GEREFACTORD (CSS variabelen):**
- `var(--color-primary)`
- `var(--color-secondary)`
- `var(--color-bg)`
- `var(--color-text)`

**PROBLEEM:** CSS variabelen zijn NIET gedefinieerd of komen niet overeen met originele kleuren.

**FIX VEREIST:**
1. Definieer CSS variabelen in common.module.css met correcte waarden
2. OF vervang alle CSS variabelen door originele hex waarden

---

### 🔴 CRITICAL ISSUE 4: KPI Tegels Ontbreken

**ORIGINEEL:** (Dashboard.tsx lines 438-455)
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
  {kpiData.map((kpi, idx) => (
    <div key={idx} style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.875rem', color: '#006583', marginBottom: '0.25rem' }}>{kpi.label}</div>
      <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#333', marginBottom: '0.25rem' }}>{kpi.value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: kpi.change.startsWith('+') ? '#006470' : '#D76628' }}>
          {kpi.change}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#999' }}>{kpi.subtext}</span>
      </div>
    </div>
  ))}
</div>
```

KPI berekeningen (lines 283-312):
```tsx
const kpiData = useMemo(() => {
  const aanbod_2010 = derivedData.aanbod_personen[0];
  const aanbod_2025 = derivedData.aanbod_personen[5];
  const fte_2010 = derivedData.fte_werkzaam[0];
  const fte_2025 = derivedData.fte_werkzaam[5];
  // ... etc
  return [
    { label: 'Totaal huisartsen 2025', value: aanbod_2025.toLocaleString('nl-NL'), change: `+${aanbod_change}%`, subtext: 't.o.v. 2010' },
    { label: 'FTE 2025', value: fte_2025.toLocaleString('nl-NL'), change: `+${fte_change}%`, subtext: 't.o.v. 2010' },
    { label: 'Vrouwen 2025', value: `${vrouwen_2025.toLocaleString('nl-NL')} (${vrouwen_percentage}%)`, change: `+${vrouwen_change}%`, subtext: 't.o.v. 2010' },
    { label: 'Zorgvraag 2025', value: `${zorgvraag_2025.toFixed(1)}%`, change: `+${zorgvraag_2025.toFixed(1)}%`, subtext: 'excl. ATV' }
  ];
}, [derivedData]);
```

**GEREFACTORD:**
- GEEN KPI tegels
- GEEN kpiData berekening

**FIX VEREIST:** Restore KPI tiles met volledige berekeningen en styling.

---

### 🔴 CRITICAL ISSUE 5: Comparison Bar Chart Ontbreekt

**ORIGINEEL:** (lines 503-528)
```tsx
<div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
    Vergelijking 2019, 2022 en 2025
  </h2>
  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={currentCategoryData.map(metric => ({ name: metric.label, '2019': metric.data[3], '2022': metric.data[4], '2025': metric.data[5] }))}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey="name" stroke="#666" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={100} interval={0} />
      <YAxis stroke="#666" style={{ fontSize: '12px' }} />
      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
      <Legend />
      <Bar dataKey="2019" fill="#0F2B5B" />
      <Bar dataKey="2022" fill="#006470" />
      <Bar dataKey="2025" fill="#D76628" />
    </BarChart>
  </ResponsiveContainer>
</div>
```

**GEREFACTORD:**
- GEEN comparison bar chart
- Alleen één line/bar chart afhankelijk van data type

**FIX VEREIST:** Restore comparison bar chart onder de main timeline chart.

---

### 🔴 CRITICAL ISSUE 6: Line Styling voor Zorgvraag en Uitstroom

**ORIGINEEL:** (lines 244-280)
```tsx
const getLineStyle = (index, total, varName) => {
  if (selectedSubCategory === 'zorgvraag') {
    const styles = {
      'epi_midden': { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' },
      'soc_midden': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
      'vak_midden': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
      'eff_midden': { stroke: '#1a4d7a', strokeWidth: 2, strokeDasharray: '8 2' },
      'hor_midden': { stroke: '#008594', strokeWidth: 2, strokeDasharray: 'none' },
      'tijd_midden': { stroke: '#e67e3a', strokeWidth: 3, strokeDasharray: '10 5' },
      'ver_midden': { stroke: '#052040', strokeWidth: 2, strokeDasharray: '2 2' },
      'totale_zorgvraag_excl_ATV_midden': { stroke: '#000000', strokeWidth: 4, strokeDasharray: 'none' }
    };
    return styles[varName] || { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' };
  }

  if (selectedSubCategory === 'uitstroom') {
    const styles = {
      'uitstroom_man_basis_vijf': { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' },
      'uitstroom_vrouw_basis_vijf': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
      'uitstroom_totaal_vijf': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
      // ... etc voor alle 12 uitstroom variabelen
    };
    return styles[varName] || { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' };
  }

  // Standaard kleuren voor andere categorieën
  const colors = ['#0F2B5B', '#006470', '#D76628', '#1a4d7a', '#008594', '#e67e3a'];
  return { stroke: colors[index % colors.length], strokeWidth: 2, strokeDasharray: 'none' };
};
```

**GEREFACTORD:**
```tsx
<Line
  key={series.var}
  type="monotone"
  dataKey={series.label}
  stroke={`hsl(${idx * 60}, 70%, 50%)`}  // DYNAMISCH GEGENEREERD
  strokeWidth={2}
  dot={{ r: 4 }}
/>
```

**PROBLEEM:**
- Geen specifieke kleuren per metric
- Geen strokeDasharray variatie
- Geen dikke lijn voor totale_zorgvraag_excl_ATV_midden

**FIX VEREIST:** Restore getLineStyle function met alle specifieke line styles.

---

### ⚠️ ISSUE 7: Legenda Interactiviteit

**ORIGINEEL:** (lines 461-477)
```tsx
<Legend
  onClick={(selectedSubCategory === 'zorgvraag' || selectedSubCategory === 'uitstroom') ? handleLegendClick : undefined}
  wrapperStyle={{ cursor: (selectedSubCategory === 'zorgvraag' || selectedSubCategory === 'uitstroom') ? 'pointer' : 'default' }}
/>
```

Met handleLegendClick functie (lines 237-241):
```tsx
const handleLegendClick = (e) => {
  const newHiddenLines = { ...hiddenLines };
  newHiddenLines[e.dataKey] = !newHiddenLines[e.dataKey];
  setHiddenLines(newHiddenLines);
};
```

**GEREFACTORD:**
```tsx
<Legend
  onClick={(e: any) => toggleLine(activeDataLines.find((d: any) => d.label === e.value)?.var || '')}
  wrapperStyle={{ cursor: 'pointer' }}
/>
```

**PROBLEEM:**
- Legenda is ALTIJD clickable (niet alleen voor zorgvraag/uitstroom)
- Andere implementatie met activeDataLines filter

**FIX VEREIST:** Restore conditional legend interactivity alleen voor zorgvraag en uitstroom.

---

### ⚠️ ISSUE 8: Y-Axis Domain Configuratie

**ORIGINEEL:** (lines 469-473)
```tsx
<YAxis
  stroke="#666"
  style={{ fontSize: '14px' }}
  domain={
    selectedSubCategory === 'zorgvraag' ? [-2, 4] :
    selectedSubCategory === 'uitstroom' ? [0, 80] :
    ['auto', 'auto']
  }
/>
```

**GEREFACTORD:**
```tsx
<YAxis
  style={{ fontSize: '14px' }}
  tickFormatter={(value) => formatThousands(value)}
/>
```

**PROBLEEM:** Geen specifieke domain settings voor verschillende data types.

**FIX VEREIST:** Restore conditional domain settings per subcategory.

---

### ⚠️ ISSUE 9: Loading en Error States

**ORIGINEEL:** (lines 315-352)
- Uitgebreide loading state met emoji en beschrijving
- Error state met reload button
- Specifieke styling met fontSize, color, etc.

**GEREFACTORD:** (lines 279-295)
- Simpele loading state met spinner uit CSS
- Simpele error state zonder reload functionaliteit
- Gebruikt className uit styles

**FIX VEREIST:** Optioneel - originele loading/error states herstellen voor consistentie.

---

## ScenarioModelAPI.tsx

### 🔴 CRITICAL ISSUE 1: Inline Styling vs Component-Based

**ORIGINEEL:**
- ALLE controls zijn inline gestylede HTML elements
- Directe style props op inputs, labels, divs
- Geen component abstractie

**GEREFACTORD:**
- Gebruikt RangeInputControl component
- Gebruikt ParameterSection component
- Gebruikt Card component
- Styling via props en CSS modules

**PROBLEEM:** Visuele appearance is anders door component abstractie.

**MOGELIJKE FIX:**
- Optie A: Vervang components door originele inline styling
- Optie B: Update components om exacte originele styling te matchen

---

### 🔴 CRITICAL ISSUE 2: Section Borders

**ORIGINEEL:** (line 322, 662, etc.)
```tsx
<div style={{
  backgroundColor: '#f8f8f8',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '0.75rem',
  border: '2px solid #000'  // ZWARTE BORDER
}}>
```

**GEREFACTORD:**
```tsx
<ParameterSection
  title="Aanbod"
  icon="📦"
  onReset={() => resetSection('aanbod')}
>
```

ParameterSection component heeft GEEN zwarte border.

**FIX VEREIST:** Add `border: '2px solid #000'` to ParameterSection styling.

---

### 🔴 CRITICAL ISSUE 3: Baseline Value Display

**ORIGINEEL:** (example line 380-381, 408-409, etc.)
```tsx
<div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
  Vastgestelde waarde: {BASELINE.instroom}
</div>
```

Elke parameter toont "Vastgestelde waarde" onder de slider.

**GEREFACTORD:**
RangeInputControl component:
- Heeft `baseline` prop
- Mogelijk niet correct getoond of verkeerd geformatteerd

**FIX VEREIST:** Verify baseline value display in RangeInputControl matches original.

---

### 🔴 CRITICAL ISSUE 4: Dutch Number Formatting

**ORIGINEEL:** (lines 58-60)
```tsx
const formatDutchNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals).replace('.', ',');
};
```

Gebruikt in:
- Baseline value displays
- Percentage displays
- Alle number inputs

**GEREFACTORD:**
- GEEN formatDutchNumber helper
- Mogelijk verkeerde formatting (punt i.p.v. komma)

**FIX VEREIST:** Restore formatDutchNumber en gebruik overal waar getallen getoond worden.

---

### 🔴 CRITICAL ISSUE 5: Header Styling

**ORIGINEEL:** (lines 309-312)
```tsx
<h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006583', marginBottom: '0' }}>
  Interactief Scenario Model Kamer Huisartsen 2025
</h1>
```

Color: `#006583` (specific teal)

**GEREFACTORD:** (lines 310-312)
```tsx
<h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-secondary)', marginBottom: '0' }}>
  Interactief Scenario Model Kamer Huisartsen 2025
</h1>
```

Color: `var(--color-secondary)` (mogelijk verkeerde waarde)

**FIX VEREIST:** Replace CSS variable met `#006583`.

---

## Prioriteit van Fixes

### P0 - CRITICAL (Must fix voor baseline functionaliteit):
1. ✅ Dashboard layout: LEFT sidebar i.p.v. TOP navigation
2. ✅ Dashboard collapsible tiles functionaliteit
3. ✅ Dashboard color scheme (hex waarden)
4. ✅ Dashboard KPI tiles
5. ✅ Dashboard comparison bar chart

### P1 - HIGH (Belangrijk voor UX):
6. ✅ Dashboard line styling (getLineStyle function)
7. ✅ ScenarioModelAPI section borders
8. ✅ ScenarioModelAPI formatDutchNumber
9. ✅ ScenarioModelAPI header color

### P2 - MEDIUM (Verbetering maar niet critical):
10. Dashboard legenda conditional interactivity
11. Dashboard Y-axis domain settings
12. Dashboard loading/error states styling
13. ScenarioModelAPI baseline value display verification

---

## Actieplan

1. **Dashboard.tsx**: Restore volledige originele versie met:
   - Left sidebar layout
   - Collapsible navigation
   - Originele hex kleuren
   - KPI tiles
   - Comparison bar chart
   - getLineStyle function

2. **ScenarioModelAPI.tsx**:
   - Optie A: Restore volledige originele inline styling
   - Optie B: Update components om exact originele appearance te matchen

3. **Verification**: Test beide componenten uitgebreid na restore.

---

*Gegenereerd: 2025-11-03*
*Versies: ori-app (original backup) vs refactoring-app (current refactored)*
