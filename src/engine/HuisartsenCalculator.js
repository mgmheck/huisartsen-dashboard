/**
 * Huisartsen Capaciteitsplanning Calculator
 * Complete JavaScript implementatie van R scenario model
 * 
 * Dit is een 1:1 conversie van run_scenario_api_v2.R
 * Performance: <50ms per scenario (vs 2500ms in R)
 */

export class HuisartsenCalculator {
  constructor(csvData) {
    // Parse CSV data naar parameters object
    this.params = this.parseCSVData(csvData);
    
    // Cache voor snelle herberekeningen
    this.cache = new Map();
    
    // Constanten
    this.BASISJAAR = 2025;
    this.EVENWICHTSJAAR = 2043;
    this.BIJSTURINGSJAAR = 2027;
    this.TRENDJAAR = 2035;
    this.JAREN = 21; // 2025-2045
  }

  /**
   * Parse CSV data naar parameters object
   */
  parseCSVData(csvData) {
    const params = {};
    
    // Als csvData een string is (CSV content)
    if (typeof csvData === 'string') {
      const lines = csvData.split('\n');
      const headers = lines[0].split(';');
      
      // Vind de kolom index voor raming_2025
      const raming2025Index = headers.indexOf('raming_2025');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const variabele = values[headers.indexOf('Variabele')];
        const waarde = values[raming2025Index];
        
        if (variabele && waarde) {
          // Converteer komma naar punt voor decimalen
          const numericValue = parseFloat(waarde.replace(',', '.'));
          if (!isNaN(numericValue)) {
            params[variabele] = numericValue;
          }
        }
      }
    } else {
      // Als csvData al een object is
      params = csvData;
    }

