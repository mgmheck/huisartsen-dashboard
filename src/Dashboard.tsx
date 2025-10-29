import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { rawData, years, kpiData } from './data/capacity-data';
import { STYLES } from './styles/constants';
import { getLineStyle, transformDataForChart, transformDataForBarChart } from './utils/chartHelpers';

// Hoofdcategorieën configuratie
const mainCategories = [
  { id: 'zorgaanbod', label: 'Zorgaanbod', icon: '🏥' },
  { id: 'opleiding', label: 'Opleiding', icon: '🎓' },
  { id: 'zorgvraag', label: 'Zorgvraag', icon: '📊' }
];

// Subcategorieën configuratie
const subCategories: { [key: string]: Array<{ id: string; label: string; icon: string }> } = {
  zorgaanbod: [
    { id: 'zorgaanbod_personen', label: 'Zorgaanbod in personen', icon: '👥' },
    { id: 'zorgaanbod_fte', label: 'FTE', icon: '⬆️' },
    { id: 'zorgaanbod_percentage', label: 'Percentage man-vrouw', icon: '⚖️' },
    { id: 'ftefactor', label: 'FTE-factor', icon: '📊' },
    { id: 'uitstroom', label: 'Uitstroom', icon: '📉' }
  ],
  opleiding: [
    { id: 'opleiding', label: 'Instroom', icon: '📚' },
    { id: 'opleidingdetails', label: 'Opleiding Details', icon: '📋' }
  ],
  zorgvraag: [
    { id: 'zorgvraag', label: 'Zorgvraag componenten', icon: '📊' },
    { id: 'demografie', label: 'Demografie', icon: '👥' },
    { id: 'onvervuldevraag', label: 'Onvervulde vraag', icon: '⚠️' }
  ]
};

