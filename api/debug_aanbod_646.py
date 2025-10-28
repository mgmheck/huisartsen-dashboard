#!/usr/bin/env python3
"""
Systematische debug van aanbod-berekening om 646 personen verschil te vinden.
Excel: 18.581 personen in 2043
Model: 19.227 personen in 2043
Verschil: +646 personen
"""

import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).parent))

from scenario_model import AanbodCalculator, get_param

CSV_FILE = Path("/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv")

print("=" * 100)
print("🔍 SYSTEMATISCHE DEBUG: AANBOD PARAMETERS")
print("=" * 100)

# STAP 1: Check alle basis parameters
print("\n📋 STAP 1: BASIS PARAMETERS")
print("-" * 100)

params_to_check = {
    'Basisjaar aanbod': [
        ('aanbod_personen', 'Aantal werkzame personen 2025'),
        ('per_vrouw_basis', 'Percentage vrouwen (basis cohort)'),
        ('fte_vrouw_basis', 'FTE factor vrouwen'),
        ('fte_man_basis', 'FTE factor mannen'),
    ],
    'Uitstroom basis cohort': [
        ('uitstroom_vrouw_basis_vijf', 'Uitstroom vrouwen 5 jaar'),
        ('uitstroom_vrouw_basis_tien', 'Uitstroom vrouwen 10 jaar'),
        ('uitstroom_vrouw_basis_vijftien', 'Uitstroom vrouwen 15 jaar'),
        ('uitstroom_vrouw_basis_twintig', 'Uitstroom vrouwen 20 jaar'),
        ('uitstroom_man_basis_vijf', 'Uitstroom mannen 5 jaar'),
        ('uitstroom_man_basis_tien', 'Uitstroom mannen 10 jaar'),
        ('uitstroom_man_basis_vijftien', 'Uitstroom mannen 15 jaar'),
        ('uitstroom_man_basis_twintig', 'Uitstroom mannen 20 jaar'),
    ],
    'Opleiding parameters': [
        ('intern_rendement', 'Intern rendement opleiding'),
        ('opleidingsduur', 'Duur opleiding (jaren)'),
        ('per_vrouw_opleiding', 'Percentage vrouwen opleiding cohort 1'),
        ('per_vrouw_opleiding2', 'Percentage vrouwen opleiding cohort 2'),
        ('per_vrouw_opleiding3', 'Percentage vrouwen opleiding cohort 3'),
    ],
    'Extern rendement': [
        ('extern_rendement_vrouw_1jaar', 'Extern rendement vrouw 1 jaar'),
        ('extern_rendement_vrouw_5jaar', 'Extern rendement vrouw 5 jaar'),
        ('extern_rendement_vrouw_10jaar', 'Extern rendement vrouw 10 jaar'),
        ('extern_rendement_vrouw_15jaar', 'Extern rendement vrouw 15 jaar'),
        ('extern_rendement_man_1jaar', 'Extern rendement man 1 jaar'),
        ('extern_rendement_man_5jaar', 'Extern rendement man 5 jaar'),
        ('extern_rendement_man_10jaar', 'Extern rendement man 10 jaar'),
        ('extern_rendement_man_15jaar', 'Extern rendement man 15 jaar'),
    ],
    'Instroom cohorten': [
        ('n_inopleiding_perjaar', 'Instroom cohort 1 (vast)'),
        ('n_inopleiding_perjaar2', 'Instroom cohort 2 (gepland)'),
        ('n_inopleiding_perjaar3', 'Instroom cohort 3 (adjustable)'),
    ],
}

for category, params in params_to_check.items():
    print(f"\n{category}:")
    for param_name, beschrijving in params:
        try:
            value = get_param(param_name)
            print(f"   {param_name:<40} = {value:>12.6f}  ({beschrijving})")
        except Exception as e:
            print(f"   {param_name:<40} = ERROR: {e}")

# STAP 2: Bereken aanbod per cohort voor 2043
print("\n" + "=" * 100)
print("📊 STAP 2: AANBOD BREAKDOWN 2043 (met instroom 1026)")
print("=" * 100)

aanbod_calc = AanbodCalculator({'instroom': 1026})
jaar = 2043

# Bereken elk cohort apart
from scenario_model import interpolate_linear

jaren_sinds_basis = jaar - 2025  # 18 jaar

print(f"\nJaar: {jaar} (t={jaren_sinds_basis} jaar sinds 2025)")

# COHORT 0: Huidig cohort
print(f"\n🔹 HUIDIG COHORT (werkzaam in 2025):")
aanbod_personen = get_param('aanbod_personen')
per_vrouw_basis = get_param('per_vrouw_basis')
per_man_basis = 1 - per_vrouw_basis

uitstroom_vrouw_5 = get_param('uitstroom_vrouw_basis_vijf')
uitstroom_vrouw_10 = get_param('uitstroom_vrouw_basis_tien')
uitstroom_vrouw_15 = get_param('uitstroom_vrouw_basis_vijftien')
uitstroom_vrouw_20 = get_param('uitstroom_vrouw_basis_twintig')

uitstroom_man_5 = get_param('uitstroom_man_basis_vijf')
uitstroom_man_10 = get_param('uitstroom_man_basis_tien')
uitstroom_man_15 = get_param('uitstroom_man_basis_vijftien')
uitstroom_man_20 = get_param('uitstroom_man_basis_twintig')

uitstroom_frac_vrouw = interpolate_linear(jaren_sinds_basis, uitstroom_vrouw_5, uitstroom_vrouw_10, uitstroom_vrouw_15, uitstroom_vrouw_20)
uitstroom_frac_man = interpolate_linear(jaren_sinds_basis, uitstroom_man_5, uitstroom_man_10, uitstroom_man_15, uitstroom_man_20)

