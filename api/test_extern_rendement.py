#!/usr/bin/env python3
"""
Test: Verifieer extern rendement berekening volgens Stata methodologie.

Staat-methode (regels 168-170, 179):
- hulpextern = total(extern_rendement_vrouw) if bepaalde jaren
- hulpextern2 = hulpextern / (jaar - basisjaar)
- n_vrouw = ... × (jaar-basisjaar) × hulpextern2

Dit resulteert in: n_vrouw = ... × hulpextern (SUM van alle ER waarden!)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scenario_model import get_param

print("=" * 100)
print("🧪 TEST: EXTERN RENDEMENT BEREKENING")
print("=" * 100)

# Haal extern rendement parameters op
er_vrouw_1 = get_param('extern_rendement_vrouw_1jaar')
er_vrouw_5 = get_param('extern_rendement_vrouw_5jaar')
er_vrouw_10 = get_param('extern_rendement_vrouw_10jaar')
er_vrouw_15 = get_param('extern_rendement_vrouw_15jaar')

print(f"\n📋 Extern Rendement Parameters (vrouwen):")
print(f"   1 jaar:  {er_vrouw_1:.4f}")
print(f"   5 jaar:  {er_vrouw_5:.4f}")
print(f"  10 jaar:  {er_vrouw_10:.4f}")
print(f"  15 jaar:  {er_vrouw_15:.4f}")

# Interpoleer voor tussenliggende jaren (zoals Stata doet regels 136-154)
def interpolate_stata(jaren):
    """Interpoleer extern rendement zoals Stata doet."""
    if jaren <= 0:
        return 0.0
    elif jaren == 1:
        return er_vrouw_1
    elif jaren <= 5:
        # Lineaire interpolatie tussen 1 en 5
        frac = (jaren - 1) / 4
        return er_vrouw_1 + frac * (er_vrouw_5 - er_vrouw_1)
    elif jaren <= 10:
        frac = (jaren - 5) / 5
        return er_vrouw_5 + frac * (er_vrouw_10 - er_vrouw_5)
    elif jaren <= 15:
        frac = (jaren - 10) / 5
        return er_vrouw_10 + frac * (er_vrouw_15 - er_vrouw_10)
    else:
        # Na 15 jaar: extrapoleer lineair verder
        frac = (jaren - 15) / 5
        return er_vrouw_15 + frac * (er_vrouw_15 - er_vrouw_10)

# Test voor cohort 1 in 2043
print("\n" + "=" * 100)
print("📊 COHORT 1 BEREKENING (2043)")
print("=" * 100)

jaren_sinds_basis = 18  # 2043 - 2025
opleidingsduur = 3
bijsturingsjaar_offset = 2  # 2027 - 2025

# Cohort 1: max 2 jaar bijdrage (tot bijsturingsjaar)
jaren_bijdrage_c1 = min(jaren_sinds_basis - opleidingsduur, bijsturingsjaar_offset)

print(f"\nJaren sinds basis: {jaren_sinds_basis}")
print(f"Opleidingsduur: {opleidingsduur}")
print(f"Jaren bijdrage cohort 1: {jaren_bijdrage_c1}")

# Bereken extern rendement volgens STATA methode
# Dit moet de SOM zijn van alle ER waarden voor de jaren dat mensen werken

print(f"\n🔍 STATA METHODE (Cumulatieve Som):")
print("-" * 100)

# Voor cohort 1: mensen zijn 3, 4, ... jaren geleden afgestudeerd (afhankelijk van wanneer gestart)
# In 2043: eerste cohort is 18-3 = 15 jaar geleden afgestudeerd
# Laatste cohort dat nog telt is bijsturingsjaar 2027, dus (2043-3-2027) = 13 jaar geleden afgestudeerd

# Volgens Stata regels 161-176:
# We nemen alle jaren vanaf eerste afstuderen tot "opleidingsduur" jaren
sum_er = 0.0
count_jaren = 0

print(f"\nBerekening extern_rendement_vrouw_injaarx:")
for i in range(jaren_bijdrage_c1):
    jaren_sinds_afstuderen = i + 1
    er_value = interpolate_stata(jaren_sinds_afstuderen)
    sum_er += er_value
    count_jaren += 1
    print(f"   Jaar {i+1} sinds afstuderen: ER = {er_value:.6f}")

avg_er = sum_er / count_jaren if count_jaren > 0 else 0.0

print(f"\n   Som: {sum_er:.6f}")
print(f"   Gemiddelde: {avg_er:.6f} (= som / {count_jaren})")

# Volgens Stata regel 179-180:
# n_vrouw = n_inopleiding × per_vrouw × intern_rend × jaren_bijdrage × avg_er
# Dit is equivalent aan: n_inopleiding × per_vrouw × intern_rend × sum_er

n_inopleiding = get_param('n_inopleiding_perjaar')
per_vrouw = get_param('per_vrouw_opleiding')
intern_rend = get_param('intern_rendement')

# Stata berekening
n_vrouw_stata_met_avg = n_inopleiding * per_vrouw * intern_rend * jaren_bijdrage_c1 * avg_er
n_vrouw_stata_met_sum = n_inopleiding * per_vrouw * intern_rend * sum_er

print(f"\n📈 STATA Resultaat:")
print(f"   Met gemiddelde: {n_inopleiding:.1f} × {per_vrouw:.4f} × {intern_rend:.4f} × {jaren_bijdrage_c1} × {avg_er:.6f} = {n_vrouw_stata_met_avg:.2f}")
print(f"   Met som:        {n_inopleiding:.1f} × {per_vrouw:.4f} × {intern_rend:.4f} × {sum_er:.6f} = {n_vrouw_stata_met_sum:.2f}")
print(f"   → Deze zijn EQUIVALENT!")

# Mijn huidige methode
print(f"\n🔍 MIJN HUIDIGE METHODE (Midpoint):")
print("-" * 100)

gem_jaren_sinds_afstuderen = jaren_bijdrage_c1 / 2
er_midpoint = interpolate_stata(gem_jaren_sinds_afstuderen)

n_vrouw_mijne = n_inopleiding * per_vrouw * intern_rend * jaren_bijdrage_c1 * er_midpoint

print(f"   Midpoint: {gem_jaren_sinds_afstuderen:.1f} jaar")
print(f"   ER bij midpoint: {er_midpoint:.6f}")
print(f"   Resultaat: {n_inopleiding:.1f} × {per_vrouw:.4f} × {intern_rend:.4f} × {jaren_bijdrage_c1} × {er_midpoint:.6f} = {n_vrouw_mijne:.2f}")

# Vergelijk
print(f"\n📊 VERGELIJKING:")
print("-" * 100)
print(f"   Stata methode:  {n_vrouw_stata_met_avg:.2f} personen")
print(f"   Mijn methode:   {n_vrouw_mijne:.2f} personen")
print(f"   Verschil:       {n_vrouw_stata_met_avg - n_vrouw_mijne:.2f} personen ({((n_vrouw_stata_met_avg - n_vrouw_mijne)/n_vrouw_stata_met_avg)*100:.2f}%)")

print("\n" + "=" * 100)
print("✅ TEST VOLTOOID")
print("=" * 100)
