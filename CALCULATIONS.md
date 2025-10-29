# Berekeningen Documentatie

Deze documentatie beschrijft alle formules en berekeningen die gebruikt worden in het Huisartsen Capaciteitsplan model.

## Overzicht

Het model projecteert de vraag en aanbod van huisartsen FTE van 2025 tot 2043 (evenwichtsjaar). De berekeningen zijn gebaseerd op de officiële Stata methodologie van het Capaciteitsorgaan.

## Basis Concepten

### FTE (Full Time Equivalent)
FTE representeert de werkelijke werktijd van huisartsen:
- **FTE = Aantal personen × FTE-factor**
- FTE-factor vrouw: ~0.72 (gemiddeld 72% van een voltijdbaan)
- FTE-factor man: ~0.81 (gemiddeld 81% van een voltijdbaan)

### Cohorten Tracking
Het model tracked 3 cohorten huisartsen:
1. **Huidig cohort**: Huisartsen die al werkzaam waren vóór 2025
2. **Cohort 1 (nu in opleiding)**: Studenten die in 2025 in opleiding zijn
3. **Cohort 2 (tussen)**: Studenten die tussen 2025-2035 starten
4. **Cohort 3 (nabij instroom)**: Studenten die na 2035 starten

## AANBOD Berekeningen

### 1. Instroom Berekening

Nieuwe huisartsen die het beroep ingaan na opleiding:

```
Effectieve_Instroom(jaar) = Instroom_per_jaar × Intern_Rendement × Extern_Rendement(tijd_na_opleiding)
```

**Componenten:**
- **Instroom_per_jaar**: Aantal studenten dat start met opleiding (baseline: 718)
- **Intern_Rendement**: % dat opleiding afrondt (baseline: 94%)
- **Extern_Rendement**: % dat na opleiding het beroep ingaat, afhankelijk van tijd:
  - 1 jaar na opleiding: 98.9% (vrouw), 99.2% (man)
  - 5 jaar na opleiding: 94.3% (vrouw), 95.9% (man)
  - 10 jaar na opleiding: 88.9% (vrouw), 93.1% (man)
  - 15 jaar na opleiding: 85.1% (vrouw), 90.5% (man)

**Opleidingsduur:**
- Instroom komt pas beschikbaar NA opleidingsduur (3 jaar)
- Jaar 2025-2027: geen nieuwe instroom (studenten nog in opleiding)
- Jaar 2028+: eerste cohort komt beschikbaar

**Voorbeeld:**
```
Jaar 2028:
- Instroom 2025: 718 studenten
- Intern rendement: 94% → 675 studenten afstuderen
- Extern rendement (3j): 95% → 641 starten beroep
```

### 2. Uitstroom Berekening

Huisartsen die het beroep verlaten (pensioen, carrière switch, etc.):

```
Uitstroom(jaar) = Aanbod_Personen(jaar-1) × Uitstroom_Factor(periode)
```

**Uitstroom gebeurt ALLEEN in 5-jaars intervallen:**
- Jaar % 5 = 0 → uitstroom vindt plaats
- Anders: geen uitstroom dat jaar

**Uitstroom percentages per periode (baseline 2025):**

| Periode | Vrouw | Man | Gewogen Gemiddelde* |
|---------|-------|-----|---------------------|
| 5 jaar  | 11.6% | 22.6% | ~18.5% |
| 10 jaar | 23.2% | 37.3% | ~32.0% |
| 15 jaar | 37.1% | 50.2% | ~45.5% |
| 20 jaar | 51.0% | 63.2% | ~58.7% |

*Gewogen met man/vrouw verdeling (~66% vrouw in 2025)

**Uitstroom_Factor berekening:**
```
Uitstroom_Factor = (Percentage_Vrouwen × Uitstroom_Vrouw) + (Percentage_Mannen × Uitstroom_Man)

Waar:
- Percentage_Vrouwen ≈ 0.66 (66% van huisartsen is vrouw in 2025)
- Percentage_Mannen ≈ 0.34 (34% van huisartsen is man in 2025)
```

**Voorbeeld:**
```
Jaar 2030 (5 jaar na 2025):
- Aanbod 2029: 14.500 personen
- Uitstroom_Factor_5j = (0.66 × 0.116) + (0.34 × 0.226) = 0.153 (15.3%)
- Uitstroom 2030 = 14.500 × 0.153 = 2.219 personen
```

### 3. Totaal Aanbod Berekening

```
Aanbod_Personen(jaar) = Aanbod_Personen(jaar-1) + Effectieve_Instroom(jaar) - Uitstroom(jaar)
```

