#!/usr/bin/env python3
"""
Test: Verifieer dat trendjaar (2035) correct wordt toegepast in scenario 6.

Niet-demografische parameters moeten stoppen bij 2035.
Demografie blijft doorlopen tot 2043.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scenario_model import VraagCalculator

print("=" * 100)
print("🧪 TEST: TRENDJAAR BEHANDELING")
print("=" * 100)

vraag_calc = VraagCalculator({})

# Test jaren: 2030, 2035 (trendjaar), 2040, 2043 (evenwichtsjaar)
test_jaren = [2025, 2030, 2035, 2040, 2043]

print("\n📊 Scenario 6 vraag ontwikkeling (midden variant):")
print("-" * 100)
print(f"{'Jaar':<6} {'FTE Vraag':>12} {'Scen1 groei':>12} {'Scen6 groei':>12} {'Niet-demo':>12} {'Jaren ND':>10}")
print("-" * 100)

results = {}
for jaar in test_jaren:
    result6 = vraag_calc.bereken_scenario6_additief(jaar, variant='midden')
    result1 = vraag_calc.bereken_scenario1_demografisch(jaar, variant='midden')

    jaren_sinds_basis = jaar - 2025
    trendjaar = 2035
    jaren_nietdemo = min(jaren_sinds_basis, trendjaar - 2025)

    results[jaar] = result6

    marker = " 🎯 TRENDJAAR" if jaar == 2035 else ""
    marker += " 🏁 EVENWICHT" if jaar == 2043 else ""

    print(f"{jaar:<6} {result6['fte_vraag']:>12,.2f} {result6['scen1_groei']*100:>11,.2f}% {result6['scen6_groei']*100:>11,.2f}% {result6['niet_demo_deel']*100:>11,.2f}% {jaren_nietdemo:>10}{marker}")

# Bereken jaar-op-jaar groei NA trendjaar
print("\n🔍 Jaar-op-jaar groei NA trendjaar (2035):")
print("-" * 100)
print(f"{'Van → Tot':<15} {'Δ FTE':>12} {'Groei %':>12} {'Verwachting':<30}")
print("-" * 100)

periodes = [
    (2030, 2035, "Voor trendjaar (niet-demo actief)"),
    (2035, 2040, "Na trendjaar (alleen demo)"),
    (2040, 2043, "Na trendjaar (alleen demo)"),
]

for van_jaar, tot_jaar, beschrijving in periodes:
    delta_fte = results[tot_jaar]['fte_vraag'] - results[van_jaar]['fte_vraag']
    jaren = tot_jaar - van_jaar
    groei_pct = (delta_fte / results[van_jaar]['fte_vraag']) * 100 / jaren  # Per jaar gemiddeld

    print(f"{van_jaar} → {tot_jaar:<6} {delta_fte:>12,.2f} {groei_pct:>11,.2f}%/jr {beschrijving:<30}")

# Check: niet-demo deel moet GELIJK blijven na 2035
print(f"\n📐 VERIFICATIE: Niet-demo deel constant na trendjaar?")
print("-" * 100)

niet_demo_2035 = results[2035]['niet_demo_deel']
niet_demo_2040 = results[2040]['niet_demo_deel']
niet_demo_2043 = results[2043]['niet_demo_deel']

print(f"   Niet-demo deel 2035: {niet_demo_2035:>10,.6f}")
print(f"   Niet-demo deel 2040: {niet_demo_2040:>10,.6f}")
print(f"   Niet-demo deel 2043: {niet_demo_2043:>10,.6f}")

if abs(niet_demo_2035 - niet_demo_2040) < 0.0001 and abs(niet_demo_2035 - niet_demo_2043) < 0.0001:
    print(f"\n   ✅ CORRECT: Niet-demo deel blijft constant na trendjaar!")
else:
    print(f"\n   ❌ FOUT: Niet-demo deel verandert na trendjaar!")
    print(f"   Verschil 2035→2040: {(niet_demo_2040 - niet_demo_2035)*100:.4f}%")
    print(f"   Verschil 2035→2043: {(niet_demo_2043 - niet_demo_2035)*100:.4f}%")

print("\n" + "=" * 100)
print("✅ TEST VOLTOOID")
print("=" * 100)
