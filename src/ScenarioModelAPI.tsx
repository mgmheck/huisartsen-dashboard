import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScenarioParameters {
  instroom: number;
  intern_rendement: number;
  opleidingsduur: number;
  fte_vrouw: number;
  fte_man: number;
  // Extern rendement - 8 individuele parameters (4 vrouwen, 4 mannen)
  extern_rendement_vrouw_1jaar: number;
  extern_rendement_vrouw_5jaar: number;
  extern_rendement_vrouw_10jaar: number;
  extern_rendement_vrouw_15jaar: number;
  extern_rendement_man_1jaar: number;
  extern_rendement_man_5jaar: number;
  extern_rendement_man_10jaar: number;
  extern_rendement_man_15jaar: number;
  // Uitstroom - 8 parameters (4 periodes × 2 geslachten)
  uitstroom_vrouw_5j: number;
  uitstroom_man_5j: number;
  uitstroom_vrouw_10j: number;
  uitstroom_man_10j: number;
  uitstroom_vrouw_15j: number;
  uitstroom_man_15j: number;
  uitstroom_vrouw_20j: number;
  uitstroom_man_20j: number;
  // Vraagcomponenten (hebben altijd een waarde)
  epi_midden: number;
  soc_midden: number;
  vak_midden: number;
  eff_midden: number;
  hor_midden: number;
  tijd_midden: number;
  ver_midden: number;
  totale_zorgvraag_excl_ATV_midden: number;
  demografie_factor?: number | null;
  uitstroom_factor_vrouw?: number | null;
  uitstroom_factor_man?: number | null;
}

interface ProjectieData {
  jaar: number;
  aanbod_fte: number;
  benodigd_fte: number;
  gap_fte: number;
  gap_percentage: number;
  aanbod_personen: number;
  vrouwen: number;
  mannen: number;
  huidig_cohort: number;
  cohort1_nuopl: number;
  cohort2_tussen: number;
  cohort3_nabijst: number;
}

// Helper functie voor Nederlandse nummer notatie (komma i.p.v. punt)
const formatDutchNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals).replace('.', ',');
};