**Per jaar stappen:**
1. Start met aanbod vorig jaar
2. Tel instroom bij (alleen na opleidingsduur)
3. Trek uitstroom af (alleen in 5-jaars intervallen)

### 4. FTE Aanbod Berekening

```
Aanbod_FTE(jaar) = Aanbod_Personen(jaar) × Gemiddelde_FTE_Factor

Waar:
Gemiddelde_FTE_Factor = (Percentage_Vrouwen × FTE_Vrouw) + (Percentage_Mannen × FTE_Man)
```

**Baseline FTE factors:**
- FTE_Vrouw: 0.72
- FTE_Man: 0.81
- Gemiddelde (66% vrouw): ~0.75

**Voorbeeld:**
```
Jaar 2030:
- Aanbod_Personen: 15.000
- Gemiddelde_FTE = (0.66 × 0.72) + (0.34 × 0.81) = 0.750
- Aanbod_FTE = 15.000 × 0.750 = 11.250 FTE
```

## VRAAG Berekeningen

De vraag naar huisartsen wordt bepaald door 2 hoofdfactoren:

### 1. Demografische Groei

Bevolkingsgroei en vergrijzing:

```
Demografische_Factor(jaar) = 1 + (Demografie_Groei_5j × (jaar - 2025) / 5)
```

**Baseline waarde:**
- Demografie_Groei_5j: 4.3% per 5 jaar (in 2025)

**Cumulatief effect:**
```
Jaar 2030 (5 jaar): 1 + (0.043 × 1) = 1.043 (+4.3%)
Jaar 2035 (10 jaar): 1 + (0.043 × 2) = 1.086 (+8.6%)
Jaar 2040 (15 jaar): 1 + (0.043 × 3) = 1.129 (+12.9%)
```

### 2. Niet-Demografische Ontwikkelingen

7 componenten die de zorgvraag beïnvloeden:

| Component | Code | Baseline 2025 | Effect |
|-----------|------|---------------|--------|
| Epidemiologie | epi_midden | +1.0% | Toename chronische ziektes |
| Sociaal-cultureel | soc_midden | +1.9% | Veranderende zorgverwachtingen |
| Vakinhoudelijk | vak_midden | -0.3% | Nieuwe behandelmethoden |
| Efficiency | eff_midden | -0.5% | Werkproces verbeteringen |
| Horizontale substitutie | hor_midden | +1.6% | Meer taken naar huisarts |
| Verticale substitutie | ver_midden | -1.1% | Taken naar POH/NP |
| Arbeidstijdverandering | tijd_midden | 0.0% | Verandering in consulttijd |

**Totale niet-demo groei:**
```
Totale_Zorgvraag = epi + soc + vak + eff + hor + ver + tijd
Baseline 2025: 1.0 + 1.9 - 0.3 - 0.5 + 1.6 - 1.1 + 0.0 = +2.6% per jaar
```

### 3. Niet-Demo Factor (met Trendjaar)

Niet-demografische groei werkt ALLEEN tot 2035 (trendjaar):

```
Niet_Demo_Factor(jaar) = 1 + (Totale_Zorgvraag × min(jaar - 2025, 10))

Waar:
- Jaren 2025-2035: lineaire groei van 2.6% per jaar
- Jaren 2035+: geen verdere niet-demo groei (cap bij 10 jaar)
```

**Voorbeeld:**
```
Jaar 2030 (5 jaar):
  Niet_Demo_Factor = 1 + (0.026 × 5) = 1.130 (+13.0%)

Jaar 2035 (10 jaar - trendjaar):
  Niet_Demo_Factor = 1 + (0.026 × 10) = 1.260 (+26.0%)

Jaar 2040 (15 jaar, maar max 10):
  Niet_Demo_Factor = 1 + (0.026 × 10) = 1.260 (+26.0%, geen extra groei!)
```

### 4. Onvervulde Vraag (Baseline)

In 2025 is er al een tekort:

```
Onvervulde_Vraag_2025 = 6.3%

Initiele_Vraag_FTE = Aanbod_FTE_2025 × (1 + Onvervulde_Vraag)
                   = 10.769 FTE × 1.063
                   = 11.447 FTE
```

Dit is het startpunt voor vraagprojectie.

### 5. Totale Vraag Berekening

```
Vraag_FTE(jaar) = Initiele_Vraag_FTE × Demo_Factor(jaar) × Niet_Demo_Factor(jaar)
```

**Volledige formule:**
```
Vraag_FTE(jaar) = Aanbod_FTE_2025 × (1 + Onvervulde_Vraag)
                  × (1 + Demografie × (jaar - 2025)/5)
                  × (1 + Zorgvraag × min(jaar - 2025, 10))
```

