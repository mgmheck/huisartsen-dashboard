# Data Mapping Documentatie

Deze documentatie beschrijft hoe CSV data wordt gemapped naar de applicatie interfaces en variabelen.

## CSV Bestand Structuur

**Bestandsnaam**: `2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv`

**Locatie**: `/public/data.csv`

### Kolommen

```csv
Categorie1;Categorie2;Data_type;Aantal_decimalen;Variabele;actual-projection;raming_2010;raming_2013;raming_2016;raming_2019_demo;raming_2022;raming_2025
```

**Kolom Beschrijvingen:**

| Kolom | Type | Beschrijving | Voorbeeld |
|-------|------|--------------|-----------|
| `Categorie1` | string | Hoofdcategorie | "Aanbod", "Vraag", "Opleiding" |
| `Categorie2` | string | Subcategorie | "personen", "FTE", "uitstroom" |
| `Data_type` | string | Data type | "aantal", "percentage" |
| `Aantal_decimalen` | number | Decimalen | 0, 1, 2 |
| `Variabele` | string | **Unieke identifier** | "aanbod_personen" |
| `actual-projection` | string | Feitelijk of projectie | "actual", "projection" |
| `raming_2010` | string | Waarde 2010 | "10371" |
| `raming_2013` | string | Waarde 2013 | "11133" |
| `raming_2016` | string | Waarde 2016 | "11821" |
| `raming_2019_demo` | string | Waarde 2019 | "12766" |
| `raming_2022` | string | Waarde 2022 | "13492" |
| `raming_2025` | string | Waarde 2025 | "14347" |

**Belangrijke notaties:**
- Decimaalscheiding: **komma** (`,`) in CSV
- Negeer kolom: `actual-projection` (alleen informatief)
- Parsing: PapaParse met delimiter `;`

## TypeScript Interfaces

### CSVRow Interface

```typescript
interface CSVRow {
  Categorie1: string;
  Categorie2: string;
  Data_type: string;
  Aantal_decimalen: string;
  Variabele: string;
  'actual-projection': string;
  raming_2010: string;
  raming_2013: string;
  raming_2016: string;
  raming_2019_demo: string;
  raming_2022: string;
  raming_2025: string;
}
```

### MetricData Interface (Dashboard)

```typescript
interface MetricData {
  var: string;        // Variabele naam uit CSV
  label: string;      // Mensleesbare label
  data: number[];     // Array van 6 waardes [2010, 2013, 2016, 2019, 2022, 2025]
}
```

### RawData Type (Dashboard)

```typescript
interface RawData {
  [key: string]: MetricData[];
}
```

**Voorbeeld:**
```typescript
const rawData: RawData = {
  zorgaanbod_personen: [
    {
      var: 'aanbod_personen',
      label: 'Werkzame huisartsen',
      data: [10371, 11133, 11821, 12766, 13492, 14347]
    },
    // ...
  ]
};
```

## CSV → Dashboard Mapping

### Categorie Mapping

| CSV Categorie1 + Categorie2 | Dashboard Key | Display Name |
|------------------------------|---------------|--------------|
| Aanbod + personen | `zorgaanbod_personen` | Zorgaanbod in personen |
| Aanbod + FTE | `zorgaanbod_fte` | FTE |
| Aanbod + percentage | `zorgaanbod_percentage` | Percentage man-vrouw |
| Aanbod + FTE-factor | `ftefactor` | FTE-factor |
| Aanbod + uitstroom | `uitstroom` | Uitstroom |
| Opleiding + instroom | `opleiding` | Instroom |
| Opleiding + details | `opleidingdetails` | Opleiding Details |
| Vraag + componenten | `zorgvraag` | Zorgvraag componenten |
| Vraag + demografie | `demografie` | Demografie |
| Vraag + onvervuld | `onvervuldevraag` | Onvervulde vraag |

### Variabele Mapping - AANBOD

#### Zorgaanbod Personen

| CSV Variabele | Label | 2025 Waarde | Eenheid |
|---------------|-------|-------------|---------|
| `aanbod_personen` | Werkzame huisartsen | 14347 | personen |
| `werkzame_vrouwen` | Werkzame vrouwen | 9469 | personen |
| `werkzame_mannen` | Werkzame mannen | 4878 | personen |

#### Zorgaanbod FTE

