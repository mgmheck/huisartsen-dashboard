#!/usr/bin/env python3
"""
Verificatie van niet-demografische parameters in CSV om te bepalen
of ze correct zijn en wat de missing factor van 2.64× veroorzaakt.
"""

import sys
from pathlib import Path
import pandas as pd

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import calculator
from scenario_model import VraagCalculator, get_param

CSV_FILE = Path("/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv")

print("=" * 100)
print("🔍 VERIFICATIE NIET-DEMOGRAFISCHE PARAMETERS")
print("=" * 100)

# Laad CSV
print("\n📊 Laden CSV parameters...")
df = pd.read_csv(CSV_FILE, delimiter=';', encoding='utf-8')

def convert_dutch_decimal(value):
    if pd.isna(value):
        return 0.0
    if isinstance(value, str):
        return float(value.replace(',', '.'))
    return float(value)

# Filter voor Kaderhuisarts en gebruik raming_2025 kolom
beroep = 'Kaderhuisarts'
df_kha = df[df['Categorie2'] == beroep].copy()

# Maak een dict met parameter waarden uit raming_2025 kolom
params = {}
for _, row in df_kha.iterrows():
    var_name = row['Variabele']
    value = row['raming_2025']
    params[var_name] = convert_dutch_decimal(value)

print(f"✅ Beroep: {beroep}")

# STAP 1: Lees alle niet-demografische parameters uit CSV
print(f"\n{'=' * 100}")
print("📋 STAP 1: NIET-DEMOGRAFISCHE PARAMETERS UIT CSV")
print("=" * 100)

# Haal alle varianten (laag, midden, hoog) op
niet_demo_params = {}

for variant in ['laag', 'midden', 'hoog']:
    print(f"\n🎯 Variant: {variant.upper()}")
    print("-" * 100)

    epi = params.get(f'epi_{variant}', 0.0)
    sociaal = params.get(f'sociaal_{variant}', 0.0)
    vakinh = params.get(f'vakinh_{variant}', 0.0)
    effic = params.get(f'effic_{variant}', 0.0)
    horsub = params.get(f'horsub_{variant}', 0.0)
    vertsub = params.get(f'vertsub_{variant}', 0.0)
    atv = params.get(f'atv_{variant}', 0.0)

    print(f"   Epidemiologie:           {epi:>12.8f}  ({epi*100:>10.6f}%)")
    print(f"   Sociaal-cultureel:       {sociaal:>12.8f}  ({sociaal*100:>10.6f}%)")
    print(f"   Vakinhoudelijk:          {vakinh:>12.8f}  ({vakinh*100:>10.6f}%)")
    print(f"   Efficiency:              {effic:>12.8f}  ({effic*100:>10.6f}%)")
    print(f"   Horizontale substitutie: {horsub:>12.8f}  ({horsub*100:>10.6f}%)")
    print(f"   Verticale substitutie:   {vertsub:>12.8f}  ({vertsub*100:>10.6f}%)")
    print(f"   Arbeidstijdverandering:  {atv:>12.8f}  ({atv*100:>10.6f}%)")

    som_epi_tot_horsub = epi + sociaal + vakinh + effic + horsub
    print(f"\n   Som (epi+sociaal+vakinh+effic+horsub): {som_epi_tot_horsub:>12.8f} ({som_epi_tot_horsub*100:>10.6f}%)")

    niet_demo_params[variant] = {
        'epi': epi,
        'sociaal': sociaal,
        'vakinh': vakinh,
        'effic': effic,
        'horsub': horsub,
        'vertsub': vertsub,
        'atv': atv,
        'som_epi_horsub': som_epi_tot_horsub
    }

# STAP 2: Bereken niet-demo factor volgens ONZE formule
print(f"\n{'=' * 100}")
print("🧮 STAP 2: ONS MODEL NIET-DEMO FACTOR (voor t=1 jaar)")
print("=" * 100)

print("\nOnze formule:")
print("   term1 = 1 + (vertsub × jaren)")
print("   term2 = 1 / (1 - (atv × jaren))")
print("   term3 = (epi + sociaal + vakinh + effic + horsub) × jaren")
print("   additief_deel = term1 + term2 + term3")
print("   niet_demo_deel = additief_deel - 1")

