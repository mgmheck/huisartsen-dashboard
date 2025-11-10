import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScenarioParams, ProjectieData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

interface UseScenarioAPIReturn {
  scenario: ScenarioParams;
  projectie: ProjectieData[];
  instroomadvies: number | null;
  loading: boolean;
  error: string | null;
  apiConnected: boolean;
  changedParams: number;
  updateParameter: (paramName: keyof ScenarioParams, value: number | null) => void;
  resetToBaseline: () => void;
  calculateScenario: () => void;
  isParameterChanged: (paramName: string) => boolean;
  comparisonData: any[];
  year2043: any;
}

// Baseline scenario - voorkeursscenario CSV default waarden
const BASELINE: ScenarioParams = {
  instroom: 865,
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
  demografie_factor: null,
  uitstroom_factor_vrouw: null,
  uitstroom_factor_man: null,
};

/**
 * Custom hook voor Scenario API management
 * Beheert alle scenario parameters, API calls en state
 */
export const useScenarioAPI = (): UseScenarioAPIReturn => {
  const [scenario, setScenario] = useState<ScenarioParams>(BASELINE);
  const [projectie, setProjectie] = useState<ProjectieData[]>([]);
  const [baseline, setBaseline] = useState<ProjectieData[]>([]);
  const [instroomadvies, setInstroomadvies] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [changedParams, setChangedParams] = useState<Set<string>>(new Set());

  // Load scenario function
  const loadScenario = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = {
        instroom: scenario.instroom,
        intern_rendement: scenario.intern_rendement,
        opleidingsduur: scenario.opleidingsduur,
        fte_vrouw: scenario.fte_vrouw,
        fte_man: scenario.fte_man,
        extern_rendement_vrouw_1jaar: scenario.extern_rendement_vrouw_1jaar,
        extern_rendement_vrouw_5jaar: scenario.extern_rendement_vrouw_5jaar,
        extern_rendement_vrouw_10jaar: scenario.extern_rendement_vrouw_10jaar,
        extern_rendement_vrouw_15jaar: scenario.extern_rendement_vrouw_15jaar,
        extern_rendement_man_1jaar: scenario.extern_rendement_man_1jaar,
        extern_rendement_man_5jaar: scenario.extern_rendement_man_5jaar,
        extern_rendement_man_10jaar: scenario.extern_rendement_man_10jaar,
        extern_rendement_man_15jaar: scenario.extern_rendement_man_15jaar,
        epi_midden: scenario.epi_midden,
        soc_midden: scenario.soc_midden,
        vak_midden: scenario.vak_midden,
        eff_midden: scenario.eff_midden,
        hor_midden: scenario.hor_midden,
        tijd_midden: scenario.tijd_midden,
        ver_midden: scenario.ver_midden,
        totale_zorgvraag_excl_ATV_midden: scenario.totale_zorgvraag_excl_ATV_midden,
        uitstroom_vrouw_5j: scenario.uitstroom_vrouw_5j,
        uitstroom_man_5j: scenario.uitstroom_man_5j,
        uitstroom_vrouw_10j: scenario.uitstroom_vrouw_10j,
        uitstroom_man_10j: scenario.uitstroom_man_10j,
        uitstroom_vrouw_15j: scenario.uitstroom_vrouw_15j,
        uitstroom_man_15j: scenario.uitstroom_man_15j,
        uitstroom_vrouw_20j: scenario.uitstroom_vrouw_20j,
        uitstroom_man_20j: scenario.uitstroom_man_20j,
      };

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  // Load baseline
  const loadBaseline = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/baseline`);
      const data = await response.json();
      setBaseline(data.projectie);
    } catch (err) {
      console.error('Failed to load baseline:', err);
    }
  }, []);

  // Check API health on mount
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

  // Load baseline and initial scenario when API connects
  useEffect(() => {
    if (apiConnected) {
      loadBaseline();
      loadScenario();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConnected]);

  // Update parameter handler
  const updateParameter = useCallback((paramName: keyof ScenarioParams, value: number | null) => {
    setScenario(prev => ({ ...prev, [paramName]: value }));
    setChangedParams(prev => new Set(prev).add(paramName));
  }, []);

  // Reset to baseline
  const resetToBaseline = useCallback(() => {
    setScenario(BASELINE);
    setChangedParams(new Set());
    setProjectie(baseline);
  }, [baseline]);

  // Calculate scenario - manual trigger
  const calculateScenario = useCallback(() => {
    if (apiConnected && !loading) {
      loadScenario();
      setChangedParams(new Set());
    }
  }, [apiConnected, loading, loadScenario]);

  // Check if parameter is changed
  const isParameterChanged = useCallback((paramName: string) => {
    return changedParams.has(paramName);
  }, [changedParams]);

  // Comparison data for charts - memoized
  const comparisonData = useMemo(() => {
    return projectie.map((item, idx) => ({
      jaar: item.jaar,
      aanbod_fte: item.aanbod_fte,
      benodigd_fte: item.benodigd_fte,
      gap_fte: item.gap_fte,
      aanbod_baseline: baseline?.[idx]?.aanbod_fte || null,
      benodigd_baseline: baseline?.[idx]?.benodigd_fte || null,
    }));
  }, [projectie, baseline]);

  // Year 2043 data
  const year2043 = useMemo(() => {
    const data2043 = projectie.find(p => p.jaar === 2043);
    const baseline2043 = baseline.find(p => p.jaar === 2043);
    return {
      scenario: data2043,
      baseline: baseline2043,
    };
  }, [projectie, baseline]);

  return {
    scenario,
    projectie,
    instroomadvies,
    loading,
    error,
    apiConnected,
    changedParams: changedParams.size,
    updateParameter,
    resetToBaseline,
    calculateScenario,
    isParameterChanged,
    comparisonData,
    year2043,
  };
};