| CSV Variabele | Label | 2025 Waarde | Eenheid |
|---------------|-------|-------------|---------|
| `fte_werkzaam` | FTE werkzame huisartsen | 10769 | FTE |
| `fte_werkzame_vrouwen` | FTE werkzame vrouwen | 6818 | FTE |
| `fte_werkzame_mannen` | FTE werkzame mannen | 3951 | FTE |

#### FTE-factor

| CSV Variabele | Label | 2025 Waarde | Eenheid |
|---------------|-------|-------------|---------|
| `fte_totaal_basis` | FTE factor totaal (%) | 75.06 | % |
| `fte_vrouw_basis` | FTE factor vrouw (%) | 72.0 | % |
| `fte_man_basis` | FTE factor man (%) | 81.0 | % |

**API Mapping (ScenarioModel):**
```typescript
// CSV: fte_vrouw_basis (percentage)
// API: fte_vrouw (fractie)
fte_vrouw: 0.72  // 72% → 0.72
```

#### Uitstroom (12 variabelen)

**Pattern**: `uitstroom_{geslacht}_basis_{periode}`

| CSV Variabele | Label | 2025 Waarde |
|---------------|-------|-------------|
| `uitstroom_man_basis_vijf` | Uitstroom 5j man (%) | 22.6% |
| `uitstroom_vrouw_basis_vijf` | Uitstroom 5j vrouw (%) | 11.6% |
| `uitstroom_totaal_vijf` | Uitstroom 5j totaal (%) | 15.3% |
| *(herhaal voor tien, vijftien, twintig)* | ... | ... |

**API Mapping:**
```typescript
// CSV: uitstroom_vrouw_basis_vijf (percentage)
// API: uitstroom_vrouw_5j (fractie)
uitstroom_vrouw_5j: 0.116  // 11.6% → 0.116
```

### Variabele Mapping - OPLEIDING

#### Instroom

| CSV Variabele | Label | 2025 Waarde | Eenheid |
|---------------|-------|-------------|---------|
| `n_inopleiding_perjaar` | Instroom per jaar | 718 | personen |

#### Opleiding Details

| CSV Variabele | Label | 2025 Waarde | API Mapping |
|---------------|-------|-------------|-------------|
| `per_vrouw_opleiding` | % vrouwen opleiding | 74.0% | - |
| `intern_rendement` | Intern rendement (%) | 94.0% | `intern_rendement: 0.94` |

#### Extern Rendement (8 variabelen)

**Pattern**: `extern_rendement_{geslacht}_{periode}jaar`

| CSV Variabele | API Parameter | 2025 Waarde |
|---------------|---------------|-------------|
| `extern_rendement_vrouw_1jaar` | `extern_rendement_vrouw_1jaar` | 0.989 |
| `extern_rendement_vrouw_5jaar` | `extern_rendement_vrouw_5jaar` | 0.943 |
| `extern_rendement_vrouw_10jaar` | `extern_rendement_vrouw_10jaar` | 0.889 |
| `extern_rendement_vrouw_15jaar` | `extern_rendement_vrouw_15jaar` | 0.851 |
| `extern_rendement_man_1jaar` | `extern_rendement_man_1jaar` | 0.992 |
| `extern_rendement_man_5jaar` | `extern_rendement_man_5jaar` | 0.959 |
| `extern_rendement_man_10jaar` | `extern_rendement_man_10jaar` | 0.931 |
| `extern_rendement_man_15jaar` | `extern_rendement_man_15jaar` | 0.905 |

**Opmerking**: Extern rendement is al in fractie vorm in CSV (niet percentage!)

### Variabele Mapping - VRAAG

#### Zorgvraag Componenten

| CSV Variabele | Label | API Parameter | 2025 Waarde |
|---------------|-------|---------------|-------------|
| `epi_midden` | Epidemiologie (%) | `epi_midden` | 1.0% → 0.01 |
| `sociaal_midden` | Sociaal-cultureel (%) | `soc_midden` | 1.9% → 0.019 |
| `vakinh_midden` | Vakinhoudelijk (%) | `vak_midden` | -0.3% → -0.003 |
| `effic_midden` | Efficiency (%) | `eff_midden` | -0.5% → -0.005 |
| `horsub_midden` | Horizontale substitutie (%) | `hor_midden` | 1.6% → 0.016 |
| `atv_midden` | ATV (%) | `tijd_midden` | 0.0% → 0.0 |
| `vertsub_midden` | Verticale substitutie (%) | `ver_midden` | -1.1% → -0.011 |
| `totale_zorgvraag_excl_ATV_midden` | Totale zorgvraag excl ATV (%) | `totale_zorgvraag_excl_ATV_midden` | 2.6% → 0.026 |

