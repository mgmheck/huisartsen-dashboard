#!/usr/bin/env python3
"""
Debug script om vraagverschillen tussen model en Excel te analyseren
"""

import pandas as pd
import openpyxl
from pathlib import Path

# Paths
BASE_DIR = Path("/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan")
DATA_DIR = BASE_DIR / "040 - 049 HA" / "046 Data en analyse"
CSV_FILE = DATA_DIR / "2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv"
EXCEL_FILE = DATA_DIR / "FINAL---Variant 3-9_3. Resultaat_raming_3.2_KHA_Versie 03092025_fte-gelijk-2035-14347---FINAL kopie.xlsx"

print("=" * 80)
print("🔍 ANALYSE VRAAGVERSCHILLEN TUSSEN MODEL EN EXCEL")
print("=" * 80)

# Laad CSV parameters
print("\n📊 Laden CSV parameters...")
df = pd.read_csv(CSV_FILE, delimiter=';', encoding='utf-8')
df_2025 = df[df['raming'] == 'raming_2025'].copy()

# Converteer Dutch decimals
def convert_dutch_decimal(value):
    if pd.isna(value):
        return 0.0
    if isinstance(value, str):
        return float(value.replace(',', '.'))
    return float(value)

# Haal vraag-gerelateerde parameters op
beroep = 'Kaderhuisarts'
params = df_2025[df_2025['beroep'] == beroep].iloc[0]

print(f"\n🎯 Beroep: {beroep}")
print(f"Basisjaar: 2025")
print(f"Trendjaar: 2035")

# Basis parameters
aanbod_personen = convert_dutch_decimal(params['aanbod_personen'])
fte_totaal_basis = convert_dutch_decimal(params['fte_totaal_basis'])
fte_basis = aanbod_personen * fte_totaal_basis

print(f"\n📌 Basis FTE berekening:")
print(f"  Aanbod personen: {aanbod_personen:,.0f}")
print(f"  FTE totaal basis: {fte_totaal_basis:.4f}")
print(f"  FTE basis: {fte_basis:,.2f}")

# Vraag parameters - alle varianten
print(f"\n📈 Onvervulde vraag parameters:")
onv_vraag_laag = convert_dutch_decimal(params['onv_vraag_laag'])
onv_vraag_midden = convert_dutch_decimal(params['onv_vraag_midden'])
onv_vraag_hoog = convert_dutch_decimal(params['onv_vraag_hoog'])
print(f"  Laag: {onv_vraag_laag:.4f}")
print(f"  Midden: {onv_vraag_midden:.4f}")
print(f"  Hoog: {onv_vraag_hoog:.4f}")

# Demografie parameters
print(f"\n🌍 Demografische ontwikkelingen:")
for jaar in [5, 10, 15, 20]:
    laag = convert_dutch_decimal(params[f'demo_{jaar}_laag'])
    midden = convert_dutch_decimal(params[f'demo_{jaar}_midden'])
    hoog = convert_dutch_decimal(params[f'demo_{jaar}_hoog'])
    print(f"  {jaar} jaar: Laag={laag:.4f}, Midden={midden:.4f}, Hoog={hoog:.4f}")

# Niet-demografische parameters
print(f"\n🔧 Niet-demografische factoren:")
epi = convert_dutch_decimal(params['epi'])
sociaal = convert_dutch_decimal(params['sociaal'])
vakinh = convert_dutch_decimal(params['vakinh'])
effic = convert_dutch_decimal(params['effic'])
horsub = convert_dutch_decimal(params['horsub'])
vertsub = convert_dutch_decimal(params['vertsub'])
atv = convert_dutch_decimal(params['atv'])

print(f"  Epidemiologie: {epi:.6f}")
print(f"  Sociaal-cultureel: {sociaal:.6f}")
print(f"  Vakinhoudelijk: {vakinh:.6f}")
print(f"  Efficiency: {effic:.6f}")
print(f"  Horizontale substitutie: {horsub:.6f}")
print(f"  Verticale substitutie: {vertsub:.6f}")
print(f"  Arbeidstijdverandering: {atv:.6f}")

# Bereken vraag voor elk jaar en variant
print(f"\n📊 VRAAGBEREKENING PER VARIANT EN JAAR:")
print("=" * 80)

