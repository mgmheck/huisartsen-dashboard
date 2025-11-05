/**
 * CSV Loader Utility
 * Loads and parses the parameterwaarden CSV file
 */

export async function loadCSVData(url) {
  try {
    // Fetch CSV file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse CSV
    const lines = text.split('\n');
    const headers = lines[0].split(';');
    
    // Find important column indices
    const variabeleIndex = headers.indexOf('Variabele');
    const raming2025Index = headers.indexOf('raming_2025');
    
    if (variabeleIndex === -1 || raming2025Index === -1) {
      throw new Error('CSV format niet correct: missing required columns');
    }
    
    // Parse data rows
    const params = {};
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(';');
      const variabele = values[variabeleIndex];
      const waarde = values[raming2025Index];
      
      if (variabele && waarde) {
        // Convert comma to dot for decimals
        const numericValue = parseFloat(waarde.replace(',', '.'));
        if (!isNaN(numericValue)) {
          params[variabele] = numericValue;
        }
      }
    }
    
    console.log(`✅ Loaded ${Object.keys(params).length} parameters from CSV`);
    
    return params;
    
  } catch (error) {
    console.error('Error loading CSV:', error);
    
    // Return default parameters als fallback
    return getDefaultParameters();
  }
}

/**
 * Get default parameters (fallback)
 */
export function getDefaultParameters() {
  return {
    // Jaren
    basisjaar: 2025,
    evenwichtsjaar1: 2043,
    evenwichtsjaar2: 2043,
    bijsturingsjaar: 2027,
    trendjaar: 2035,
    opleidingsduur: 3,
    opleidingsduur2: 3,
    opleidingsduur3: 3,
    
    // Aanbod
    aanbod_personen: 14347,
    per_vrouw_basis: 0.66,
    fte_vrouw_basis: 0.72,
    fte_man_basis: 0.81,
    fte_vrouw_basis_vijf: 0.72,
    fte_man_basis_vijf: 0.81,
    fte_vrouw_basis_tien: 0.72,
    fte_man_basis_tien: 0.81,
    fte_vrouw_basis_vijftien: 0.72,
    fte_man_basis_vijftien: 0.81,
    fte_vrouw_basis_twintig: 0.72,
    fte_man_basis_twintig: 0.81,
    
    // Uitstroom
    uitstroom_vrouw_basis_vijf: 0.116,
    uitstroom_vrouw_basis_tien: 0.232,
    uitstroom_vrouw_basis_vijftien: 0.371,
    uitstroom_vrouw_basis_twintig: 0.51,
    uitstroom_man_basis_vijf: 0.226,
    uitstroom_man_basis_tien: 0.373,
    uitstroom_man_basis_vijftien: 0.502,
    uitstroom_man_basis_twintig: 0.632,
    
    // Opleiding
    n_inopleiding_perjaar: 718,
    n_inopleiding_perjaar2: 718,
    n_inopleiding_perjaar3: 718,
    per_vrouw_opleiding: 0.74,
    per_vrouw_opleiding2: 0.74,
    per_vrouw_opleiding3: 0.74,
    intern_rendement: 0.94,
    intern_rendement2: 0.94,
    intern_rendement3: 0.94,
    
    // Extern rendement vrouw
    extern_rendement_vrouw_1jaar: 0.989,
    extern_rendement_vrouw_5jaar: 0.943,
    extern_rendement_vrouw_10jaar: 0.889,
    extern_rendement_vrouw_15jaar: 0.851,
    extern_rendement_vrouw_1jaar2: 0.989,
    extern_rendement_vrouw_5jaar2: 0.943,
    extern_rendement_vrouw_10jaar2: 0.889,
    extern_rendement_vrouw_15jaar2: 0.851,
    extern_rendement_vrouw_1jaar3: 0.989,
    extern_rendement_vrouw_5jaar3: 0.943,
    extern_rendement_vrouw_10jaar3: 0.889,
    extern_rendement_vrouw_15jaar3: 0.851,
    
    // Extern rendement man
    extern_rendement_man_1jaar: 0.992,
    extern_rendement_man_5jaar: 0.959,
    extern_rendement_man_10jaar: 0.931,
    extern_rendement_man_15jaar: 0.905,
    extern_rendement_man_1jaar2: 0.992,
    extern_rendement_man_5jaar2: 0.959,
    extern_rendement_man_10jaar2: 0.931,
    extern_rendement_man_15jaar2: 0.905,
    extern_rendement_man_1jaar3: 0.992,
    extern_rendement_man_5jaar3: 0.959,
    extern_rendement_man_10jaar3: 0.931,
    extern_rendement_man_15jaar3: 0.905,
    
    // Buitenland
    n_buitenland: 14,
    per_vrouw_buitenland: 1.0,
    rendement_buitenland: 1.0,
    
    // Zorgvraag
    onv_vraag_laag: 0.063,
    onv_vraag_midden: 0.063,
    onv_vraag_hoog: 0.063,
    demo_5_laag: 0.043,
    demo_10_laag: 0.086,
    demo_15_laag: 0.121,
    demo_20_laag: 0.148,
    demo_5_midden: 0.043,
    demo_10_midden: 0.086,
    demo_15_midden: 0.121,
    demo_20_midden: 0.148,
    demo_5_hoog: 0.043,
    demo_10_hoog: 0.086,
    demo_15_hoog: 0.121,
    demo_20_hoog: 0.148,
    
    // Vraagcomponenten
    epi_laag: 0.01,
    soc_laag: 0.019,
    vak_laag: -0.003,
    eff_laag: -0.005,
    hor_laag: 0.016,
    tijd_laag: 0,
    ver_laag: -0.011,
    epi_midden: 0.01,
    soc_midden: 0.019,
    vak_midden: -0.003,
    eff_midden: -0.005,
    hor_midden: 0.016,
    tijd_midden: 0,
    ver_midden: -0.011,
    epi_hoog: 0.01,
    soc_hoog: 0.019,
    vak_hoog: -0.003,
    eff_hoog: -0.005,
    hor_hoog: 0.016,
    tijd_hoog: 0,
    ver_hoog: -0.011
  };
}

/**
 * Validate parameters
 */
export function validateParameters(params) {
  const required = [
    'basisjaar',
    'evenwichtsjaar1',
    'aanbod_personen',
    'n_inopleiding_perjaar',
    'intern_rendement',
    'fte_vrouw_basis',
    'fte_man_basis'
  ];
  
  const missing = [];
  
  for (const key of required) {
    if (params[key] === undefined || params[key] === null) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.warn(`Missing required parameters: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * Export parameters to JSON
 */
export function exportParametersToJSON(params) {
  const json = JSON.stringify(params, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `parameters_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import parameters from JSON file
 */
export function importParametersFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const params = JSON.parse(e.target.result);
        resolve(params);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