**Conversie**: Percentage → Fractie (deel door 100)

#### Demografie

| CSV Variabele | Label | 2025 Waarde | API Gebruik |
|---------------|-------|-------------|-------------|
| `demo_5_midden` | Demografie 5j (%) | 4.3% | Gebruikt in berekeningen |
| `demo_10_midden` | Demografie 10j (%) | 8.6% | Display only |
| `demo_15_midden` | Demografie 15j (%) | 12.1% | Display only |
| `demo_20_midden` | Demografie 20j (%) | 14.8% | Display only |

**API Mapping:**
```typescript
// Python API gebruikt ALLEEN demo_5_midden voor berekeningen
// Andere periodes zijn cumulatief voor display
```

#### Onvervulde Vraag

| CSV Variabele | Label | 2025 Waarde | API Mapping |
|---------------|-------|-------------|-------------|
| `onv_vraag_midden` | Onvervulde vraag (%) | 6.3% | `onv_vraag: 0.063` |

## Parsing Helpers

### CSV → Number Conversie

```typescript
const parseCSVValue = (value: string): number => {
  // Vervang Nederlandse komma door punt
  return parseFloat(value.replace(',', '.'));
};
```

### Dashboard Data Extractie

```typescript
const getCSVValue = (variabele: string, column: string = 'raming_2025'): number => {
  const row = csvData.find(r => r.Variabele === variabele);
  if (!row) return 0;
  const value = row[column as keyof CSVRow];
  return typeof value === 'string' ? parseFloat(value.replace(',', '.')) : 0;
};
```

### Percentage → Fractie Conversie

```typescript
// Voor zorgvraag componenten
const percentageToFraction = (percentage: number): number => {
  return percentage / 100;
};

// Voorbeeld:
// CSV: epi_midden = "1,0" (1.0%)
// Parse: 1.0
// Conversie: 0.01 (fractie)
// API: epi_midden: 0.01
```

## Baseline Configuratie

### BASELINE Constante Mapping

Alle baseline waardes komen uit CSV `raming_2025` kolom:

```typescript
export const BASELINE = {
  // Aanbod
  instroom: 718,                                // n_inopleiding_perjaar
  fte_vrouw: 0.72,                              // fte_vrouw_basis / 100
  fte_man: 0.81,                                // fte_man_basis / 100

  // Opleiding
  intern_rendement: 0.94,                       // intern_rendement / 100
  extern_rendement_vrouw_1jaar: 0.989,          // extern_rendement_vrouw_1jaar (already fraction)
  extern_rendement_vrouw_5jaar: 0.943,          // extern_rendement_vrouw_5jaar
  // ... (8 totaal)

  // Uitstroom
  uitstroom_vrouw_5j: 0.116,                    // uitstroom_vrouw_basis_vijf / 100
  uitstroom_man_5j: 0.226,                      // uitstroom_man_basis_vijf / 100
  // ... (8 totaal)

  // Vraag
  epi_midden: 0.01,                             // epi_midden / 100
  soc_midden: 0.019,                            // sociaal_midden / 100
  // ... (8 totaal)
};
```

## API Request/Response Mapping

### POST /api/scenario Request Body

Alle optionele velden:

```json
{
  "instroom": 800,                              // aantal personen
  "intern_rendement": 0.95,                     // fractie (0-1)
  "fte_vrouw": 0.75,                            // fractie (0-1)
  "fte_man": 0.85,                              // fractie (0-1)

  // Extern rendement (8 waardes, fractie)
  "extern_rendement_vrouw_1jaar": 0.99,
  "extern_rendement_vrouw_5jaar": 0.95,
  // ...

  // Uitstroom (8 waardes, fractie)
  "uitstroom_vrouw_5j": 0.10,
  "uitstroom_man_5j": 0.20,
  // ...

  // Vraag componenten (8 waardes, fractie)
  "epi_midden": 0.015,
  "soc_midden": 0.020,
  // ...
}
```

### Response Mapping

