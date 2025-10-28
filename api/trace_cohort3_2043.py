#!/usr/bin/env python3
"""
GEDETAILLEERDE TRACE: Cohort 3 berekening voor 2043 met instroom 1,026

Dit script vergelijkt stap-voor-stap mijn Python implementatie met de Stata methodologie
uit de volgende scripts:
1. Beschikbaar aanbod_3.2.do (regels 378-498)
2. Invullen instroomadviezen_3.2.do (regels 21-28)
3. 2. Benodigde instroom_3.2.do (gebruikt de eerste twee)

Het doel is om het +2,902 personen verschil te vinden.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scenario_model import get_param, interpolate_linear

print("=" * 100)
print("🔍 GEDETAILLEERDE TRACE: COHORT 3 BEREKENING VOOR 2043")
print("=" * 100)

# PARAMETERS OPHALEN
print("\n📋 STAP 1: OPHALEN PARAMETERS")
print("-" * 100)

basisjaar = 2025
bijsturingsjaar = 2027
jaar = 2043
evenwichtsjaar = 2043
instroom = 1026

n_inopl_perjaar3 = instroom
per_vrouw_opl3 = get_param('per_vrouw_opleiding3')
per_man_opl3 = 1 - per_vrouw_opl3
intern_rendement3 = get_param('intern_rendement3')
opleidingsduur3 = get_param('opleidingsduur3')

er_vrouw_1 = get_param('extern_rendement_vrouw_1jaar3')
er_vrouw_5 = get_param('extern_rendement_vrouw_5jaar3')
er_vrouw_10 = get_param('extern_rendement_vrouw_10jaar3')
er_vrouw_15 = get_param('extern_rendement_vrouw_15jaar3')

er_man_1 = get_param('extern_rendement_man_1jaar3')
er_man_5 = get_param('extern_rendement_man_5jaar3')
er_man_10 = get_param('extern_rendement_man_10jaar3')
er_man_15 = get_param('extern_rendement_man_15jaar3')

print(f"Basisjaar:               {basisjaar}")
print(f"Bijsturingsjaar:         {bijsturingsjaar}")
print(f"Evenwichtsjaar:          {evenwichtsjaar}")
print(f"Jaar (target):           {jaar}")
print(f"\nInstroom cohort 3:       {n_inopl_perjaar3:,.0f} personen/jaar")
print(f"Percentage vrouwen:      {per_vrouw_opl3:.4f} ({per_vrouw_opl3*100:.2f}%)")
print(f"Intern rendement:        {intern_rendement3:.4f} ({intern_rendement3*100:.2f}%)")
print(f"Opleidingsduur:          {opleidingsduur3:.1f} jaar")

print(f"\nExtern rendement vrouwen:")
print(f"   1 jaar:  {er_vrouw_1:.6f}")
print(f"   5 jaar:  {er_vrouw_5:.6f}")
print(f"  10 jaar:  {er_vrouw_10:.6f}")
print(f"  15 jaar:  {er_vrouw_15:.6f}")

print(f"\nExtern rendement mannen:")
print(f"   1 jaar:  {er_man_1:.6f}")
print(f"   5 jaar:  {er_man_5:.6f}")
print(f"  10 jaar:  {er_man_10:.6f}")
print(f"  15 jaar:  {er_man_15:.6f}")

# STAP 2: BEREKENING JAREN_BIJDRAGE
print("\n" + "=" * 100)
print("📊 STAP 2: BEREKENING JAREN_BIJDRAGE")
print("=" * 100)

print("\n🔹 STATA FORMULE (Beschikbaar aanbod_3.2.do, regel 435):")
print("   jaren_bijdrage = jaar - opleidingsduur3 - (bijsturingsjaar - basisjaar) - basisjaar")
print("   Simplificatie: jaar - opleidingsduur3 - bijsturingsjaar")

stata_jaren_bijdrage = jaar - opleidingsduur3 - bijsturingsjaar

print(f"\n   Berekening:")
print(f"   = {jaar} - {opleidingsduur3} - {bijsturingsjaar}")
print(f"   = {stata_jaren_bijdrage}")

print("\n🔹 MIJN PYTHON METHODE:")
eerste_bijdrage_c3 = bijsturingsjaar + opleidingsduur3
jaren_sinds_eerste_bijdrage = jaar - eerste_bijdrage_c3
jaren_instroom = evenwichtsjaar - bijsturingsjaar
mijn_jaren_bijdrage = min(jaren_sinds_eerste_bijdrage, jaren_instroom)

print(f"   Eerste bijdrage jaar:     {eerste_bijdrage_c3} (= {bijsturingsjaar} + {opleidingsduur3})")
print(f"   Jaren sinds eerste bijdr: {jaren_sinds_eerste_bijdrage} (= {jaar} - {eerste_bijdrage_c3})")
print(f"   Jaren instroom mogelijk:  {jaren_instroom} (= {evenwichtsjaar} - {bijsturingsjaar})")
print(f"   Min van beide:            {mijn_jaren_bijdrage}")

if stata_jaren_bijdrage == mijn_jaren_bijdrage:
    print(f"\n   ✅ MATCH! Beide methodes geven {mijn_jaren_bijdrage} jaren bijdrage")
else:
    print(f"\n   ❌ VERSCHIL! Stata: {stata_jaren_bijdrage}, Mijn: {mijn_jaren_bijdrage}")

# STAP 3: EXTERN RENDEMENT BEREKENING
print("\n" + "=" * 100)
print("📊 STAP 3: EXTERN RENDEMENT BEREKENING")
print("=" * 100)

def interpolate_stata(jaren, er_1, er_5, er_10, er_15):
    """Interpoleer extern rendement zoals Stata doet."""
    if jaren <= 0:
        return 0.0
    elif jaren == 1:
        return er_1
    elif jaren <= 5:
        # Lineaire interpolatie tussen 1 en 5
        frac = (jaren - 1) / 4
        return er_1 + frac * (er_5 - er_1)
    elif jaren <= 10:
        frac = (jaren - 5) / 5
        return er_5 + frac * (er_10 - er_5)
    elif jaren <= 15:
        frac = (jaren - 10) / 5
        return er_10 + frac * (er_15 - er_10)
    else:
        # Na 15 jaar: extrapoleer lineair verder
        frac = (jaren - 15) / 5
        return er_15 + frac * (er_15 - er_10)

print("\n🔹 STATA METHODE (Beschikbaar aanbod_3.2.do, regels 424-432):")
print("   extern_rendement_vrouw_injaarx3 is een CUMULATIEVE SOM / jaren")
print("   Formule: hulpextern = total(extern_rendement_vrouw3) voor alle jaren")
print("            hulpextern2 = hulpextern / (jaar - basisjaar)")

# Voor cohort 3: mensen beginnen vanaf bijsturingsjaar met opleiding
# In 2043: eerste cohort is 2043-3-2027 = 13 jaar geleden afgestudeerd
# Dit betekent we hebben mensen die 1, 2, 3, ..., 13 jaar geleden afgestudeerd zijn

print(f"\n   In {jaar}: cohort 3 heeft mensen die afgestudeerd zijn tussen:")
print(f"   - Eerste afstuderen: {eerste_bijdrage_c3} (= bijsturingsjaar + opleidingsduur)")
print(f"   - Laatste afstuderen: {jaar - opleidingsduur3}")
print(f"   - Dit zijn cohorten met {mijn_jaren_bijdrage} verschillende 'afstudeer-jaren'")

print("\n   Extern rendement voor elk afstudeer-cohort:")
print("   " + "-" * 80)
print(f"   {'Jaren sinds':'<20} {'ER waarde':>15} {'Toelichting':<40}")
print(f"   {'afstuderen':'<20} {'':>15} {'':>40}")
print("   " + "-" * 80)

sum_er_vrouw = 0.0
sum_er_man = 0.0
for i in range(1, int(mijn_jaren_bijdrage) + 1):
    er_vrouw_value = interpolate_stata(i, er_vrouw_1, er_vrouw_5, er_vrouw_10, er_vrouw_15)
    er_man_value = interpolate_stata(i, er_man_1, er_man_5, er_man_10, er_man_15)
    sum_er_vrouw += er_vrouw_value
    sum_er_man += er_man_value

    if i <= 3 or i >= int(mijn_jaren_bijdrage) - 1:
        print(f"   {i:>3} jaar{'en' if i > 1 else '':<14}  V: {er_vrouw_value:>7.6f}  M: {er_man_value:>7.6f}")
    elif i == 4:
        print(f"   {'...':<20}  {'...':<30}")

print("   " + "-" * 80)
print(f"   {'SOM (alle jaren)':<20}  V: {sum_er_vrouw:>7.6f}  M: {sum_er_man:>7.6f}")
print("   " + "-" * 80)

avg_er_vrouw = sum_er_vrouw / mijn_jaren_bijdrage
avg_er_man = sum_er_man / mijn_jaren_bijdrage

print(f"\n   Gemiddeld extern rendement (= som / jaren):")
print(f"   Vrouwen:  {sum_er_vrouw:.6f} / {mijn_jaren_bijdrage} = {avg_er_vrouw:.6f}")
print(f"   Mannen:   {sum_er_man:.6f} / {mijn_jaren_bijdrage} = {avg_er_man:.6f}")

# STAP 4: COHORT 3 TOTALE BEREKENING (STATA METHODE)
print("\n" + "=" * 100)
print("📊 STAP 4: COHORT 3 TOTALE BEREKENING - STATA METHODE")
print("=" * 100)

print("\n🔹 STATA FORMULE (Beschikbaar aanbod_3.2.do, regel 435):")
print("   n_vrouw = n_inopleiding_perjaar3 × per_vrouw_opleiding3 × intern_rendement3 × ")
print("             jaren_bijdrage × extern_rendement_vrouw_injaarx3")
print("\n   Maar extern_rendement_vrouw_injaarx3 = sum_er / jaren")
print("   Dus: n_vrouw = n_inopleiding × per_vrouw × intern_rend × jaren_bijdrage × (sum_er / jaren)")
print("   Simplificatie: n_vrouw = n_inopleiding × per_vrouw × intern_rend × sum_er")

n_gestart_vrouw = n_inopl_perjaar3 * per_vrouw_opl3 * mijn_jaren_bijdrage
n_afgestudeerd_vrouw = n_gestart_vrouw * intern_rendement3
n_werkend_vrouw_stata = n_afgestudeerd_vrouw * avg_er_vrouw
n_werkend_vrouw_stata_alt = n_inopl_perjaar3 * per_vrouw_opl3 * intern_rendement3 * sum_er_vrouw

print(f"\n   VROUWEN:")
print(f"   Aantal gestart:       {n_inopl_perjaar3:,.1f} × {per_vrouw_opl3:.6f} × {mijn_jaren_bijdrage} jaar")
print(f"                       = {n_gestart_vrouw:,.2f} personen")
print(f"\n   Na intern rendement:  {n_gestart_vrouw:,.2f} × {intern_rendement3:.6f}")
print(f"                       = {n_afgestudeerd_vrouw:,.2f} personen")
print(f"\n   Methode 1 (met gemiddelde ER):")
print(f"   Na extern rendement:  {n_afgestudeerd_vrouw:,.2f} × {avg_er_vrouw:.6f}")
print(f"                       = {n_werkend_vrouw_stata:,.2f} personen")
print(f"\n   Methode 2 (met som ER - EQUIVALENT):")
print(f"   Na extern rendement:  {n_inopl_perjaar3:,.1f} × {per_vrouw_opl3:.6f} × {intern_rendement3:.6f} × {sum_er_vrouw:.6f}")
print(f"                       = {n_werkend_vrouw_stata_alt:,.2f} personen")

n_gestart_man = n_inopl_perjaar3 * per_man_opl3 * mijn_jaren_bijdrage
n_afgestudeerd_man = n_gestart_man * intern_rendement3
n_werkend_man_stata = n_afgestudeerd_man * avg_er_man
n_werkend_man_stata_alt = n_inopl_perjaar3 * per_man_opl3 * intern_rendement3 * sum_er_man

print(f"\n   MANNEN:")
print(f"   Aantal gestart:       {n_inopl_perjaar3:,.1f} × {per_man_opl3:.6f} × {mijn_jaren_bijdrage} jaar")
print(f"                       = {n_gestart_man:,.2f} personen")
print(f"\n   Na intern rendement:  {n_gestart_man:,.2f} × {intern_rendement3:.6f}")
print(f"                       = {n_afgestudeerd_man:,.2f} personen")
print(f"\n   Methode 1 (met gemiddelde ER):")
print(f"   Na extern rendement:  {n_afgestudeerd_man:,.2f} × {avg_er_man:.6f}")
print(f"                       = {n_werkend_man_stata:,.2f} personen")
print(f"\n   Methode 2 (met som ER - EQUIVALENT):")
print(f"   Na extern rendement:  {n_inopl_perjaar3:,.1f} × {per_man_opl3:.6f} × {intern_rendement3:.6f} × {sum_er_man:.6f}")
print(f"                       = {n_werkend_man_stata_alt:,.2f} personen")

n_totaal_stata = n_werkend_vrouw_stata + n_werkend_man_stata

print(f"\n   TOTAAL COHORT 3 (STATA):")
print(f"   Vrouwen + Mannen = {n_werkend_vrouw_stata:,.2f} + {n_werkend_man_stata:,.2f}")
print(f"                    = {n_totaal_stata:,.2f} personen")

# STAP 5: COHORT 3 BEREKENING - MIJN PYTHON METHODE
print("\n" + "=" * 100)
print("📊 STAP 5: COHORT 3 BEREKENING - MIJN PYTHON METHODE")
print("=" * 100)

print("\n🔹 MIJN METHODE (scenario_model.py, regels 394-429):")

# Bereken gewogen gemiddelde extern rendement (zoals ik doe)
er_gem_gewogen = (per_vrouw_opl3 * avg_er_vrouw) + (per_man_opl3 * avg_er_man)

print(f"\n   Gewogen gemiddeld extern rendement:")
print(f"   = ({per_vrouw_opl3:.6f} × {avg_er_vrouw:.6f}) + ({per_man_opl3:.6f} × {avg_er_man:.6f})")
print(f"   = {er_gem_gewogen:.6f}")

n_gestart_totaal = n_inopl_perjaar3 * mijn_jaren_bijdrage
n_afgestudeerd_totaal = n_gestart_totaal * intern_rendement3
n_werkend_totaal_mijn = n_afgestudeerd_totaal * er_gem_gewogen

print(f"\n   Totaal gestart:       {n_inopl_perjaar3:,.1f} × {mijn_jaren_bijdrage} jaar")
print(f"                       = {n_gestart_totaal:,.2f} personen")
print(f"\n   Na intern rendement:  {n_gestart_totaal:,.2f} × {intern_rendement3:.6f}")
print(f"                       = {n_afgestudeerd_totaal:,.2f} personen")
print(f"\n   Na extern rendement:  {n_afgestudeerd_totaal:,.2f} × {er_gem_gewogen:.6f}")
print(f"                       = {n_werkend_totaal_mijn:,.2f} personen")

# Dan splits naar vrouwen en mannen
n_werkend_vrouw_mijn = n_werkend_totaal_mijn * per_vrouw_opl3
n_werkend_man_mijn = n_werkend_totaal_mijn * per_man_opl3

print(f"\n   Verdeling naar geslacht:")
print(f"   Vrouwen: {n_werkend_totaal_mijn:,.2f} × {per_vrouw_opl3:.6f} = {n_werkend_vrouw_mijn:,.2f}")
print(f"   Mannen:  {n_werkend_totaal_mijn:,.2f} × {per_man_opl3:.6f} = {n_werkend_man_mijn:,.2f}")

# STAP 6: VERGELIJKING
print("\n" + "=" * 100)
print("📊 STAP 6: VERGELIJKING STATA vs MIJN METHODE")
print("=" * 100)

print(f"\n{'Cohort':<20} {'Stata':<20} {'Mijn methode':<20} {'Verschil':<20}")
print("-" * 80)
print(f"{'Vrouwen':<20} {n_werkend_vrouw_stata:>18,.2f} {n_werkend_vrouw_mijn:>18,.2f} {n_werkend_vrouw_stata - n_werkend_vrouw_mijn:>18,.2f}")
print(f"{'Mannen':<20} {n_werkend_man_stata:>18,.2f} {n_werkend_man_mijn:>18,.2f} {n_werkend_man_stata - n_werkend_man_mijn:>18,.2f}")
print(f"{'TOTAAL':<20} {n_totaal_stata:>18,.2f} {n_werkend_totaal_mijn:>18,.2f} {n_totaal_stata - n_werkend_totaal_mijn:>18,.2f}")
print("-" * 80)

verschil_pct = ((n_totaal_stata - n_werkend_totaal_mijn) / n_totaal_stata) * 100

if abs(n_totaal_stata - n_werkend_totaal_mijn) < 1.0:
    print(f"\n✅ EXCELLENT! Verschil is verwaarloosbaar: {n_totaal_stata - n_werkend_totaal_mijn:.4f} personen ({verschil_pct:.6f}%)")
elif abs(n_totaal_stata - n_werkend_totaal_mijn) < 10.0:
    print(f"\n✅ GOED! Verschil is klein: {n_totaal_stata - n_werkend_totaal_mijn:.2f} personen ({verschil_pct:.4f}%)")
else:
    print(f"\n⚠️  SIGNIFICANT VERSCHIL: {n_totaal_stata - n_werkend_totaal_mijn:.2f} personen ({verschil_pct:.2f}%)")

# CONCLUSIE
print("\n" + "=" * 100)
print("📊 CONCLUSIE")
print("=" * 100)

print("\n1. JAREN_BIJDRAGE:")
print(f"   Beide methodes berekenen: {mijn_jaren_bijdrage} jaren bijdrage ✅")

print("\n2. EXTERN RENDEMENT:")
print(f"   Stata gebruikt: SOM van alle ER waarden = {sum_er_vrouw:.6f} (vrouwen), {sum_er_man:.6f} (mannen)")
print(f"   Mijn methode: Gewogen gemiddelde = {er_gem_gewogen:.6f}")

print("\n3. VERSCHIL:")
if abs(n_totaal_stata - n_werkend_totaal_mijn) < 1.0:
    print("   Cohort 3 berekening is CORRECT! ✅")
    print("   Het verschil van +2,902 personen moet ergens anders vandaan komen.")
else:
    print(f"   Cohort 3 heeft een verschil van {n_totaal_stata - n_werkend_totaal_mijn:,.2f} personen")
    print("   Dit kan bijdragen aan het totale verschil van +2,902 personen")

print("\n" + "=" * 100)
print("✅ TRACE VOLTOOID")
print("=" * 100)