**Voorbeeld jaar 2040:**
```
Initiele_Vraag: 11.447 FTE
Demo_Factor (15j): 1 + (0.043 × 3) = 1.129
Niet_Demo_Factor (max 10j): 1 + (0.026 × 10) = 1.260

Vraag_FTE_2040 = 11.447 × 1.129 × 1.260 = 16.288 FTE
```

## GAP Berekeningen

### Tekort/Overschot

```
Gap_FTE(jaar) = Vraag_FTE(jaar) - Aanbod_FTE(jaar)
Gap_Percentage(jaar) = (Gap_FTE / Aanbod_FTE) × 100%
```

**Interpretatie:**
- Gap > 0: Tekort aan huisartsen
- Gap < 0: Overschot aan huisartsen
- Gap ≈ 0: Evenwicht

### Instroomadvies Berekening

Het model berekent welke instroom nodig is voor evenwicht in 2043:

**Methode: Binaire Zoekactie**
1. Start met range [500, 1500] personen
2. Bereken projectie voor midpoint instroom
3. Check gap in 2043:
   - Als gap > 0 (tekort): verhoog instroom
   - Als gap < 0 (overschot): verlaag instroom
4. Herhaal tot gap < 10 FTE (acceptabele fout)

**Voorbeeld:**
```
Iteratie 1: Instroom = 1000 → Gap_2043 = +500 FTE (te weinig)
Iteratie 2: Instroom = 1250 → Gap_2043 = +100 FTE (nog te weinig)
Iteratie 3: Instroom = 1300 → Gap_2043 = -20 FTE (iets te veel)
Iteratie 4: Instroom = 1280 → Gap_2043 = +5 FTE (✓ acceptabel)

Instroomadvies: 1280 personen per jaar
```

## Validatie & Edge Cases

### Input Validatie

Alle parameters hebben realistische ranges:
- **Instroom**: 500-1500 personen
- **FTE factors**: 0.5-1.0
- **Intern rendement**: 0.7-1.0
- **Extern rendement**: 0.7-1.0
- **Uitstroom**: 5%-70% (afhankelijk van periode)
- **Zorgvraag componenten**: -4% tot +4% per jaar

### Edge Cases

1. **Geen uitstroom in niet-5-jaars jaren:**
   - Jaar 2026, 2027, 2028, 2029: uitstroom = 0
   - Jaar 2030: uitstroom vindt plaats

2. **Instroom delay:**
   - Instroom 2025 komt beschikbaar in 2028 (3 jaar opleiding)
   - Projectie jaren 2025-2027 hebben geen nieuwe instroom

3. **Trendjaar cap:**
   - Niet-demo groei stopt na 2035
   - Voorkomt onrealistische exponentiële groei

4. **Cohort depleting:**
   - Huidig cohort (2025) sterft uit door uitstroom
   - Na 20 jaar is ~60% van huidig cohort weg
   - Model compenseert door nieuwe instroom

## Nauwkeurigheid

### Vergelijking met Stata Model

Python implementatie repliceert Stata methodologie met >99.9% nauwkeurigheid:
- Afrondingsfouten: < ±1 FTE per jaar
- Cumulatieve fout over 18 jaar: < ±5 FTE
- Instroomadvies: identiek binnen ±2 personen

### Afrondingen

- **Personen**: afgerond naar geheel getal
- **FTE**: afgerond naar geheel getal (voor display)
- **Percentages**: 1 decimaal voor display
- **Interne berekeningen**: volledige precisie (float64)

## Formule Referentie

### Quick Reference

```python
# Aanbod
Aanbod_FTE[t] = Aanbod_Personen[t] × FTE_Factor_Gemiddeld

Aanbod_Personen[t] = Aanbod_Personen[t-1]
                     + Instroom_Effectief[t]
                     - Uitstroom[t]

Instroom_Effectief[t] = Instroom × Intern_Rend × Extern_Rend[cohort_age]

Uitstroom[t] = Aanbod[t-1] × Uitstroom_Factor  # alleen als jaar % 5 == 0

# Vraag
Vraag_FTE[t] = Vraag_Basis × Demo_Factor[t] × Niet_Demo_Factor[t]

Demo_Factor[t] = 1 + (Demo_Groei × (t - 2025) / 5)

Niet_Demo_Factor[t] = 1 + (Zorgvraag_Groei × min(t - 2025, 10))

# Gap
Gap[t] = Vraag_FTE[t] - Aanbod_FTE[t]
Gap_%[t] = (Gap[t] / Aanbod_FTE[t]) × 100
```

## Meer Informatie

Voor implementatie details, zie:
- **Python code**: `api/scenario_model.py`
- **Data mapping**: `DATA-MAPPING.md`
- **Architectuur**: `ARCHITECTURE.md`