```json
{
  "projectie": [
    {
      "jaar": 2025,
      "aanbod_fte": 10769,                      // Afgerond naar geheel getal
      "benodigd_fte": 11447,                    // Afgerond naar geheel getal
      "gap_fte": 678,                           // Verschil (benodigd - aanbod)
      "gap_percentage": 6.3,                    // (gap / aanbod) * 100, 1 decimaal
      "aanbod_personen": 14347,                 // Geheel getal
      "vrouwen": 9469,                          // Geheel getal
      "mannen": 4878,                           // Geheel getal
      "huidig_cohort": 14347,                   // Cohort tracking
      "cohort1_nuopl": 0,                       // Cohort tracking
      "cohort2_tussen": 0,                      // Cohort tracking
      "cohort3_nabijst": 0                      // Cohort tracking
    },
    // ... voor elk jaar 2025-2043
  ],
  "instroomadvies_2043": 1026                  // Geheel getal
}
```

## Data Validatie

### Input Ranges

| Parameter | Min | Max | Type | Eenheid |
|-----------|-----|-----|------|---------|
| instroom | 500 | 1500 | integer | personen |
| intern_rendement | 0.70 | 1.0 | float | fractie |
| fte_vrouw | 0.50 | 1.0 | float | fractie |
| fte_man | 0.50 | 1.0 | float | fractie |
| extern_rendement_* | 0.70 | 1.0 | float | fractie |
| uitstroom_*_5j | 0.05 | 0.30 | float | fractie |
| uitstroom_*_10j | 0.10 | 0.50 | float | fractie |
| uitstroom_*_15j | 0.15 | 0.60 | float | fractie |
| uitstroom_*_20j | 0.20 | 0.70 | float | fractie |
| vraag_componenten | -0.04 | 0.04 | float | fractie |

### Validatie Regels

1. **Percentage conversie**:
   - CSV bevat percentages (behalve extern rendement)
   - API verwacht fracties (0-1)
   - Conversie: deel door 100

2. **Negatieve waardes**:
   - Alleen vraag componenten kunnen negatief zijn
   - Alle andere waardes moeten ≥ 0

3. **Logische consistentie**:
   - FTE factor ≤ 1.0 (niemand werkt >100%)
   - Uitstroom stijgt met periode (5j < 10j < 15j < 20j)
   - Intern/extern rendement ≤ 1.0 (max 100% slaagt)

## Naamgeving Conventies

### Patroon Herkenning

| Patroon | Voorbeeld | Type |
|---------|-----------|------|
| `*_basis` | `fte_vrouw_basis` | Baseline waarde (2025) |
| `*_midden` | `epi_midden` | Midden scenario (vs laag/hoog) |
| `*_vijf` / `*_tien` etc. | `uitstroom_man_basis_vijf` | Periode indicator |
| `*_vrouw` / `*_man` | `extern_rendement_vrouw_1jaar` | Geslacht specifiek |
| `*_totaal` | `uitstroom_totaal_vijf` | Gewogen gemiddelde M/V |
| `n_*` | `n_inopleiding_perjaar` | Aantal (niet percentage) |
| `per_*` | `per_vrouw_opleiding` | Percentage |

### Afkortingen

| Afkorting | Betekenis |
|-----------|-----------|
| `epi` | Epidemiologie |
| `soc` | Sociaal-cultureel |
| `vak` / `vakinh` | Vakinhoudelijk |
| `eff` / `effic` | Efficiency |
| `hor` / `horsub` | Horizontale substitutie |
| `ver` / `vertsub` | Verticale substitutie |
| `tijd` / `atv` | Arbeidstijdverandering |
| `demo` | Demografie |
| `onv` | Onvervuld |

## Troubleshooting

### Veel voorkomende fouten

1. **Komma vs punt**:
   - CSV gebruikt komma (`,`) als decimaalscheiding
   - JavaScript verwacht punt (`.`)
   - **Fix**: Altijd `.replace(',', '.')` bij parsing

2. **Percentage vs fractie**:
   - CSV heeft vaak percentages (72.0 voor 72%)
   - API verwacht fracties (0.72)
   - **Fix**: Deel door 100 waar nodig

3. **Extern rendement exception**:
   - Extern rendement is AL in fractie vorm in CSV
   - **Fix**: NIET delen door 100 voor extern rendement

4. **String vs number**:
   - CSV data is altijd strings
   - **Fix**: Gebruik `parseFloat()` voor conversie

5. **Missing values**:
   - Sommige CSV rijen kunnen leeg zijn
   - **Fix**: Check `if (!row) return 0` voor fallback

## Referenties

- CSV bron: Capaciteitsorgaan 2025 rapportage
- Datum: 22 oktober 2025
- Versie: DEF (definitief)
- Periode: 2010-2025 (historisch + projectie)
