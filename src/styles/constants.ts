// Style constanten voor het hele project
export const STYLES = {
  // Kleuren
  colors: {
    primary: '#006583',
    navy: '#0F2B5B',
    teal: '#006470',
    orange: '#D76628',
    lightGray: '#f8f8f8',
    mediumGray: '#666',
    darkGray: '#333',
    borderGray: '#ccc',
    subtleGray: '#999',
    white: '#ffffff'
  },

  // Cards
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '1.25rem'
  },

  // Input velden
  inputContainer: {
    marginBottom: '0.5rem'
  },

  inputLabel: {
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    color: '#333',
    display: 'block',
    marginBottom: '0.5rem'
  },

  numberInput: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    border: '1px solid #ccc',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    boxSizing: 'border-box' as const
  },

  rangeInput: {
    width: '100%',
    display: 'block' as const
  },

  baselineText: {
    fontSize: '0.75rem',
    color: '#666',
    marginTop: '0.25rem'
  },

  // KPI elementen
  kpiLabel: {
    fontSize: '0.875rem',
    marginBottom: '0.25rem'
  },

  kpiValue: {
    fontSize: '0.875rem',
    fontWeight: 'normal' as const
  },

  kpiSubtext: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: '0.25rem'
  },

  // Section headers
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '0.5rem'
  },

  sectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    color: '#0F2B5B',
    marginBottom: '0'
  },

  // Buttons
  resetButton: {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    border: 'none',
    backgroundColor: '#0F2B5B',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer'
  },

  primaryButton: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: '#0F2B5B',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    marginTop: '1rem'
  },

  // Section containers
  section: {
    backgroundColor: '#f8f8f8',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '0.75rem',
    border: '2px solid #000'
  },

  // Row layout
  row: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },

  halfWidth: {
    width: 'calc(50% - 0.25rem)'
  }
};

// Chart kleuren voor verschillende categorieën
export const CHART_COLORS = {
  default: ['#0F2B5B', '#006470', '#D76628', '#1a4d7a', '#008594', '#e67e3a'],

  zorgvraag: {
    'epi_midden': { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' },
    'sociaal_midden': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
    'vakinh_midden': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
    'effic_midden': { stroke: '#1a4d7a', strokeWidth: 2, strokeDasharray: '8 2' },
    'horsub_midden': { stroke: '#008594', strokeWidth: 2, strokeDasharray: 'none' },
    'atv_midden': { stroke: '#e67e3a', strokeWidth: 3, strokeDasharray: '10 5' },
    'vertsub_midden': { stroke: '#052040', strokeWidth: 2, strokeDasharray: '2 2' },
    'totale_zorgvraag_excl_ATV_midden': { stroke: '#000000', strokeWidth: 4, strokeDasharray: 'none' }
  },

  uitstroom: {
    'uitstroom_man_basis_vijf': { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' },
    'uitstroom_vrouw_basis_vijf': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
    'uitstroom_totaal_vijf': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
    'uitstroom_man_basis_tien': { stroke: '#1a4d7a', strokeWidth: 2, strokeDasharray: '8 2' },
    'uitstroom_vrouw_basis_tien': { stroke: '#008594', strokeWidth: 2, strokeDasharray: 'none' },
    'uitstroom_totaal_tien': { stroke: '#e67e3a', strokeWidth: 2, strokeDasharray: '10 5' },
    'uitstroom_man_basis_vijftien': { stroke: '#052040', strokeWidth: 2, strokeDasharray: '2 2' },
    'uitstroom_vrouw_basis_vijftien': { stroke: '#004d7a', strokeWidth: 2, strokeDasharray: 'none' },
    'uitstroom_totaal_vijftien': { stroke: '#6b4423', strokeWidth: 2, strokeDasharray: '5 3' },
    'uitstroom_man_basis_twintig': { stroke: '#004d4d', strokeWidth: 2, strokeDasharray: '3 3' },
    'uitstroom_vrouw_basis_twintig': { stroke: '#8b3a00', strokeWidth: 2, strokeDasharray: 'none' },
    'uitstroom_totaal_twintig': { stroke: '#1a1a1a', strokeWidth: 3, strokeDasharray: '4 4' }
  }
};
