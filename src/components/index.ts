/**
 * Component Exports - Huisartsen Dashboard
 *
 * Centrale export file voor alle herbruikbare components
 * Gebruik: import { RangeInputControl, Card } from './components';
 */

// Forms
export { default as RangeInputControl } from './forms/RangeInputControl';
export { PARAM_CONFIGS, getParamsBySection, getParamConfig } from './forms/parameterConfig';
export type { ParamConfig } from './forms/parameterConfig';

// Layout
export { default as Card } from './layout/Card';
export { default as ParameterSection } from './layout/ParameterSection';

// Charts
export { default as ChartContainer } from './charts/ChartContainer';
