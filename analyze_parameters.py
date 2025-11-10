#!/usr/bin/env python3
"""
Analyseert de parameterwaarden en berekent relatieve stijging (%) en absolute stijging (procentpunten)
voor de jaren 2019, 2022 en 2025 ten opzichte van het basisjaar 2019.
"""

import pandas as pd
import numpy as np

# Lees het CSV bestand
df = pd.read_csv('public/data/parameterwaarden.csv', sep=';', encoding='utf-8-sig')

# Converteer komma's naar punten voor numerieke kolommen
numeric_columns = ['raming_2010', 'raming_2013', 'raming_2016', 'raming_2019_demo', 'raming_2022', 'raming_2025']
for col in numeric_columns:
    df[col] = df[col].astype(str).str.replace(',', '.').replace('', np.nan)
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Filter alleen rijen met data voor alle jaren
df_filtered = df[df['raming_2019_demo'].notna() & df['raming_2022'].notna() & df['raming_2025'].notna()].copy()

# Bereken veranderingen ten opzichte van 2019
results = []

for idx, row in df_filtered.iterrows():
    variabele = row['Variabele']
    label = f"{row['Categorie1']}"
    if pd.notna(row['Categorie2']) and row['Categorie2']:
        label += f" - {row['Categorie2']}"
    
    data_type = row['Data_type']
    
    val_2019 = row['raming_2019_demo']
    val_2022 = row['raming_2022']
    val_2025 = row['raming_2025']
    
    # Skip als waarden 0 zijn (division by zero)
    if val_2019 == 0:
        continue
    
    # Bereken relatieve verandering (%)
    rel_2019_2022 = ((val_2022 - val_2019) / val_2019) * 100
    rel_2019_2025 = ((val_2025 - val_2019) / val_2019) * 100
    
    # Bereken absolute verandering
    abs_2019_2022 = val_2022 - val_2019
    abs_2019_2025 = val_2025 - val_2019
    
    # Voor percentages: absolute verandering in procentpunten
    if data_type == 'Percentage':
        abs_2019_2022_pp = abs_2019_2022 * 100  # van 0.xx naar xx.x procentpunten
        abs_2019_2025_pp = abs_2019_2025 * 100
    else:
        abs_2019_2022_pp = abs_2019_2022
        abs_2019_2025_pp = abs_2019_2025
    
    results.append({
        'Variabele': variabele,
        'Label': label,
        'Data_type': data_type,
        'Waarde_2019': val_2019,
        'Waarde_2022': val_2022,
        'Waarde_2025': val_2025,
        'Rel_verandering_2019_2022_%': round(rel_2019_2022, 2),
        'Rel_verandering_2019_2025_%': round(rel_2019_2025, 2),
        'Abs_verandering_2019_2022': round(abs_2019_2022_pp, 2),
        'Abs_verandering_2019_2025': round(abs_2019_2025_pp, 2),
    })

# Maak DataFrame van resultaten
results_df = pd.DataFrame(results)

# Sorteer op categorie en variabele
results_df = results_df.sort_values(['Label', 'Variabele'])

# Toon resultaten
print("=" * 150)
print("ANALYSE PARAMETERWAARDEN: VERANDERINGEN 2019-2022-2025")
print("=" * 150)
print()

# Groepeer per hoofdcategorie
categories = results_df['Label'].str.split(' - ').str[0].unique()

for category in sorted(categories):
    cat_df = results_df[results_df['Label'].str.startswith(category)]
    
    if len(cat_df) == 0:
        continue
    
    print(f"\n{'=' * 150}")
    print(f"CATEGORIE: {category}")
    print(f"{'=' * 150}")
    
    for idx, row in cat_df.iterrows():
        print(f"\n{row['Label']}")
        print(f"  Variable: {row['Variabele']}")
        print(f"  Type: {row['Data_type']}")
        print(f"  Waarden: 2019={row['Waarde_2019']:.3f}  |  2022={row['Waarde_2022']:.3f}  |  2025={row['Waarde_2025']:.3f}")
        
        if row['Data_type'] == 'Percentage':
            print(f"  Relatieve verandering: 2019→2022: {row['Rel_verandering_2019_2022_%']:+.2f}%  |  2019→2025: {row['Rel_verandering_2019_2025_%']:+.2f}%")
            print(f"  Absolute verandering:  2019→2022: {row['Abs_verandering_2019_2022']:+.2f} pp |  2019→2025: {row['Abs_verandering_2019_2025']:+.2f} pp")
        else:
            print(f"  Relatieve verandering: 2019→2022: {row['Rel_verandering_2019_2022_%']:+.2f}%  |  2019→2025: {row['Rel_verandering_2019_2025_%']:+.2f}%")
            print(f"  Absolute verandering:  2019→2022: {row['Abs_verandering_2019_2022']:+.2f}     |  2019→2025: {row['Abs_verandering_2019_2025']:+.2f}")

# Exporteer naar CSV
output_file = 'parameter_veranderingen_2019_2022_2025.csv'
results_df.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"\n\n{'=' * 150}")
print(f"Resultaten geëxporteerd naar: {output_file}")
print(f"{'=' * 150}")

# Print summary statistics
print(f"\n\nSAMENVATTING:")
print(f"  Totaal aantal parameters geanalyseerd: {len(results_df)}")
print(f"  Categorieën: {len(categories)}")
