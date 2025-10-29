import React from 'react';
import { STYLES } from '../styles/constants';

interface NumberInputWithSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  baseline: number;
  unit?: string;
  decimals?: number;
  multiplier?: number; // Voor percentage conversie (bijv. 100 voor %)
}

const NumberInputWithSlider: React.FC<NumberInputWithSliderProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  baseline,
  unit = '',
  decimals = 0,
  multiplier = 1
}) => {
  const displayValue = value * multiplier;
  const displayBaseline = baseline * multiplier;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue / multiplier);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value) / multiplier);
  };

  const formatValue = (val: number): string => {
    return val.toFixed(decimals).replace('.', ',');
  };

  return (
    <div style={STYLES.inputContainer}>
      <label style={STYLES.inputLabel}>{label}</label>
      <input
        type="number"
        step={step * multiplier}
        value={formatValue(displayValue)}
        onChange={handleInputChange}
        style={STYLES.numberInput}
      />
      <input
        type="range"
        min={min * multiplier}
        max={max * multiplier}
        step={step * multiplier}
        value={displayValue}
        onChange={handleSliderChange}
        style={STYLES.rangeInput}
      />
      <div style={STYLES.baselineText}>
        Vastgestelde waarde: {formatValue(displayBaseline)}{unit}
      </div>
    </div>
  );
};

export default NumberInputWithSlider;
