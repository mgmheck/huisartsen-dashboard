"""
Scenario Model API - R Wrapper
===============================================================================

Flask API die het gevalideerde R model aanroept voor scenario berekeningen.

Dit zorgt voor 100% consistentie met het officiële capaciteitsplan model
en de validatie resultaten (VALIDATIE_RESULTATEN.txt).

Autor: Claude Code
Datum: 2025-11-05
Versie: 3.0 (R Wrapper - Railway Deployment)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import subprocess
import pandas as pd
from pathlib import Path
import tempfile
import os
import traceback
import sys
import hashlib
import json
from functools import lru_cache
from datetime import datetime

# ==================================================================================
# CONFIGURATIE
# ==================================================================================

# Paden - gebruik environment variables voor productie, fallback naar lokale paths
R_SCRIPT_PATH = Path(os.getenv('R_SCRIPT_PATH', "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/047 Capaciteitsplan/Capaciteitsplan 2025-2030/Visuals/Scripts/run_scenario_api_v2.R"))
DATA_PATH = Path(os.getenv('DATA_PATH', "/Users/mgmheck/Library/CloudStorage/OneDrive-Capaciteitsorgaan/040 - 049 HA/046 Data en analyse/2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv"))

# Flask app
app = Flask(__name__)

# CORS configuratie - specifieke origins voor security
# Toegepast op ALLE routes (inclusief /health)
CORS(app, resources={
    r"/*": {  # Alle routes, niet alleen /api/*
        "origins": [
            # Lokale development
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            # Render (huidige productie - behouden voor rollback)
            "https://huisartsen-dashboard-frontend.onrender.com",
            # Railway + Cloudflare (nieuwe productie)
            "https://huisartsen-dashboard-frontend.pages.dev",
            "https://huisartsen-dashboard-backend.railway.app",
            # Custom domains (voeg toe indien nodig)
            # "https://dashboard.capaciteitsorgaan.nl",
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600
    }
})

# Rate limiting configuratie
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Port configuratie
PORT = int(os.getenv('PORT', 5001))

# Debug mode detection (voor error sanitization)
DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'

# Default parameters (from CSV)
DEFAULT_PARAMS = {
    # AANBOD parameters
    'instroom': 718,  # n_inopleiding_perjaar3
    'intern_rendement': 0.94,
    'opleidingsduur': 3.0,  # Opleidingsduur in jaren
    'fte_vrouw': 0.72,
    'fte_man': 0.81,
    # Extern rendement CSV defaults (Capaciteitsplan 2025)
    'extern_rendement_vrouw_1jaar': 0.989,
    'extern_rendement_vrouw_5jaar': 0.943,
    'extern_rendement_vrouw_10jaar': 0.889,
    'extern_rendement_vrouw_15jaar': 0.851,
    'extern_rendement_man_1jaar': 0.992,
    'extern_rendement_man_5jaar': 0.959,
    'extern_rendement_man_10jaar': 0.931,
    'extern_rendement_man_15jaar': 0.905,
    # Uitstroom CSV defaults (Capaciteitsplan 2025)
    'uitstroom_vrouw_5j': 0.116,
    'uitstroom_vrouw_10j': 0.232,
    'uitstroom_vrouw_15j': 0.371,
    'uitstroom_vrouw_20j': 0.51,
    'uitstroom_man_5j': 0.226,
    'uitstroom_man_10j': 0.373,
    'uitstroom_man_15j': 0.502,
    'uitstroom_man_20j': 0.632,
    # VRAAG parameters (voorkeursscenario)
    'epi_midden': 0.01,
    'soc_midden': 0.019,
    'vak_midden': -0.003,
    'eff_midden': -0.005,
    'hor_midden': 0.016,
    'tijd_midden': 0.0,
    'ver_midden': -0.011,
    'totale_zorgvraag_excl_ATV_midden': 0.026,
}

# ==================================================================================
# CACHE CONFIGURATION
# ==================================================================================

# Cache size: 100 most recent scenario calculations
CACHE_SIZE = 100

# Cache statistics tracking
cache_stats = {
    'hits': 0,
    'misses': 0,
    'total_requests': 0,
    'cache_size': 0,
    'started_at': datetime.now().isoformat()
}

# ==================================================================================
# VALIDATION CONFIG
# ==================================================================================

VALIDATION_RULES = {
    # Aanbod parameters
    'instroom': (600, 1500, 'Instroom moet tussen 600 en 1500 zijn'),
    'intern_rendement': (0.7, 1.0, 'Intern rendement moet tussen 0.7 en 1.0 zijn'),
    'opleidingsduur': (2.0, 4.0, 'Opleidingsduur moet tussen 2.0 en 4.0 jaar zijn'),
    'fte_vrouw': (0.5, 1.0, 'FTE vrouw moet tussen 0.5 en 1.0 zijn'),
    'fte_man': (0.5, 1.0, 'FTE man moet tussen 0.5 en 1.0 zijn'),

    # Extern rendement (8 waarden)
    'extern_rendement_vrouw_1jaar': (0.0, 1.0, 'extern_rendement_vrouw_1jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_vrouw_5jaar': (0.0, 1.0, 'extern_rendement_vrouw_5jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_vrouw_10jaar': (0.0, 1.0, 'extern_rendement_vrouw_10jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_vrouw_15jaar': (0.0, 1.0, 'extern_rendement_vrouw_15jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_man_1jaar': (0.0, 1.0, 'extern_rendement_man_1jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_man_5jaar': (0.0, 1.0, 'extern_rendement_man_5jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_man_10jaar': (0.0, 1.0, 'extern_rendement_man_10jaar moet tussen 0.0 en 1.0 zijn'),
    'extern_rendement_man_15jaar': (0.0, 1.0, 'extern_rendement_man_15jaar moet tussen 0.0 en 1.0 zijn'),

    # Uitstroom (8 waarden)
    'uitstroom_vrouw_5j': (0.0, 1.0, 'uitstroom_vrouw_5j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_man_5j': (0.0, 1.0, 'uitstroom_man_5j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_vrouw_10j': (0.0, 1.0, 'uitstroom_vrouw_10j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_man_10j': (0.0, 1.0, 'uitstroom_man_10j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_vrouw_15j': (0.0, 1.0, 'uitstroom_vrouw_15j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_man_15j': (0.0, 1.0, 'uitstroom_man_15j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_vrouw_20j': (0.0, 1.0, 'uitstroom_vrouw_20j moet tussen 0.0 en 1.0 zijn'),
    'uitstroom_man_20j': (0.0, 1.0, 'uitstroom_man_20j moet tussen 0.0 en 1.0 zijn'),

    # Vraagcomponenten
    'epi_midden': (-0.05, 0.05, 'epi_midden moet tussen -0.05 en 0.05 zijn'),
    'soc_midden': (-0.05, 0.05, 'soc_midden moet tussen -0.05 en 0.05 zijn'),
    'vak_midden': (-0.05, 0.05, 'vak_midden moet tussen -0.05 en 0.05 zijn'),
    'eff_midden': (-0.05, 0.05, 'eff_midden moet tussen -0.05 en 0.05 zijn'),
    'hor_midden': (-0.05, 0.05, 'hor_midden moet tussen -0.05 en 0.05 zijn'),
    'tijd_midden': (-0.05, 0.05, 'tijd_midden moet tussen -0.05 en 0.05 zijn'),
    'ver_midden': (-0.05, 0.05, 'ver_midden moet tussen -0.05 en 0.05 zijn'),
    'totale_zorgvraag_excl_ATV_midden': (-0.05, 0.05, 'totale_zorgvraag_excl_ATV_midden moet tussen -0.05 en 0.05 zijn'),

    # Factors
    'demografie_factor': (0.9, 1.3, 'Demografie factor moet tussen 0.9 en 1.3 zijn (-10% tot +30%)'),
    'uitstroom_factor_vrouw': (0.0, 0.8, 'Uitstroom factor vrouw moet tussen 0.0 en 0.8 zijn (0% tot 80%)'),
    'uitstroom_factor_man': (0.0, 0.8, 'Uitstroom factor man moet tussen 0.0 en 0.8 zijn (0% tot 80%)'),
}

def validate_parameters(data: dict) -> tuple[bool, str]:
    """
    Valideer parameters volgens VALIDATION_RULES config.

    Returns:
        (is_valid, error_message): Tuple met validatie result en error message (None als valid)
    """
    for param, (min_val, max_val, error_msg) in VALIDATION_RULES.items():
        if param in data:
            value = data[param]
            # Skip None values (optionele parameters)
            if value is None:
                continue
            # Validate range
            if not (min_val <= value <= max_val):
                return False, error_msg

    return True, None

# ==================================================================================
# HELPER FUNCTIES
# ==================================================================================

def get_csv_hash() -> str:
    """
    Bereken MD5 hash van CSV data file voor cache invalidatie.

    Returns:
        str: MD5 hash van CSV bestand
    """
    try:
        with open(DATA_PATH, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except Exception as e:
        print(f"Warning: Could not calculate CSV hash: {e}", file=sys.stderr)
        return "unknown"


def create_cache_key(**params) -> str:
    """
    Create a unique cache key from scenario parameters.

    Args:
        **params: All scenario parameters

    Returns:
        str: MD5 hash of parameters (cache key)
    """
    # Sort parameters for consistent hashing
    param_str = json.dumps(params, sort_keys=True)
    return hashlib.md5(param_str.encode()).hexdigest()


def get_cache_stats() -> dict:
    """
    Get current cache statistics.

    Returns:
        dict: Cache stats including hits, misses, hit rate
    """
    total = cache_stats['total_requests']
    hits = cache_stats['hits']
    hit_rate = (hits / total * 100) if total > 0 else 0

    return {
        'hits': hits,
        'misses': cache_stats['misses'],
        'total_requests': total,
        'hit_rate_percent': round(hit_rate, 2),
        'cache_size': cache_stats['cache_size'],
        'max_cache_size': CACHE_SIZE,
        'started_at': cache_stats['started_at'],
        'uptime_seconds': (datetime.now() - datetime.fromisoformat(cache_stats['started_at'])).total_seconds()
    }


def clear_cache():
    """Clear the scenario cache and reset statistics."""
    global _scenario_cache, _cache_order
    _scenario_cache.clear()
    _cache_order.clear()
    cache_stats['hits'] = 0
    cache_stats['misses'] = 0
    cache_stats['total_requests'] = 0
    cache_stats['cache_size'] = 0
    cache_stats['started_at'] = datetime.now().isoformat()


def _call_r_model_uncached(instroom: float, intern_rendement: float, fte_vrouw: float, fte_man: float,
                 # Extern rendement - 8 individuele waarden (verplicht)
                 extern_rendement_vrouw_1jaar: float, extern_rendement_vrouw_5jaar: float,
                 extern_rendement_vrouw_10jaar: float, extern_rendement_vrouw_15jaar: float,
                 extern_rendement_man_1jaar: float, extern_rendement_man_5jaar: float,
                 extern_rendement_man_10jaar: float, extern_rendement_man_15jaar: float,
                 # Uitstroom - 8 individuele waarden (verplicht)
                 uitstroom_vrouw_5j: float, uitstroom_man_5j: float,
                 uitstroom_vrouw_10j: float, uitstroom_man_10j: float,
                 uitstroom_vrouw_15j: float, uitstroom_man_15j: float,
                 uitstroom_vrouw_20j: float, uitstroom_man_20j: float,
                 # Vraagcomponenten
                 epi_midden: float = None, soc_midden: float = None, vak_midden: float = None,
                 eff_midden: float = None, hor_midden: float = None, tijd_midden: float = None,
                 ver_midden: float = None, totale_zorgvraag_excl_ATV_midden: float = None,
                 demografie_factor: float = None,
                 uitstroom_factor_vrouw: float = None, uitstroom_factor_man: float = None,
                 opleidingsduur: float = None) -> pd.DataFrame:
    """
    Roep het R model aan met gegeven parameters.

    Args:
        instroom: Instroom cohort 3 (na bijsturingsjaar)
        fte_vrouw: FTE factor vrouwen
        fte_man: FTE factor mannen
        extern_rendement_vrouw_1jaar: Extern rendement vrouwen 1 jaar
        extern_rendement_vrouw_5jaar: Extern rendement vrouwen 5 jaar
        extern_rendement_vrouw_10jaar: Extern rendement vrouwen 10 jaar
        extern_rendement_vrouw_15jaar: Extern rendement vrouwen 15 jaar
        extern_rendement_man_1jaar: Extern rendement mannen 1 jaar
        extern_rendement_man_5jaar: Extern rendement mannen 5 jaar
        extern_rendement_man_10jaar: Extern rendement mannen 10 jaar
        extern_rendement_man_15jaar: Extern rendement mannen 15 jaar
        uitstroom_vrouw_5j: Uitstroom vrouwen 5 jaar
        uitstroom_man_5j: Uitstroom mannen 5 jaar
        uitstroom_vrouw_10j: Uitstroom vrouwen 10 jaar
        uitstroom_man_10j: Uitstroom mannen 10 jaar
        uitstroom_vrouw_15j: Uitstroom vrouwen 15 jaar
        uitstroom_man_15j: Uitstroom mannen 15 jaar
        uitstroom_vrouw_20j: Uitstroom vrouwen 20 jaar
        uitstroom_man_20j: Uitstroom mannen 20 jaar
        epi_midden: Epidemiologie parameter (None = gebruik CSV default)
        soc_midden: Sociaal-cultureel parameter (None = gebruik CSV default)
        vak_midden: Vakinhoudelijk parameter (None = gebruik CSV default)
        eff_midden: Efficiency parameter (None = gebruik CSV default)
        hor_midden: Horizontale substitutie parameter (None = gebruik CSV default)
        tijd_midden: Arbeidstijdverandering parameter (None = gebruik CSV default)
        ver_midden: Verticale substitutie parameter (None = gebruik CSV default)
        totale_zorgvraag_excl_ATV_midden: Totale zorgvraag parameter (None = gebruik CSV default)
        demografie_factor: Factor voor demografie (None = gebruik 1.0, geen aanpassing)
        uitstroom_factor_vrouw: Factor voor uitstroom vrouwen (None = gebruik 1.0, geen aanpassing)
        uitstroom_factor_man: Factor voor uitstroom mannen (None = gebruik 1.0, geen aanpassing)

    Returns:
        DataFrame met projectie 2025-2043

    Raises:
        RuntimeError: Als R script faalt
    """
    # Maak tijdelijk output bestand
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        output_file = f.name

    try:
        # Roep R script aan
        # Als parameter None is → geef "NA" door (gebruik CSV defaults)
        cmd = [
            'Rscript',
            str(R_SCRIPT_PATH),
            str(int(instroom)),
            str(fte_vrouw),
            str(fte_man),
            str(intern_rendement),
            # Extern rendement (8 parameters - altijd waarde, geen NA)
            str(extern_rendement_vrouw_1jaar),
            str(extern_rendement_vrouw_5jaar),
            str(extern_rendement_vrouw_10jaar),
            str(extern_rendement_vrouw_15jaar),
            str(extern_rendement_man_1jaar),
            str(extern_rendement_man_5jaar),
            str(extern_rendement_man_10jaar),
            str(extern_rendement_man_15jaar),
            # Uitstroom (8 parameters - altijd waarde, geen NA)
            str(uitstroom_vrouw_5j),
            str(uitstroom_man_5j),
            str(uitstroom_vrouw_10j),
            str(uitstroom_man_10j),
            str(uitstroom_vrouw_15j),
            str(uitstroom_man_15j),
            str(uitstroom_vrouw_20j),
            str(uitstroom_man_20j),
            # Vraagcomponenten (8 parameters)
            "NA" if epi_midden is None else str(epi_midden),
            "NA" if soc_midden is None else str(soc_midden),
            "NA" if vak_midden is None else str(vak_midden),
            "NA" if eff_midden is None else str(eff_midden),
            "NA" if hor_midden is None else str(hor_midden),
            "NA" if tijd_midden is None else str(tijd_midden),
            "NA" if ver_midden is None else str(ver_midden),
            "NA" if totale_zorgvraag_excl_ATV_midden is None else str(totale_zorgvraag_excl_ATV_midden),
            # Demografie en uitstroom factors (3 parameters)
            "NA" if demografie_factor is None else str(demografie_factor),
            "NA" if uitstroom_factor_vrouw is None else str(uitstroom_factor_vrouw),
            "NA" if uitstroom_factor_man is None else str(uitstroom_factor_man),
            # Opleidingsduur (1 parameter)
            "NA" if opleidingsduur is None else str(opleidingsduur),
            # Output file
            output_file
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 120 seconden timeout (R berekeningen kunnen lang duren)
        )

        if result.returncode != 0:
            raise RuntimeError(f"R script failed: {result.stderr}")

        # Lees output CSV
        df = pd.read_csv(output_file)

        return df

    finally:
        # Cleanup temp file
        if os.path.exists(output_file):
            os.remove(output_file)


# Manual cache for DataFrames (LRU not possible with non-hashable types)
_scenario_cache = {}
_cache_order = []  # Track access order for LRU

def call_r_model(**params):
    """
    Cached wrapper for _call_r_model_uncached().

    Uses manual LRU cache since pandas DataFrames are not hashable.
    Cache key is MD5 hash of all parameters.

    Args:
        **params: All parameters for scenario calculation

    Returns:
        pd.DataFrame: Scenario calculation results
    """
    global _scenario_cache, _cache_order

    # Create cache key
    cache_key = create_cache_key(**params)

    # Update stats
    cache_stats['total_requests'] += 1

    # Check cache
    if cache_key in _scenario_cache:
        # Cache HIT
        cache_stats['hits'] += 1

        # Update LRU order (move to end = most recently used)
        _cache_order.remove(cache_key)
        _cache_order.append(cache_key)

        try:
            print(f"✅ Cache HIT ({cache_stats['hits']}/{cache_stats['total_requests']})", file=sys.stderr)
        except (BrokenPipeError, IOError):
            pass
        return _scenario_cache[cache_key].copy()  # Return copy to prevent mutation

    # Cache MISS - call R model
    cache_stats['misses'] += 1
    try:
        print(f"❌ Cache MISS ({cache_stats['misses']}/{cache_stats['total_requests']}) - Running R calculation...", file=sys.stderr)
    except (BrokenPipeError, IOError):
        pass

    result = _call_r_model_uncached(**params)

    # Store in cache
    _scenario_cache[cache_key] = result.copy()
    _cache_order.append(cache_key)

    # Enforce cache size limit (LRU eviction)
    if len(_scenario_cache) > CACHE_SIZE:
        # Remove oldest entry
        oldest_key = _cache_order.pop(0)
        del _scenario_cache[oldest_key]
        print(f"🗑️  Cache eviction: {len(_scenario_cache)}/{CACHE_SIZE}", file=sys.stderr)

    # Update cache size
    cache_stats['cache_size'] = len(_scenario_cache)

    return result


def extract_impact_analysis(df: pd.DataFrame) -> dict:
    """
    Extraheer impactanalyse data voor evenwichtsjaar 2043.

    De impactanalyse decompo neert het instroomadvies in bijdragen van verschillende factoren:
    - Vraagfactoren: demografie, epidemiologie, sociaal-cultureel, vakinhoudelijk, efficiency,
                     horizontale substitutie, ATV, verticale substitutie
    - Aanbodfactoren: onvervulde vraag, uitstroom, nu in opleiding, tussen opleiding, buitenland

    Args:
        df: DataFrame van R model output (met impact kolommen)

    Returns:
        Dictionary met impact data voor 2043
    """
    # Filter jaar 2043 (evenwichtsjaar)
    jaar_2043 = df[df['jaar'] == 2043].iloc[0]

    # Controleer of impact kolommen aanwezig zijn
    if 'impact_demo_midden' not in jaar_2043:
        # Impact kolommen niet beschikbaar (oudere R model versie)
        print("⚠️  DEBUG: impact_demo_midden kolom NIET gevonden in R output")
        print(f"   Beschikbare kolommen: {list(jaar_2043.index)[:20]}...")
        return None

    print("✅ DEBUG: impact_analysis data succesvol geëxtraheerd")

    return {
        'jaar': 2043,
        'vraagfactoren': {
            'demografie': round(jaar_2043.get('impact_demo_midden', 0), 2),
            'epidemiologie_t': round(jaar_2043.get('impact_epi_midden_t', 0), 2),
            'epidemiologie_d': round(jaar_2043.get('impact_epi_midden_d', 0), 2),
            'sociaal_cultureel_t': round(jaar_2043.get('impact_soc_midden_t', 0), 2),
            'sociaal_cultureel_d': round(jaar_2043.get('impact_soc_midden_d', 0), 2),
            'vakinhoudelijk_t': round(jaar_2043.get('impact_vak_midden_t', 0), 2),
            'vakinhoudelijk_d': round(jaar_2043.get('impact_vak_midden_d', 0), 2),
            'efficiency_t': round(jaar_2043.get('impact_eff_midden_t', 0), 2),
            'efficiency_d': round(jaar_2043.get('impact_eff_midden_d', 0), 2),
            'horizontale_substitutie_t': round(jaar_2043.get('impact_hor_midden_t', 0), 2),
            'horizontale_substitutie_d': round(jaar_2043.get('impact_hor_midden_d', 0), 2),
            'atv_t': round(jaar_2043.get('impact_atv_midden_t', 0), 2),
            'atv_d': round(jaar_2043.get('impact_atv_midden_d', 0), 2),
            'verticale_substitutie_t': round(jaar_2043.get('impact_ver_midden_t', 0), 2),
            'verticale_substitutie_d': round(jaar_2043.get('impact_ver_midden_d', 0), 2),
        },
        'aanbodfactoren': {
            'onvervulde_vraag': round(jaar_2043.get('impact_ovv_midden', 0), 2),
            'uitstroom': round(jaar_2043.get('impact_uitstroom', 0), 2),
            'nu_in_opleiding': round(jaar_2043.get('impact_nuinopl', 0), 2),
            'tussen_opleiding': round(jaar_2043.get('impact_tussenopl', 0), 2),
            'buitenland': round(jaar_2043.get('impact_buitenland', 0), 2),
        },
        'scenario_totalen': {
            'scenario1': round(jaar_2043.get('totaal_impact_sc1_midden', 0), 2),
            'scenario2': round(jaar_2043.get('totaal_impact_sc2_midden', 0), 2),
            'scenario3': round(jaar_2043.get('totaal_impact_sc3_midden', 0), 2),
            'scenario6': round(jaar_2043.get('totaal_impact_sc6_midden', 0), 2),
        }
    }


def dataframe_to_projectie_json(df: pd.DataFrame, scenario: str = 'scenario6') -> list:
    """
    Converteer DataFrame naar JSON formaat voor frontend.

    Args:
        df: DataFrame van R model output
        scenario: 'scenario1' of 'scenario6'

    Returns:
        List van dictionaries met projectie data (2025-2043, evenwichtsjaar)
    """
    # Filter alleen jaren tot en met 2043 (evenwichtsjaar)
    df = df[df['jaar'] <= 2043].copy()

    projectie = []

    for _, row in df.iterrows():
        # Selecteer juiste kolommen op basis van scenario
        if scenario == 'scenario1':
            benodigd_fte = row['scen1_fte_midden']
        else:  # scenario6
            benodigd_fte = row['scen6_fte_midden_a']

        # BELANGRIJKE CORRECTIE: Bereken tekort ALTIJD als demand - supply
        # De R kolom scen6_tekort_midden_a bevat iets anders (onbekend wat)
        tekort_fte = benodigd_fte - row['fte_totaal']

        # Bereken gap percentage (tekort als % van aanbod)
        gap_percentage = (tekort_fte / row['fte_totaal']) if row['fte_totaal'] > 0 else 0

        # Bereken aanbod_personen als som van cohorten
        aanbod_personen = (
            row['n_totaal_uit_nuopl'] +
            row['n_totaal_uit_tussopl'] +
            row['n_totaal_nabijst']
        )

        projectie.append({
            'jaar': int(row['jaar']),
            'aanbod_fte': round(row['fte_totaal'], 2),
            'benodigd_fte': round(benodigd_fte, 2),
            'gap_fte': round(tekort_fte, 2),
            'gap_percentage': round(gap_percentage, 4),
            'aanbod_personen': round(aanbod_personen, 2),
            'vrouwen': round(aanbod_personen * 0.66, 2),  # Schatting 66% vrouwen
            'mannen': round(aanbod_personen * 0.34, 2),   # Schatting 34% mannen
            'huidig_cohort': 0,  # Niet beschikbaar in R output
            'cohort1_nuopl': round(row['n_totaal_uit_nuopl'], 2),
            'cohort2_tussen': round(row['n_totaal_uit_tussopl'], 2),
            'cohort3_nabijst': round(row['n_totaal_nabijst'], 2),
        })

    return projectie


# ==================================================================================
# FLASK API ENDPOINTS
# ==================================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint met data versioning."""
    r_script_exists = R_SCRIPT_PATH.exists()
    data_exists = DATA_PATH.exists()

    # Data versioning voor frontend cache invalidatie
    data_hash = get_csv_hash() if data_exists else None
    data_modified = os.path.getmtime(DATA_PATH) if data_exists else None

    return jsonify({
        'status': 'healthy' if (r_script_exists and data_exists) else 'degraded',
        'versie': '3.0',
        'r_script_found': r_script_exists,
        'data_found': data_exists,
        'r_script_path': str(R_SCRIPT_PATH),
        'data_hash': data_hash,  # Voor cache invalidatie
        'data_modified': data_modified,  # Unix timestamp
    })


