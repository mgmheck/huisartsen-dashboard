import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

const CACHE_VERSION = 'v6-csv-cleaned';
const YEARS = ['2010', '2013', '2016', '2019', '2022', '2025'];

interface RawData {
  [category: string]: Array<{
    var: string;
    label: string;
    data: number[];
  }>;
}

interface KPIData {
  label: string;
  value: string;
  change: string;
  subtext: string;
}

interface UseCSVDataReturn {
  isLoading: boolean;
  error: string | null;
  rawData: RawData;
  kpiData: KPIData[];
}

/**
 * Custom hook voor CSV data management
 * Laadt en parsed CSV data met localStorage caching
 * Genereert ook KPI metrics voor dashboard
 *
 * VOLLEDIGE IMPLEMENTATIE uit legacy Dashboard.tsx
 */
export const useCSVData = (): UseCSVDataReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<any>({});

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        setIsLoading(true);

        console.log('🚀 CSV laden - verwachte cache versie:', CACHE_VERSION);

        // ALTIJD oude cache entries verwijderen
        const cacheKey = `csv-cache-dashboard-${CACHE_VERSION}`;
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('csv-cache-dashboard-') && key !== cacheKey) {
            localStorage.removeItem(key);
            console.log('🗑️ Oude cache verwijderd: ' + key);
          }
        });

        // Check cache first
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setCsvData(parsed.data);
            setIsLoading(false);
            console.log('✅ CSV Cache HIT (versie: ' + CACHE_VERSION + ')');
            return;
          } catch (e) {
            console.warn('⚠️ Invalid cache, fetching fresh');
          }
        } else {
          console.log('❌ Geen cache gevonden voor versie:', CACHE_VERSION);
        }

        // Fetch fresh data
        const response = await fetch('/data/parameterwaarden.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          delimiter: ';',
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results) => {
            // Maak lookup object: variabele naam -> row data
            const lookup: any = {};
            results.data.forEach((row: any) => {
              if (row.Variabele) {
                lookup[row.Variabele] = row;
              }
            });

            // Save to cache
            localStorage.setItem(cacheKey, JSON.stringify({
              data: lookup,
              timestamp: Date.now()
            }));
            console.log('💾 CSV Cache SAVED (versie: ' + CACHE_VERSION + ')');

            setCsvData(lookup);
            setIsLoading(false);
          },
          error: (err: any) => {
            setError('Fout bij laden CSV: ' + err.message);
            setIsLoading(false);
          }
        });
      } catch (err: any) {
        setError('Fout bij laden CSV: ' + err.message);
        setIsLoading(false);
      }
    };

    loadCSVData();
  }, []);

  // Helper functie om CSV waarde te parsen (komma -> punt voor decimalen)
  const parseValue = (val: any): number => {
    if (!val || val === '') return 0;
    if (typeof val === 'number') return val;
    const str = val.toString().replace(',', '.');
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper functie om data array te extraheren uit CSV row (memoized)
  const getDataArray = useMemo(() => {
    return (variableName: string): number[] => {
      const row = csvData[variableName];
      if (!row) {
        console.warn('⚠️ Variabele niet gevonden in CSV:', variableName);
        return [0, 0, 0, 0, 0, 0];
      }
      const data = [
        parseValue(row.raming_2010),
        parseValue(row.raming_2013),
        parseValue(row.raming_2016),
        parseValue(row.raming_2019_demo),
        parseValue(row.raming_2022),
        parseValue(row.raming_2025)
      ];
      return data;
    };
  }, [csvData]);

  // Bereken afgeleide data (werkzame vrouwen/mannen, FTE, etc.) - MEMOIZED voor performance
  const derivedData = useMemo(() => {
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
  }, [csvData, getDataArray]);

  // Data uit CSV bestand (dynamisch geladen) - MEMOIZED voor performance
  const rawData: RawData = useMemo(() => {
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
      ],
      tbo_werkzaam: [
        { var: 'werkzaam_zelfstandig_TBO', label: 'Werkzaam zelfstandig', data: getDataArray('werkzaam_zelfstandig_TBO') },
        { var: 'werkzaam_loondienst_TBO', label: 'Werkzaam loondienst', data: getDataArray('werkzaam_loondienst_TBO') },
        { var: 'werkzaam_wiss-waarnemer_TBO', label: 'Werkzaam wisselende waarnemer', data: getDataArray('werkzaam_wiss-waarnemer_TBO') }
      ],
      tbo_uren: [
        { var: 'werkzame_uren_vrouw', label: 'Werkzame uren vrouw', data: getDataArray('werkzame_uren_vrouw') },
        { var: 'werkzame_uren_man', label: 'Werkzame uren man', data: getDataArray('werkzame_uren_man') },
        { var: 'uren_zelfstandig', label: 'Uren zelfstandig', data: getDataArray('uren_zelfstandig') },
        { var: 'uren_loondienst', label: 'Uren loondienst', data: getDataArray('uren_loondienst') },
        { var: 'uren_wiss-waarnemer', label: 'Uren wisselende waarnemer', data: getDataArray('uren_wiss-waarnemer') }
      ]
    };
  }, [derivedData, getDataArray]);

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
  }, [derivedData, getDataArray]);

  return { isLoading, error, rawData, kpiData };
};
