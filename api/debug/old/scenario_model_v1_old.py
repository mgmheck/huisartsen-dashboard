"""
Scenario Model API voor Capaciteitsplan Huisartsen
Gebaseerd op officiële Stata scripts en gevalideerde Python forecasting code

Auteur: Claude + Maurice Heck
Datum: 2025-10-24
Databron: 2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Laad CSV data bij startup
DATA_PATH = Path('/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv')
df = pd.read_csv(DATA_PATH, delimiter=';', decimal=',')

def get_value(variabele_naam, kolom='raming_2025'):
    """Haal een specifieke parameterwaarde op uit de dataset"""
    row = df[df['Variabele'] == variabele_naam]
    if len(row) > 0:
        return row[kolom].values[0]
    return None


def interpolate_uitstroom(jaren_verschil, uitstroom_5, uitstroom_10, uitstroom_15, uitstroom_20):
    """
    Lineaire interpolatie van uitstroom tussen 5-jaars meetpunten
    Gebaseerd op Stata script: Beschikbaar aanbod_3.2.do, lijn 60-78
    """
    if jaren_verschil == 0:
        return 0
    elif jaren_verschil <= 5:
        # Lineaire interpolatie tussen 0 en 5 jaar
        return uitstroom_5 * (jaren_verschil / 5)
    elif jaren_verschil <= 10:
        # Interpolatie tussen 5 en 10 jaar
        return uitstroom_5 + (uitstroom_10 - uitstroom_5) * ((jaren_verschil - 5) / 5)
    elif jaren_verschil <= 15:
        # Interpolatie tussen 10 en 15 jaar
        return uitstroom_10 + (uitstroom_15 - uitstroom_10) * ((jaren_verschil - 10) / 5)
    elif jaren_verschil <= 20:
        # Interpolatie tussen 15 en 20 jaar
        return uitstroom_15 + (uitstroom_20 - uitstroom_15) * ((jaren_verschil - 15) / 5)
    else:
        # Na 20 jaar: constant
        return uitstroom_20


def interpolate_extern_rendement(jaren_verschil, er_1, er_5, er_10, er_15):
    """
    Lineaire interpolatie van extern rendement tussen meetpunten
    Gebaseerd op Stata script: Beschikbaar aanbod_3.2.do, lijn 129-154
    """
    if jaren_verschil <= 1:
        return er_1
    elif jaren_verschil <= 5:
        # Interpolatie tussen 1 en 5 jaar
        return er_1 + (er_5 - er_1) * ((jaren_verschil - 1) / 4)
    elif jaren_verschil <= 10:
        # Interpolatie tussen 5 en 10 jaar
        return er_5 + (er_10 - er_5) * ((jaren_verschil - 5) / 5)
    elif jaren_verschil <= 15:
        # Interpolatie tussen 10 en 15 jaar
        return er_10 + (er_15 - er_10) * ((jaren_verschil - 10) / 5)
    else:
        # Na 15 jaar: constant (extrapolatie)
        return er_15 + (er_15 - er_10) * ((jaren_verschil - 15) / 5)


def calculate_gemiddeld_extern_rendement(jaar, basisjaar, opleidingsduur, er_array):
    """
    Bereken gemiddeld extern rendement over alle jaren sinds afstuderen
    Dit is KRITIEK: Stata gebruikt NIET gewoon er_15jaar, maar GEMIDDELDE!

    Gebaseerd op Stata script: lijn 158-176
    """
    jaren_sinds_basis = jaar - basisjaar

    if jaren_sinds_basis <= opleidingsduur:
        # Nog in opleiding of net afgestudeerd
        return 1.0

    # Aantal jaren werkzaam = jaren sinds basis - opleidingsduur
    jaren_werkzaam = jaren_sinds_basis - opleidingsduur

    # Gemiddelde van extern rendement van jaar 1 tot jaar X
    if jaren_werkzaam <= len(er_array):
        return np.mean(er_array[:int(jaren_werkzaam)])
    else:
        return np.mean(er_array)


def bereken_beschikbaar_aanbod(scenario_params, jaren=18):
    """
    Bereken beschikbaar aanbod volgens officiële Stata methodologie

    Parameters:
    - scenario_params: dict met scenario parameters
    - jaren: aantal jaren te projecteren (default 18 voor evenwichtsjaar 2043)

    Returns:
    - DataFrame met projectie per jaar
    """

    # Basis parameters (2025)
    basisjaar = 2025
    bijsturingsjaar = 2027
    evenwichtsjaar = 2043

    # Haal parameters uit CSV
    aanbod_basis = get_value('aanbod_personen')
    per_vrouw_basis = get_value('per_vrouw_basis')
    per_man_basis = 1 - per_vrouw_basis

    # FTE factoren
    fte_vrouw_basis = scenario_params.get('fte_vrouw', get_value('fte_vrouw_basis'))
    fte_man_basis = scenario_params.get('fte_man', get_value('fte_man_basis'))

    # Uitstroom parameters
    uitstroom_vrouw_5 = scenario_params.get('uitstroom_vrouw_5j', get_value('uitstroom_vrouw_basis_vijf'))
    uitstroom_vrouw_10 = get_value('uitstroom_vrouw_basis_tien')
    uitstroom_vrouw_15 = get_value('uitstroom_vrouw_basis_vijftien')
    uitstroom_vrouw_20 = get_value('uitstroom_vrouw_basis_twintig')

    uitstroom_man_5 = scenario_params.get('uitstroom_man_5j', get_value('uitstroom_man_basis_vijf'))
    uitstroom_man_10 = get_value('uitstroom_man_basis_tien')
    uitstroom_man_15 = get_value('uitstroom_man_basis_vijftien')
    uitstroom_man_20 = get_value('uitstroom_man_basis_twintig')

    # Opleiding parameters - COHORT 1: Nu in opleiding
    n_inopl_nu = get_value('n_inopleiding_perjaar')
    per_vrouw_opl = get_value('per_vrouw_opleiding')
    intern_rend = get_value('intern_rendement')
    opleidingsduur = get_value('opleidingsduur')

    # Extern rendement arrays voor interpolatie
    er_vrouw_1 = get_value('extern_rendement_vrouw_1jaar')
    er_vrouw_5 = get_value('extern_rendement_vrouw_5jaar')
    er_vrouw_10 = get_value('extern_rendement_vrouw_10jaar')
    er_vrouw_15 = scenario_params.get('extern_rendement_vrouw', get_value('extern_rendement_vrouw_15jaar'))

    er_man_1 = get_value('extern_rendement_man_1jaar')
    er_man_5 = get_value('extern_rendement_man_5jaar')
    er_man_10 = get_value('extern_rendement_man_10jaar')
    er_man_15 = scenario_params.get('extern_rendement_man', get_value('extern_rendement_man_15jaar'))

    # COHORT 2: Tussen nu en bijsturingsjaar
    n_inopl_tussen = scenario_params.get('instroom_tussen', get_value('n_inopleiding_perjaar2'))
    per_vrouw_opl2 = get_value('per_vrouw_opleiding2')
    intern_rend2 = get_value('intern_rendement2')
    opleidingsduur2 = get_value('opleidingsduur2')

    # COHORT 3: Na bijsturingsjaar (dit is de aanpasbare instroom)
    n_inopl_nabijst = scenario_params.get('instroom', get_value('n_inopleiding_perjaar3'))
    per_vrouw_opl3 = get_value('per_vrouw_opleiding3')
    intern_rend3 = get_value('intern_rendement3')
    opleidingsduur3 = get_value('opleidingsduur3')

    # Buitenland instroom
    n_buitenland = get_value('n_buitenland')
    per_vrouw_buitenland = get_value('per_vrouw_buitenland')
    rendement_buitenland = get_value('rendement_buitenland') or 0

    # Initialisatie
    projectie = []

    for jaar_offset in range(0, jaren + 1):
        huidigjaar = basisjaar + jaar_offset

        # ========== STAP 1: HUIDIGE GROEP WERKZAME PERSONEN ==========
        # Interpoleer uitstroom voor vrouwen en mannen
        uitstroom_vrouw_jaar = interpolate_uitstroom(
            jaar_offset, uitstroom_vrouw_5, uitstroom_vrouw_10,
            uitstroom_vrouw_15, uitstroom_vrouw_20
        )
        uitstroom_man_jaar = interpolate_uitstroom(
            jaar_offset, uitstroom_man_5, uitstroom_man_10,
            uitstroom_man_15, uitstroom_man_20
        )

        # Aantal vrouwen/mannen nog werkzaam uit huidige cohort
        huidig_vrouw = (aanbod_basis * per_vrouw_basis) * (1 - uitstroom_vrouw_jaar)
        huidig_man = (aanbod_basis * per_man_basis) * (1 - uitstroom_man_jaar)

        # ========== STAP 2: COHORT 1 - Nu in opleiding ==========
        # Bereken extern rendement (gemiddeld over jaren werkzaam)
        er_vrouw_jaar = interpolate_extern_rendement(jaar_offset, er_vrouw_1, er_vrouw_5, er_vrouw_10, er_vrouw_15)
        er_man_jaar = interpolate_extern_rendement(jaar_offset, er_man_1, er_man_5, er_man_10, er_man_15)

        # Aantal jaren dat dit cohort bijdraagt
        if jaar_offset <= opleidingsduur:
            jaren_bijdrage_cohort1 = jaar_offset
        else:
            jaren_bijdrage_cohort1 = opleidingsduur

        n_vrouw_uit_nuopl = (n_inopl_nu * per_vrouw_opl * intern_rend *
                             jaren_bijdrage_cohort1 * er_vrouw_jaar)
        n_man_uit_nuopl = (n_inopl_nu * (1 - per_vrouw_opl) * intern_rend *
                           jaren_bijdrage_cohort1 * er_man_jaar)

        # ========== STAP 3: COHORT 2 - Tussen nu en bijsturingsjaar ==========
        jaren_tot_bijsturing = bijsturingsjaar - basisjaar  # 2 jaar

        if jaar_offset <= opleidingsduur2:
            jaren_bijdrage_cohort2 = 0
        elif jaar_offset <= (opleidingsduur2 + jaren_tot_bijsturing):
            jaren_bijdrage_cohort2 = jaar_offset - opleidingsduur2
        else:
            jaren_bijdrage_cohort2 = jaren_tot_bijsturing

        n_vrouw_uit_tussopl = (n_inopl_tussen * per_vrouw_opl2 * intern_rend2 *
                               jaren_bijdrage_cohort2 * er_vrouw_jaar)
        n_man_uit_tussopl = (n_inopl_tussen * (1 - per_vrouw_opl2) * intern_rend2 *
                             jaren_bijdrage_cohort2 * er_man_jaar)

        # ========== STAP 4: COHORT 3 - Na bijsturingsjaar (SCENARIO PARAMETER) ==========
        start_cohort3 = opleidingsduur3 + jaren_tot_bijsturing

        if jaar_offset < start_cohort3:
            jaren_bijdrage_cohort3 = 0
        else:
            jaren_bijdrage_cohort3 = jaar_offset - start_cohort3

        n_vrouw_nabijst = (n_inopl_nabijst * per_vrouw_opl3 * intern_rend3 *
                           jaren_bijdrage_cohort3 * er_vrouw_jaar)
        n_man_nabijst = (n_inopl_nabijst * (1 - per_vrouw_opl3) * intern_rend3 *
                         jaren_bijdrage_cohort3 * er_man_jaar)

        # ========== STAP 5: BUITENLAND ==========
        n_vrouw_buitenland = (n_buitenland * per_vrouw_buitenland *
                              jaar_offset * rendement_buitenland) if n_buitenland else 0
        n_man_buitenland = (n_buitenland * (1 - per_vrouw_buitenland) *
                            jaar_offset * rendement_buitenland) if n_buitenland else 0

        # ========== STAP 6: TOTAAL BESCHIKBAAR AANBOD ==========
        n_vrouwen = (huidig_vrouw + n_vrouw_uit_nuopl + n_vrouw_uit_tussopl +
                     n_vrouw_nabijst + n_vrouw_buitenland)
        n_mannen = (huidig_man + n_man_uit_nuopl + n_man_uit_tussopl +
                    n_man_nabijst + n_man_buitenland)
        n_totaal = n_vrouwen + n_mannen

        # Bereken FTE
        fte_vrouwen = n_vrouwen * fte_vrouw_basis
        fte_mannen = n_mannen * fte_man_basis
        fte_totaal = fte_vrouwen + fte_mannen

        # Opslaan
        projectie.append({
            'jaar': huidigjaar,
            'aanbod_personen': round(n_totaal),
            'aanbod_fte': round(fte_totaal),
            'vrouwen': round(n_vrouwen),
            'mannen': round(n_mannen),
            'fte_vrouwen': round(fte_vrouwen),
            'fte_mannen': round(fte_mannen),
            'huidig_cohort': round(huidig_vrouw + huidig_man),
            'cohort1_nuopl': round(n_vrouw_uit_nuopl + n_man_uit_nuopl),
            'cohort2_tussen': round(n_vrouw_uit_tussopl + n_man_uit_tussopl),
            'cohort3_nabijst': round(n_vrouw_nabijst + n_man_nabijst),
            'buitenland': round(n_vrouw_buitenland + n_man_buitenland),
        })

    return pd.DataFrame(projectie)


def bereken_benodigd_aanbod(scenario_params, jaren=18):
    """
    Bereken benodigd aanbod (zorgvraag) volgens Stata methodologie
    Gebaseerd op: Benodigd aanbod_3.2.do
    """

    basisjaar = 2025
    trendjaar = 2035

    # Haal zorgvraag parameters op
    onv_vraag = get_value('onv_vraag_midden')

    # Demografie
    demo_5 = get_value('demo_5_midden')
    demo_10 = get_value('demo_10_midden')
    demo_15 = get_value('demo_15_midden')
    demo_20 = get_value('demo_20_midden')

    # Niet-demografische parameters
    epi = get_value('epi_midden')
    sociaal = get_value('sociaal_midden')
    vakinh = get_value('vakinh_midden')
    effic = get_value('effic_midden')
    horsub = get_value('horsub_midden')
    vertsub = get_value('vertsub_midden')
    atv = get_value('atv_midden')

    # Start FTE (uit aanbod berekening)
    fte_basis = get_value('aanbod_personen') * (
        get_value('per_vrouw_basis') * get_value('fte_vrouw_basis') +
        (1 - get_value('per_vrouw_basis')) * get_value('fte_man_basis')
    )

    projectie = []

    for jaar_offset in range(0, jaren + 1):
        huidigjaar = basisjaar + jaar_offset

        # Interpoleer demografie
        demo_jaar = interpolate_uitstroom(jaar_offset, demo_5, demo_10, demo_15, demo_20)

        # Trend_t: tot trendjaar, daarna constant
        if (huidigjaar - basisjaar) < (trendjaar - basisjaar):
            trend_t = huidigjaar - basisjaar
        else:
            trend_t = trendjaar - basisjaar

        # SCENARIO 6: Additief model (gebruikt in huidige capaciteitsplannen)
        # Formule uit Stata lijn 420-424
        niet_demo_groei = (
            (1 + vertsub * trend_t) +
            (1 / (1 - atv * trend_t)) +
            ((epi + sociaal + vakinh + effic + horsub) * trend_t)
        ) - 1

        # Totale groei (multiplicatief)
        scen6_groei = niet_demo_groei * (1 + demo_jaar) * (1 + onv_vraag)

        # Benodigd FTE
        benodigd_fte = fte_basis * (1 + scen6_groei)

        projectie.append({
            'jaar': huidigjaar,
            'benodigd_fte': round(benodigd_fte),
            'demo_groei': round(demo_jaar * 100, 2),
            'niet_demo_groei': round(niet_demo_groei * 100, 2),
            'totale_groei': round(scen6_groei * 100, 2),
        })

    return pd.DataFrame(projectie)


@app.route('/api/scenario', methods=['POST'])
def calculate_scenario():
    """
    API endpoint voor scenario berekeningen

    Request body:
    {
        "instroom": 800,  # n_inopleiding_perjaar3 (na bijsturingsjaar)
        "fte_vrouw": 0.75,
        "fte_man": 0.85,
        "extern_rendement_vrouw": 0.90,
        "extern_rendement_man": 0.92,
        "uitstroom_vrouw_5j": 0.10,
        "uitstroom_man_5j": 0.20
    }

    Response:
    {
        "aanbod": [...],
        "vraag": [...],
        "gap": [...]
    }
    """
    try:
        scenario_params = request.json

        # Bereken aanbod en vraag
        df_aanbod = bereken_beschikbaar_aanbod(scenario_params)
        df_vraag = bereken_benodigd_aanbod(scenario_params)

        # Merge en bereken gap
        df_combined = pd.merge(df_aanbod, df_vraag, on='jaar')
        df_combined['gap_fte'] = df_combined['benodigd_fte'] - df_combined['aanbod_fte']
        df_combined['gap_percentage'] = (df_combined['gap_fte'] / df_combined['aanbod_fte'] * 100).round(1)

        # Convert to JSON
        result = {
            'projectie': df_combined.to_dict(orient='records'),
            'summary': {
                'evenwichtsjaar_2043': {
                    'aanbod_fte': int(df_combined[df_combined['jaar'] == 2043]['aanbod_fte'].values[0]),
                    'vraag_fte': int(df_combined[df_combined['jaar'] == 2043]['benodigd_fte'].values[0]),
                    'gap_fte': int(df_combined[df_combined['jaar'] == 2043]['gap_fte'].values[0]),
                    'gap_pct': float(df_combined[df_combined['jaar'] == 2043]['gap_percentage'].values[0]),
                }
            }
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/baseline', methods=['GET'])
def get_baseline():
    """
    Haal baseline projectie op (huidig beleid, geen scenario aanpassingen)
    """
    try:
        # Lege scenario params = gebruik defaults uit CSV
        df_aanbod = bereken_beschikbaar_aanbod({})
        df_vraag = bereken_benodigd_aanbod({})

        df_combined = pd.merge(df_aanbod, df_vraag, on='jaar')
        df_combined['gap_fte'] = df_combined['benodigd_fte'] - df_combined['aanbod_fte']
        df_combined['gap_percentage'] = (df_combined['gap_fte'] / df_combined['aanbod_fte'] * 100).round(1)

        return jsonify({
            'projectie': df_combined.to_dict(orient='records')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'data_loaded': len(df) > 0})


if __name__ == '__main__':
    print("=" * 80)
    print("🚀 Scenario Model API Server Starting...")
    print("=" * 80)
    print(f"📊 Data loaded: {len(df)} rows")
    print(f"📁 Data source: {DATA_PATH}")
    print(f"🌐 API endpoint: http://localhost:5001/api/scenario")
    print(f"🔍 Baseline endpoint: http://localhost:5001/api/baseline")
    print(f"💚 Health check: http://localhost:5001/health")
    print("=" * 80)

    app.run(debug=True, host='0.0.0.0', port=5001)
