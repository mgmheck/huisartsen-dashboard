import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState('zorgaanbod');
  const [selectedSubCategory, setSelectedSubCategory] = useState('zorgaanbod_personen');
  const [hiddenLines, setHiddenLines] = useState({});

  // Data uit CSV bestand
  const rawData = {
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
  
  const years = ['2010', '2013', '2016', '2019', '2022', '2025'];
  
  // Hoofdcategorieën
  const mainCategories = [
    { id: 'zorgaanbod', label: 'Zorgaanbod', icon: '🏥' },
    { id: 'opleiding', label: 'Opleiding', icon: '🎓' },
    { id: 'zorgvraag', label: 'Zorgvraag', icon: '📊' }
  ];
  
  // Subcategorieën per hoofdcategorie
  const subCategories = {
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

  const chartData = useMemo(() => {
    const categoryData = rawData[selectedSubCategory];
    if (!categoryData) return [];
    
    return years.map((year, idx) => {
      const point = { jaar: year };
      categoryData.forEach(metric => {
        point[metric.var] = metric.data[idx];
      });
      return point;
    });
  }, [selectedSubCategory]);
  
  const currentCategoryData = rawData[selectedSubCategory] || [];
  
  // Handler voor hoofdcategorie klik
  const handleMainCategoryClick = (mainCatId) => {
    setSelectedMainCategory(mainCatId);
    const firstSubCat = subCategories[mainCatId][0];
    setSelectedSubCategory(firstSubCat.id);
  };
  
  // Handler voor subcategorie klik
  const handleSubCategoryClick = (subCatId) => {
    setSelectedSubCategory(subCatId);
  };
  
  // Handler voor legenda klik (zorgvraag en uitstroom)
  const handleLegendClick = (e) => {
    const newHiddenLines = { ...hiddenLines };
    newHiddenLines[e.dataKey] = !newHiddenLines[e.dataKey];
    setHiddenLines(newHiddenLines);
  };
  
  // Kleurenpalet met maximaal contrast voor zorgvraag en uitstroom
  const getLineStyle = (index, total, varName) => {
    if (selectedSubCategory === 'zorgvraag') {
      const styles = {
        'epi_midden': { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' },
        'sociaal_midden': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
        'vakinh_midden': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
        'effic_midden': { stroke: '#1a4d7a', strokeWidth: 2, strokeDasharray: '8 2' },
        'horsub_midden': { stroke: '#008594', strokeWidth: 2, strokeDasharray: 'none' },
        'atv_midden': { stroke: '#e67e3a', strokeWidth: 3, strokeDasharray: '10 5' },
        'vertsub_midden': { stroke: '#052040', strokeWidth: 2, strokeDasharray: '2 2' },
        'totale_zorgvraag_excl_ATV_midden': { stroke: '#000000', strokeWidth: 4, strokeDasharray: 'none' }
      };
      return styles[varName] || { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' };
    }
    
    if (selectedSubCategory === 'uitstroom') {
      const styles = {
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
      };
      return styles[varName] || { stroke: '#0F2B5B', strokeWidth: 2, strokeDasharray: 'none' };
    }
    
    // Standaard kleuren voor andere categorieën
    const colors = ['#0F2B5B', '#006470', '#D76628', '#1a4d7a', '#008594', '#e67e3a'];
    return { stroke: colors[index % colors.length], strokeWidth: 2, strokeDasharray: 'none' };
  };
  
  // KPI data berekeningen
  const kpiData = [
    { label: 'Totaal huisartsen 2025', value: '14.347', change: '+6%', subtext: 't.o.v. 2010' },
    { label: 'FTE 2025', value: '10.769', change: '+47%', subtext: 't.o.v. 2010' },
    { label: 'Vrouwen 2025', value: '9.469 (66%)', change: '+118%', subtext: 't.o.v. 2010' },
    { label: 'Zorgvraag 2025', value: '2,6%', change: '+2,6%', subtext: 'excl. ATV' }
  ];
  
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ maxWidth: '1600px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#006583', marginBottom: '0.5rem' }}>
              Capaciteitsplan Huisartsen 2025-2030
            </h1>
            <p style={{ color: '#666', fontSize: '1rem' }}>
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
                      backgroundColor: selectedMainCategory === mainCat.id ? '#0F2B5B' : '#f8f8f8',
                      color: selectedMainCategory === mainCat.id ? 'white' : '#006583',
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
                          onClick={() => handleSubCategoryClick(subCat.id)}
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
                Tijdlijn {subCategories[selectedMainCategory].find(c => c.id === selectedSubCategory)?.label}
                {(selectedSubCategory === 'zorgvraag' || selectedSubCategory === 'uitstroom') && (
                  <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#666', marginLeft: '0.5rem' }}>(Klik op legenda om lijnen te tonen/verbergen)</span>
                )}
              </h2>
              <ResponsiveContainer width="100%" height={selectedSubCategory === 'uitstroom' ? 600 : 400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="jaar" stroke="#666" style={{ fontSize: '14px' }} />
                  <YAxis 
                    stroke="#666" 
                    style={{ fontSize: '14px' }}
                    domain={selectedSubCategory === 'zorgvraag' ? [-2, 4] : selectedSubCategory === 'uitstroom' ? [0, 80] : ['auto', 'auto']}
                  />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }} />
                  <Legend 
                    onClick={(selectedSubCategory === 'zorgvraag' || selectedSubCategory === 'uitstroom') ? handleLegendClick : undefined}
                    wrapperStyle={{ cursor: (selectedSubCategory === 'zorgvraag' || selectedSubCategory === 'uitstroom') ? 'pointer' : 'default' }}
                  />
                  {currentCategoryData.map((metric, idx) => {
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
            <div style={{ backgroundColor: '#f8f8f8', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem' }}>
                Vergelijking 2019, 2022 en 2025
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={currentCategoryData.map(metric => ({ name: metric.label, '2019': metric.data[3], '2022': metric.data[4], '2025': metric.data[5] }))}>
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
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#006583' }}>
              <p>Bron: Capaciteitsorgaan | Bestand: 20251022_Parameterwaarden20102013201620192025_DEF.csv</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;