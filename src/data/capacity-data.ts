// Data uit CSV bestand: 20251022_Parameterwaarden20102013201620192025_DEF.csv

export interface MetricData {
  var: string;
  label: string;
  data: number[];
}

export interface RawData {
  [key: string]: MetricData[];
}

export const years = ['2010', '2013', '2016', '2019', '2022', '2025'];

export const rawData: RawData = {
  zorgaanbod_personen: [
    { var: 'aanbod_personen', label: 'Werkzame huisartsen', data: [10371, 11133, 11821, 12766, 13492, 14347] },
    { var: 'werkzame_vrouwen', label: 'Werkzame vrouwen', data: [4345, 5054, 6194, 7366, 8230, 9469] },
    { var: 'werkzame_mannen', label: 'Werkzame mannen', data: [6026, 6079, 5627, 5400, 5262, 4878] }
  ],
  zorgaanbod_fte: [
    { var: 'fte_werkzaam', label: 'FTE werkzame huisartsen', data: [7348, 8280, 8809, 9495, 10211, 10769] },
    { var: 'fte_werkzame_vrouwen', label: 'FTE werkzame vrouwen', data: [2394, 3235, 4026, 5230, 5843, 6818] },
    { var: 'fte_werkzame_mannen', label: 'FTE werkzame mannen', data: [4953, 5046, 4783, 4266, 4367, 3951] }
  ],
  zorgaanbod_percentage: [
    { var: 'werkzame_vrouwen', label: 'Werkzame vrouwen', data: [4345, 5054, 6194, 7366, 8230, 9469] },
    { var: 'werkzame_mannen', label: 'Werkzame mannen', data: [6026, 6079, 5627, 5400, 5262, 4878] }
  ],
  ftefactor: [
    { var: 'fte_totaal_basis', label: 'FTE factor totaal (%)', data: [70.85, 74.37, 74.52, 74.38, 75.68, 75.06] },
    { var: 'fte_vrouw_basis', label: 'FTE factor vrouw (%)', data: [55.1, 64.0, 65.0, 71.0, 71.0, 72.0] },
    { var: 'fte_man_basis', label: 'FTE factor man (%)', data: [82.2, 83.0, 85.0, 79.0, 83.0, 81.0] }
  ],
  uitstroom: [
    { var: 'uitstroom_man_basis_vijf', label: 'Uitstroom 5j man (%)', data: [18.9, 13.1, 15.4, 13.2, 17.0, 22.6] },
    { var: 'uitstroom_vrouw_basis_vijf', label: 'Uitstroom 5j vrouw (%)', data: [8.4, 6.3, 6.0, 5.0, 6.0, 11.6] },
    { var: 'uitstroom_totaal_vijf', label: 'Uitstroom 5j totaal (%)', data: [14.5, 10.0, 10.5, 8.5, 10.3, 15.3] },
    { var: 'uitstroom_man_basis_tien', label: 'Uitstroom 10j man (%)', data: [38.2, 29.3, 28.7, 33.6, 36.0, 37.3] },
    { var: 'uitstroom_vrouw_basis_tien', label: 'Uitstroom 10j vrouw (%)', data: [19.2, 15.8, 12.9, 14.3, 16.0, 23.2] },
    { var: 'uitstroom_totaal_tien', label: 'Uitstroom 10j totaal (%)', data: [30.2, 23.2, 20.4, 22.5, 23.8, 28.0] },
    { var: 'uitstroom_man_basis_vijftien', label: 'Uitstroom 15j man (%)', data: [54.6, 43.7, 43.5, 48.1, 53.0, 50.2] },
    { var: 'uitstroom_vrouw_basis_vijftien', label: 'Uitstroom 15j vrouw (%)', data: [31.3, 26.6, 22.6, 24.9, 28.0, 37.1] },
    { var: 'uitstroom_totaal_vijftien', label: 'Uitstroom 15j totaal (%)', data: [44.8, 35.9, 32.5, 34.7, 37.8, 41.6] },
    { var: 'uitstroom_man_basis_twintig', label: 'Uitstroom 20j man (%)', data: [67.9, 56.3, 56.7, 60.0, 65.0, 63.2] },
    { var: 'uitstroom_vrouw_basis_twintig', label: 'Uitstroom 20j vrouw (%)', data: [44.3, 38.9, 34.2, 37.7, 37.0, 51.0] },
    { var: 'uitstroom_totaal_twintig', label: 'Uitstroom 20j totaal (%)', data: [58.0, 48.4, 44.9, 47.1, 47.9, 55.1] }
  ],
  opleiding: [
    { var: 'n_inopleiding_perjaar', label: 'Instroom per jaar', data: [513, 602, 707, 719, 798, 718] }
  ],
  opleidingdetails: [
    { var: 'per_vrouw_opleiding', label: '% vrouwen opleiding', data: [71.3, 76.0, 77.5, 74.6, 73.7, 74.0] },
    { var: 'intern_rendement', label: 'Intern rendement (%)', data: [98.0, 98.0, 98.0, 98.0, 94.3, 94.0] }
  ],
  zorgvraag: [
    { var: 'epi_midden', label: 'Epidemiologie (%)', data: [0.3, 0.3, 0.4, 0.4, 0.7, 1.0] },
    { var: 'sociaal_midden', label: 'Sociaal-cultureel (%)', data: [0.5, 0.7, 0.8, 0.8, 1.2, 1.9] },
    { var: 'vakinh_midden', label: 'Vakinhoudelijk (%)', data: [0.1, 0.1, 0.1, 0.2, 0.8, -0.3] },
    { var: 'effic_midden', label: 'Efficiency (%)', data: [0.2, 0.3, 0, 0.3, 0.4, -0.5] },
    { var: 'horsub_midden', label: 'Horizontale substitutie (%)', data: [0.5, 1.0, 1.2, 1.0, 1.4, 1.6] },
    { var: 'atv_midden', label: 'ATV (%)', data: [0, 0, 0, 0.8, 1.5, 0] },
    { var: 'vertsub_midden', label: 'Verticale substitutie (%)', data: [-0.6, -0.6, -1.0, -0.6, -1.0, -1.1] },
    { var: 'totale_zorgvraag_excl_ATV_midden', label: 'Totale zorgvraag excl ATV (%)', data: [1.0, 1.8, 1.5, 2.1, 3.6, 2.6] }
  ],
  demografie: [
    { var: 'demo_5_midden', label: 'Demografie 5j (%)', data: [3.1, 3.5, 4.9, 6.0, 5.8, 4.3] },
    { var: 'demo_10_midden', label: 'Demografie 10j (%)', data: [6.0, 7.1, 9.4, 11.4, 10.8, 8.6] },
    { var: 'demo_15_midden', label: 'Demografie 15j (%)', data: [8.4, 10.6, 13.5, 16.0, 14.8, 12.1] },
    { var: 'demo_20_midden', label: 'Demografie 20j (%)', data: [10.4, 13.3, 17.2, 19.5, 17.9, 14.8] }
  ],
  onvervuldevraag: [
    { var: 'onv_vraag_midden', label: 'Onvervulde vraag (%)', data: [1.0, 0, 0, 3.0, 8.0, 6.3] }
  ]
};

// KPI data berekeningen
export const kpiData = [
  { label: 'Totaal huisartsen 2025', value: '14.347', change: '+6%', subtext: 't.o.v. 2010' },
  { label: 'FTE 2025', value: '10.769', change: '+47%', subtext: 't.o.v. 2010' },
  { label: 'Vrouwen 2025', value: '9.469 (66%)', change: '+118%', subtext: 't.o.v. 2010' },
  { label: 'Zorgvraag 2025', value: '2,6%', change: '+2,6%', subtext: 'excl. ATV' }
];
