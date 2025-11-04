#!/usr/bin/env python3
"""
Test: Klopt het dat instroom van 1.026 personen resulteert in evenwicht in 2043?

Excel beweert: 1.026 personen instroom → gap = 0 in 2043 (18-jarige evenwichtsperiode)
Model berekent: ?
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import calculator
from scenario_model import AanbodCalculator, VraagCalculator, get_param

# CSV locatie
CSV_FILE = Path("/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv")

print("=" * 100)
print("🧪 TEST: EVENWICHT BIJ INSTROOM 1.026 PERSONEN")
print("=" * 100)

# Laad parameters
params = {}
# (Voor deze test gebruiken we de standaard params uit VraagCalculator en AanbodCalculator)

vraag_calc = VraagCalculator(params)

# Test verschillende instroom waarden
test_instromen = [
    1026,   # Excel evenwicht
    1100,
    1200,
    1300,
    1323,   # Wat ik eerder berekende
]

print("\n📊 Gap in 2043 voor verschillende instroomwaarden (scenario 6):")
print("-" * 100)
print(f"{'Instroom (pers)':>15} {'Aanbod FTE':>12} {'Vraag FTE':>12} {'Gap FTE':>12} {'Gap %':>12}")
print("-" * 100)

for instroom in test_instromen:
    # Bereken aanbod met deze instroom
    aanbod_calc = AanbodCalculator({'instroom': instroom})
    aanbod = aanbod_calc.bereken_totaal_aanbod(2043)

    # Bereken vraag scenario 6
    vraag = vraag_calc.bereken_scenario6_additief(2043, variant='midden')

    # Bereken gap
    gap_fte = aanbod['fte_totaal'] - vraag['fte_vraag']
    gap_pct = (gap_fte / vraag['fte_vraag']) * 100

    marker = " ✅ EVENWICHT!" if abs(gap_fte) < 10 else ""

    print(f"{instroom:>15} {aanbod['fte_totaal']:>12,.2f} {vraag['fte_vraag']:>12,.2f} {gap_fte:>12,.2f} {gap_pct:>11,.2f}%{marker}")

# Zoek EXACTE evenwicht via binary search
print("\n🎯 Zoeken naar EXACTE evenwicht...")
print("-" * 100)

def bereken_gap(instroom):
    aanbod_calc = AanbodCalculator({'instroom': instroom})
    aanbod = aanbod_calc.bereken_totaal_aanbod(2043)
    vraag = vraag_calc.bereken_scenario6_additief(2043, variant='midden')
    return aanbod['fte_totaal'] - vraag['fte_vraag']

# Binary search voor evenwicht
laag = 900
hoog = 1500
tolerantie = 0.1  # 0.1 FTE is verwaarloosbaar

while hoog - laag > 1:
    midden = (laag + hoog) / 2
    gap = bereken_gap(midden)

    if abs(gap) < tolerantie:
        break
    elif gap < 0:  # Te weinig aanbod
        laag = midden
    else:  # Te veel aanbod
        hoog = midden

evenwicht_instroom = (laag + hoog) / 2
evenwicht_gap = bereken_gap(evenwicht_instroom)

print(f"✅ Evenwicht gevonden bij instroom: {evenwicht_instroom:,.1f} personen/jaar")
print(f"   Resulterende gap in 2043: {evenwicht_gap:,.2f} FTE ({(evenwicht_gap/vraag['fte_vraag'])*100:,.3f}%)")

# Bereken details voor 1026
print("\n📋 DETAILS VOOR INSTROOM 1.026 (Excel waarde):")
print("=" * 100)

instroom_excel = 1026
aanbod_calc = AanbodCalculator({'instroom': instroom_excel})
aanbod = aanbod_calc.bereken_totaal_aanbod(2043)
vraag = vraag_calc.bereken_scenario6_additief(2043, variant='midden')

print(f"\n2043 met instroom {instroom_excel} personen/jaar:")
print(f"   Aanbod totaal:        {aanbod['fte_totaal']:>12,.2f} FTE ({aanbod['totaal_personen']:>12,.2f} personen)")
print(f"   └─ Huidig cohort:     {aanbod['huidig_totaal']:>12,.2f} personen")
print(f"   └─ Cohort 1:          {aanbod['cohort1_totaal']:>12,.2f} personen")
print(f"   └─ Cohort 2:          {aanbod['cohort2_totaal']:>12,.2f} personen")
print(f"   └─ Cohort 3:          {aanbod['cohort3_totaal']:>12,.2f} personen")
print(f"   └─ Buitenland:        {aanbod['buitenland']:>12,.2f} personen")
print()
print(f"   Vraag scenario 6:     {vraag['fte_vraag']:>12,.2f} FTE")
print()
print(f"   Gap:                  {aanbod['fte_totaal'] - vraag['fte_vraag']:>12,.2f} FTE ({((aanbod['fte_totaal'] - vraag['fte_vraag'])/vraag['fte_vraag'])*100:>6,.2f}%)")

print("\n" + "=" * 100)
print("✅ TEST VOLTOOID")
print("=" * 100)