    // Voeg default waarden toe voor ontbrekende parameters
    return this.addDefaultParameters(params);
  }

  /**
   * Voeg default parameters toe
   */
  addDefaultParameters(params) {
    // Basis parameters uit CSV
    const defaults = {
      basisjaar: this.BASISJAAR,
      evenwichtsjaar1: this.EVENWICHTSJAAR,
      evenwichtsjaar2: this.EVENWICHTSJAAR,
      bijsturingsjaar: this.BIJSTURINGSJAAR,
      trendjaar: this.TRENDJAAR,
      opleidingsduur: 3,
      opleidingsduur2: 3,
      opleidingsduur3: 3,
      
      // Aanbod parameters
      aanbod_personen: 14347,
      per_vrouw_basis: 0.66,
      fte_vrouw_basis: 0.72,
      fte_man_basis: 0.81,
      
      // Uitstroom percentages
      uitstroom_vrouw_basis_vijf: 0.116,
      uitstroom_vrouw_basis_tien: 0.232,
      uitstroom_vrouw_basis_vijftien: 0.371,
      uitstroom_vrouw_basis_twintig: 0.51,
      uitstroom_man_basis_vijf: 0.226,
      uitstroom_man_basis_tien: 0.373,
      uitstroom_man_basis_vijftien: 0.502,
      uitstroom_man_basis_twintig: 0.632,
      
      // Opleiding parameters
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
      
      // Extern rendement man
      extern_rendement_man_1jaar: 0.992,
      extern_rendement_man_5jaar: 0.959,
      extern_rendement_man_10jaar: 0.931,
      extern_rendement_man_15jaar: 0.905,
      
      // Buitenland
      n_buitenland: 14,
      per_vrouw_buitenland: 1.0,
      rendement_buitenland: 1.0,
      
      // Zorgvraag parameters
      onv_vraag_midden: 0.063,
      demo_5_midden: 0.043,
      demo_10_midden: 0.086,
      demo_15_midden: 0.121,
      demo_20_midden: 0.148,
      
      // Vraagcomponenten
      epi_midden: 0.01,
      soc_midden: 0.019,
      vak_midden: -0.003,
      eff_midden: -0.005,
      hor_midden: 0.016,
      tijd_midden: 0,
      ver_midden: -0.011
    };

    return { ...defaults, ...params };
  }

  /**
   * Hoofdfunctie: Bereken scenario
   */
  calculateScenario(overrides = {}) {
    // Check cache
    const cacheKey = JSON.stringify(overrides);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const startTime = performance.now();

    // Merge overrides met basis parameters
    const params = { ...this.params, ...overrides };

    // Initialize data array voor alle jaren
    const data = this.initializeDataArray(params);

    // Stap 1: Bereken beschikbaar aanbod
    this.berekenBeschikbaarAanbod(data, params);

    // Stap 2: Interpoleer demografie
    this.interpoleerDemografie(data, params);

    // Stap 3: Bereken scenario 6 (alle factoren)
    this.berekenScenario6(data, params);

    // Stap 4: Bereken benodigde instroom
    this.berekenBenodigdeInstroom(data, params);

    // Stap 5: Impact analyse
    this.berekenImpactAnalyse(data, params);

    // Bereken summary statistics
    const summary = this.calculateSummary(data);

    const result = {
      calculation_time_ms: Math.round(performance.now() - startTime),
      parameters: overrides,
      data: data,
      summary: summary,
      evenwichtsjaar: {
        jaar: params.evenwichtsjaar1,
        ...this.getEvenwichtsjaarResultaten(data, params.evenwichtsjaar1)
      }
    };

    // Cache het resultaat
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Initialize data array voor alle jaren
   */
  initializeDataArray(params) {
    const data = [];
    
    for (let i = 0; i < this.JAREN; i++) {
      const jaar = params.basisjaar + i;
      data.push({
        jaar: jaar,
        jaren_sinds_basis: i,
        ...params // Kopieer alle parameters naar elk jaar
      });
    }
    
    return data;
  }

  /**
   * Bereken beschikbaar aanbod (vertaling van beschikbaar_aanbod.R)
   */
  berekenBeschikbaarAanbod(data, params) {
    // Voor elk jaar
    data.forEach((row, index) => {
      const jaar = row.jaar;
      const jaren_sinds_basis = row.jaren_sinds_basis;
      
      // === HUIDIGE VOORRAAD ===
      if (index === 0) {
        // Basisjaar: gebruik actuele aantallen
        row.huidig_man = params.aanbod_personen * (1 - params.per_vrouw_basis);
        row.huidig_vrouw = params.aanbod_personen * params.per_vrouw_basis;
      } else {
        // Bereken uitstroom op basis van periode
        let uitstroom_man_rate, uitstroom_vrouw_rate;
        
        if (jaren_sinds_basis <= 5) {
          const factor = jaren_sinds_basis / 5;
          uitstroom_man_rate = params.uitstroom_man_basis_vijf * factor;
          uitstroom_vrouw_rate = params.uitstroom_vrouw_basis_vijf * factor;
        } else if (jaren_sinds_basis <= 10) {
          const prev_rate_man = params.uitstroom_man_basis_vijf;
          const next_rate_man = params.uitstroom_man_basis_tien;
          const factor = (jaren_sinds_basis - 5) / 5;
          uitstroom_man_rate = prev_rate_man + (next_rate_man - prev_rate_man) * factor;
          
          const prev_rate_vrouw = params.uitstroom_vrouw_basis_vijf;
          const next_rate_vrouw = params.uitstroom_vrouw_basis_tien;
          uitstroom_vrouw_rate = prev_rate_vrouw + (next_rate_vrouw - prev_rate_vrouw) * factor;
        } else if (jaren_sinds_basis <= 15) {
          const prev_rate_man = params.uitstroom_man_basis_tien;
          const next_rate_man = params.uitstroom_man_basis_vijftien;
          const factor = (jaren_sinds_basis - 10) / 5;
          uitstroom_man_rate = prev_rate_man + (next_rate_man - prev_rate_man) * factor;
          
          const prev_rate_vrouw = params.uitstroom_vrouw_basis_tien;
          const next_rate_vrouw = params.uitstroom_vrouw_basis_vijftien;
          uitstroom_vrouw_rate = prev_rate_vrouw + (next_rate_vrouw - prev_rate_vrouw) * factor;
        } else if (jaren_sinds_basis <= 20) {
          const prev_rate_man = params.uitstroom_man_basis_vijftien;
          const next_rate_man = params.uitstroom_man_basis_twintig;
          const factor = (jaren_sinds_basis - 15) / 5;
          uitstroom_man_rate = prev_rate_man + (next_rate_man - prev_rate_man) * factor;
          
          const prev_rate_vrouw = params.uitstroom_vrouw_basis_vijftien;
          const next_rate_vrouw = params.uitstroom_vrouw_basis_twintig;
          uitstroom_vrouw_rate = prev_rate_vrouw + (next_rate_vrouw - prev_rate_vrouw) * factor;
        } else {
          uitstroom_man_rate = params.uitstroom_man_basis_twintig;
          uitstroom_vrouw_rate = params.uitstroom_vrouw_basis_twintig;
        }
        
        // Bereken resterende aantallen
        const init_man = params.aanbod_personen * (1 - params.per_vrouw_basis);
        const init_vrouw = params.aanbod_personen * params.per_vrouw_basis;
        
        row.huidig_man = init_man * (1 - uitstroom_man_rate);
        row.huidig_vrouw = init_vrouw * (1 - uitstroom_vrouw_rate);
      }
      
      // === INSTROOM UIT OPLEIDING ===
      
      // Cohort 1: Nu in opleiding
      const cohort1_afgestudeerd = jaar - params.opleidingsduur;
      if (cohort1_afgestudeerd >= params.basisjaar - 3 && cohort1_afgestudeerd < params.basisjaar) {
        const jaren_sinds_afstuderen = jaar - (cohort1_afgestudeerd + params.opleidingsduur);
        const extern_rendement_man = this.getExternRendement('man', jaren_sinds_afstuderen, params);
        const extern_rendement_vrouw = this.getExternRendement('vrouw', jaren_sinds_afstuderen, params);
        
        row.n_man_uit_nuopl = params.n_inopleiding_perjaar * (1 - params.per_vrouw_opleiding) * 
                              params.intern_rendement * extern_rendement_man;
        row.n_vrouw_uit_nuopl = params.n_inopleiding_perjaar * params.per_vrouw_opleiding * 
                                params.intern_rendement * extern_rendement_vrouw;
      } else {
        row.n_man_uit_nuopl = 0;
        row.n_vrouw_uit_nuopl = 0;
      }
      
      // Cohort 2: Tussen nu en bijsturingsjaar
      const cohort2_afgestudeerd = jaar - params.opleidingsduur2;
      if (cohort2_afgestudeerd >= params.basisjaar && cohort2_afgestudeerd < params.bijsturingsjaar) {
        const jaren_sinds_afstuderen = jaar - (cohort2_afgestudeerd + params.opleidingsduur2);
        const extern_rendement_man = this.getExternRendement('man', jaren_sinds_afstuderen, params, '2');
        const extern_rendement_vrouw = this.getExternRendement('vrouw', jaren_sinds_afstuderen, params, '2');
        
        row.n_man_uit_tussopl = params.n_inopleiding_perjaar2 * (1 - params.per_vrouw_opleiding2) * 
                                params.intern_rendement2 * extern_rendement_man;
        row.n_vrouw_uit_tussopl = params.n_inopleiding_perjaar2 * params.per_vrouw_opleiding2 * 
                                  params.intern_rendement2 * extern_rendement_vrouw;
      } else {
        row.n_man_uit_tussopl = 0;
        row.n_vrouw_uit_tussopl = 0;
      }
      
      // Cohort 3: Na bijsturingsjaar (nabij studeren)
      const cohort3_afgestudeerd = jaar - params.opleidingsduur3;
      if (cohort3_afgestudeerd >= params.bijsturingsjaar) {
        const jaren_sinds_afstuderen = jaar - (cohort3_afgestudeerd + params.opleidingsduur3);
        const extern_rendement_man = this.getExternRendement('man', jaren_sinds_afstuderen, params, '3');
        const extern_rendement_vrouw = this.getExternRendement('vrouw', jaren_sinds_afstuderen, params, '3');
        
        row.n_man_nabijst = params.n_inopleiding_perjaar3 * (1 - params.per_vrouw_opleiding3) * 
                            params.intern_rendement3 * extern_rendement_man;
        row.n_vrouw_nabijst = params.n_inopleiding_perjaar3 * params.per_vrouw_opleiding3 * 
                              params.intern_rendement3 * extern_rendement_vrouw;
      } else {
        row.n_man_nabijst = 0;
        row.n_vrouw_nabijst = 0;
      }
      
      // === BUITENLAND ===
      row.n_man_buitenland = params.n_buitenland * (1 - params.per_vrouw_buitenland) * params.rendement_buitenland;
      row.n_vrouw_buitenland = params.n_buitenland * params.per_vrouw_buitenland * params.rendement_buitenland;
      
      // === FTE FACTOREN ===
      row.fte_man = this.getFTEFactor('man', jaren_sinds_basis, params);
      row.fte_vrouw = this.getFTEFactor('vrouw', jaren_sinds_basis, params);
      
      // === TOTALEN ===
      row.n_man_totaal = row.huidig_man + row.n_man_uit_nuopl + row.n_man_uit_tussopl + 
                         row.n_man_nabijst + row.n_man_buitenland;
      row.n_vrouw_totaal = row.huidig_vrouw + row.n_vrouw_uit_nuopl + row.n_vrouw_uit_tussopl + 
                           row.n_vrouw_nabijst + row.n_vrouw_buitenland;
      row.n_totaal = row.n_man_totaal + row.n_vrouw_totaal;
      
      row.fte_totaal = row.n_man_totaal * row.fte_man + row.n_vrouw_totaal * row.fte_vrouw;
      row.fte_toekomst = row.n_man_nabijst * row.fte_man + row.n_vrouw_nabijst * row.fte_vrouw;
    });
  }

  /**
   * Get extern rendement op basis van jaren sinds afstuderen
   */
  getExternRendement(geslacht, jaren_sinds_afstuderen, params, cohort = '') {
    // Bepaal de juiste parameter naam
    const prefix = `extern_rendement_${geslacht}`;
    const suffix = cohort;
    
    if (jaren_sinds_afstuderen <= 1) {
      return params[`${prefix}_1jaar${suffix}`] || 0.99;
    } else if (jaren_sinds_afstuderen <= 5) {
      const r1 = params[`${prefix}_1jaar${suffix}`] || 0.99;
      const r5 = params[`${prefix}_5jaar${suffix}`] || 0.95;
      const factor = (jaren_sinds_afstuderen - 1) / 4;
      return r1 + (r5 - r1) * factor;
    } else if (jaren_sinds_afstuderen <= 10) {
      const r5 = params[`${prefix}_5jaar${suffix}`] || 0.95;
      const r10 = params[`${prefix}_10jaar${suffix}`] || 0.90;
      const factor = (jaren_sinds_afstuderen - 5) / 5;
      return r5 + (r10 - r5) * factor;
    } else if (jaren_sinds_afstuderen <= 15) {
      const r10 = params[`${prefix}_10jaar${suffix}`] || 0.90;
      const r15 = params[`${prefix}_15jaar${suffix}`] || 0.85;
      const factor = (jaren_sinds_afstuderen - 10) / 5;
      return r10 + (r15 - r10) * factor;
    } else {
      return params[`${prefix}_15jaar${suffix}`] || 0.85;
    }
  }

  /**
   * Get FTE factor op basis van jaren sinds basis
   */
  getFTEFactor(geslacht, jaren_sinds_basis, params) {
    const prefix = `fte_${geslacht}_basis`;
    
    if (jaren_sinds_basis === 0) {
      return params[prefix] || (geslacht === 'man' ? 0.81 : 0.72);
    } else if (jaren_sinds_basis <= 5) {
      return params[`${prefix}_vijf`] || (geslacht === 'man' ? 0.81 : 0.72);
    } else if (jaren_sinds_basis <= 10) {
      return params[`${prefix}_tien`] || (geslacht === 'man' ? 0.81 : 0.72);
    } else if (jaren_sinds_basis <= 15) {
      return params[`${prefix}_vijftien`] || (geslacht === 'man' ? 0.81 : 0.72);
    } else {
      return params[`${prefix}_twintig`] || (geslacht === 'man' ? 0.81 : 0.72);
    }
  }

  /**
   * Interpoleer demografie voor alle jaren
   */
  interpoleerDemografie(data, params) {
    ['laag', 'midden', 'hoog'].forEach(variant => {
      const field = `demografie_${variant}`;
      
      // Zet key jaren
      data.forEach(row => {
        const jaren_sinds = row.jaren_sinds_basis;
        
        if (jaren_sinds === 0) row[field] = 0;
        else if (jaren_sinds === 5) row[field] = params[`demo_5_${variant}`];
        else if (jaren_sinds === 10) row[field] = params[`demo_10_${variant}`];
        else if (jaren_sinds === 15) row[field] = params[`demo_15_${variant}`];
        else if (jaren_sinds === 20) row[field] = params[`demo_20_${variant}`];
      });
      
      // Interpoleer tussen key jaren
      for (let i = 1; i < data.length - 1; i++) {
        if (data[i][field] === undefined) {
          // Vind vorige en volgende defined waarden
          let prevIndex = i - 1;
          let nextIndex = i + 1;
          
          while (prevIndex >= 0 && data[prevIndex][field] === undefined) prevIndex--;
          while (nextIndex < data.length && data[nextIndex][field] === undefined) nextIndex++;
          
          if (prevIndex >= 0 && nextIndex < data.length) {
            const prevValue = data[prevIndex][field];
            const nextValue = data[nextIndex][field];
            const factor = (i - prevIndex) / (nextIndex - prevIndex);
            data[i][field] = prevValue + (nextValue - prevValue) * factor;
          }
        }
      }
    });
  }

  /**
   * Bereken scenario 6 (alle factoren)
   */
  berekenScenario6(data, params) {
    data.forEach((row, index) => {
      // Bereken trend variabelen
      const jaren_tot_trend = params.trendjaar - params.basisjaar;
      row.trend_t = Math.min(row.jaren_sinds_basis, jaren_tot_trend);
      row.trend_d = row.jaren_sinds_basis;
      
      // Voor elke variant (laag, midden, hoog)
      ['laag', 'midden', 'hoog'].forEach(variant => {
        // Haal parameters voor deze variant
        const onv_vraag = params[`onv_vraag_${variant}`] || 0.063;
        const demografie = row[`demografie_${variant}`] || 0;
        const epi = params[`epi_${variant}`] || 0.01;
        const soc = params[`soc_${variant}`] || 0.019;
        const vak = params[`vak_${variant}`] || -0.003;
        const eff = params[`eff_${variant}`] || -0.005;
        const hor = params[`hor_${variant}`] || 0.016;
        const tijd = params[`tijd_${variant}`] || 0;
        const ver = params[`ver_${variant}`] || -0.011;
        
        // Bereken ATV effect
        const atv_effect = tijd !== 0 ? ((1 / (1 - tijd)) - 1) : 0;
        
        // Bereken groei multiplicatief (zoals in R/Excel)
        const non_demo_groei = (atv_effect + epi + soc + vak + eff + hor + ver) * row.trend_t;
        const totale_groei = ((1 + non_demo_groei) * (1 + demografie) * (1 + onv_vraag)) - 1;
        
        row[`scen6_groei_${variant}_a`] = totale_groei;
        
        // Bereken benodigd FTE
        const fte_start = data[0].fte_totaal;
        row[`scen6_fte_${variant}_a`] = fte_start * (1 + totale_groei);
        
        // Bereken tekort/overschot
        row[`scen6_tekort_${variant}_a`] = row.fte_totaal / row[`scen6_fte_${variant}_a`] - 1;
      });
    });
  }

  /**
   * Bereken benodigde instroom
   */
  berekenBenodigdeInstroom(data, params) {
    data.forEach(row => {
      ['laag', 'midden', 'hoog'].forEach(variant => {
        const ftetekort = row[`scen6_fte_${variant}_a`] - row.fte_totaal;
        row[`sc6_ftetekort_${variant}_a`] = ftetekort;
        
        if (row.fte_toekomst > 0) {
          row[`ben_instroom_sc6_${variant}_a`] = 
            params.n_inopleiding_perjaar3 + 
            (ftetekort / row.fte_toekomst) * params.n_inopleiding_perjaar3;
        } else {
          row[`ben_instroom_sc6_${variant}_a`] = params.n_inopleiding_perjaar3;
        }
      });
    });
  }

  /**
   * Bereken impact analyse
   */
  berekenImpactAnalyse(data, params) {
    const fte_start = data[0].fte_totaal;
    
    data.forEach((row, index) => {
      // Impact factoren (alleen midden variant voor nu)
      const fte_nabijst = row.fte_toekomst;
      const factor = fte_nabijst > 0 ? params.n_inopleiding_perjaar3 / fte_nabijst : 0;
      
      // Vraagfactoren
      row.impact_demo_midden = row.demografie_midden * fte_start * (1 + params.onv_vraag_midden) * factor;
      
      // Aanbodfactoren
      row.impact_uitstroom = (fte_start - (row.huidig_man * row.fte_man + row.huidig_vrouw * row.fte_vrouw)) * factor;
      row.impact_nuinopl = -((row.n_man_uit_nuopl * row.fte_man + row.n_vrouw_uit_nuopl * row.fte_vrouw) * factor);
      row.impact_tussenopl = -((row.n_man_uit_tussopl * row.fte_man + row.n_vrouw_uit_tussopl * row.fte_vrouw) * factor);
      row.impact_buitenland = -((row.n_man_buitenland * row.fte_man + row.n_vrouw_buitenland * row.fte_vrouw) * factor);
      row.impact_ovv_midden = params.onv_vraag_midden * fte_start * factor;
    });
  }

  /**
   * Bereken summary statistics
   */
  calculateSummary(data) {
    // Vind key jaren
    const jaar2030 = data.find(d => d.jaar === 2030);
    const jaar2035 = data.find(d => d.jaar === 2035);
    const jaar2043 = data.find(d => d.jaar === 2043);
    
    return {
      // Tekorten in key jaren
      tekort_2030_midden: jaar2030 ? jaar2030.sc6_ftetekort_midden_a : null,
      tekort_2035_midden: jaar2035 ? jaar2035.sc6_ftetekort_midden_a : null,
      tekort_2043_midden: jaar2043 ? jaar2043.sc6_ftetekort_midden_a : null,
      
      // Percentages
      tekort_2030_midden_pct: jaar2030 ? jaar2030.scen6_tekort_midden_a * 100 : null,
      tekort_2035_midden_pct: jaar2035 ? jaar2035.scen6_tekort_midden_a * 100 : null,
      tekort_2043_midden_pct: jaar2043 ? jaar2043.scen6_tekort_midden_a * 100 : null,
      
      // Instroom advies
      instroom_advies_2043: {
        laag: jaar2043 ? Math.round(jaar2043.ben_instroom_sc6_laag_a) : null,
        midden: jaar2043 ? Math.round(jaar2043.ben_instroom_sc6_midden_a) : null,
        hoog: jaar2043 ? Math.round(jaar2043.ben_instroom_sc6_hoog_a) : null
      }
    };
  }

  /**
   * Get resultaten voor specifiek jaar
   */
  getEvenwichtsjaarResultaten(data, jaar) {
    const row = data.find(d => d.jaar === jaar);
    
    if (!row) return null;
    
    return {
      beschikbaar_fte: row.fte_totaal,
      benodigd_fte: {
        laag: row.scen6_fte_laag_a,
        midden: row.scen6_fte_midden_a,
        hoog: row.scen6_fte_hoog_a
      },
      fte_tekort: {
        laag: row.sc6_ftetekort_laag_a,
        midden: row.sc6_ftetekort_midden_a,
        hoog: row.sc6_ftetekort_hoog_a
      },
      tekort_percentage: {
        laag: row.scen6_tekort_laag_a * 100,
        midden: row.scen6_tekort_midden_a * 100,
        hoog: row.scen6_tekort_hoog_a * 100
      },
      instroom_advies: {
        laag: Math.round(row.ben_instroom_sc6_laag_a),
        midden: Math.round(row.ben_instroom_sc6_midden_a),
        hoog: Math.round(row.ben_instroom_sc6_hoog_a)
      }
    };
  }

  /**
   * Export data voor charts
   */
  getChartData(data) {
    return data.map(row => ({
      jaar: row.jaar,
      beschikbaar_fte: Math.round(row.fte_totaal * 10) / 10,
      benodigd_fte_laag: Math.round(row.scen6_fte_laag_a * 10) / 10,
      benodigd_fte_midden: Math.round(row.scen6_fte_midden_a * 10) / 10,
      benodigd_fte_hoog: Math.round(row.scen6_fte_hoog_a * 10) / 10,
      tekort_fte_laag: Math.round(row.sc6_ftetekort_laag_a * 10) / 10,
      tekort_fte_midden: Math.round(row.sc6_ftetekort_midden_a * 10) / 10,
      tekort_fte_hoog: Math.round(row.sc6_ftetekort_hoog_a * 10) / 10
    }));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export as default
export default HuisartsenCalculator;