for variant in ['laag', 'midden', 'hoog']:
    print(f"\n🎯 Variant: {variant.upper()} (t=1 jaar)")
    print("-" * 100)

    p = niet_demo_params[variant]
    jaren = 1

    term1 = 1 + (p['vertsub'] * jaren)
    if (p['atv'] * jaren) < 1:
        term2 = 1 / (1 - (p['atv'] * jaren))
    else:
        term2 = 1.5
    term3 = p['som_epi_horsub'] * jaren

    additief_deel = term1 + term2 + term3
    niet_demo_deel = additief_deel - 1

    print(f"   term1 (1 + vertsub×1):              {term1:>12.8f}")
    print(f"   term2 (1 / (1 - atv×1)):            {term2:>12.8f}")
    print(f"   term3 (som_epi_horsub×1):           {term3:>12.8f}")
    print(f"   additief_deel (term1+term2+term3):  {additief_deel:>12.8f}")
    print(f"   niet_demo_deel (additief-1):        {niet_demo_deel:>12.8f}")

# STAP 3: Bereken wat het ZOU MOETEN ZIJN om Excel te matchen
print(f"\n{'=' * 100}")
print("🎯 STAP 3: VEREISTE NIET-DEMO FACTOR OM EXCEL TE MATCHEN")
print("=" * 100)

print("\nUit reverse engineering analyse:")
print("   Excel niet_demo_factor: ~3.84  (implied factor ÷ scen1_groei)")
print("   Ons model niet_demo_factor: 1.2052")
print("   Missing multiplicator: 3.84 / 1.2052 = 3.19")
print("\n   OF: Missing additieve factor: 3.84 - 1.2052 = 2.63")

# Bereken voor midden variant specifiek
p_midden = niet_demo_params['midden']
jaren = 1

ons_term1 = 1 + (p_midden['vertsub'] * jaren)
if (p_midden['atv'] * jaren) < 1:
    ons_term2 = 1 / (1 - (p_midden['atv'] * jaren))
else:
    ons_term2 = 1.5
ons_term3 = p_midden['som_epi_horsub'] * jaren

ons_additief = ons_term1 + ons_term2 + ons_term3
ons_niet_demo = ons_additief - 1

excel_niet_demo = 3.84 - 1  # Van implied factor analyse
missing_additief = excel_niet_demo - ons_niet_demo

print(f"\n📊 Midden variant (t=1):")
print(f"   Ons additief_deel:      {ons_additief:>12.8f}")
print(f"   Ons niet_demo_deel:     {ons_niet_demo:>12.8f}")
print(f"   Excel niet_demo (impl): {excel_niet_demo:>12.8f}")
print(f"   Missing additief:       {missing_additief:>12.8f}")

# STAP 4: Hypotheses testen
print(f"\n{'=' * 100}")
print("💡 STAP 4: HYPOTHESES")
print("=" * 100)

print("\n🔍 HYPOTHESE 1: Multiplicatieve factor in plaats van additief")
print("-" * 100)
print("   Als Excel gebruikt: factor = term1 × term2 × term3")
print("   In plaats van:     additief = term1 + term2 + term3")

mult_factor = ons_term1 * ons_term2 * ons_term3
print(f"   Multiplicatief: {mult_factor:>12.8f}")
print(f"   Excel target:   {excel_niet_demo + 1:>12.8f}")
print(f"   Match? {'✅ JA!' if abs(mult_factor - (excel_niet_demo + 1)) < 0.01 else '❌ NEE'}")

print("\n🔍 HYPOTHESE 2: Ontbrekende parameters")
print("-" * 100)
print(f"   Missing additief: {missing_additief:>12.8f}")
print(f"   Per jaar: {missing_additief/jaren:>12.8f}")
print("\n   Mogelijke ontbrekende parameters:")
print(f"   - Extra epi component?   {missing_additief:>12.8f} ({missing_additief*100:>10.2f}%)")
print(f"   - Extra sociaal component? {missing_additief:>12.8f} ({missing_additief*100:>10.2f}%)")
print(f"   - Scaling factor op term3? {(ons_term3 + missing_additief)/ons_term3:>12.8f}×")

print("\n🔍 HYPOTHESE 3: ATV berekening anders")
print("-" * 100)
current_atv_term = ons_term2
print(f"   Huidige term2 (1/(1-atv)):  {current_atv_term:>12.8f}")
print(f"   Wat als term2 = 1 + atv?    {1 + p_midden['atv']:>12.8f}")
print(f"   Wat als term2 = 1/(1+atv)?  {1/(1+p_midden['atv']):>12.8f}")
print(f"   Wat als term2 negeren?      {ons_term1 + ons_term3:>12.8f}")

