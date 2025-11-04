import React from 'react';
import styles from '../../styles/common.module.css';

interface RangeInputControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  baseline: number;
  transform?: (val: number) => number;  // Voor display transformatie (bijv. * 100 voor percentages)
  inverseTransform?: (val: number) => number;  // Voor inverse transformatie (bijv. / 100)
  decimals?: number;  // Aantal decimalen voor display
  unit?: string;  // Optionele eenheid (%, personen, etc.)
}

/**
 * RangeInputControl Component
 *
 * Herbruikbare parameter control met:
 * - Number input field
 * - Range slider
 * - Baseline waarde display
 * - Optionele transformaties (voor percentages)
 *
 * Gebruikt CSS Modules voor styling - GEEN inline styles
 */
const RangeInputControl: React.FC<RangeInputControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  baseline,
  transform,
  inverseTransform,
  decimals = 0,
  unit = '',
}) => {
  // Bereken display waarde (met transformatie indien nodig)
  const displayValue = transform ? transform(value) : value;
  const displayBaseline = transform ? transform(baseline) : baseline;

  // Handler voor number input
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);
    if (isNaN(inputValue)) return;

    // Inverse transformatie indien nodig
    const actualValue = inverseTransform ? inverseTransform(inputValue) : inputValue;
    onChange(actualValue);
  };

  // Handler voor range slider
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.target.value);
    onChange(inputValue);
  };

  return (
    <div className={styles['mb-sm']}>
      <label
        style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#333',
          display: 'block',
          marginBottom: '0.5rem'
        }}
      >
        {label}
      </label>

      {/* Number Input */}
      <input
        type="number"
        step={step}
        value={displayValue.toFixed(decimals)}
        onChange={handleNumberChange}
        style={{
          width: '100%',
          padding: '0.5rem',
          borderRadius: '0.25rem',
          border: '1px solid #ccc',
          fontSize: '1rem',
          marginBottom: '0.5rem',
          boxSizing: 'border-box'
        }}
      />

      {/* Range Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleRangeChange}
        style={{ width: '100%', display: 'block' }}
      />

      {/* Baseline Display */}
      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
        Vastgestelde waarde: {displayBaseline.toFixed(decimals)}{unit}
      </div>
    </div>
  );
};

export default RangeInputControl;
