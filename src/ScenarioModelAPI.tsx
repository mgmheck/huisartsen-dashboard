import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import NumberInputWithSlider from './components/NumberInputWithSlider';
import KPICard from './components/KPICard';
import SectionHeader from './components/SectionHeader';
import { STYLES } from './styles/constants';
import { formatWithThousandsSeparator } from './utils/formatters';
import { BASELINE, BASELINE_INSTROOMADVIES } from './data/baseline-config';

interface ScenarioParameters {
  instroom: number;
  intern_rendement: number;
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

const ScenarioModelAPI = () => {
  const [scenario, setScenario] = useState<ScenarioParameters>({ ...BASELINE, demografie_factor: null, uitstroom_factor_vrouw: null, uitstroom_factor_man: null });
  const [projectie, setProjectie] = useState<ProjectieData[]>([]);
  const [baseline, setBaseline] = useState<ProjectieData[]>([]);
  const [instroomadvies, setInstroomadvies] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);

  // Check API health
  useEffect(() => {
    fetch('http://localhost:5001/health')
      .then(res => res.json())
      .then(data => { if (data.status === 'healthy') setApiConnected(true); })
      .catch(() => setApiConnected(false));
  }, []);

  // Load baseline on mount
  useEffect(() => {
    if (apiConnected) loadBaseline();
  }, [apiConnected]);