const Dashboard = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState('zorgaanbod');
  const [selectedSubCategory, setSelectedSubCategory] = useState('zorgaanbod_personen');
  const [hiddenLines, setHiddenLines] = useState<{ [key: string]: boolean }>({});

  // Chart data transformatie
  const chartData = useMemo(
    () => transformDataForChart(rawData[selectedSubCategory] || [], years),
    [selectedSubCategory]
  );

  const barChartData = useMemo(
    () => transformDataForBarChart(rawData[selectedSubCategory] || []),
    [selectedSubCategory]
  );

  const currentCategoryData = rawData[selectedSubCategory] || [];

  // Handlers
  const handleMainCategoryClick = (mainCatId: string) => {
    setSelectedMainCategory(mainCatId);
    const firstSubCat = subCategories[mainCatId][0];
    setSelectedSubCategory(firstSubCat.id);
  };

  const handleLegendClick = (e: any) => {
    setHiddenLines(prev => ({ ...prev, [e.dataKey]: !prev[e.dataKey] }));
  };

  // Check of interactieve legenda enabled is
  const hasInteractiveLegend = ['zorgvraag', 'uitstroom'].includes(selectedSubCategory);

  return (
    <div style={{ backgroundColor: STYLES.colors.white, minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ ...STYLES.card, padding: '2rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: STYLES.colors.primary, marginBottom: '0.5rem' }}>
              Capaciteitsplan Huisartsen 2025-2030
            </h1>
            <p style={{ color: STYLES.colors.mediumGray, fontSize: '1rem' }}>
              Analyse van zorgaanbod, opleiding en zorgvraag (2010-2025)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* Linkerzijbalk */}
          <div style={{ width: '224px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', position: 'sticky', top: '1.5rem' }}>
              {mainCategories.map(mainCat => (
                <div key={mainCat.id}>
                  <button
                    onClick={() => handleMainCategoryClick(mainCat.id)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedMainCategory === mainCat.id ? STYLES.colors.navy : STYLES.colors.lightGray,
                      color: selectedMainCategory === mainCat.id ? 'white' : STYLES.colors.primary,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>{mainCat.icon}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{mainCat.label}</div>
                      </div>
                      <div style={{ fontSize: '1.25rem', transform: selectedMainCategory === mainCat.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        ▼
                      </div>
                    </div>
                  </button>

                  {selectedMainCategory === mainCat.id && (
                    <div style={{ marginTop: '0.5rem', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {subCategories[mainCat.id].map(subCat => (
                        <button
                          key={subCat.id}
                          onClick={() => setSelectedSubCategory(subCat.id)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left',
                            backgroundColor: selectedSubCategory === subCat.id ? STYLES.colors.teal : STYLES.colors.lightGray,
                            color: selectedSubCategory === subCat.id ? 'white' : STYLES.colors.primary,
                            transform: selectedSubCategory === subCat.id ? 'scale(1.05)' : 'scale(1)',
                            fontWeight: selectedSubCategory === subCat.id ? '500' : '400'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ fontSize: '1.125rem' }}>{subCat.icon}</div>
                            <div style={{ fontSize: '0.75rem', lineHeight: '1.25' }}>{subCat.label}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hoofd content area */}
          <div style={{ flex: 1 }}>
            {/* KPI Tegels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {kpiData.map((kpi, idx) => (
                <div key={idx} style={{ ...STYLES.card }}>
                  <div style={{ fontSize: '0.875rem', color: STYLES.colors.primary, marginBottom: '0.25rem' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: STYLES.colors.darkGray, marginBottom: '0.25rem' }}>{kpi.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: kpi.change.startsWith('+') ? STYLES.colors.teal : kpi.change.startsWith('-') ? STYLES.colors.orange : STYLES.colors.navy
                    }}>
                      {kpi.change}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: STYLES.colors.subtleGray }}>{kpi.subtext}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tijdlijn grafiek */}
            <div style={{ ...STYLES.card, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STYLES.colors.darkGray, marginBottom: '1rem' }}>
                Tijdlijn {subCategories[selectedMainCategory].find(c => c.id === selectedSubCategory)?.label}
                {hasInteractiveLegend && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: STYLES.colors.mediumGray, marginLeft: '0.5rem' }}>
                    (Klik op legenda om lijnen te tonen/verbergen)
                  </span>
                )}
              </h2>
              <ResponsiveContainer width="100%" height={selectedSubCategory === 'uitstroom' ? 600 : 400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="jaar" stroke={STYLES.colors.mediumGray} style={{ fontSize: '14px' }} />
                  <YAxis
                    stroke={STYLES.colors.mediumGray}
                    style={{ fontSize: '14px' }}
                    domain={selectedSubCategory === 'zorgvraag' ? [-2, 4] : selectedSubCategory === 'uitstroom' ? [0, 80] : ['auto', 'auto']}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Legend
                    onClick={hasInteractiveLegend ? handleLegendClick : undefined}
                    wrapperStyle={{ cursor: hasInteractiveLegend ? 'pointer' : 'default' }}
                  />
                  {currentCategoryData.map((metric, idx) => {
                    const lineStyle = getLineStyle(idx, metric.var, selectedSubCategory);
                    const isHidden = hiddenLines[metric.var];

                    return (
                      <Line
                        key={metric.var}
                        type="monotone"
                        dataKey={metric.var}
                        name={metric.label}
                        stroke={lineStyle.stroke}
                        strokeWidth={lineStyle.strokeWidth}
                        strokeDasharray={lineStyle.strokeDasharray}
                        dot={{ r: 5, fill: lineStyle.stroke, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                        hide={isHidden}
                        strokeOpacity={isHidden ? 0 : 1}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Vergelijking grafiek */}
            <div style={{ ...STYLES.card, padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: STYLES.colors.darkGray, marginBottom: '1rem' }}>
                Vergelijking 2019, 2022 en 2025
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="name"
                    stroke={STYLES.colors.mediumGray}
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis stroke={STYLES.colors.mediumGray} style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="2019" fill={STYLES.colors.navy} />
                  <Bar dataKey="2022" fill={STYLES.colors.teal} />
                  <Bar dataKey="2025" fill={STYLES.colors.orange} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: STYLES.colors.primary }}>
              <p>Bron: Capaciteitsorgaan | Bestand: 20251022_Parameterwaarden20102013201620192025_DEF.csv</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
