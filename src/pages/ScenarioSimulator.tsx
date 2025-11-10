import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useScenarioAPI } from '../hooks/useScenarioAPI';
import { ParameterSections } from '../components/simulator/ParameterSection';

/**
 * ScenarioSimulator Component
 * Gerefactorde versie van ScenarioModelAPI
 * Gebruikt generieke componenten en custom hooks
 * Van 1700+ regels naar ~400 regels
 */
const ScenarioSimulator: React.FC = () => {
  // Use custom hook voor alle API logic
  const {
    scenario,
    projectie,
    instroomadvies,
    loading,
    error,
    apiConnected,
    changedParams,
    updateParameter,
    resetToBaseline,
    calculateScenario,
    isParameterChanged,
    comparisonData,
    year2043
  } = useScenarioAPI();

  // Helper functie voor Nederlandse nummer notatie
  const formatDutchNumber = (value: number, decimals: number = 0): string => {
    return value.toFixed(decimals).replace('.', ',');
  };

  // API not connected state
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

  // Loading state (alleen bij eerste load)
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
          <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔮</span>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006583', marginBottom: '0' }}>
                    Scenario Simulator - Capaciteitsplan 2025-2030
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                    Interactieve scenario modellering met STATA-gevalideerde berekeningen
                  </p>
                </div>
              </div>
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
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div style={{ display: 'flex', gap: '1.5rem' }}>

          {/* Linkerzijbalk: Scenario Controls */}
          <div style={{ width: '35%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                onClick={calculateScenario}
                disabled={loading || !apiConnected || changedParams === 0}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: changedParams > 0 ? '#D76628' : '#cccccc',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: changedParams > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? 'Berekenen...' : `Herbereken scenario ${changedParams > 0 ? `(${changedParams} wijzigingen)` : ''}`}
              </button>
              <button
                onClick={resetToBaseline}
                title="Reset alle parameters naar voorkeursscenario"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  backgroundColor: '#0F2B5B',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🔄 Reset alles
              </button>
            </div>

            {/* Parameter Sections */}
            <ParameterSections
              scenario={scenario}
              onParameterChange={updateParameter}
              isParameterChanged={isParameterChanged}
              onReset={resetToBaseline}
            />

            {/* Status messages */}
            {loading && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#fffbea', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                color: '#996600' 
              }}>
                ⏳ Berekeningen uitvoeren...
              </div>
            )}

            {error && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                backgroundColor: '#ffe5e5', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                color: '#D76628' 
              }}>
                ❌ Fout: {error}
              </div>
            )}
          </div>

          {/* Rechterkant: Visualisaties */}
          <div style={{ width: '65%', position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>

            {/* Container met resultaten */}
            <div style={{ border: '2px solid #000', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>

              {/* KPI Tegels */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Rij 1: Voorkeursscenario (Baseline) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F2B5B' }}>
                      Voorkeursscenario 2043
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Baseline projectie
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aanbod: {Math.round(year2043.baseline?.aanbod_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Verwacht aanbod huisartsen
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Vraag: {Math.round(year2043.baseline?.benodigd_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Verwachte zorgvraag
                    </div>
                  </div>
                </div>

                {/* Rij 2: Aangepast scenario */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#006470' }}>
                      Aangepast scenario 2043
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      {changedParams} parameters gewijzigd
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Aanbod: {Math.round(year2043.scenario?.aanbod_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: year2043.scenario?.gap_fte || 0 > 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem', fontWeight: 'bold' }}>
                      Gap: {Math.round(year2043.scenario?.gap_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#e5f5f5', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      Vraag: {Math.round(year2043.scenario?.benodigd_fte || 0).toLocaleString('nl-NL')} FTE
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Bij huidige parameters
                    </div>
                  </div>
                </div>
              </div>

              {/* Instroomadvies */}
              {instroomadvies !== null && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #006470',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0F2B5B', marginBottom: '0.5rem' }}>
                    💡 Benodigd instroomadvies voor evenwicht in 2043
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#006470' }}>
                    {Math.round(instroomadvies).toLocaleString('nl-NL')} personen per jaar
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                    (huidig: {Math.round(scenario.instroom).toLocaleString('nl-NL')} | verschil: {Math.round(instroomadvies - scenario.instroom).toLocaleString('nl-NL')})
                  </div>
                </div>
              )}

              {/* Scenario vergelijking grafiek */}
              <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                  Projectie Aanbod vs Vraag (2025-2043)
                </h2>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="jaar" 
                      stroke="#666" 
                      style={{ fontSize: '14px' }}
                    />
                    <YAxis
                      stroke="#666"
                      style={{ fontSize: '14px' }}
                      tickFormatter={(value) => value.toLocaleString('nl-NL')}
                      label={{ value: 'FTE', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fill: '#666' } }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                      formatter={(value: any) => Math.round(value).toLocaleString('nl-NL')}
                    />
                    <Legend />

                    {/* Scenario lijnen */}
                    <Line 
                      type="monotone" 
                      dataKey="aanbod_fte" 
                      name="Aanbod (scenario)" 
                      stroke="#0F2B5B" 
                      strokeWidth={3} 
                      dot={{ r: 3 }} 
                      isAnimationActive={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benodigd_fte" 
                      name="Vraag (scenario)" 
                      stroke="#D76628" 
                      strokeWidth={3} 
                      dot={{ r: 3 }} 
                      isAnimationActive={false} 
                    />
                    
                    {/* Baseline lijnen */}
                    <Line 
                      type="monotone" 
                      dataKey="aanbod_baseline" 
                      name="Aanbod (baseline)" 
                      stroke="#006470" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benodigd_baseline" 
                      name="Vraag (baseline)" 
                      stroke="#e67e3a" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Data tabel */}
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '0.875rem', color: '#006583', fontWeight: 'bold' }}>
                    📊 Bekijk gedetailleerde cijfers
                  </summary>
                  <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.6rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                          <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>Jaar</th>
                          <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>Aanbod (scenario)</th>
                          <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>Vraag (scenario)</th>
                          <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>Gap</th>
                          <th style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>Gap %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectie.slice(0, 10).map((row: any) => (
                          <tr key={row.jaar}>
                            <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>{row.jaar}</td>
                            <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                              {Math.round(row.aanbod_fte).toLocaleString('nl-NL')}
                            </td>
                            <td style={{ padding: '0.3rem', border: '1px solid #ddd', textAlign: 'center' }}>
                              {Math.round(row.benodigd_fte).toLocaleString('nl-NL')}
                            </td>
                            <td style={{ 
                              padding: '0.3rem', 
                              border: '1px solid #ddd', 
                              textAlign: 'center',
                              color: row.gap_fte > 0 ? '#10b981' : '#ef4444',
                              fontWeight: 'bold'
                            }}>
                              {Math.round(row.gap_fte).toLocaleString('nl-NL')}
                            </td>
                            <td style={{ 
                              padding: '0.3rem', 
                              border: '1px solid #ddd', 
                              textAlign: 'center',
                              color: row.gap_percentage > 0 ? '#10b981' : '#ef4444'
                            }}>
                              {formatDutchNumber(row.gap_percentage, 1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
