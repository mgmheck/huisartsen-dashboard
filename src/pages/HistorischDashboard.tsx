import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCSVData } from '../hooks/useCSVData';

// Constants
const YEARS = ['2010', '2013', '2016', '2019', '2022', '2025'];
const YEARS_TBO = ['2013', '2016', '2019', '2022', '2025']; // TBO data heeft geen 2010

/**
 * Historisch Dashboard Component
 * Read-only visualisatie van capaciteitsplan ramingen 2010-2025
 * Geen interactieve elementen - puur voor analyse en vergelijking
 */
const HistorischDashboard: React.FC = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState('zorgaanbod');
  const [selectedSubCategory, setSelectedSubCategory] = useState('zorgaanbod_personen');
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  
  // Gebruik de custom hook voor CSV data management
  const { isLoading, error, rawData, kpiData } = useCSVData();

  // Hoofdcategorieën
  const mainCategories = [
    { id: 'zorgaanbod', label: 'Zorgaanbod', icon: '🏥' },
    { id: 'opleiding', label: 'Opleiding', icon: '🎓' },
    { id: 'zorgvraag', label: 'Zorgvraag', icon: '📊' },
    { id: 'tijdbestedingsonderzoek', label: 'Tijdbestedingsonderzoek', icon: '⏱️' }
  ];

  // Subcategorieën per hoofdcategorie
  const subCategories: Record<string, Array<{id: string, label: string, icon: string}>> = {
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
      { id: 'zorgvraag', label: 'Niet-demografische ontwikkelingen', icon: '📈' },
      { id: 'demografie', label: 'Demografie', icon: '👴👵' },
      { id: 'onvervuldevraag', label: 'Onvervulde vraag', icon: '⚠️' }
    ],
    tijdbestedingsonderzoek: [
      { id: 'tbo_werkzaam', label: 'Werkzame huisartsen', icon: '👥' },
      { id: 'tbo_uren', label: 'Werkzame uren per week', icon: '⏰' }
    ]
  };

  // Reset hidden lines when subcategory changes
  React.useEffect(() => {
    setHiddenLines({});
  }, [selectedSubCategory]);

  // Chart data transformatie
  const chartData = useMemo(() => {
    const categoryData = rawData[selectedSubCategory];
    if (!categoryData) return [];

    // TBO data heeft geen 2010
    if (selectedSubCategory.startsWith('tbo_')) {
      return YEARS_TBO.map((year, idx) => {
        const point: any = { jaar: year };
        categoryData.forEach((metric: any) => {
          point[metric.var] = metric.data[idx + 1];
        });
        return point;
      });
    }

    return YEARS.map((year, idx) => {
      const point: any = { jaar: year };
      categoryData.forEach((metric: any) => {
        point[metric.var] = metric.data[idx];
      });
      return point;
    });
  }, [rawData, selectedSubCategory]);

  // Kleurenpalet
  const getLineStyle = (index: number, total: number, varName: string) => {
    const colors = ['#0F2B5B', '#006470', '#D76628', '#1a4d7a', '#008594', '#e67e3a'];
    const dashArrays = ['none', '5 5', '3 3', '8 2', '10 5', '2 2'];
    
    return { 
      stroke: colors[index % colors.length], 
      strokeWidth: 2, 
      strokeDasharray: total > 6 ? dashArrays[index % dashArrays.length] : 'none'
    };
  };

  // Handler voor legenda klik
  const handleLegendClick = (e: any) => {
    setHiddenLines(prev => ({
      ...prev,
      [e.dataKey]: !prev[e.dataKey]
    }));
  };

  const currentCategoryData = rawData[selectedSubCategory] || [];

  // Loading state
  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ color: '#006583', marginBottom: '0.5rem' }}>Dashboard wordt geladen...</h2>
          <p style={{ color: '#666' }}>CSV data wordt ingelezen</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#D76628', marginBottom: '0.5rem' }}>Fout bij laden dashboard</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#006470',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>📊</span>
              <div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#006583', marginBottom: '0.5rem' }}>
                  Historisch Dashboard - Capaciteitsplan Huisartsen
                </h1>
                <p style={{ color: '#666', fontSize: '1rem' }}>
                  Analyse van ramingen 2010-2025 (read-only visualisatie)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {/* Linkerzijbalk - Navigatie */}
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', position: 'sticky', top: '1.5rem' }}>
              {mainCategories.map(mainCat => (
                <div key={mainCat.id}>
                  <button
                    onClick={() => {
                      setSelectedMainCategory(mainCat.id);
                      const firstSubCat = subCategories[mainCat.id][0];
                      setSelectedSubCategory(firstSubCat.id);
                    }}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: selectedMainCategory === mainCat.id ? '#0F2B5B' : '#f8f8f8',
                      color: selectedMainCategory === mainCat.id ? 'white' : '#006583',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>{mainCat.icon}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{mainCat.label}</div>
                      </div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        transform: selectedMainCategory === mainCat.id ? 'rotate(180deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s' 
                      }}>
                        ▼
                      </div>
                    </div>
                  </button>

                  {selectedMainCategory === mainCat.id && (
                    <div style={{ marginTop: '0.5rem', marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {subCategories[mainCat.id].map((subCat: any) => (
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
                            backgroundColor: selectedSubCategory === subCat.id ? '#006470' : '#f8f8f8',
                            color: selectedSubCategory === subCat.id ? 'white' : '#006583',
                            transform: selectedSubCategory === subCat.id ? 'scale(1.02)' : 'scale(1)',
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
                <div key={idx} style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#006583', marginBottom: '0.25rem' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#333', marginBottom: '0.25rem' }}>{kpi.value}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: kpi.change.startsWith('+') ? '#006470' : kpi.change.startsWith('-') ? '#D76628' : '#0F2B5B'
                    }}>
                      {kpi.change}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>{kpi.subtext}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tijdlijn grafiek */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                Tijdlijn {subCategories[selectedMainCategory]?.find((c: any) => c.id === selectedSubCategory)?.label}
                {currentCategoryData.length > 6 && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#666', marginLeft: '0.5rem' }}>
                    (Klik op legenda om lijnen te tonen/verbergen)
                  </span>
                )}
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="jaar" stroke="#666" style={{ fontSize: '14px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '14px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Legend
                    onClick={currentCategoryData.length > 6 ? handleLegendClick : undefined}
                    wrapperStyle={{ cursor: currentCategoryData.length > 6 ? 'pointer' : 'default' }}
                  />
                  {currentCategoryData.map((metric: any, idx: number) => {
                    const lineStyle = getLineStyle(idx, currentCategoryData.length, metric.var);
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
                        dot={{ r: 4, fill: lineStyle.stroke, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                        hide={isHidden}
                        strokeOpacity={isHidden ? 0 : 1}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Vergelijking grafiek */}
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                {selectedSubCategory.startsWith('tbo_')
                  ? 'Vergelijking TBO 2013-2016, 2018 en 2024'
                  : 'Vergelijking 2019, 2022 en 2025'
                }
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                {selectedSubCategory.startsWith('tbo_') ? (
                  <BarChart data={currentCategoryData.map((metric: any) => ({
                    name: metric.label,
                    'TBO 2013-2016': metric.data[1],
                    'TBO 2018': metric.data[3],
                    'TBO 2024': metric.data[5]
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      style={{ fontSize: '11px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="TBO 2013-2016" fill="#0F2B5B" />
                    <Bar dataKey="TBO 2018" fill="#006470" />
                    <Bar dataKey="TBO 2024" fill="#D76628" />
                  </BarChart>
                ) : (
                  <BarChart data={currentCategoryData.map((metric: any) => ({ 
                    name: metric.label, 
                    '2019': metric.data[3], 
                    '2022': metric.data[4], 
                    '2025': metric.data[5] 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="name"
                      stroke="#666"
                      style={{ fontSize: '11px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="2019" fill="#0F2B5B" />
                    <Bar dataKey="2022" fill="#006470" />
                    <Bar dataKey="2025" fill="#D76628" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#006583' }}>
              <p>Bron: Capaciteitsorgaan | Data: parameterwaarden.csv | Laatste update: 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistorischDashboard;
