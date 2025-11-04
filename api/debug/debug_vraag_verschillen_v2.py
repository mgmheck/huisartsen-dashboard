#!/usr/bin/env python3
"""
Debug script om vraagverschillen tussen model en Excel te analyseren
Gebruikt de scenario_model module direct
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Import calculator
from scenario_model import VraagCalculator

print("=" * 80)
print("🔍 ANALYSE VRAAGVERSCHILLEN TUSSEN MODEL EN EXCEL")
print("=" * 80)

# Initialiseer calculator (met lege dict - gebruikt intern get_param())
vraag_calc = VraagCalculator({})

print(f"\n🎯 Huidige configuratie:")
print(f"Basisjaar: {vraag_calc.basisjaar}")
print(f"Trendjaar: {vraag_calc.trendjaar}")
print(f"FTE basis: {vraag_calc.fte_basis:,.2f}")

print(f"\n📈 Onvervulde vraag (midden): {vraag_calc.onv_vraag_midden:.4f}")

# Demografische parameters
print(f"\n🌍 Demografische ontwikkelingen (midden):")
print(f"  5 jaar: {vraag_calc.demo_midden_5:.4f}")
print(f"  10 jaar: {vraag_calc.demo_midden_10:.4f}")
print(f"  15 jaar: {vraag_calc.demo_midden_15:.4f}")
print(f"  20 jaar: {vraag_calc.demo_midden_20:.4f}")

# Niet-demografische parameters (variant-specifiek, geskipt voor eenvoud)

# Excel validatie data
excel_vraag = {
    2025: 11447.30,
    2026: 11845.93,
    2027: 12249.69,
    2028: 12658.56,
    2029: 13072.56,
    2030: 13491.67
}

jaren = [2025, 2026, 2027, 2028, 2029, 2030]

print(f"\n{'=' * 80}")
print(f"SCENARIO 1: DEMOGRAFIE + ONVERVULDE VRAAG")
print(f"{'=' * 80}\n")

results_scen1 = []
for jaar in jaren:
    result = vraag_calc.bereken_scenario1_demografisch(jaar, variant='midden')
    fte_vraag = result['fte_vraag']
    excel_waarde = excel_vraag.get(jaar, 0)
    verschil = fte_vraag - excel_waarde

    results_scen1.append({
        'jaar': jaar,
        'model_fte': fte_vraag,
        'excel': excel_waarde,
        'verschil': verschil
    })

print(f"{'Jaar':<6} {'Model FTE':>12} {'Excel FTE':>12} {'Verschil':>12} {'% Verschil':>12}")
print("-" * 60)
for r in results_scen1:
    pct_verschil = (r['verschil'] / r['excel']) * 100 if r['excel'] != 0 else 0
    print(f"{r['jaar']:<6} {r['model_fte']:>12,.2f} {r['excel']:>12,.2f} {r['verschil']:>12,.2f} {pct_verschil:>11,.1f}%")

total_abs_error_scen1 = sum(abs(r['verschil']) for r in results_scen1)
print(f"\n📊 Totale absolute fout Scenario 1: {total_abs_error_scen1:,.2f} FTE")

print(f"\n{'=' * 80}")
print(f"SCENARIO 6: ADDITIEF MODEL (ALLE FACTOREN)")
print(f"{'=' * 80}\n")

results_scen6 = []
for jaar in jaren:
    result = vraag_calc.bereken_scenario6_additief(jaar, variant='midden')
    fte_vraag = result['fte_vraag']
    excel_waarde = excel_vraag.get(jaar, 0)
    verschil = fte_vraag - excel_waarde

    results_scen6.append({
        'jaar': jaar,
        'model_fte': fte_vraag,
        'excel': excel_waarde,
        'verschil': verschil
    })

print(f"{'Jaar':<6} {'Model FTE':>12} {'Excel FTE':>12} {'Verschil':>12} {'% Verschil':>12}")
print("-" * 60)
for r in results_scen6:
    pct_verschil = (r['verschil'] / r['excel']) * 100 if r['excel'] != 0 else 0
    print(f"{r['jaar']:<6} {r['model_fte']:>12,.2f} {r['excel']:>12,.2f} {r['verschil']:>12,.2f} {pct_verschil:>11,.1f}%")

total_abs_error_scen6 = sum(abs(r['verschil']) for r in results_scen6)
print(f"\n📊 Totale absolute fout Scenario 6: {total_abs_error_scen6:,.2f} FTE")

# Analyse welk scenario het beste past
print(f"\n{'=' * 80}")
print(f"🔍 CONCLUSIE:")
print(f"{'=' * 80}")

if total_abs_error_scen1 < total_abs_error_scen6:
    print(f"\n✅ Scenario 1 past het BEST bij Excel data:")
    print(f"   Totale fout Scen1: {total_abs_error_scen1:,.2f} FTE")
    print(f"   Totale fout Scen6: {total_abs_error_scen6:,.2f} FTE")
    print(f"\n🔎 Excel gebruikt waarschijnlijk SCENARIO 1 (demo + onvervulde vraag)")
else:
    print(f"\n✅ Scenario 6 past het BEST bij Excel data:")
    print(f"   Totale fout Scen6: {total_abs_error_scen6:,.2f} FTE")
    print(f"   Totale fout Scen1: {total_abs_error_scen1:,.2f} FTE")
    print(f"\n🔎 Excel gebruikt waarschijnlijk SCENARIO 6 (additief model)")

# Gedetailleerde analyse van verschillen
print(f"\n{'=' * 80}")
print(f"🔬 PATROON ANALYSE:")
print(f"{'=' * 80}")

# Check of verschil lineair groeit
verschillen_scen1 = [abs(r['verschil']) for r in results_scen1]
verschillen_scen6 = [abs(r['verschil']) for r in results_scen6]

print(f"\nScenario 1 absolute verschillen per jaar:")
for i, (jaar, verschil) in enumerate(zip(jaren, verschillen_scen1)):
    if i > 0:
        delta = verschil - verschillen_scen1[i-1]
        print(f"  {jaar}: {verschil:>8,.2f} FTE  (Δ: {delta:>+8,.2f})")
    else:
        print(f"  {jaar}: {verschil:>8,.2f} FTE")

print(f"\nScenario 6 absolute verschillen per jaar:")
for i, (jaar, verschil) in enumerate(zip(jaren, verschillen_scen6)):
    if i > 0:
        delta = verschil - verschillen_scen6[i-1]
        print(f"  {jaar}: {verschil:>8,.2f} FTE  (Δ: {delta:>+8,.2f})")
    else:
        print(f"  {jaar}: {verschil:>8,.2f} FTE")

print("\n" + "=" * 80)
print("✅ ANALYSE VOLTOOID")
print("=" * 80)
