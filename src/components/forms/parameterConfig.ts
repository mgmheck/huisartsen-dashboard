/**
 * Parameter Configuration - Huisartsen Dashboard
 *
 * Single source of truth voor ALLE parameter definities
 * Config-driven approach: 1280 regels duplicatie → 80 regels config
 *
 * Gebruikt door RangeInputControl component voor rendering
 */

export interface ParamConfig {
  key: string;                      // Parameter key in state
  label: string;                    // Display label
  min: number;                      // Min waarde voor range slider
  max: number;                      // Max waarde voor range slider
  step: number;                     // Step size
  decimals: number;                 // Aantal decimalen voor display
  unit?: string;                    // Eenheid (%, personen, jaar)
  transform?: (val: number) => number;        // Display transformatie (bijv. * 100 voor %)
  inverseTransform?: (val: number) => number; // Inverse transformatie (bijv. / 100)
  section: 'aanbod' | 'opleiding' | 'vraag';  // Sectie voor groepering
  paired?: boolean;                 // True als parameter in paren komt (vrouw/man)
}

/**
 * ALLE PARAMETER CONFIGURATIES
 * Georganiseerd per sectie: Aanbod, Opleiding, Vraag
 */
export const PARAM_CONFIGS: ParamConfig[] = [
  // ========== SECTIE 1: AANBOD ==========
  {
    key: 'instroom',
    label: 'Instroom opleiding',
    min: 600,
    max: 1500,
    step: 10,
    decimals: 0,
    unit: ' personen',
    section: 'aanbod',
  },
  {
    key: 'fte_vrouw',
    label: 'FTE-factor vrouw',
    min: 0.5,
    max: 1.0,
    step: 0.01,
    decimals: 2,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'fte_man',
    label: 'FTE-factor man',
    min: 0.5,
    max: 1.0,
    step: 0.01,
    decimals: 2,
    section: 'aanbod',
    paired: true,
  },

  // Uitstroom parameters (8 parameters: 4 periodes × 2 geslachten)
  {
    key: 'uitstroom_vrouw_5j',
    label: 'Uitstroom vrouw (5 jaar)',
    min: 5,    // Display range (na * 100)
    max: 30,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_man_5j',
    label: 'Uitstroom man (5 jaar)',
    min: 5,
    max: 30,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_vrouw_10j',
    label: 'Uitstroom vrouw (10 jaar)',
    min: 10,
    max: 45,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_man_10j',
    label: 'Uitstroom man (10 jaar)',
    min: 10,
    max: 45,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_vrouw_15j',
    label: 'Uitstroom vrouw (15 jaar)',
    min: 15,
    max: 60,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_man_15j',
    label: 'Uitstroom man (15 jaar)',
    min: 15,
    max: 60,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_vrouw_20j',
    label: 'Uitstroom vrouw (20 jaar)',
    min: 20,
    max: 70,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },
  {
    key: 'uitstroom_man_20j',
    label: 'Uitstroom man (20 jaar)',
    min: 20,
    max: 70,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'aanbod',
    paired: true,
  },

  // ========== SECTIE 2: OPLEIDING ==========
  {
    key: 'intern_rendement',
    label: 'Intern rendement',
    min: 0.7,
    max: 1.0,
    step: 0.01,
    decimals: 0,
    unit: '%',
    transform: (val) => val * 100,
    section: 'opleiding',
  },
  {
    key: 'opleidingsduur',
    label: 'Opleidingsduur (jaren)',
    min: 2.0,
    max: 4.0,
    step: 0.1,
    decimals: 1,
    unit: ' jaar',
    section: 'opleiding',
  },

  // Extern rendement parameters (8 parameters: 4 periodes × 2 geslachten)
  {
    key: 'extern_rendement_vrouw_1jaar',
    label: 'Extern rendement vrouw (1 jaar)',
    min: 80,   // Display range (na * 100)
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_man_1jaar',
    label: 'Extern rendement man (1 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_vrouw_5jaar',
    label: 'Extern rendement vrouw (5 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_man_5jaar',
    label: 'Extern rendement man (5 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_vrouw_10jaar',
    label: 'Extern rendement vrouw (10 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_man_10jaar',
    label: 'Extern rendement man (10 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_vrouw_15jaar',
    label: 'Extern rendement vrouw (15 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },
  {
    key: 'extern_rendement_man_15jaar',
    label: 'Extern rendement man (15 jaar)',
    min: 80,
    max: 100,
    step: 0.1,
    decimals: 1,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'opleiding',
    paired: true,
  },

  // ========== SECTIE 3: VRAAG (NIET-DEMOGRAFISCHE ONTWIKKELINGEN) ==========
  {
    key: 'epi_midden',
    label: 'Epidemiologie',
    min: -4,   // Display range (na * 100)
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'soc_midden',
    label: 'Sociaal-cultureel',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'vak_midden',
    label: 'Vakinhoudelijk',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'eff_midden',
    label: 'Efficiency',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'hor_midden',
    label: 'Horizontale substitutie',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'tijd_midden',
    label: 'Arbeidstijdverandering',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'ver_midden',
    label: 'Verticale substitutie',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
    paired: true,
  },
  {
    key: 'totale_zorgvraag_excl_ATV_midden',
    label: 'Totale zorgvraag (excl. ATV)',
    min: -4,
    max: 4,
    step: 0.01,
    decimals: 2,
    unit: '%',
    transform: (val) => val * 100,
    inverseTransform: (val) => val / 100,
    section: 'vraag',
  },
];

/**
 * Helper: Filter parameters per sectie
 */
export const getParamsBySection = (section: 'aanbod' | 'opleiding' | 'vraag'): ParamConfig[] => {
  return PARAM_CONFIGS.filter(p => p.section === section);
};

/**
 * Helper: Get parameter config by key
 */
export const getParamConfig = (key: string): ParamConfig | undefined => {
  return PARAM_CONFIGS.find(p => p.key === key);
};
