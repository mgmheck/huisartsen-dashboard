/**
 * Type Definitions - Huisartsen Dashboard
 * Centrale export voor alle TypeScript types en interfaces
 */

export interface ScenarioParams {
  instroom: number;
  intern_rendement: number;
  opleidingsduur: number;
  fte_vrouw: number;
  fte_man: number;
  extern_rendement_vrouw_1jaar: number;
  extern_rendement_vrouw_5jaar: number;
  extern_rendement_vrouw_10jaar: number;
  extern_rendement_vrouw_15jaar: number;
  extern_rendement_man_1jaar: number;
  extern_rendement_man_5jaar: number;
  extern_rendement_man_10jaar: number;
  extern_rendement_man_15jaar: number;
  uitstroom_vrouw_5j: number;
  uitstroom_man_5j: number;
  uitstroom_vrouw_10j: number;
  uitstroom_man_10j: number;
  uitstroom_vrouw_15j: number;
  uitstroom_man_15j: number;
  uitstroom_vrouw_20j: number;
  uitstroom_man_20j: number;
  epi_midden: number;
  soc_midden: number;
  vak_midden: number;
  eff_midden: number;
  hor_midden: number;
  tijd_midden: number;
  ver_midden: number;
  totale_zorgvraag_excl_ATV_midden: number;
  demografie_factor: number | null;
  uitstroom_factor_vrouw: number | null;
  uitstroom_factor_man: number | null;
}

export interface ProjectieData {
  jaar: number;
  aanbod_fte: number;
  benodigd_fte: number;
  gap_fte: number;
}