n_vrouw_huidig = aanbod_personen * per_vrouw_basis * (1 - uitstroom_frac_vrouw)
n_man_huidig = aanbod_personen * per_man_basis * (1 - uitstroom_frac_man)

print(f"   Basis 2025:           {aanbod_personen:>10,.2f} personen")
print(f"   └─ Vrouwen ({per_vrouw_basis*100:.1f}%):     {aanbod_personen * per_vrouw_basis:>10,.2f}")
print(f"   └─ Mannen ({per_man_basis*100:.1f}%):      {aanbod_personen * per_man_basis:>10,.2f}")
print(f"\n   Uitstroom na {jaren_sinds_basis} jaar:")
print(f"   └─ Vrouwen:           {uitstroom_frac_vrouw*100:>10,.2f}% → blijven: {n_vrouw_huidig:>10,.2f}")
print(f"   └─ Mannen:            {uitstroom_frac_man*100:>10,.2f}% → blijven: {n_man_huidig:>10,.2f}")
print(f"   TOTAAL huidig cohort: {n_vrouw_huidig + n_man_huidig:>10,.2f} personen")

# COHORT 1
print(f"\n🔹 COHORT 1 (nu in opleiding, vóór 2025):")
n_inopl_perjaar = get_param('n_inopleiding_perjaar')
per_vrouw_opl1 = get_param('per_vrouw_opleiding')
intern_rendement = get_param('intern_rendement')
opleidingsduur = get_param('opleidingsduur')

bijsturingsjaar = 2027
eerste_bijdrage = 2025 + opleidingsduur

if jaar >= eerste_bijdrage:
    jaren_bijdrage_c1 = min(jaren_sinds_basis - opleidingsduur, bijsturingsjaar - 2025)
    if jaren_bijdrage_c1 > 0:
        n_totaal_c1 = n_inopl_perjaar * jaren_bijdrage_c1 * intern_rendement
        print(f"   Instroom/jaar:        {n_inopl_perjaar:>10,.2f} personen")
        print(f"   Jaren bijdrage:       {jaren_bijdrage_c1:>10,.2f}")
        print(f"   Intern rendement:     {intern_rendement*100:>10,.2f}%")
        print(f"   TOTAAL cohort 1:      {n_totaal_c1:>10,.2f} personen (na extern rend & uitstroom)")
    else:
        print(f"   Geen bijdrage (jaren_bijdrage={jaren_bijdrage_c1})")
else:
    print(f"   Nog niet afgestudeerd")

# COHORT 2
print(f"\n🔹 COHORT 2 (tussen 2025 en 2027):")
n_inopl_perjaar2 = get_param('n_inopleiding_perjaar2')
print(f"   Instroom/jaar:        {n_inopl_perjaar2:>10,.2f} personen")

# COHORT 3
print(f"\n🔹 COHORT 3 (na 2027, ADJUSTABLE):")
n_inopl_perjaar3 = 1026  # Excel waarde
evenwichtsjaar = 2043
eerste_bijdrage_c3 = bijsturingsjaar + opleidingsduur

if jaar >= eerste_bijdrage_c3:
    jaren_sinds_eerste_bijdrage = jaar - eerste_bijdrage_c3
    jaren_instroom = evenwichtsjaar - bijsturingsjaar
    jaren_bijdrage_c3 = min(jaren_sinds_eerste_bijdrage, jaren_instroom)

    n_totaal_c3 = n_inopl_perjaar3 * jaren_bijdrage_c3 * intern_rendement

    print(f"   Instroom/jaar:        {n_inopl_perjaar3:>10,.2f} personen")
    print(f"   Jaren bijdrage:       {jaren_bijdrage_c3:>10,.2f}")
    print(f"   Totaal gestart:       {n_inopl_perjaar3 * jaren_bijdrage_c3:>10,.2f}")
    print(f"   Na intern rend:       {n_totaal_c3:>10,.2f} personen")
    print(f"   TOTAAL cohort 3:      {n_totaal_c3:>10,.2f} personen (na extern rend & uitstroom)")

# BUITENLAND
print(f"\n🔹 BUITENLAND:")
buitenland = 14.0 * jaren_sinds_basis
print(f"   Per jaar:             {14.0:>10,.2f} personen")
print(f"   Jaren sinds 2025:     {jaren_sinds_basis:>10,.2f}")
print(f"   TOTAAL buitenland:    {buitenland:>10,.2f} personen")

# TOTAAL VIA MODEL
print("\n" + "=" * 100)
print("📊 STAP 3: MODEL TOTAAL vs BREAKDOWN")
print("=" * 100)

aanbod = aanbod_calc.bereken_totaal_aanbod(jaar)

print(f"\nModel functie output:")
print(f"   Huidig cohort:        {aanbod['huidig_totaal']:>10,.2f}")
print(f"   Cohort 1:             {aanbod['cohort1_totaal']:>10,.2f}")
print(f"   Cohort 2:             {aanbod['cohort2_totaal']:>10,.2f}")
print(f"   Cohort 3:             {aanbod['cohort3_totaal']:>10,.2f}")
print(f"   Buitenland:           {aanbod['buitenland']:>10,.2f}")
print(f"   ────────────────────────────")
print(f"   TOTAAL:               {aanbod['totaal_personen']:>10,.2f}")

print(f"\n   Excel S25:            {18581:>10,.2f}")
print(f"   Verschil:             {aanbod['totaal_personen'] - 18581:>10,.2f} ({((aanbod['totaal_personen'] - 18581)/18581)*100:>6,.2f}%)")

print("\n" + "=" * 100)
print("✅ DEBUG VOLTOOID")
print("=" * 100)