# Check alternatieve formule zonder term2
alt_zonder_term2 = ons_term1 + ons_term3 - 1
print(f"\n   Als we term2 weglaten:")
print(f"   niet_demo = term1 + term3 - 1 = {alt_zonder_term2:>12.8f}")

print("\n🔍 HYPOTHESE 4: Andere jaren/periode interpretatie")
print("-" * 100)
print("   Wat als niet-demo parameters over ANDERE periode worden berekend?")
for test_jaren in [2, 5, 10]:
    test_term1 = 1 + (p_midden['vertsub'] * test_jaren)
    if (p_midden['atv'] * test_jaren) < 1:
        test_term2 = 1 / (1 - (p_midden['atv'] * test_jaren))
    else:
        test_term2 = 1.5
    test_term3 = p_midden['som_epi_horsub'] * test_jaren
    test_additief = test_term1 + test_term2 + test_term3
    test_niet_demo = test_additief - 1

    print(f"   Met {test_jaren} jaren: niet_demo = {test_niet_demo:>12.8f}")

# STAP 5: Check of Stata formule anders is
print(f"\n{'=' * 100}")
print("📚 STAP 5: VERGELIJKING MET STATA FORMULE")
print("=" * 100)

print("\nSTATA formule uit eerdere analyse:")
print("   vfactor6 = (1 + `vertsub6'*`looptijd'/10) *")
print("              (1/(1 - `atv6'*`looptijd'/10)) +")
print("              (`epi6' + `sociaal6' + `vakinh6' + `effic6' + `horsub6')*`looptijd'/10")

print("\nVoor t=1 jaar, looptijd=1:")
print("   vfactor6 = (1 + vertsub*1/10) * (1/(1 - atv*1/10)) + som_epi_horsub*1/10")
print("   Note: VERMENIGVULDIGING van term1 en term2, dan OPTELLEN van term3!")

# Bereken volgens Stata formule
looptijd = 1
stata_term1 = 1 + (p_midden['vertsub'] * looptijd / 10)
stata_term2_noemer = 1 - (p_midden['atv'] * looptijd / 10)
if stata_term2_noemer > 0:
    stata_term2 = 1 / stata_term2_noemer
else:
    stata_term2 = 1.5
stata_term3 = p_midden['som_epi_horsub'] * looptijd / 10

stata_vfactor = (stata_term1 * stata_term2) + stata_term3

print(f"\n📊 Stata berekening (looptijd=1, t=1 jaar):")
print(f"   term1 = 1 + vertsub*1/10:          {stata_term1:>12.8f}")
print(f"   term2 = 1/(1 - atv*1/10):          {stata_term2:>12.8f}")
print(f"   term1 × term2:                     {stata_term1 * stata_term2:>12.8f}")
print(f"   term3 = som_epi_horsub*1/10:       {stata_term3:>12.8f}")
print(f"   vfactor6 = (term1×term2) + term3:  {stata_vfactor:>12.8f}")
print(f"   niet_demo_deel = vfactor6 - 1:     {stata_vfactor - 1:>12.8f}")

# Test verschillende looptijd interpretaties
print(f"\n🧪 Test verschillende looptijd waarden:")
print("-" * 100)
for looptijd in [1, 5, 10, 20]:
    stata_term1 = 1 + (p_midden['vertsub'] * looptijd / 10)
    stata_term2_noemer = 1 - (p_midden['atv'] * looptijd / 10)
    if stata_term2_noemer > 0:
        stata_term2 = 1 / stata_term2_noemer
    else:
        stata_term2 = 1.5
    stata_term3 = p_midden['som_epi_horsub'] * looptijd / 10

    stata_vfactor = (stata_term1 * stata_term2) + stata_term3
    stata_niet_demo = stata_vfactor - 1

    print(f"   looptijd={looptijd:>2}: vfactor={stata_vfactor:>12.8f}, niet_demo={stata_niet_demo:>12.8f}")
    if abs(stata_niet_demo - excel_niet_demo) < 0.1:
        print(f"                ✅ MATCH MET EXCEL! (verschil: {abs(stata_niet_demo - excel_niet_demo):>12.8f})")

print(f"\n{'=' * 100}")
print("✅ ANALYSE VOLTOOID")
print("=" * 100)

print("\n💡 CONCLUSIE:")
print("   Bekijk bovenstaande hypotheses en Stata formule vergelijking.")
print("   De waarschijnlijkste oorzaak is één van:")
print("   1. Multiplicatieve in plaats van additieve combinatie van term1 en term2")
print("   2. Andere looptijd interpretatie in Stata formule")
print("   3. Ontbrekende parameters of scaling factor")
