import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Type definitie voor CSV data
interface CSVRow {
  Categorie1: string;
  Categorie2: string;
  Data_type: string;
  Aantal_decimalen: string;
  Variabele: string;
  'actual-projection': string;
  raming_2010: string;
  raming_2013: string;
  raming_2016: string;
  raming_2019_demo: string;
  raming_2022: string;
  raming_2025: string;
}

interface ScenarioParameters {
  instroom: number;
  fteVrouw: number;
  fteMan: number;
  externRendement: number;
  uitstroomVrouw5j: number;
  uitstroomMan5j: number;
}

const ScenarioModel = () => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default scenario = huidige situatie 2025
  const [scenario, setScenario] = useState<ScenarioParameters>({
    instroom: 718,
    fteVrouw: 0.72,
    fteMan: 0.81,
    externRendement: 0.865,
    uitstroomVrouw5j: 0.116,
    uitstroomMan5j: 0.226,
  });

  // Laad CSV data
  useEffect(() => {
    const csvPath = '/data.csv'; // Relatief pad naar public folder

    fetch(csvPath)
      .then(response => response.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          delimiter: ';',
          skipEmptyLines: true,
          complete: (results) => {
            setCsvData(results.data as CSVRow[]);
            setLoading(false);
          },
          error: (err) => {
            setError(`CSV parsing error: ${err.message}`);
            setLoading(false);
          }
        });
      })
      .catch(err => {
        setError(`Fetch error: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // Helper functie: haal waarde uit CSV
  const getCSVValue = (variabele: string, column: string = 'raming_2025'): number => {
    const row = csvData.find(r => r.Variabele === variabele);
    if (!row) return 0;
    const value = row[column as keyof CSVRow];
    return typeof value === 'string' ? parseFloat(value.replace(',', '.')) : 0;
  };

  // Bereken scenario projectie (2025-2043)
  const scenarioProjection = useMemo(() => {
    if (csvData.length === 0) return [];

    const basisjaar = 2025;
    const evenwichtsjaar = 2043;
    const jaren = evenwichtsjaar - basisjaar;

    // Start waardes 2025
    const startAanbodPersonen = getCSVValue('aanbod_personen');
    const startPerVrouw = getCSVValue('per_vrouw_basis');
    const startPerVrouwOpleiding = getCSVValue('per_vrouw_opleiding');
    const internRendement = getCSVValue('intern_rendement');
    const opleidingsduur = getCSVValue('opleidingsduur');

    // Zorgvraag parameters
    const demoGrowth5j = getCSVValue('demo_5_midden');
    const nietDemoGrowth = getCSVValue('totale_zorgvraag_excl_ATV_midden');
    const onvervuldeVraag = getCSVValue('onv_vraag_midden');

    let projection = [];
    let huidigeAanbod = startAanbodPersonen;
    let huidigeFTE = huidigeAanbod * (startPerVrouw * scenario.fteVrouw + (1 - startPerVrouw) * scenario.fteMan);

    // Bereken vraag baseline
    let huidigeVraag = huidigeFTE * (1 + onvervuldeVraag);

    for (let jaar = 0; jaar <= jaren; jaar++) {
      const huidigjaar = basisjaar + jaar;

      // AANBOD BEREKENING
      // Instroom die jaar X het beroep ingaat (rekening houdend met opleidingsduur)
      const effectieveInstroom = jaar >= opleidingsduur
        ? scenario.instroom * internRendement * scenario.externRendement
        : 0;

      // Uitstroom berekening (gewogen gemiddelde man/vrouw)
      const uitstroomFactor = jaar > 0 && jaar % 5 === 0
        ? (startPerVrouw * scenario.uitstroomVrouw5j + (1 - startPerVrouw) * scenario.uitstroomMan5j)
        : 0;

      const uitstroom = huidigeAanbod * uitstroomFactor;

      // Update aanbod
      huidigeAanbod = huidigeAanbod + effectieveInstroom - uitstroom;

      // Bereken FTE (gewogen gemiddelde man/vrouw)
      huidigeFTE = huidigeAanbod * (startPerVrouw * scenario.fteVrouw + (1 - startPerVrouw) * scenario.fteMan);

      // VRAAG BEREKENING
      // Demografie: lineaire groei over tijd
      const demoFactor = 1 + (demoGrowth5j * (jaar / 5));

      // Niet-demografische groei (tot trendjaar 2035)
      const trendJaren = Math.min(jaar, 10); // trendjaar = 2035 = 10 jaar vanaf 2025
      const nietDemoFactor = 1 + (nietDemoGrowth * trendJaren);

      huidigeVraag = huidigeVraag * demoFactor * nietDemoFactor;

      projection.push({
        jaar: huidigjaar,
        aanbod: Math.round(huidigeFTE),
        vraag: Math.round(huidigeVraag),
        gap: Math.round(huidigeVraag - huidigeFTE),
        gapPercentage: ((huidigeVraag - huidigeFTE) / huidigeFTE * 100).toFixed(1),
      });
    }

    return projection;
  }, [csvData, scenario]);

  // Bereken baseline (huidige beleid)
  const baselineProjection = useMemo(() => {
    if (csvData.length === 0) return [];

    const basisjaar = 2025;
    const evenwichtsjaar = 2043;
    const jaren = evenwichtsjaar - basisjaar;

    const startAanbodPersonen = getCSVValue('aanbod_personen');
    const startPerVrouw = getCSVValue('per_vrouw_basis');
    const fteVrouw = getCSVValue('fte_vrouw_basis');
    const fteMan = getCSVValue('fte_man_basis');
    const internRendement = getCSVValue('intern_rendement');
    const instroom = getCSVValue('n_inopleiding_perjaar');
    const externRendement15j = getCSVValue('extern_rendement_totaal_15jaar');
    const opleidingsduur = getCSVValue('opleidingsduur');

    const demoGrowth5j = getCSVValue('demo_5_midden');
    const nietDemoGrowth = getCSVValue('totale_zorgvraag_excl_ATV_midden');
    const onvervuldeVraag = getCSVValue('onv_vraag_midden');

    let projection = [];
    let huidigeAanbod = startAanbodPersonen;
    let huidigeFTE = huidigeAanbod * (startPerVrouw * fteVrouw + (1 - startPerVrouw) * fteMan);
    let huidigeVraag = huidigeFTE * (1 + onvervuldeVraag);

    for (let jaar = 0; jaar <= jaren; jaar++) {
      const huidigjaar = basisjaar + jaar;

      const effectieveInstroom = jaar >= opleidingsduur
        ? instroom * internRendement * externRendement15j
        : 0;

      const uitstroomVrouw5j = getCSVValue('uitstroom_vrouw_basis_vijf');
      const uitstroomMan5j = getCSVValue('uitstroom_man_basis_vijf');
      const uitstroomFactor = jaar > 0 && jaar % 5 === 0
        ? (startPerVrouw * uitstroomVrouw5j + (1 - startPerVrouw) * uitstroomMan5j)
        : 0;

      const uitstroom = huidigeAanbod * uitstroomFactor;

      huidigeAanbod = huidigeAanbod + effectieveInstroom - uitstroom;
      huidigeFTE = huidigeAanbod * (startPerVrouw * fteVrouw + (1 - startPerVrouw) * fteMan);

      const demoFactor = 1 + (demoGrowth5j * (jaar / 5));
      const trendJaren = Math.min(jaar, 10);
      const nietDemoFactor = 1 + (nietDemoGrowth * trendJaren);

      huidigeVraag = huidigeVraag * demoFactor * nietDemoFactor;

      projection.push({
        jaar: huidigjaar,
        aanbod_baseline: Math.round(huidigeFTE),
        vraag_baseline: Math.round(huidigeVraag),
      });
    }

    return projection;
  }, [csvData]);

  // Merge scenario + baseline voor vergelijking
  const combinedData = useMemo(() => {
    return scenarioProjection.map((item, idx) => ({
      ...item,
      ...(baselineProjection[idx] || {}),
    }));
  }, [scenarioProjection, baselineProjection]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '1.5rem', color: '#006583' }}>Laden CSV data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ fontSize: '1.5rem', color: '#D76628' }}>Fout: {error}</div>
      </div>
    );
  }

  const evenwichtsjaar2043 = combinedData.find(d => d.jaar === 2043);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#006583', marginBottom: '0.5rem' }}>
              Interactief Scenario Model 2025-2043
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
              Pas parameters aan en zie direct de impact op het evenwicht tussen vraag en aanbod
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>

          {/* Linkerzijbalk: Scenario Controls */}
          <div style={{ width: '350px', flexShrink: 0 }}>
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', position: 'sticky', top: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0F2B5B', marginBottom: '1rem' }}>
                📊 Scenario Parameters
              </h2>

              {/* Instroom */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                  Instroom opleiding (per jaar)
                </label>
                <input
                  type="number"
                  value={scenario.instroom}
                  onChange={(e) => setScenario({...scenario, instroom: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="range"
                  min="500"
                  max="1000"
                  step="10"
                  value={scenario.instroom}
                  onChange={(e) => setScenario({...scenario, instroom: parseFloat(e.target.value)})}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Huidig: 718</div>
              </div>

              {/* FTE Vrouw */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                  FTE-factor vrouw (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scenario.fteVrouw}
                  onChange={(e) => setScenario({...scenario, fteVrouw: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.01"
                  value={scenario.fteVrouw}
                  onChange={(e) => setScenario({...scenario, fteVrouw: parseFloat(e.target.value)})}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Huidig: 0.72 (72%)</div>
              </div>

              {/* FTE Man */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                  FTE-factor man (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scenario.fteMan}
                  onChange={(e) => setScenario({...scenario, fteMan: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.01"
                  value={scenario.fteMan}
                  onChange={(e) => setScenario({...scenario, fteMan: parseFloat(e.target.value)})}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Huidig: 0.81 (81%)</div>
              </div>

              {/* Extern Rendement */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#333', display: 'block', marginBottom: '0.5rem' }}>
                  Extern rendement 15j (0-1)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scenario.externRendement}
                  onChange={(e) => setScenario({...scenario, externRendement: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <input
                  type="range"
                  min="0.7"
                  max="1"
                  step="0.01"
                  value={scenario.externRendement}
                  onChange={(e) => setScenario({...scenario, externRendement: parseFloat(e.target.value)})}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>Huidig: 0.865 (86.5%)</div>
              </div>

              {/* Reset knop */}
              <button
                onClick={() => setScenario({
                  instroom: 718,
                  fteVrouw: 0.72,
                  fteMan: 0.81,
                  externRendement: 0.865,
                  uitstroomVrouw5j: 0.116,
                  uitstroomMan5j: 0.226,
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#D76628',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                🔄 Reset naar huidig beleid
              </button>
            </div>
          </div>

          {/* Hoofd content area */}
          <div style={{ flex: 1 }}>

            {/* KPI Tegels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#006583', marginBottom: '0.25rem' }}>Aanbod 2043</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#333', marginBottom: '0.25rem' }}>
                  {evenwichtsjaar2043?.aanbod.toLocaleString('nl-NL')} FTE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  Baseline: {evenwichtsjaar2043?.aanbod_baseline.toLocaleString('nl-NL')} FTE
                </div>
              </div>

              <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#006583', marginBottom: '0.25rem' }}>Vraag 2043</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#333', marginBottom: '0.25rem' }}>
                  {evenwichtsjaar2043?.vraag.toLocaleString('nl-NL')} FTE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  Baseline: {evenwichtsjaar2043?.vraag_baseline.toLocaleString('nl-NL')} FTE
                </div>
              </div>

              <div style={{ backgroundColor: evenwichtsjaar2043 && evenwichtsjaar2043.gap > 0 ? '#ffe5e5' : '#e5f5e5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#006583', marginBottom: '0.25rem' }}>Gap 2043</div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: evenwichtsjaar2043 && evenwichtsjaar2043.gap > 0 ? '#D76628' : '#006470', marginBottom: '0.25rem' }}>
                  {evenwichtsjaar2043?.gap > 0 ? '+' : ''}{evenwichtsjaar2043?.gap.toLocaleString('nl-NL')} FTE
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>
                  {evenwichtsjaar2043?.gapPercentage}% van aanbod
                </div>
              </div>
            </div>

            {/* Scenario vs Baseline Chart */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                Projectie 2025-2043: Scenario vs Baseline
              </h2>
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="jaar" stroke="#666" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '14px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Legend />

                  {/* Baseline lijnen (gestippeld) */}
                  <Line type="monotone" dataKey="aanbod_baseline" name="Aanbod (huidig beleid)" stroke="#006470" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="vraag_baseline" name="Vraag (huidig beleid)" stroke="#D76628" strokeWidth={2} strokeDasharray="5 5" dot={false} />

                  {/* Scenario lijnen (solid) */}
                  <Line type="monotone" dataKey="aanbod" name="Aanbod (jouw scenario)" stroke="#0F2B5B" strokeWidth={3} dot={{ r: 4, fill: '#0F2B5B' }} />
                  <Line type="monotone" dataKey="vraag" name="Vraag" stroke="#D76628" strokeWidth={3} dot={{ r: 4, fill: '#D76628' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gap Area Chart */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                Gap tussen Vraag en Aanbod (FTE)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="jaar" stroke="#666" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '14px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="gap" name="Gap (FTE)" fill="#D76628" fillOpacity={0.3} stroke="#D76628" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#006583' }}>
              <p>Bron: Capaciteitsorgaan | Bestand: 2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModel;