# Helper functie voor demo interpolatie
def get_demo(jaar, variant):
    jaren_sinds_basis = jaar - 2025

    if variant == 'laag':
        d5, d10, d15, d20 = (
            convert_dutch_decimal(params['demo_5_laag']),
            convert_dutch_decimal(params['demo_10_laag']),
            convert_dutch_decimal(params['demo_15_laag']),
            convert_dutch_decimal(params['demo_20_laag'])
        )
    elif variant == 'midden':
        d5, d10, d15, d20 = (
            convert_dutch_decimal(params['demo_5_midden']),
            convert_dutch_decimal(params['demo_10_midden']),
            convert_dutch_decimal(params['demo_15_midden']),
            convert_dutch_decimal(params['demo_20_midden'])
        )
    else:  # hoog
        d5, d10, d15, d20 = (
            convert_dutch_decimal(params['demo_5_hoog']),
            convert_dutch_decimal(params['demo_10_hoog']),
            convert_dutch_decimal(params['demo_15_hoog']),
            convert_dutch_decimal(params['demo_20_hoog'])
        )

    if jaren_sinds_basis < 5:
        return d5 * (jaren_sinds_basis / 5.0)
    elif jaren_sinds_basis < 10:
        return d5 + (d10 - d5) * ((jaren_sinds_basis - 5) / 5.0)
    elif jaren_sinds_basis < 15:
        return d10 + (d15 - d10) * ((jaren_sinds_basis - 10) / 5.0)
    elif jaren_sinds_basis < 20:
        return d15 + (d20 - d15) * ((jaren_sinds_basis - 15) / 5.0)
    else:
        return d20

# Helper functie voor onv_vraag interpolatie
def get_onv_vraag(jaar, variant):
    jaren_sinds_basis = jaar - 2025

    if variant == 'laag':
        onv = convert_dutch_decimal(params['onv_vraag_laag'])
    elif variant == 'midden':
        onv = convert_dutch_decimal(params['onv_vraag_midden'])
    else:
        onv = convert_dutch_decimal(params['onv_vraag_hoog'])

    # Onvervulde vraag wordt lineair afgebouwd naar 0 in 20 jaar
    if jaren_sinds_basis >= 20:
        return 0.0
    return onv * (1 - (jaren_sinds_basis / 20.0))

# Bereken voor relevante jaren
jaren = [2025, 2026, 2027, 2028, 2029, 2030]
excel_vraag = {
    2025: 11447.30,
    2026: 11845.93,
    2027: 12249.69,
    2028: 12658.56,
    2029: 13072.56,
    2030: 13491.67
}

for variant in ['laag', 'midden', 'hoog']:
    print(f"\n{'=' * 80}")
    print(f"VARIANT: {variant.upper()}")
    print(f"{'=' * 80}")

    results = []
    for jaar in jaren:
        jaren_sinds_basis = jaar - 2025

        # Demo factor
        demo = get_demo(jaar, variant)
        demo_factor = 1 + demo

        # Onvervulde vraag
        onv = get_onv_vraag(jaar, variant)

        # Scenario 1: Demo + onvervulde vraag
        scen1_groei = demo_factor * (1 + onv) - 1
        scen1_fte = fte_basis * (1 + scen1_groei)

        # Niet-demografische factoren (tot trendjaar 2035)
        jaren_nietdemo = min(jaren_sinds_basis, 10)  # Max 10 jaar

        term1 = 1 + (vertsub * jaren_nietdemo)
        term2 = 1 / (1 - (atv * jaren_nietdemo)) if (atv * jaren_nietdemo) < 1 else 1.5
        term3 = (epi + sociaal + vakinh + effic + horsub) * jaren_nietdemo

        additief_deel = term1 + term2 + term3
        niet_demo_deel = additief_deel - 1

        # Scenario 6: Additief model
        scen6_groei = niet_demo_deel * scen1_groei
        scen6_fte = fte_basis * (1 + scen6_groei)

        excel_waarde = excel_vraag.get(jaar, 0)
        verschil_scen1 = scen1_fte - excel_waarde
        verschil_scen6 = scen6_fte - excel_waarde

        results.append({
            'jaar': jaar,
            'demo': demo,
            'onv': onv,
            'scen1_groei': scen1_groei,
            'scen1_fte': scen1_fte,
            'scen6_groei': scen6_groei,
            'scen6_fte': scen6_fte,
            'excel': excel_waarde,
            'verschil_scen1': verschil_scen1,
            'verschil_scen6': verschil_scen6
        })

    # Print resultaten
    print(f"\n{'Jaar':<6} {'Demo':>8} {'OnvVr':>8} {'Scen1 FTE':>12} {'Scen6 FTE':>12} {'Excel':>12} {'Δ Scen1':>12} {'Δ Scen6':>12}")
    print("-" * 80)
    for r in results:
        print(f"{r['jaar']:<6} {r['demo']:>8.4f} {r['onv']:>8.4f} {r['scen1_fte']:>12,.2f} {r['scen6_fte']:>12,.2f} "
              f"{r['excel']:>12,.2f} {r['verschil_scen1']:>12,.2f} {r['verschil_scen6']:>12,.2f}")

    # Check welke het dichtst bij Excel zit
    total_abs_error_scen1 = sum(abs(r['verschil_scen1']) for r in results)
    total_abs_error_scen6 = sum(abs(r['verschil_scen6']) for r in results)

    print(f"\n📊 Totale absolute fout voor variant {variant}:")
    print(f"  Scenario 1: {total_abs_error_scen1:,.2f} FTE")
    print(f"  Scenario 6: {total_abs_error_scen6:,.2f} FTE")

print("\n" + "=" * 80)
print("✅ ANALYSE VOLTOOID")
print("=" * 80)
