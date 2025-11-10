#!/usr/bin/env python3
"""
Visualiseert parameterwaarden met:
- Sparklines voor relatieve ontwikkeling (2019, 2022, 2025)
- Kleine staafdiagrammen voor absolute waarden per jaar
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import Rectangle
import seaborn as sns

# Configuratie
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 8

# Lees het CSV bestand met de analyse
df = pd.read_csv('parameter_veranderingen_2019_2022_2025.csv')

# Groepeer per hoofdcategorie
df['Hoofdcategorie'] = df['Label'].str.split(' - ').str[0]
categories = df['Hoofdcategorie'].unique()

# Functie om sparkline te tekenen
def draw_sparkline(ax, values, color='#006583'):
    """Teken een sparkline voor 3 datapunten"""
    x = [0, 1, 2]
    ax.plot(x, values, color=color, linewidth=2, marker='o', markersize=4)
    ax.set_xlim(-0.2, 2.2)
    
    # Voeg waarde labels toe
    for i, (xi, val) in enumerate(zip(x, values)):
        ax.text(xi, val, f'{val:.1f}', ha='center', va='bottom', fontsize=6)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(['2019', '2022', '2025'], fontsize=6)
    ax.tick_params(axis='both', which='both', length=0)
    ax.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.5)

# Functie om klein staafdiagram te tekenen
def draw_small_bars(ax, values, data_type):
    """Teken kleine staafjes voor 3 waarden"""
    x = [0, 1, 2]
    colors = ['#0F2B5B', '#006583', '#D76628']
    
    bars = ax.bar(x, values, color=colors, width=0.6)
    
    # Voeg waarde labels toe bovenop de staafjes
    for i, (bar, val) in enumerate(zip(bars, values)):
        height = bar.get_height()
        if data_type == 'Percentage':
            label = f'{val:.3f}'
        else:
            label = f'{val:.1f}' if abs(val) < 100 else f'{int(val)}'
        
        ax.text(bar.get_x() + bar.get_width()/2., height,
                label, ha='center', va='bottom', fontsize=6)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(['2019', '2022', '2025'], fontsize=6)
    ax.tick_params(axis='both', which='both', length=0)
    ax.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.5)
    ax.axhline(y=0, color='black', linewidth=0.5)

# Maak visualisaties per hoofdcategorie
for category in sorted(categories):
    cat_df = df[df['Hoofdcategorie'] == category].copy()
    
    if len(cat_df) == 0:
        continue
    
    # Sorteer op variabele naam
    cat_df = cat_df.sort_values('Variabele')
    
    n_params = len(cat_df)
    
    # Maak figuur met subplots (2 kolommen: sparklines en staafdiagrammen)
    fig = plt.figure(figsize=(16, max(8, n_params * 0.6)))
    
    # Titel
    fig.suptitle(f'{category} - Parameter Ontwikkeling 2019-2022-2025', 
                 fontsize=14, fontweight='bold', y=0.995)
    
    # Maak grid layout
    gs = gridspec.GridSpec(n_params, 3, figure=fig, 
                          width_ratios=[3, 1.5, 1.5],
                          hspace=0.4, wspace=0.3,
                          left=0.05, right=0.98, top=0.97, bottom=0.03)
    
    for idx, (i, row) in enumerate(cat_df.iterrows()):
        # Label kolom
        ax_label = fig.add_subplot(gs[idx, 0])
        ax_label.text(0.02, 0.5, f"{row['Variabele']}", 
                     va='center', ha='left', fontsize=8, fontweight='bold')
        ax_label.text(0.02, 0.2, f"{row['Label']}", 
                     va='center', ha='left', fontsize=6, color='gray', style='italic')
        ax_label.text(0.02, 0.8, f"Type: {row['Data_type']}", 
                     va='center', ha='left', fontsize=6, color='darkblue')
        ax_label.axis('off')
        
        # Sparkline voor relatieve verandering
        ax_spark = fig.add_subplot(gs[idx, 1])
        rel_values = [0, row['Rel_verandering_2019_2022_%'], row['Rel_verandering_2019_2025_%']]
        
        # Kleur op basis van trend
        if row['Rel_verandering_2019_2025_%'] > 0:
            spark_color = '#D76628'  # Oranje voor stijging
        else:
            spark_color = '#006583'  # Teal voor daling
        
        draw_sparkline(ax_spark, rel_values, color=spark_color)
        ax_spark.set_ylabel('Rel. % wijz.', fontsize=6)
        
        if idx == 0:
            ax_spark.set_title('Relatieve Verandering (%)', fontsize=9, fontweight='bold')
        
        # Staafdiagram voor absolute waarden
        ax_bars = fig.add_subplot(gs[idx, 2])
        abs_values = [row['Waarde_2019'], row['Waarde_2022'], row['Waarde_2025']]
        draw_small_bars(ax_bars, abs_values, row['Data_type'])
        
        if row['Data_type'] == 'Percentage':
            ax_bars.set_ylabel('Waarde', fontsize=6)
        else:
            ax_bars.set_ylabel(row['Data_type'], fontsize=6)
        
        if idx == 0:
            ax_bars.set_title('Absolute Waarden', fontsize=9, fontweight='bold')
    
    # Opslaan
    filename = f'parameters_visualisatie_{category.lower().replace(" ", "_")}.png'
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    print(f'Saved: {filename}')
    plt.close()

print("\n" + "="*80)
print("Alle visualisaties zijn gegenereerd!")
print("="*80)

# Maak ook een overzichtsvisualisatie met alleen de belangrijkste parameters
print("\nGenereer overzichtsvisualisatie met key parameters...")

# Selecteer interessante parameters
key_params = [
    'aanbod_personen',
    'per_vrouw_basis',
    'fte_totaal_basis',
    'uitstroom_totaal_basis_vijf',
    'uitstroom_totaal_basis_tien',
    'n_inopleiding_perjaar',
    'intern_rendement',
    'totale_zorgvraag_excl_ATV_laag',
    'totale_zorgvraag_excl_ATV_midden',
    'totale_zorgvraag_excl_ATV_hoog',
    'onv_vraag_midden',
    'demo_10_midden',
]

key_df = df[df['Variabele'].isin(key_params)].copy()

if len(key_df) > 0:
    fig = plt.figure(figsize=(16, 10))
    fig.suptitle('Kernparameters Ontwikkeling 2019-2022-2025', 
                 fontsize=16, fontweight='bold', y=0.995)
    
    gs = gridspec.GridSpec(len(key_df), 3, figure=fig,
                          width_ratios=[3, 1.5, 1.5],
                          hspace=0.5, wspace=0.3,
                          left=0.05, right=0.98, top=0.97, bottom=0.03)
    
    for idx, (i, row) in enumerate(key_df.iterrows()):
        # Label
        ax_label = fig.add_subplot(gs[idx, 0])
        ax_label.text(0.02, 0.5, f"{row['Variabele']}", 
                     va='center', ha='left', fontsize=10, fontweight='bold')
        ax_label.text(0.02, 0.15, f"{row['Label']}", 
                     va='center', ha='left', fontsize=7, color='gray', style='italic')
        ax_label.axis('off')
        
        # Sparkline
        ax_spark = fig.add_subplot(gs[idx, 1])
        rel_values = [0, row['Rel_verandering_2019_2022_%'], row['Rel_verandering_2019_2025_%']]
        spark_color = '#D76628' if row['Rel_verandering_2019_2025_%'] > 0 else '#006583'
        draw_sparkline(ax_spark, rel_values, color=spark_color)
        ax_spark.set_ylabel('Rel. % wijz.', fontsize=7)
        
        if idx == 0:
            ax_spark.set_title('Relatieve Verandering (%)', fontsize=11, fontweight='bold')
        
        # Staafdiagram
        ax_bars = fig.add_subplot(gs[idx, 2])
        abs_values = [row['Waarde_2019'], row['Waarde_2022'], row['Waarde_2025']]
        draw_small_bars(ax_bars, abs_values, row['Data_type'])
        ax_bars.set_ylabel('Waarde', fontsize=7)
        
        if idx == 0:
            ax_bars.set_title('Absolute Waarden', fontsize=11, fontweight='bold')
    
    plt.savefig('parameters_visualisatie_kernparameters.png', dpi=300, bbox_inches='tight')
    print('Saved: parameters_visualisatie_kernparameters.png')
    plt.close()

print("\n" + "="*80)
print("Alle visualisaties compleet!")
print("="*80)