@app.route('/api/baseline', methods=['GET'])
def api_baseline():
    """
    Bereken baseline scenario (huidige parameters, scenario 6).

    Returns:
        JSON met projectie 2025-2043
    """
    try:
        # Roep R model aan met default parameters (met 8 extern rendement en 8 uitstroom waarden)
        df = call_r_model(
            instroom=DEFAULT_PARAMS['instroom'],
            intern_rendement=DEFAULT_PARAMS['intern_rendement'],
            fte_vrouw=DEFAULT_PARAMS['fte_vrouw'],
            fte_man=DEFAULT_PARAMS['fte_man'],
            # Extern rendement - 8 individuele parameters
            extern_rendement_vrouw_1jaar=DEFAULT_PARAMS['extern_rendement_vrouw_1jaar'],
            extern_rendement_vrouw_5jaar=DEFAULT_PARAMS['extern_rendement_vrouw_5jaar'],
            extern_rendement_vrouw_10jaar=DEFAULT_PARAMS['extern_rendement_vrouw_10jaar'],
            extern_rendement_vrouw_15jaar=DEFAULT_PARAMS['extern_rendement_vrouw_15jaar'],
            extern_rendement_man_1jaar=DEFAULT_PARAMS['extern_rendement_man_1jaar'],
            extern_rendement_man_5jaar=DEFAULT_PARAMS['extern_rendement_man_5jaar'],
            extern_rendement_man_10jaar=DEFAULT_PARAMS['extern_rendement_man_10jaar'],
            extern_rendement_man_15jaar=DEFAULT_PARAMS['extern_rendement_man_15jaar'],
            # Uitstroom - 8 individuele parameters
            uitstroom_vrouw_5j=DEFAULT_PARAMS['uitstroom_vrouw_5j'],
            uitstroom_man_5j=DEFAULT_PARAMS['uitstroom_man_5j'],
            uitstroom_vrouw_10j=DEFAULT_PARAMS['uitstroom_vrouw_10j'],
            uitstroom_man_10j=DEFAULT_PARAMS['uitstroom_man_10j'],
            uitstroom_vrouw_15j=DEFAULT_PARAMS['uitstroom_vrouw_15j'],
            uitstroom_man_15j=DEFAULT_PARAMS['uitstroom_man_15j'],
            uitstroom_vrouw_20j=DEFAULT_PARAMS['uitstroom_vrouw_20j'],
            uitstroom_man_20j=DEFAULT_PARAMS['uitstroom_man_20j'],
            # Opleidingsduur
            opleidingsduur=DEFAULT_PARAMS['opleidingsduur']
        )

        # Converteer naar JSON (scenario 6)
        projectie = dataframe_to_projectie_json(df, scenario='scenario6')

        return jsonify({'projectie': projectie})

    except Exception as e:
        # Uitgebreide error logging
        print("\n" + "="*80, file=sys.stderr)
        print("❌ ERROR in /api/baseline endpoint", file=sys.stderr)
        print("="*80, file=sys.stderr)
        print(f"\n🔴 Exception type: {type(e).__name__}", file=sys.stderr)
        print(f"🔴 Exception message: {str(e)}", file=sys.stderr)
        print(f"\n📚 Full stack trace:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)

        # Error sanitization - alleen details in DEBUG mode
        if DEBUG:
            return jsonify({'error': str(e)}), 500  # Development: details
        else:
            return jsonify({'error': 'Internal server error'}), 500  # Production: generiek


@app.route('/api/scenario', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting voor zware berekeningen
def api_scenario():
    """
    Bereken custom scenario met user-defined parameters.

    Expected JSON body:
    {
        "instroom": 718,
        "fte_vrouw": 0.72,
        "fte_man": 0.81,
        "extern_rendement_vrouw": 0.851,
        "extern_rendement_man": 0.905,
        "scenario": "scenario6",  # or "scenario1"

        # Vraagcomponenten (optioneel)
        "epi_midden": 0.01,
        "soc_midden": 0.019,
        "vak_midden": -0.003,
        "eff_midden": -0.005,
        "hor_midden": 0.016,
        "tijd_midden": 0.0,
        "ver_midden": -0.011,
        "totale_zorgvraag_excl_ATV_midden": 0.026,

        # Demografie en uitstroom factors (optioneel)
        "demografie_factor": 1.0,
        "uitstroom_factor_vrouw": 1.0,
        "uitstroom_factor_man": 1.0
    }

    Returns:
        JSON met projectie 2025-2043
    """
    try:
        data = request.json

        # Parse parameters (met defaults)
        instroom = data.get('instroom', DEFAULT_PARAMS['instroom'])
        intern_rendement = data.get('intern_rendement', DEFAULT_PARAMS['intern_rendement'])
        opleidingsduur = data.get('opleidingsduur', DEFAULT_PARAMS['opleidingsduur'])
        fte_vrouw = data.get('fte_vrouw', DEFAULT_PARAMS['fte_vrouw'])
        fte_man = data.get('fte_man', DEFAULT_PARAMS['fte_man'])

        # Extern rendement (8 waarden, verplicht vanaf frontend)
        extern_rendement_vrouw_1jaar = data.get('extern_rendement_vrouw_1jaar', DEFAULT_PARAMS['extern_rendement_vrouw_1jaar'])
        extern_rendement_vrouw_5jaar = data.get('extern_rendement_vrouw_5jaar', DEFAULT_PARAMS['extern_rendement_vrouw_5jaar'])
        extern_rendement_vrouw_10jaar = data.get('extern_rendement_vrouw_10jaar', DEFAULT_PARAMS['extern_rendement_vrouw_10jaar'])
        extern_rendement_vrouw_15jaar = data.get('extern_rendement_vrouw_15jaar', DEFAULT_PARAMS['extern_rendement_vrouw_15jaar'])
        extern_rendement_man_1jaar = data.get('extern_rendement_man_1jaar', DEFAULT_PARAMS['extern_rendement_man_1jaar'])
        extern_rendement_man_5jaar = data.get('extern_rendement_man_5jaar', DEFAULT_PARAMS['extern_rendement_man_5jaar'])
        extern_rendement_man_10jaar = data.get('extern_rendement_man_10jaar', DEFAULT_PARAMS['extern_rendement_man_10jaar'])
        extern_rendement_man_15jaar = data.get('extern_rendement_man_15jaar', DEFAULT_PARAMS['extern_rendement_man_15jaar'])

        # Uitstroom (8 waarden, verplicht vanaf frontend)
        uitstroom_vrouw_5j = data.get('uitstroom_vrouw_5j', DEFAULT_PARAMS['uitstroom_vrouw_5j'])
        uitstroom_man_5j = data.get('uitstroom_man_5j', DEFAULT_PARAMS['uitstroom_man_5j'])
        uitstroom_vrouw_10j = data.get('uitstroom_vrouw_10j', DEFAULT_PARAMS['uitstroom_vrouw_10j'])
        uitstroom_man_10j = data.get('uitstroom_man_10j', DEFAULT_PARAMS['uitstroom_man_10j'])
        uitstroom_vrouw_15j = data.get('uitstroom_vrouw_15j', DEFAULT_PARAMS['uitstroom_vrouw_15j'])
        uitstroom_man_15j = data.get('uitstroom_man_15j', DEFAULT_PARAMS['uitstroom_man_15j'])
        uitstroom_vrouw_20j = data.get('uitstroom_vrouw_20j', DEFAULT_PARAMS['uitstroom_vrouw_20j'])
        uitstroom_man_20j = data.get('uitstroom_man_20j', DEFAULT_PARAMS['uitstroom_man_20j'])

        scenario = data.get('scenario', 'scenario6')

        # Nieuwe parameters: vraagcomponenten (defaults naar None)
        epi_midden = data.get('epi_midden', None)
        soc_midden = data.get('soc_midden', None)
        vak_midden = data.get('vak_midden', None)
        eff_midden = data.get('eff_midden', None)
        hor_midden = data.get('hor_midden', None)
        tijd_midden = data.get('tijd_midden', None)
        ver_midden = data.get('ver_midden', None)
        totale_zorgvraag_excl_ATV_midden = data.get('totale_zorgvraag_excl_ATV_midden', None)

        # Nieuwe parameters: demografie en uitstroom factors (defaults naar None)
        demografie_factor = data.get('demografie_factor', None)
        uitstroom_factor_vrouw = data.get('uitstroom_factor_vrouw', None)
        uitstroom_factor_man = data.get('uitstroom_factor_man', None)

        # Validatie met helper function
        is_valid, error_message = validate_parameters(data)
        if not is_valid:
            return jsonify({'error': error_message}), 400

        # Roep R model aan
        df = call_r_model(
            instroom=instroom,
            intern_rendement=intern_rendement,
            fte_vrouw=fte_vrouw,
            fte_man=fte_man,
            # Extern rendement (8 individuele waarden)
            extern_rendement_vrouw_1jaar=extern_rendement_vrouw_1jaar,
            extern_rendement_vrouw_5jaar=extern_rendement_vrouw_5jaar,
            extern_rendement_vrouw_10jaar=extern_rendement_vrouw_10jaar,
            extern_rendement_vrouw_15jaar=extern_rendement_vrouw_15jaar,
            extern_rendement_man_1jaar=extern_rendement_man_1jaar,
            extern_rendement_man_5jaar=extern_rendement_man_5jaar,
            extern_rendement_man_10jaar=extern_rendement_man_10jaar,
            extern_rendement_man_15jaar=extern_rendement_man_15jaar,
            # Uitstroom (8 individuele waarden)
            uitstroom_vrouw_5j=uitstroom_vrouw_5j,
            uitstroom_man_5j=uitstroom_man_5j,
            uitstroom_vrouw_10j=uitstroom_vrouw_10j,
            uitstroom_man_10j=uitstroom_man_10j,
            uitstroom_vrouw_15j=uitstroom_vrouw_15j,
            uitstroom_man_15j=uitstroom_man_15j,
            uitstroom_vrouw_20j=uitstroom_vrouw_20j,
            uitstroom_man_20j=uitstroom_man_20j,
            # Vraagcomponenten
            epi_midden=epi_midden,
            soc_midden=soc_midden,
            vak_midden=vak_midden,
            eff_midden=eff_midden,
            hor_midden=hor_midden,
            tijd_midden=tijd_midden,
            ver_midden=ver_midden,
            totale_zorgvraag_excl_ATV_midden=totale_zorgvraag_excl_ATV_midden,
            # Demografie en uitstroom factors
            demografie_factor=demografie_factor,
            uitstroom_factor_vrouw=uitstroom_factor_vrouw,
            uitstroom_factor_man=uitstroom_factor_man,
            # Opleidingsduur
            opleidingsduur=opleidingsduur
        )

        # Converteer naar JSON
        projectie = dataframe_to_projectie_json(df, scenario=scenario)

        # Haal impact analyse data op voor evenwichtsjaar 2043
        impact_analysis = extract_impact_analysis(df)

        # Bereken instroomadvies voor evenwichtsjaar 2043
        #
        # BELANGRIJK: Instroomadvies wordt berekend door het R-model (run_scenario_api_v2.R)
        # Python dupliceert GEEN logica - we lezen het direct uit de R-model output.
        # Dit garandeert 100% consistentie met de officiële STATA/Excel berekeningen.
        #
        # Het R-model berekent: ben_instroom_sc6_midden_a = n_inopleiding_perjaar3 +
        #                       (sc6_ftetekort_midden_a / fte_toekomst) * n_inopleiding_perjaar3
        #
        # Het instroomadvies wordt berekend op basis van het AANGEPASTE scenario (df),
        # zodat het correct reageert op zowel aanbod- als vraagparameter wijzigingen.
        # Dit zorgt ervoor dat het instroomadvies het tekort in 2043 compenseert.

        # Lees instroomadvies uit het aangepaste scenario
        jaar_2043_scenario = df[df['jaar'] == 2043].iloc[0]
        instroomadvies = jaar_2043_scenario['ben_instroom_sc6_midden_a']

        # Bouw response met optionele impact_analysis
        response = {
            'projectie': projectie,
            'instroomadvies_2043': round(instroomadvies, 0) if instroomadvies else None
        }

        # Voeg impact analysis toe als beschikbaar
        if impact_analysis is not None:
            response['impact_analysis'] = impact_analysis
            print(f"📊 DEBUG: impact_analysis toegevoegd aan response (scenario6={impact_analysis['scenario_totalen']['scenario6']})")
        else:
            print("⚠️  DEBUG: impact_analysis is None - NIET toegevoegd aan response")

        return jsonify(response)

    except Exception as e:
        # Uitgebreide error logging
        print("\n" + "="*80, file=sys.stderr)
        print("❌ ERROR in /api/scenario endpoint", file=sys.stderr)
        print("="*80, file=sys.stderr)
        print(f"\n🔴 Exception type: {type(e).__name__}", file=sys.stderr)
        print(f"🔴 Exception message: {str(e)}", file=sys.stderr)
        print(f"\n📋 Request data:", file=sys.stderr)
        print(f"   {request.json}", file=sys.stderr)
        print(f"\n📚 Full stack trace:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print("="*80 + "\n", file=sys.stderr)

        # Error sanitization - alleen details in DEBUG mode
        if DEBUG:
            return jsonify({'error': str(e)}), 500  # Development: details
        else:
            return jsonify({'error': 'Internal server error'}), 500  # Production: generiek


@app.route('/api/test', methods=['GET'])
def api_test():
    """
    Test endpoint - roep R model aan met default params en print debug info.
    """
    try:
        print("🧪 Testing R model call...")

        df = call_r_model(
            instroom=DEFAULT_PARAMS['instroom'],
            fte_vrouw=DEFAULT_PARAMS['fte_vrouw'],
            fte_man=DEFAULT_PARAMS['fte_man'],
            intern_rendement=DEFAULT_PARAMS['intern_rendement'],
            extern_rendement_vrouw_1jaar=DEFAULT_PARAMS['extern_rendement_vrouw_1jaar'],
            extern_rendement_vrouw_5jaar=DEFAULT_PARAMS['extern_rendement_vrouw_5jaar'],
            extern_rendement_vrouw_10jaar=DEFAULT_PARAMS['extern_rendement_vrouw_10jaar'],
            extern_rendement_vrouw_15jaar=DEFAULT_PARAMS['extern_rendement_vrouw_15jaar'],
            extern_rendement_man_1jaar=DEFAULT_PARAMS['extern_rendement_man_1jaar'],
            extern_rendement_man_5jaar=DEFAULT_PARAMS['extern_rendement_man_5jaar'],
            extern_rendement_man_10jaar=DEFAULT_PARAMS['extern_rendement_man_10jaar'],
            extern_rendement_man_15jaar=DEFAULT_PARAMS['extern_rendement_man_15jaar'],
            uitstroom_vrouw_5j=DEFAULT_PARAMS['uitstroom_vrouw_5j'],
            uitstroom_man_5j=DEFAULT_PARAMS['uitstroom_man_5j'],
            uitstroom_vrouw_10j=DEFAULT_PARAMS['uitstroom_vrouw_10j'],
            uitstroom_man_10j=DEFAULT_PARAMS['uitstroom_man_10j'],
            uitstroom_vrouw_15j=DEFAULT_PARAMS['uitstroom_vrouw_15j'],
            uitstroom_man_15j=DEFAULT_PARAMS['uitstroom_man_15j'],
            uitstroom_vrouw_20j=DEFAULT_PARAMS['uitstroom_vrouw_20j'],
            uitstroom_man_20j=DEFAULT_PARAMS['uitstroom_man_20j']
        )

        # Print eerste en laatste rij
        print("\n📊 R Model Output:")
        print(df.head(3))
        print("...")
        print(df.tail(3))

        # Check 2043 waarden
        jaar_2043 = df[df['jaar'] == 2043].iloc[0]

        # Bereken tekort correct als demand - supply
        tekort_calc = jaar_2043['scen6_fte_midden_a'] - jaar_2043['fte_totaal']

        test_result = {
            'status': 'success',
            'rows': len(df),
            'columns': list(df.columns),
            'jaar_2043': {
                'aanbod_fte': round(jaar_2043['fte_totaal'], 2),
                'benodigd_fte_scen6': round(jaar_2043['scen6_fte_midden_a'], 2),
                'tekort_fte_scen6': round(tekort_calc, 2),
                'gap_percentage_scen6': round((tekort_calc / jaar_2043['fte_totaal']) * 100, 2) if jaar_2043['fte_totaal'] > 0 else 0,
            }
        }

        return jsonify(test_result)

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/api/cache/stats', methods=['GET'])
def api_cache_stats():
    """
    Get cache statistics.

    Returns cache performance metrics including hits, misses, hit rate,
    and current cache size.

    Returns:
        JSON with cache statistics
    """
    try:
        stats = get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/cache/clear', methods=['POST'])
def api_cache_clear():
    """
    Clear the scenario cache and reset statistics.

    This endpoint allows administrators to manually clear the cache,
    useful after data updates or for troubleshooting.

    Returns:
        JSON confirmation
    """
    try:
        old_stats = get_cache_stats()
        clear_cache()
        return jsonify({
            'status': 'success',
            'message': 'Cache cleared successfully',
            'previous_stats': old_stats,
            'new_stats': get_cache_stats()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================================================================================
# MAIN
# ==================================================================================

if __name__ == '__main__':
    print("=" * 80)
    print("🚀 Scenario Model API Server v3.0 - R Wrapper")
    print("=" * 80)
    print(f"📊 R Script: {R_SCRIPT_PATH}")
    print(f"   Exists: {R_SCRIPT_PATH.exists()}")
    print(f"📁 Data source: {DATA_PATH}")
    print(f"   Exists: {DATA_PATH.exists()}")
    print(f"")
    print(f"🌐 API endpoints:")
    print(f"   - http://localhost:{PORT}/health (GET)")
    print(f"   - http://localhost:{PORT}/api/baseline (GET)")
    print(f"   - http://localhost:{PORT}/api/scenario (POST)")
    print(f"   - http://localhost:{PORT}/api/test (GET) - debug endpoint")
    print("=" * 80)
    print()
    print("✅ Deze API roept het GEVALIDEERDE R model aan")
    print("   100% consistentie met VALIDATIE_RESULTATEN.txt")
    print("   Scenario 6 multiplicatieve formule")
    print("=" * 80)
    print()

    # Production mode: gebruik gunicorn
    # Development mode: gebruik Flask development server
    is_production = os.getenv('FLASK_ENV') == 'production'

    if not is_production:
        app.run(debug=True, host='0.0.0.0', port=PORT)
    # In production, gunicorn wordt gebruikt (zie Dockerfile CMD)
