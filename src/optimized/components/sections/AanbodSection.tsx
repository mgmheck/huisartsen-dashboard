/**
 * AanbodSection Component
 *
 * OPTIMALISATIE #1: Component opsplitsing - Aanbod parameters
 *
 * Extracted from monolithic ScenarioModelAPI component (1,498 lines)
 * Isolates supply-side parameters for independent rendering
 *
 * Performance impact:
 * - Renders only when aanbod parameters change (not vraag parameters)
 * - Reduces re-render scope from 1,498 lines to ~200 lines
 * - Result: 85% smaller re-render tree
 */

import React, { memo, useCallback } from 'react';
import RangeInputOptimized from '../forms/RangeInputOptimized';
import ParameterSectionOptimized from '../layout/ParameterSectionOptimized';

interface ScenarioParameters {
  instroom: number;
  fte_vrouw: number;
  fte_man: number;
  uitstroom_vrouw_5j: number;
  uitstroom_man_5j: number;
  uitstroom_vrouw_10j: number;
  uitstroom_man_10j: number;
  uitstroom_vrouw_15j: number;
  uitstroom_man_15j: number;
  uitstroom_vrouw_20j: number;
  uitstroom_man_20j: number;
}

interface AanbodSectionProps {
  scenario: ScenarioParameters;
  baseline: ScenarioParameters;
  onScenarioChange: (updates: Partial<ScenarioParameters>) => void;
}

const AanbodSection = memo<AanbodSectionProps>(({ scenario, baseline, onScenarioChange }) => {
  const handleReset = useCallback(() => {
    onScenarioChange({
      instroom: baseline.instroom,
      fte_vrouw: baseline.fte_vrouw,
      fte_man: baseline.fte_man,
      uitstroom_vrouw_5j: baseline.uitstroom_vrouw_5j,
      uitstroom_man_5j: baseline.uitstroom_man_5j,
      uitstroom_vrouw_10j: baseline.uitstroom_vrouw_10j,
      uitstroom_man_10j: baseline.uitstroom_man_10j,
      uitstroom_vrouw_15j: baseline.uitstroom_vrouw_15j,
      uitstroom_man_15j: baseline.uitstroom_man_15j,
      uitstroom_vrouw_20j: baseline.uitstroom_vrouw_20j,
      uitstroom_man_20j: baseline.uitstroom_man_20j,
    });
  }, [baseline, onScenarioChange]);

  const handleInstroomChange = useCallback(
    (value: number) => onScenarioChange({ instroom: value }),
    [onScenarioChange]
  );

  const handleFteVrouwChange = useCallback(
    (value: number) => onScenarioChange({ fte_vrouw: value }),
    [onScenarioChange]
  );

  const handleFteManChange = useCallback(
    (value: number) => onScenarioChange({ fte_man: value }),
    [onScenarioChange]
  );

  const handleUitstroomVrouw5jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_vrouw_5j: value }),
    [onScenarioChange]
  );

  const handleUitstroomMan5jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_man_5j: value }),
    [onScenarioChange]
  );

  const handleUitstroomVrouw10jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_vrouw_10j: value }),
    [onScenarioChange]
  );

  const handleUitstroomMan10jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_man_10j: value }),
    [onScenarioChange]
  );

  const handleUitstroomVrouw15jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_vrouw_15j: value }),
    [onScenarioChange]
  );

  const handleUitstroomMan15jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_man_15j: value }),
    [onScenarioChange]
  );

  const handleUitstroomVrouw20jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_vrouw_20j: value }),
    [onScenarioChange]
  );

  const handleUitstroomMan20jChange = useCallback(
    (value: number) => onScenarioChange({ uitstroom_man_20j: value }),
    [onScenarioChange]
  );

  return (
    <ParameterSectionOptimized
      title="Aanbod"
      icon="📦"
      onReset={handleReset}
    >
      <RangeInputOptimized
        label="Instroom opleiding"
        value={scenario.instroom}
        onChange={handleInstroomChange}
        min={600}
        max={1500}
        step={10}
        baselineValue={baseline.instroom}
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="FTE-factor vrouw"
            value={scenario.fte_vrouw}
            onChange={handleFteVrouwChange}
            min={0.5}
            max={1.0}
            step={0.01}
            baselineValue={baseline.fte_vrouw}
          />
        </div>

        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="FTE-factor man"
            value={scenario.fte_man}
            onChange={handleFteManChange}
            min={0.5}
            max={1.0}
            step={0.01}
            baselineValue={baseline.fte_man}
          />
        </div>
      </div>

      {/* Uitstroom 5 jaar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom vrouw (5 jaar)"
            value={scenario.uitstroom_vrouw_5j}
            onChange={handleUitstroomVrouw5jChange}
            min={0.05}
            max={0.30}
            step={0.001}
            baselineValue={baseline.uitstroom_vrouw_5j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>

        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom man (5 jaar)"
            value={scenario.uitstroom_man_5j}
            onChange={handleUitstroomMan5jChange}
            min={0.05}
            max={0.30}
            step={0.001}
            baselineValue={baseline.uitstroom_man_5j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>

      {/* Uitstroom 10 jaar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom vrouw (10 jaar)"
            value={scenario.uitstroom_vrouw_10j}
            onChange={handleUitstroomVrouw10jChange}
            min={0.10}
            max={0.50}
            step={0.001}
            baselineValue={baseline.uitstroom_vrouw_10j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>

        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom man (10 jaar)"
            value={scenario.uitstroom_man_10j}
            onChange={handleUitstroomMan10jChange}
            min={0.10}
            max={0.50}
            step={0.001}
            baselineValue={baseline.uitstroom_man_10j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>

      {/* Uitstroom 15 jaar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom vrouw (15 jaar)"
            value={scenario.uitstroom_vrouw_15j}
            onChange={handleUitstroomVrouw15jChange}
            min={0.15}
            max={0.60}
            step={0.001}
            baselineValue={baseline.uitstroom_vrouw_15j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>

        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom man (15 jaar)"
            value={scenario.uitstroom_man_15j}
            onChange={handleUitstroomMan15jChange}
            min={0.15}
            max={0.60}
            step={0.001}
            baselineValue={baseline.uitstroom_man_15j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>

      {/* Uitstroom 20 jaar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom vrouw (20 jaar)"
            value={scenario.uitstroom_vrouw_20j}
            onChange={handleUitstroomVrouw20jChange}
            min={0.20}
            max={0.70}
            step={0.001}
            baselineValue={baseline.uitstroom_vrouw_20j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>

        <div style={{ width: 'calc(50% - 0.25rem)' }}>
          <RangeInputOptimized
            label="Uitstroom man (20 jaar)"
            value={scenario.uitstroom_man_20j}
            onChange={handleUitstroomMan20jChange}
            min={0.20}
            max={0.70}
            step={0.001}
            baselineValue={baseline.uitstroom_man_20j}
            formatValue={(v) => (v * 100).toFixed(1)}
            unit="%"
          />
        </div>
      </div>
    </ParameterSectionOptimized>
  );
});

AanbodSection.displayName = 'AanbodSection';

export default AanbodSection;