// API URL configuratie - gebruik environment variable of fallback naar localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const ScenarioModelAPI = () => {
  // Voorkeursscenario baseline waarden (2025 defaults)
  const BASELINE = {
    instroom: 718,
    intern_rendement: 0.94,
    opleidingsduur: 3.0,
    fte_vrouw: 0.72,
    fte_man: 0.81,
    extern_rendement_vrouw_1jaar: 0.989,
    extern_rendement_vrouw_5jaar: 0.943,
    extern_rendement_vrouw_10jaar: 0.889,
    extern_rendement_vrouw_15jaar: 0.851,
    extern_rendement_man_1jaar: 0.992,
    extern_rendement_man_5jaar: 0.959,
    extern_rendement_man_10jaar: 0.931,
    extern_rendement_man_15jaar: 0.905,
    uitstroom_vrouw_5j: 0.116,
    uitstroom_man_5j: 0.226,
    uitstroom_vrouw_10j: 0.232,
    uitstroom_man_10j: 0.373,
    uitstroom_vrouw_15j: 0.371,
    uitstroom_man_15j: 0.502,
    uitstroom_vrouw_20j: 0.51,
    uitstroom_man_20j: 0.632,
    epi_midden: 0.01,
    soc_midden: 0.019,
    vak_midden: -0.003,
    eff_midden: -0.005,
    hor_midden: 0.016,
    tijd_midden: 0.0,
    ver_midden: -0.011,
    totale_zorgvraag_excl_ATV_midden: 0.026,
  };

  const [scenario, setScenario] = useState<ScenarioParameters>({
    instroom: 718,
    intern_rendement: 0.94,
    opleidingsduur: 3.0,
    fte_vrouw: 0.72,
    fte_man: 0.81,
    // Extern rendement - CSV default waarden uit Capaciteitsplan 2025
    extern_rendement_vrouw_1jaar: 0.989,
    extern_rendement_vrouw_5jaar: 0.943,
    extern_rendement_vrouw_10jaar: 0.889,
    extern_rendement_vrouw_15jaar: 0.851,
    extern_rendement_man_1jaar: 0.992,
    extern_rendement_man_5jaar: 0.959,
    extern_rendement_man_10jaar: 0.931,
    extern_rendement_man_15jaar: 0.905,
    // Uitstroom - CSV default waarden uit Capaciteitsplan 2025
    uitstroom_vrouw_5j: 0.116,
    uitstroom_man_5j: 0.226,
    uitstroom_vrouw_10j: 0.232,
    uitstroom_man_10j: 0.373,
    uitstroom_vrouw_15j: 0.371,
    uitstroom_man_15j: 0.502,
    uitstroom_vrouw_20j: 0.51,
    uitstroom_man_20j: 0.632,
    // Vraagcomponenten - CSV default waarden uit Capaciteitsplan 2025
    epi_midden: 0.01,
    soc_midden: 0.019,
    vak_midden: -0.003,
    eff_midden: -0.005,
    hor_midden: 0.016,
    tijd_midden: 0.0,
    ver_midden: -0.011,
    totale_zorgvraag_excl_ATV_midden: 0.026,
    // Demografie en uitstroom factors (null = gebruik CSV defaults)
    demografie_factor: null,
    uitstroom_factor_vrouw: null,
    uitstroom_factor_man: null,
  });

  const [projectie, setProjectie] = useState<ProjectieData[]>([]);
  const [baseline, setBaseline] = useState<ProjectieData[]>([]);
  const [instroomadvies, setInstroomadvies] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  // Load scenario function - defined before useEffect that uses it
  const loadScenario = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build request body - ALLEEN stuur parameters als ze NIET null/default zijn
      // null → stuur niet mee zodat CSV tijd-afhankelijke defaults gebruikt worden
      const requestBody: any = {
        instroom: scenario.instroom,
        intern_rendement: scenario.intern_rendement,
        opleidingsduur: scenario.opleidingsduur,
        fte_vrouw: scenario.fte_vrouw,
        fte_man: scenario.fte_man,
      };

      // Extern rendement - altijd meesturen (8 individuele waarden)
      requestBody.extern_rendement_vrouw_1jaar = scenario.extern_rendement_vrouw_1jaar;
      requestBody.extern_rendement_vrouw_5jaar = scenario.extern_rendement_vrouw_5jaar;
      requestBody.extern_rendement_vrouw_10jaar = scenario.extern_rendement_vrouw_10jaar;
      requestBody.extern_rendement_vrouw_15jaar = scenario.extern_rendement_vrouw_15jaar;
      requestBody.extern_rendement_man_1jaar = scenario.extern_rendement_man_1jaar;
      requestBody.extern_rendement_man_5jaar = scenario.extern_rendement_man_5jaar;
      requestBody.extern_rendement_man_10jaar = scenario.extern_rendement_man_10jaar;
      requestBody.extern_rendement_man_15jaar = scenario.extern_rendement_man_15jaar;

      // Vraagcomponenten - altijd meesturen (hebben altijd een waarde)
      requestBody.epi_midden = scenario.epi_midden;
      requestBody.soc_midden = scenario.soc_midden;
      requestBody.vak_midden = scenario.vak_midden;
      requestBody.eff_midden = scenario.eff_midden;
      requestBody.hor_midden = scenario.hor_midden;
      requestBody.tijd_midden = scenario.tijd_midden;
      requestBody.ver_midden = scenario.ver_midden;
      requestBody.totale_zorgvraag_excl_ATV_midden = scenario.totale_zorgvraag_excl_ATV_midden;

      // Uitstroom parameters - altijd meesturen (8 individuele waarden)
      requestBody.uitstroom_vrouw_5j = scenario.uitstroom_vrouw_5j;
      requestBody.uitstroom_man_5j = scenario.uitstroom_man_5j;
      requestBody.uitstroom_vrouw_10j = scenario.uitstroom_vrouw_10j;
      requestBody.uitstroom_man_10j = scenario.uitstroom_man_10j;
      requestBody.uitstroom_vrouw_15j = scenario.uitstroom_vrouw_15j;
      requestBody.uitstroom_man_15j = scenario.uitstroom_man_15j;
      requestBody.uitstroom_vrouw_20j = scenario.uitstroom_vrouw_20j;
      requestBody.uitstroom_man_20j = scenario.uitstroom_man_20j;

      // Demografie en uitstroom factors - alleen meesturen als niet-null
      if (scenario.demografie_factor !== null) requestBody.demografie_factor = scenario.demografie_factor;
      if (scenario.uitstroom_factor_vrouw !== null) requestBody.uitstroom_factor_vrouw = scenario.uitstroom_factor_vrouw;
      if (scenario.uitstroom_factor_man !== null) requestBody.uitstroom_factor_man = scenario.uitstroom_factor_man;

      const response = await fetch(`${API_URL}/api/scenario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setProjectie(data.projectie);
      setInstroomadvies(data.instroomadvies_2043 || null);

      // Debug logging
      console.log('📊 API Response ontvangen:');
      console.log('   instroomadvies_2043:', data.instroomadvies_2043);
      console.log('   impact_analysis:', data.impact_analysis ? 'PRESENT' : 'MISSING');
      if (data.impact_analysis) {
        console.log('   scenario6 totaal:', data.impact_analysis.scenario_totalen.scenario6);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const loadBaseline = async () => {
    try {
      const response = await fetch(`${API_URL}/api/baseline`);
      const data = await response.json();
      setBaseline(data.projectie);
    } catch (err) {
      console.error('Failed to load baseline:', err);
    }
  };

  // Check API health
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') {
          setApiConnected(true);
        }
      })
      .catch(() => setApiConnected(false));
  }, []);

  // Load baseline on mount
  useEffect(() => {
    if (apiConnected) {
      loadBaseline();
      // Load initial scenario (voorkeursscenario)
      loadScenario();
    }
  }, [apiConnected, loadScenario]);

  // Manual calculation trigger - gebruiker past eerst alle parameters aan
  // en klikt dan op "Bereken scenario" om berekening te starten
  const handleCalculate = () => {
    if (apiConnected && !loading) {
      loadScenario();
    }
  };

  // Merge projectie en baseline voor chart - MEMOIZED for performance
  const combinedData = useMemo(() => projectie.map((item, idx) => ({
    jaar: item.jaar,
    aanbod_fte: item.aanbod_fte,
    benodigd_fte: item.benodigd_fte,
    gap_fte: item.gap_fte,
    aanbod_baseline: baseline?.[idx]?.aanbod_fte || null,
    benodigd_baseline: baseline?.[idx]?.benodigd_fte || null,
  })), [projectie, baseline]);

  const evenwichtsjaar2043 = projectie.find(d => d.jaar === 2043);
  const baseline2043 = baseline?.find(d => d.jaar === 2043);

  if (!apiConnected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{ fontSize: '1.5rem', color: '#D76628', fontWeight: 'bold' }}>Python API niet verbonden</div>
        <div style={{ fontSize: '1rem', color: '#666', maxWidth: '600px', textAlign: 'center' }}>
          Start de Python API server met:<br />
          <code style={{ backgroundColor: '#f0f0f0', padding: '0.5rem', borderRadius: '0.25rem', display: 'block', marginTop: '0.5rem' }}>
            cd api && source venv/bin/activate && python scenario_model.py
          </code>
        </div>
      </div>
    );
  }

  if (loading && projectie.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '1.5rem', color: '#006583' }}>Berekeningen uitvoeren...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006583', marginBottom: '0' }}>
              Interactief Scenario Model Kamer Huisartsen 2025
            </h1>
            {loading && (
              <div style={{ fontSize: '0.875rem', color: '#006470', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #006470',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                <span>Berekenen...</span>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div style={{ display: 'flex', gap: '1.5rem' }}>

          {/* Linkerzijbalk: Scenario Controls */}
          <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* ========== SECTIE 1: AANBOD ========== */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem', border: '2px solid #000' }}>
              <div style={{ paddingTop: '0', marginTop: '0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0F2B5B', marginBottom: '0' }}>
                    📦 Aanbod
                  </h3>
                  <button
                    onClick={() => setScenario({...scenario,
                      instroom: BASELINE.instroom,
                      fte_vrouw: BASELINE.fte_vrouw,
                      fte_man: BASELINE.fte_man,
                      uitstroom_vrouw_5j: BASELINE.uitstroom_vrouw_5j,
                      uitstroom_man_5j: BASELINE.uitstroom_man_5j,
                      uitstroom_vrouw_10j: BASELINE.uitstroom_vrouw_10j,
                      uitstroom_man_10j: BASELINE.uitstroom_man_10j,
                      uitstroom_vrouw_15j: BASELINE.uitstroom_vrouw_15j,
                      uitstroom_man_15j: BASELINE.uitstroom_man_15j,
                      uitstroom_vrouw_20j: BASELINE.uitstroom_vrouw_20j,
                      uitstroom_man_20j: BASELINE.uitstroom_man_20j,
                    })}
                    title="Reset naar voorkeursscenario"
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      backgroundColor: '#0F2B5B',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🔄
                  </button>
                </div>

                {/* Instroom opleiding */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                    Instroom opleiding
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={scenario.instroom}
                    onChange={(e) => setScenario({...scenario, instroom: parseFloat(e.target.value)})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                  />
                  <input
                    type="range"
                    min="600"
                    max="1500"
                    step="10"
                    value={scenario.instroom}
                    onChange={(e) => setScenario({...scenario, instroom: parseFloat(e.target.value)})}
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Vastgestelde waarde: {BASELINE.instroom}
                  </div>
                </div>

                {/* FTE-factors naast elkaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* FTE-factor vrouw */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      FTE-factor vrouw
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={scenario.fte_vrouw.toFixed(2)}
                      onChange={(e) => setScenario({...scenario, fte_vrouw: parseFloat(e.target.value)})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.01"
                      value={scenario.fte_vrouw}
                      onChange={(e) => setScenario({...scenario, fte_vrouw: parseFloat(e.target.value)})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {BASELINE.fte_vrouw}
                    </div>
                  </div>

                  {/* FTE-factor man */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      FTE-factor man
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={scenario.fte_man.toFixed(2)}
                      onChange={(e) => setScenario({...scenario, fte_man: parseFloat(e.target.value)})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.01"
                      value={scenario.fte_man}
                      onChange={(e) => setScenario({...scenario, fte_man: parseFloat(e.target.value)})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {BASELINE.fte_man}
                    </div>
                  </div>
                </div>

                {/* Uitstroom parameters naast elkaar - 5 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Uitstroom vrouw 5j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom vrouw (5 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_vrouw_5j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_5j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="0.1"
                      value={scenario.uitstroom_vrouw_5j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_5j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_vrouw_5j * 100, 1)}%
                    </div>
                  </div>

                  {/* Uitstroom man 5j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom man (5 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_man_5j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_5j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="0.1"
                      value={scenario.uitstroom_man_5j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_5j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_man_5j * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Uitstroom 10 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Uitstroom vrouw 10j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom vrouw (10 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_vrouw_10j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_10j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="0.1"
                      value={scenario.uitstroom_vrouw_10j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_10j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_vrouw_10j * 100, 1)}%
                    </div>
                  </div>

                  {/* Uitstroom man 10j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom man (10 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_man_10j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_10j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="0.1"
                      value={scenario.uitstroom_man_10j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_10j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_man_10j * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Uitstroom 15 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Uitstroom vrouw 15j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom vrouw (15 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_vrouw_15j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_15j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="0.1"
                      value={scenario.uitstroom_vrouw_15j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_15j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_vrouw_15j * 100, 1)}%
                    </div>
                  </div>

                  {/* Uitstroom man 15j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom man (15 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_man_15j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_15j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="0.1"
                      value={scenario.uitstroom_man_15j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_15j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_man_15j * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Uitstroom 20 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Uitstroom vrouw 20j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom vrouw (20 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_vrouw_20j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_20j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="0.1"
                      value={scenario.uitstroom_vrouw_20j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_vrouw_20j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_vrouw_20j * 100, 1)}%
                    </div>
                  </div>

                  {/* Uitstroom man 20j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Uitstroom man (20 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={(scenario.uitstroom_man_20j * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_20j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="20"
                      max="70"
                      step="0.1"
                      value={scenario.uitstroom_man_20j * 100}
                      onChange={(e) => setScenario({...scenario, uitstroom_man_20j: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.uitstroom_man_20j * 100, 1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== SECTIE 2: OPLEIDING ========== */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem', border: '2px solid #000' }}>
              <div style={{ paddingTop: '0', marginTop: '0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0F2B5B', marginBottom: '0' }}>
                    🎓 Opleiding
                  </h3>
                  <button
                    onClick={() => setScenario({...scenario,
                      intern_rendement: BASELINE.intern_rendement,
                      opleidingsduur: BASELINE.opleidingsduur,
                      extern_rendement_vrouw_1jaar: BASELINE.extern_rendement_vrouw_1jaar,
                      extern_rendement_vrouw_5jaar: BASELINE.extern_rendement_vrouw_5jaar,
                      extern_rendement_vrouw_10jaar: BASELINE.extern_rendement_vrouw_10jaar,
                      extern_rendement_vrouw_15jaar: BASELINE.extern_rendement_vrouw_15jaar,
                      extern_rendement_man_1jaar: BASELINE.extern_rendement_man_1jaar,
                      extern_rendement_man_5jaar: BASELINE.extern_rendement_man_5jaar,
                      extern_rendement_man_10jaar: BASELINE.extern_rendement_man_10jaar,
                      extern_rendement_man_15jaar: BASELINE.extern_rendement_man_15jaar,
                    })}
                    title="Reset naar voorkeursscenario"
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      backgroundColor: '#0F2B5B',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🔄
                  </button>
                </div>

                {/* Intern rendement */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                    Intern rendement
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.7"
                    max="1.0"
                    value={scenario.intern_rendement}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setScenario({...scenario, intern_rendement: value});
                      }
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                  />
                  <input
                    type="range"
                    min="0.7"
                    max="1.0"
                    step="0.01"
                    value={scenario.intern_rendement}
                    onChange={(e) => setScenario({...scenario, intern_rendement: parseFloat(e.target.value)})}
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Vastgestelde waarde: {formatDutchNumber(BASELINE.intern_rendement * 100, 0)}%
                  </div>
                </div>

                {/* Opleidingsduur */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                    Opleidingsduur (jaren)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="2.0"
                    max="4.0"
                    value={scenario.opleidingsduur}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setScenario({...scenario, opleidingsduur: value});
                      }
                    }}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                  />
                  <input
                    type="range"
                    min="2.0"
                    max="4.0"
                    step="0.1"
                    value={scenario.opleidingsduur}
                    onChange={(e) => setScenario({...scenario, opleidingsduur: parseFloat(e.target.value)})}
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Vastgestelde waarde: {formatDutchNumber(BASELINE.opleidingsduur, 1)} jaar
                  </div>
                </div>

                {/* Extern rendement 1 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Extern rendement vrouw 1j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement vrouw (1 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_vrouw_1jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_1jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_vrouw_1jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_1jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_vrouw_1jaar * 100, 1)}%
                    </div>
                  </div>

                  {/* Extern rendement man 1j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement man (1 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_man_1jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_1jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_man_1jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_1jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_man_1jaar * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Extern rendement 5 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Extern rendement vrouw 5j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement vrouw (5 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_vrouw_5jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_5jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_vrouw_5jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_5jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_vrouw_5jaar * 100, 1)}%
                    </div>
                  </div>

                  {/* Extern rendement man 5j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement man (5 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_man_5jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_5jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_man_5jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_5jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_man_5jaar * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Extern rendement 10 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Extern rendement vrouw 10j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement vrouw (10 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_vrouw_10jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_10jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="70"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_vrouw_10jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_10jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_vrouw_10jaar * 100, 1)}%
                    </div>
                  </div>

                  {/* Extern rendement man 10j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement man (10 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_man_10jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_10jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="70"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_man_10jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_10jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_man_10jaar * 100, 1)}%
                    </div>
                  </div>
                </div>

                {/* Extern rendement 15 jaar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Extern rendement vrouw 15j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement vrouw (15 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_vrouw_15jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_15jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="70"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_vrouw_15jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_vrouw_15jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_vrouw_15jaar * 100, 1)}%
                    </div>
                  </div>

                  {/* Extern rendement man 15j */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Extern rendement man (15 jaar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={(scenario.extern_rendement_man_15jaar * 100).toFixed(1)}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_15jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="70"
                      max="100"
                      step="0.1"
                      value={scenario.extern_rendement_man_15jaar * 100}
                      onChange={(e) => setScenario({...scenario, extern_rendement_man_15jaar: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.extern_rendement_man_15jaar * 100, 1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== SECTIE 3: VRAAG ========== */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem', border: '2px solid #000' }}>
              <div style={{ paddingTop: '0', marginTop: '0', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0F2B5B', marginBottom: '0' }}>
                    📊 Vraag (Niet-demografische ontwikkelingen)
                  </h3>
                  <button
                    onClick={() => setScenario({...scenario,
                      epi_midden: BASELINE.epi_midden,
                      soc_midden: BASELINE.soc_midden,
                      vak_midden: BASELINE.vak_midden,
                      eff_midden: BASELINE.eff_midden,
                      hor_midden: BASELINE.hor_midden,
                      tijd_midden: BASELINE.tijd_midden,
                      ver_midden: BASELINE.ver_midden,
                      totale_zorgvraag_excl_ATV_midden: BASELINE.totale_zorgvraag_excl_ATV_midden,
                    })}
                    title="Reset naar voorkeursscenario"
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      backgroundColor: '#0F2B5B',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    🔄
                  </button>
                </div>

                {/* Row 1: Epidemiologie + Sociaal-cultureel */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Epidemiologie */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Epidemiologie
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.epi_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, epi_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.epi_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, epi_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.epi_midden * 100, 2)}%
                    </div>
                  </div>

                  {/* Sociaal-cultureel */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Sociaal-cultureel
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.soc_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, soc_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.soc_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, soc_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.soc_midden * 100, 2)}%
                    </div>
                  </div>
                </div>

                {/* Row 2: Vakinhoudelijk + Efficiency */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Vakinhoudelijk */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Vakinhoudelijk
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.vak_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, vak_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.vak_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, vak_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.vak_midden * 100, 2)}%
                    </div>
                  </div>

                  {/* Efficiency */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Efficiency
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.eff_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, eff_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.eff_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, eff_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.eff_midden * 100, 2)}%
                    </div>
                  </div>
                </div>

                {/* Row 3: Horizontale substitutie + Verticale substitutie */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {/* Horizontale substitutie */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Horizontale substitutie
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.hor_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, hor_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.hor_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, hor_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.hor_midden * 100, 2)}%
                    </div>
                  </div>

                  {/* Verticale substitutie */}
                  <div style={{ width: 'calc(50% - 0.25rem)' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                      Verticale substitutie
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={(scenario.ver_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, ver_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.01"
                      value={(scenario.ver_midden * 100).toFixed(2)}
                      onChange={(e) => setScenario({...scenario, ver_midden: parseFloat(e.target.value) / 100})}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Vastgestelde waarde: {formatDutchNumber(BASELINE.ver_midden * 100, 2)}%
                    </div>
                  </div>
                </div>

                {/* Row 4: Arbeidstijdverandering (alone) */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                    Arbeidstijdverandering
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={(scenario.tijd_midden * 100).toFixed(2)}
                    onChange={(e) => setScenario({...scenario, tijd_midden: parseFloat(e.target.value) / 100})}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem', marginBottom: '0.5rem', boxSizing: 'border-box' }}
                  />
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.01"
                    value={(scenario.tijd_midden * 100).toFixed(2)}
                    onChange={(e) => setScenario({...scenario, tijd_midden: parseFloat(e.target.value) / 100})}
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Vastgestelde waarde: {formatDutchNumber(BASELINE.tijd_midden * 100, 2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Reset knop */}
            <button
                onClick={() => setScenario({
                  instroom: 718,
                  intern_rendement: 0.94,
                  opleidingsduur: 3.0,
                  fte_vrouw: 0.72,
                  fte_man: 0.81,
                  // Reset extern rendement naar CSV defaults (8 waarden)
                  extern_rendement_vrouw_1jaar: 0.989,
                  extern_rendement_vrouw_5jaar: 0.943,
                  extern_rendement_vrouw_10jaar: 0.889,
                  extern_rendement_vrouw_15jaar: 0.851,
                  extern_rendement_man_1jaar: 0.992,
                  extern_rendement_man_5jaar: 0.959,
                  extern_rendement_man_10jaar: 0.931,
                  extern_rendement_man_15jaar: 0.905,
                  uitstroom_vrouw_5j: 0.116,
                  uitstroom_man_5j: 0.226,
                  uitstroom_vrouw_10j: 0.232,
                  uitstroom_man_10j: 0.373,
                  uitstroom_vrouw_15j: 0.371,
                  uitstroom_man_15j: 0.502,
                  uitstroom_vrouw_20j: 0.51,
                  uitstroom_man_20j: 0.632,
                  // Reset vraagcomponenten naar CSV defaults
                  epi_midden: 0.01,
                  soc_midden: 0.019,
                  vak_midden: -0.003,
                  eff_midden: -0.005,
                  hor_midden: 0.016,
                  tijd_midden: 0.0,
                  ver_midden: -0.011,
                  totale_zorgvraag_excl_ATV_midden: 0.026,
                  // Reset demografie en uitstroom factors naar null
                  demografie_factor: null,
                  uitstroom_factor_vrouw: null,
                  uitstroom_factor_man: null,
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#0F2B5B',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                🔄 Reset naar voorkeursscenario
              </button>

              {/* Bereken scenario knop */}
              <button
                onClick={handleCalculate}
                disabled={loading || !apiConnected}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: loading || !apiConnected ? '#cccccc' : '#D76628',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading || !apiConnected ? 'not-allowed' : 'pointer',
                  marginTop: '1.5rem',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? '⏳ Berekenen...' : '🚀 Bereken scenario'}
              </button>

            {loading && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffbea', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#996600' }}>
                ⏳ Berekeningen uitvoeren...
              </div>
            )}

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffe5e5', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#D76628' }}>
                ❌ Fout: {error}
              </div>
            )}
          </div>

          {/* Rechterkant: Visualisaties */}
          <div style={{ width: '65%', position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>

            {/* Container met zwart kader om tegels en grafiek */}
            <div style={{ border: '2px solid #000', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>

              {/* KPI Tegels - 2 Rijen */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Rij 1: Voorkeursscenario (Baseline) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F2B5B' }}>
                      Volgens voorkeursscenario:
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aanbod in 2043: {Math.round(baseline2043?.aanbod_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Vraag in 2043: {Math.round(baseline2043?.benodigd_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Voorkeursadvies: 1.026 personen
                    </div>
                  </div>
                </div>

                {/* Rij 2: Jouw scenario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#006470' }}>
                      Volgens aangepast scenario:
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aangepast aanbod in 2043: {Math.round(evenwichtsjaar2043?.aanbod_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aangepaste vraag in 2043: {Math.round(evenwichtsjaar2043?.benodigd_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aangepaste instroomadvies: {Math.round(scenario.instroom).toLocaleString('nl-NL')} personen
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenario vs Baseline Chart */}
              <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', position: 'relative' }}>

                {/* Instroomadvies Tegel */}
                {instroomadvies !== null && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ddd',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 10
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F2B5B', marginBottom: '0.5rem' }}>
                      Aangepast instroomadvies voor evenwicht 2043
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#006470' }}>
                      {Math.round(instroomadvies).toLocaleString('nl-NL')} personen
                    </div>
                  </div>
                )}

                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="jaar" stroke="#666" style={{ fontSize: '14px' }} />
                    <YAxis
                      stroke="#666"
                      style={{ fontSize: '14px' }}
                      domain={[13000, 'auto']}
                      tickFormatter={(value) => value.toLocaleString('nl-NL')}
                      label={{ value: 'FTE', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fill: '#666' } }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                      formatter={(value: any) => Math.round(value).toLocaleString('nl-NL')}
                    />
                    <Legend
                      content={(props) => {
                        const { payload } = props;
                        if (!payload) return null;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                            {/* Rij 1: Aanbod items */}
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                              {payload.slice(0, 2).map((entry: any, index: number) => (
                                <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '40px',
                                    height: '0',
                                    borderTop: entry.payload?.strokeDasharray ? `2px dashed ${entry.color}` : `3px solid ${entry.color}`
                                  }} />
                                  <span style={{ fontSize: '14px', color: '#666' }}>{entry.value}</span>
                                </div>
                              ))}
                            </div>
                            {/* Rij 2: Vraag items */}
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                              {payload.slice(2, 4).map((entry: any, index: number) => (
                                <div key={`legend-${index + 2}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '40px',
                                    height: '0',
                                    borderTop: entry.payload?.strokeDasharray ? `2px dashed ${entry.color}` : `3px solid ${entry.color}`
                                  }} />
                                  <span style={{ fontSize: '14px', color: '#666' }}>{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />

                    {/* Aangepast scenario lijnen (solid) - Animations disabled for instant updates */}
                    <Line type="monotone" dataKey="aanbod_fte" name="Aanbod (aangepast scenario)" stroke="#0F2B5B" strokeWidth={3} dot={{ r: 4, fill: '#0F2B5B' }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="aanbod_baseline" name="Aanbod (voorkeursscenario)" stroke="#006470" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="benodigd_fte" name="Vraag (aangepast scenario)" stroke="#D76628" strokeWidth={3} dot={{ r: 4, fill: '#D76628' }} isAnimationActive={false} />
                    <Line type="monotone" dataKey="benodigd_baseline" name="Vraag (voorkeursscenario)" stroke="#D76628" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>

                {/* Tabel met FTE waarden per jaar */}
                <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Jaar</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Aanbod (aangepast)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Aanbod (voorkeur)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Vraag (aangepast)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Vraag (voorkeur)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectie.map((row: any, index: number) => (
                        <tr key={row.jaar}>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600', backgroundColor: '#f9f9f9' }}>
                            {row.jaar}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {Math.round(row.aanbod_fte).toLocaleString('nl-NL')}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {Math.round(combinedData[index].aanbod_baseline || 0).toLocaleString('nl-NL')}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {Math.round(row.benodigd_fte).toLocaleString('nl-NL')}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {Math.round(combinedData[index].benodigd_baseline || 0).toLocaleString('nl-NL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModelAPI;
