import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

const Dashboard = () => {
  const [selectedMainCategory, setSelectedMainCategory] = useState('zorgaanbod');
  const [selectedSubCategory, setSelectedSubCategory] = useState('zorgaanbod_personen');
  const [hiddenLines, setHiddenLines] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [csvData, setCsvData] = useState({});

  // Laad CSV data bij component mount
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/data/parameterwaarden.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          delimiter: ';',
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results) => {
            // Maak lookup object: variabele naam -> row data
            const lookup = {};
            results.data.forEach(row => {
              if (row.Variabele) {
                lookup[row.Variabele] = row;
              }
            });
            setCsvData(lookup);
            setIsLoading(false);
          },
          error: (err) => {
            setError('Fout bij laden CSV: ' + err.message);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError('Fout bij laden CSV: ' + err.message);
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Helper functie om CSV waarde te parsen (komma -> punt voor decimalen)
  const parseValue = (val) => {
    if (!val || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper functie om data array te extraheren uit CSV row
  const getDataArray = (variableName) => {
    const row = csvData[variableName];
    if (!row) return [0, 0, 0, 0, 0, 0];
    return [
      parseValue(row.raming_2010),
      parseValue(row.raming_2013),
      parseValue(row.raming_2016),
      parseValue(row.raming_2019_demo),
      parseValue(row.raming_2022),
      parseValue(row.raming_2025)
    ];
  };

  // Bereken afgeleide data (werkzame vrouwen/mannen, FTE, etc.)
  const calculateDerivedData = () => {
    if (Object.keys(csvData).length === 0) {
      return null; // Nog geen data geladen
    }

    const aanbod_personen = getDataArray('aanbod_personen');
    const per_vrouw_basis = getDataArray('per_vrouw_basis');
    const per_man_basis = per_vrouw_basis.map(v => 1 - v); // Mannen = 1 - vrouwen
    const fte_totaal_basis = getDataArray('fte_totaal_basis');
    const fte_vrouw_basis = getDataArray('fte_vrouw_basis');
    const fte_man_basis = getDataArray('fte_man_basis');

    // Bereken werkzame vrouwen/mannen
    const werkzame_vrouwen = aanbod_personen.map((val, idx) => Math.round(val * per_vrouw_basis[idx]));
    const werkzame_mannen = aanbod_personen.map((val, idx) => Math.round(val * per_man_basis[idx]));

    // Bereken FTE werkzaam
    const fte_werkzaam = aanbod_personen.map((val, idx) => Math.round(val * fte_totaal_basis[idx]));
    const fte_werkzame_vrouwen = werkzame_vrouwen.map((val, idx) => Math.round(val * fte_vrouw_basis[idx]));
    const fte_werkzame_mannen = werkzame_mannen.map((val, idx) => Math.round(val * fte_man_basis[idx]));

    return {
      aanbod_personen,
      werkzame_vrouwen,
      werkzame_mannen,
      fte_werkzaam,
      fte_werkzame_vrouwen,
      fte_werkzame_mannen,
      fte_totaal_basis: fte_totaal_basis.map(v => v * 100), // Percentage
      fte_vrouw_basis: fte_vrouw_basis.map(v => v * 100),
      fte_man_basis: fte_man_basis.map(v => v * 100)
    };
  };

  const derivedData = calculateDerivedData();

  // Data uit CSV bestand (dynamisch geladen)
  const rawData = useMemo(() => {
    if (!derivedData) {
      return {}; // Fallback lege data als CSV nog niet geladen
    }

    return {
      zorgaanbod_personen: [
        { var: 'aanbod_personen', label: 'Werkzame huisartsen', data: derivedData.aanbod_personen },
        { var: 'werkzame_vrouwen', label: 'Werkzame vrouwen', data: derivedData.werkzame_vrouwen },
        { var: 'werkzame_mannen', label: 'Werkzame mannen', data: derivedData.werkzame_mannen }
      ],
      zorgaanbod_fte: [
        { var: 'fte_werkzaam', label: 'FTE werkzame huisartsen', data: derivedData.fte_werkzaam },
        { var: 'fte_werkzame_vrouwen', label: 'FTE werkzame vrouwen', data: derivedData.fte_werkzame_vrouwen },
        { var: 'fte_werkzame_mannen', label: 'FTE werkzame mannen', data: derivedData.fte_werkzame_mannen }
      ],
      zorgaanbod_percentage: [
        { var: 'werkzame_vrouwen', label: 'Werkzame vrouwen', data: derivedData.werkzame_vrouwen },
        { var: 'werkzame_mannen', label: 'Werkzame mannen', data: derivedData.werkzame_mannen }
      ],
      ftefactor: [
        { var: 'fte_totaal_basis', label: 'FTE factor totaal (%)', data: derivedData.fte_totaal_basis },
        { var: 'fte_vrouw_basis', label: 'FTE factor vrouw (%)', data: derivedData.fte_vrouw_basis },
        { var: 'fte_man_basis', label: 'FTE factor man (%)', data: derivedData.fte_man_basis }
      ],
      uitstroom: [
        { var: 'uitstroom_man_basis_vijf', label: 'Uitstroom 5j man (%)', data: getDataArray('uitstroom_man_basis_vijf').map(v => v * 100) },
        { var: 'uitstroom_vrouw_basis_vijf', label: 'Uitstroom 5j vrouw (%)', data: getDataArray('uitstroom_vrouw_basis_vijf').map(v => v * 100) },
        { var: 'uitstroom_totaal_vijf', label: 'Uitstroom 5j totaal (%)', data: getDataArray('uitstroom_totaal_basis_vijf').map(v => v * 100) },
        { var: 'uitstroom_man_basis_tien', label: 'Uitstroom 10j man (%)', data: getDataArray('uitstroom_man_basis_tien').map(v => v * 100) },
        { var: 'uitstroom_vrouw_basis_tien', label: 'Uitstroom 10j vrouw (%)', data: getDataArray('uitstroom_vrouw_basis_tien').map(v => v * 100) },
        { var: 'uitstroom_totaal_tien', label: 'Uitstroom 10j totaal (%)', data: getDataArray('uitstroom_totaal_basis_tien').map(v => v * 100) },
        { var: 'uitstroom_man_basis_vijftien', label: 'Uitstroom 15j man (%)', data: getDataArray('uitstroom_man_basis_vijftien').map(v => v * 100) },
        { var: 'uitstroom_vrouw_basis_vijftien', label: 'Uitstroom 15j vrouw (%)', data: getDataArray('uitstroom_vrouw_basis_vijftien').map(v => v * 100) },
        { var: 'uitstroom_totaal_vijftien', label: 'Uitstroom 15j totaal (%)', data: getDataArray('uitstroom_totaal_basis_vijftien').map(v => v * 100) },
        { var: 'uitstroom_man_basis_twintig', label: 'Uitstroom 20j man (%)', data: getDataArray('uitstroom_man_basis_twintig').map(v => v * 100) },
        { var: 'uitstroom_vrouw_basis_twintig', label: 'Uitstroom 20j vrouw (%)', data: getDataArray('uitstroom_vrouw_basis_twintig').map(v => v * 100) },
        { var: 'uitstroom_totaal_twintig', label: 'Uitstroom 20j totaal (%)', data: getDataArray('uitstroom_totaal_basis_twintig').map(v => v * 100) }
      ],
      opleiding: [
        { var: 'n_inopleiding_perjaar', label: 'Instroom per jaar', data: getDataArray('n_inopleiding_perjaar') }
      ],
      opleidingdetails: [
        { var: 'per_vrouw_opleiding', label: '% vrouwen opleiding', data: getDataArray('per_vrouw_opleiding').map(v => v * 100) },
        { var: 'intern_rendement', label: 'Intern rendement (%)', data: getDataArray('intern_rendement').map(v => v * 100) }
      ],
      zorgvraag: [
        { var: 'epi_midden', label: 'Epidemiologie (%)', data: getDataArray('epi_midden').map(v => v * 100) },
        { var: 'soc_midden', label: 'Sociaal-cultureel (%)', data: getDataArray('soc_midden').map(v => v * 100) },
        { var: 'vak_midden', label: 'Vakinhoudelijk (%)', data: getDataArray('vak_midden').map(v => v * 100) },
        { var: 'eff_midden', label: 'Efficiency (%)', data: getDataArray('eff_midden').map(v => v * 100) },
        { var: 'hor_midden', label: 'Horizontale substitutie (%)', data: getDataArray('hor_midden').map(v => v * 100) },
        { var: 'tijd_midden', label: 'ATV (%)', data: getDataArray('tijd_midden').map(v => v * 100) },
        { var: 'ver_midden', label: 'Verticale substitutie (%)', data: getDataArray('ver_midden').map(v => v * 100) },
        { var: 'totale_zorgvraag_excl_ATV_midden', label: 'Totale zorgvraag excl ATV (%)', data: getDataArray('totale_zorgvraag_excl_ATV_midden').map(v => v * 100) }
      ],
      demografie: [
        { var: 'demo_5_midden', label: 'Demografie 5j (%)', data: getDataArray('demo_5_midden').map(v => v * 100) },
        { var: 'demo_10_midden', label: 'Demografie 10j (%)', data: getDataArray('demo_10_midden').map(v => v * 100) },
        { var: 'demo_15_midden', label: 'Demografie 15j (%)', data: getDataArray('demo_15_midden').map(v => v * 100) },
        { var: 'demo_20_midden', label: 'Demografie 20j (%)', data: getDataArray('demo_20_midden').map(v => v * 100) }
      ],
      onvervuldevraag: [
        { var: 'onv_vraag_midden', label: 'Onvervulde vraag (%)', data: getDataArray('onv_vraag_midden').map(v => v * 100) }
      ]
    };
  }, [csvData, derivedData]);
  
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
        'soc_midden': { stroke: '#006470', strokeWidth: 2, strokeDasharray: '5 5' },
        'vak_midden': { stroke: '#D76628', strokeWidth: 2, strokeDasharray: '3 3' },
        'eff_midden': { stroke: '#1a4d7a', strokeWidth: 2, strokeDasharray: '8 2' },
        'hor_midden': { stroke: '#008594', strokeWidth: 2, strokeDasharray: 'none' },
        'tijd_midden': { stroke: '#e67e3a', strokeWidth: 3, strokeDasharray: '10 5' },
        'ver_midden': { stroke: '#052040', strokeWidth: 2, strokeDasharray: '2 2' },
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
  
  // KPI data berekeningen (dynamisch uit CSV)
  const kpiData = useMemo(() => {
    if (!derivedData) {
      return [
        { label: 'Totaal huisartsen 2025', value: '...', change: '...', subtext: 't.o.v. 2010' },
        { label: 'FTE 2025', value: '...', change: '...', subtext: 't.o.v. 2010' },
        { label: 'Vrouwen 2025', value: '...', change: '...', subtext: 't.o.v. 2010' },
        { label: 'Zorgvraag 2025', value: '...', change: '...', subtext: 'excl. ATV' }
      ];
    }

    const aanbod_2010 = derivedData.aanbod_personen[0];
    const aanbod_2025 = derivedData.aanbod_personen[5];
    const fte_2010 = derivedData.fte_werkzaam[0];
    const fte_2025 = derivedData.fte_werkzaam[5];
    const vrouwen_2010 = derivedData.werkzame_vrouwen[0];
    const vrouwen_2025 = derivedData.werkzame_vrouwen[5];
    const zorgvraag_2025 = getDataArray('totale_zorgvraag_excl_ATV_midden')[5] * 100;

    const aanbod_change = ((aanbod_2025 - aanbod_2010) / aanbod_2010 * 100).toFixed(0);
    const fte_change = ((fte_2025 - fte_2010) / fte_2010 * 100).toFixed(0);
    const vrouwen_change = ((vrouwen_2025 - vrouwen_2010) / vrouwen_2010 * 100).toFixed(0);
    const vrouwen_percentage = (vrouwen_2025 / aanbod_2025 * 100).toFixed(0);

    return [
      { label: 'Totaal huisartsen 2025', value: aanbod_2025.toLocaleString('nl-NL'), change: `+${aanbod_change}%`, subtext: 't.o.v. 2010' },
      { label: 'FTE 2025', value: fte_2025.toLocaleString('nl-NL'), change: `+${fte_change}%`, subtext: 't.o.v. 2010' },
      { label: 'Vrouwen 2025', value: `${vrouwen_2025.toLocaleString('nl-NL')} (${vrouwen_percentage}%)`, change: `+${vrouwen_change}%`, subtext: 't.o.v. 2010' },
      { label: 'Zorgvraag 2025', value: `${zorgvraag_2025.toFixed(1)}%`, change: `+${zorgvraag_2025.toFixed(1)}%`, subtext: 'excl. ATV' }
    ];
  }, [derivedData]);

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