  // Load scenario when parameters change
  useEffect(() => {
    if (apiConnected) {
      const debounce = setTimeout(() => loadScenario(), 500);
      return () => clearTimeout(debounce);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, apiConnected]);

  const loadBaseline = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/baseline');
      const data = await response.json();
      setBaseline(data.projectie);
    } catch (err) {
      console.error('Failed to load baseline:', err);
    }
  };

  const loadScenario = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = { ...scenario };
      if (scenario.demografie_factor === null) delete requestBody.demografie_factor;
      if (scenario.uitstroom_factor_vrouw === null) delete requestBody.uitstroom_factor_vrouw;
      if (scenario.uitstroom_factor_man === null) delete requestBody.uitstroom_factor_man;

      const response = await fetch('http://localhost:5001/api/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data = await response.json();
      setProjectie(data.projectie);
      setInstroomadvies(data.instroomadvies_2043 || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateScenario = (updates: Partial<ScenarioParameters>) => {
    setScenario(prev => ({ ...prev, ...updates }));
  };

  const resetToBaseline = () => {
    setScenario({ ...BASELINE, demografie_factor: null, uitstroom_factor_vrouw: null, uitstroom_factor_man: null });
  };

  const resetAanbod = () => {
    updateScenario({
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
    });
  };

  const resetOpleiding = () => {
    updateScenario({
      intern_rendement: BASELINE.intern_rendement,
      extern_rendement_vrouw_1jaar: BASELINE.extern_rendement_vrouw_1jaar,
      extern_rendement_vrouw_5jaar: BASELINE.extern_rendement_vrouw_5jaar,
      extern_rendement_vrouw_10jaar: BASELINE.extern_rendement_vrouw_10jaar,
      extern_rendement_vrouw_15jaar: BASELINE.extern_rendement_vrouw_15jaar,
      extern_rendement_man_1jaar: BASELINE.extern_rendement_man_1jaar,
      extern_rendement_man_5jaar: BASELINE.extern_rendement_man_5jaar,
      extern_rendement_man_10jaar: BASELINE.extern_rendement_man_10jaar,
      extern_rendement_man_15jaar: BASELINE.extern_rendement_man_15jaar,
    });
  };

  const resetVraag = () => {
    updateScenario({
      epi_midden: BASELINE.epi_midden,
      soc_midden: BASELINE.soc_midden,
      vak_midden: BASELINE.vak_midden,
      eff_midden: BASELINE.eff_midden,
      hor_midden: BASELINE.hor_midden,
      tijd_midden: BASELINE.tijd_midden,
      ver_midden: BASELINE.ver_midden,
      totale_zorgvraag_excl_ATV_midden: BASELINE.totale_zorgvraag_excl_ATV_midden,
    });
  };

  const combinedData = projectie.map((item, idx) => ({
    jaar: item.jaar,
    aanbod_fte: item.aanbod_fte,
    benodigd_fte: item.benodigd_fte,
    gap_fte: item.gap_fte,
    aanbod_baseline: baseline?.[idx]?.aanbod_fte || null,
    benodigd_baseline: baseline?.[idx]?.benodigd_fte || null,
  }));

  const evenwichtsjaar2043 = projectie.find(d => d.jaar === 2043);
  const baseline2043 = baseline?.find(d => d.jaar === 2043);

  if (!apiConnected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <div style={{ fontSize: '1.5rem', color: STYLES.colors.orange, fontWeight: 'bold' }}>Python API niet verbonden</div>
        <div style={{ fontSize: '1rem', color: STYLES.colors.mediumGray, maxWidth: '600px', textAlign: 'center' }}>
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
        <div style={{ fontSize: '1.5rem', color: STYLES.colors.primary }}>Berekeningen uitvoeren...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: STYLES.colors.white, minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ ...STYLES.card, padding: '0.75rem 1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: STYLES.colors.primary, marginBottom: '0' }}>
              Interactief Scenario Model Kamer Huisartsen 2025
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>

          {/* Linkerzijbalk: Scenario Controls */}
          <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* SECTIE 1: AANBOD */}
            <div style={STYLES.section}>
              <SectionHeader icon="📦" title="Aanbod" onReset={resetAanbod} />

              <NumberInputWithSlider
                label="Instroom opleiding"
                value={scenario.instroom}
                onChange={(v) => updateScenario({ instroom: v })}
                min={600}
                max={1500}
                step={10}
                baseline={BASELINE.instroom}
              />

              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="FTE-factor vrouw"
                    value={scenario.fte_vrouw}
                    onChange={(v) => updateScenario({ fte_vrouw: v })}
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    baseline={BASELINE.fte_vrouw}
                    decimals={2}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="FTE-factor man"
                    value={scenario.fte_man}
                    onChange={(v) => updateScenario({ fte_man: v })}
                    min={0.5}
                    max={1.0}
                    step={0.01}
                    baseline={BASELINE.fte_man}
                    decimals={2}
                  />
                </div>
              </div>

              {/* Uitstroom 5 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom vrouw (5 jaar)"
                    value={scenario.uitstroom_vrouw_5j}
                    onChange={(v) => updateScenario({ uitstroom_vrouw_5j: v })}
                    min={0.05}
                    max={0.30}
                    step={0.001}
                    baseline={BASELINE.uitstroom_vrouw_5j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom man (5 jaar)"
                    value={scenario.uitstroom_man_5j}
                    onChange={(v) => updateScenario({ uitstroom_man_5j: v })}
                    min={0.05}
                    max={0.30}
                    step={0.001}
                    baseline={BASELINE.uitstroom_man_5j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Uitstroom 10 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom vrouw (10 jaar)"
                    value={scenario.uitstroom_vrouw_10j}
                    onChange={(v) => updateScenario({ uitstroom_vrouw_10j: v })}
                    min={0.10}
                    max={0.50}
                    step={0.001}
                    baseline={BASELINE.uitstroom_vrouw_10j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom man (10 jaar)"
                    value={scenario.uitstroom_man_10j}
                    onChange={(v) => updateScenario({ uitstroom_man_10j: v })}
                    min={0.10}
                    max={0.50}
                    step={0.001}
                    baseline={BASELINE.uitstroom_man_10j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Uitstroom 15 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom vrouw (15 jaar)"
                    value={scenario.uitstroom_vrouw_15j}
                    onChange={(v) => updateScenario({ uitstroom_vrouw_15j: v })}
                    min={0.15}
                    max={0.60}
                    step={0.001}
                    baseline={BASELINE.uitstroom_vrouw_15j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom man (15 jaar)"
                    value={scenario.uitstroom_man_15j}
                    onChange={(v) => updateScenario({ uitstroom_man_15j: v })}
                    min={0.15}
                    max={0.60}
                    step={0.001}
                    baseline={BASELINE.uitstroom_man_15j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Uitstroom 20 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom vrouw (20 jaar)"
                    value={scenario.uitstroom_vrouw_20j}
                    onChange={(v) => updateScenario({ uitstroom_vrouw_20j: v })}
                    min={0.20}
                    max={0.70}
                    step={0.001}
                    baseline={BASELINE.uitstroom_vrouw_20j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Uitstroom man (20 jaar)"
                    value={scenario.uitstroom_man_20j}
                    onChange={(v) => updateScenario({ uitstroom_man_20j: v })}
                    min={0.20}
                    max={0.70}
                    step={0.001}
                    baseline={BASELINE.uitstroom_man_20j}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>
            </div>

            {/* SECTIE 2: OPLEIDING */}
            <div style={STYLES.section}>
              <SectionHeader icon="🎓" title="Opleiding" onReset={resetOpleiding} />

              <NumberInputWithSlider
                label="Intern rendement"
                value={scenario.intern_rendement}
                onChange={(v) => updateScenario({ intern_rendement: v })}
                min={0.7}
                max={1.0}
                step={0.01}
                baseline={BASELINE.intern_rendement}
                unit="%"
                decimals={0}
                multiplier={100}
              />

              {/* Extern rendement 1 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement vrouw (1 jaar)"
                    value={scenario.extern_rendement_vrouw_1jaar}
                    onChange={(v) => updateScenario({ extern_rendement_vrouw_1jaar: v })}
                    min={0.80}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_vrouw_1jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement man (1 jaar)"
                    value={scenario.extern_rendement_man_1jaar}
                    onChange={(v) => updateScenario({ extern_rendement_man_1jaar: v })}
                    min={0.80}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_man_1jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Extern rendement 5 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement vrouw (5 jaar)"
                    value={scenario.extern_rendement_vrouw_5jaar}
                    onChange={(v) => updateScenario({ extern_rendement_vrouw_5jaar: v })}
                    min={0.80}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_vrouw_5jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement man (5 jaar)"
                    value={scenario.extern_rendement_man_5jaar}
                    onChange={(v) => updateScenario({ extern_rendement_man_5jaar: v })}
                    min={0.80}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_man_5jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Extern rendement 10 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement vrouw (10 jaar)"
                    value={scenario.extern_rendement_vrouw_10jaar}
                    onChange={(v) => updateScenario({ extern_rendement_vrouw_10jaar: v })}
                    min={0.70}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_vrouw_10jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement man (10 jaar)"
                    value={scenario.extern_rendement_man_10jaar}
                    onChange={(v) => updateScenario({ extern_rendement_man_10jaar: v })}
                    min={0.70}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_man_10jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>

              {/* Extern rendement 15 jaar */}
              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement vrouw (15 jaar)"
                    value={scenario.extern_rendement_vrouw_15jaar}
                    onChange={(v) => updateScenario({ extern_rendement_vrouw_15jaar: v })}
                    min={0.70}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_vrouw_15jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Extern rendement man (15 jaar)"
                    value={scenario.extern_rendement_man_15jaar}
                    onChange={(v) => updateScenario({ extern_rendement_man_15jaar: v })}
                    min={0.70}
                    max={1.0}
                    step={0.001}
                    baseline={BASELINE.extern_rendement_man_15jaar}
                    unit="%"
                    decimals={1}
                    multiplier={100}
                  />
                </div>
              </div>
            </div>

            {/* SECTIE 3: VRAAG */}
            <div style={STYLES.section}>
              <SectionHeader icon="📊" title="Vraag (Niet-demografische ontwikkelingen)" onReset={resetVraag} />

              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Epidemiologie"
                    value={scenario.epi_midden}
                    onChange={(v) => updateScenario({ epi_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.epi_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Sociaal-cultureel"
                    value={scenario.soc_midden}
                    onChange={(v) => updateScenario({ soc_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.soc_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
              </div>

              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Vakinhoudelijk"
                    value={scenario.vak_midden}
                    onChange={(v) => updateScenario({ vak_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.vak_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Efficiency"
                    value={scenario.eff_midden}
                    onChange={(v) => updateScenario({ eff_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.eff_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
              </div>

              <div style={STYLES.row}>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Horizontale substitutie"
                    value={scenario.hor_midden}
                    onChange={(v) => updateScenario({ hor_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.hor_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
                <div style={STYLES.halfWidth}>
                  <NumberInputWithSlider
                    label="Verticale substitutie"
                    value={scenario.ver_midden}
                    onChange={(v) => updateScenario({ ver_midden: v })}
                    min={-0.04}
                    max={0.04}
                    step={0.0001}
                    baseline={BASELINE.ver_midden}
                    unit="%"
                    decimals={2}
                    multiplier={100}
                  />
                </div>
              </div>

              <NumberInputWithSlider
                label="Arbeidstijdverandering"
                value={scenario.tijd_midden}
                onChange={(v) => updateScenario({ tijd_midden: v })}
                min={-0.04}
                max={0.04}
                step={0.0001}
                baseline={BASELINE.tijd_midden}
                unit="%"
                decimals={2}
                multiplier={100}
              />
            </div>

            {/* Reset knop */}
            <button onClick={resetToBaseline} style={STYLES.primaryButton}>
              🔄 Reset naar voorkeursscenario
            </button>

            {loading && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffbea', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#996600' }}>
                ⏳ Berekeningen uitvoeren...
              </div>
            )}

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffe5e5', borderRadius: '0.5rem', fontSize: '0.875rem', color: STYLES.colors.orange }}>
                ❌ Fout: {error}
              </div>
            )}
          </div>

          {/* Hoofd content area */}
          <div style={{ width: '65%', position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>

            {/* Container met zwart kader om tegels en grafiek */}
            <div style={{ border: '2px solid #000', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>

              {/* KPI Tegels - 2 Rijen */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Rij 1: Voorkeursscenario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <KPICard label="Volgens voorkeursscenario:" value="" textColor={STYLES.colors.navy} />
                  <KPICard label="" value={`Aanbod in 2043: ${formatWithThousandsSeparator(baseline2043?.aanbod_fte || 0)} FTE`} />
                  <KPICard label="" value={`Vraag in 2043: ${formatWithThousandsSeparator(baseline2043?.benodigd_fte || 0)} FTE`} />
                  <KPICard label="" value={`Voorkeursadvies: ${BASELINE_INSTROOMADVIES} personen`} />
                </div>

                {/* Rij 2: Jouw scenario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <KPICard label="Volgens aangepast scenario:" value="" backgroundColor="#e5f5f5" textColor={STYLES.colors.teal} />
                  <KPICard label="" value={`Aangepast aanbod in 2043: ${formatWithThousandsSeparator(evenwichtsjaar2043?.aanbod_fte || 0)} FTE`} backgroundColor="#e5f5f5" />
                  <KPICard label="" value={`Aangepaste vraag in 2043: ${formatWithThousandsSeparator(evenwichtsjaar2043?.benodigd_fte || 0)} FTE`} backgroundColor="#e5f5f5" />
                  <KPICard label="" value={`Aangepaste instroomadvies: ${Math.round(scenario.instroom)} personen`} backgroundColor="#e5f5f5" />
                </div>
              </div>

              {/* Scenario vs Baseline Chart */}
              <div style={{ ...STYLES.card, padding: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
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
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: STYLES.colors.navy, marginBottom: '0.5rem' }}>
                      Aangepast instroomadvies voor evenwicht 2043
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STYLES.colors.teal }}>
                      {formatWithThousandsSeparator(instroomadvies)} personen
                    </div>
                  </div>
                )}

                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="jaar" stroke={STYLES.colors.mediumGray} style={{ fontSize: '14px' }} />
                    <YAxis
                      stroke={STYLES.colors.mediumGray}
                      style={{ fontSize: '14px' }}
                      domain={[13000, 'auto']}
                      tickFormatter={(value) => formatWithThousandsSeparator(value)}
                      label={{ value: 'FTE', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fill: STYLES.colors.mediumGray } }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                      formatter={(value: any) => formatWithThousandsSeparator(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="aanbod_fte" name="Aanbod volgens aangepast scenario" stroke={STYLES.colors.navy} strokeWidth={3} dot={{ r: 4, fill: STYLES.colors.navy }} />
                    <Line type="monotone" dataKey="aanbod_baseline" name="Aanbod volgens voorkeursscenario" stroke={STYLES.colors.teal} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="benodigd_fte" name="Vraag volgens aangepast scenario" stroke={STYLES.colors.orange} strokeWidth={3} dot={{ r: 4, fill: STYLES.colors.orange }} />
                    <Line type="monotone" dataKey="benodigd_baseline" name="Vraag volgens voorkeursscenario" stroke={STYLES.colors.orange} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>

                {/* Tabel met FTE waarden per jaar */}
                <div style={{ marginTop: '2rem', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Jaar</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Aanbod volgens aangepast scenario (FTE)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Aanbod volgens voorkeursscenario (FTE)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Vraag volgens aangepast scenario (FTE)</th>
                        <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600' }}>Vraag volgens voorkeursscenario (FTE)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectie.map((row: any, index: number) => (
                        <tr key={row.jaar}>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center', fontWeight: '600', backgroundColor: '#f9f9f9' }}>
                            {row.jaar}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {formatWithThousandsSeparator(row.aanbod_fte)}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {formatWithThousandsSeparator(combinedData[index].aanbod_baseline)}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {formatWithThousandsSeparator(row.benodigd_fte)}
                          </td>
                          <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                            {formatWithThousandsSeparator(combinedData[index].benodigd_baseline)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: STYLES.colors.primary }}>
              <p>Bron: Capaciteitsorgaan | Bestand: 2025-10-22_Parameterwaarden-2010-2013-2016-2019-2025_DEF.csv</p>
              <p style={{ fontSize: '0.75rem', color: STYLES.colors.subtleGray, marginTop: '0.5rem' }}>
                Berekeningen: Officiële Stata methodologie | Python API backend | 3 Cohorten tracking
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioModelAPI;
