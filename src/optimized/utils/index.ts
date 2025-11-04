/**
 * Utils Exports - Huisartsen Dashboard
 *
 * Centrale export file voor alle utility functies
 * Gebruik: import { combineScenarioWithBaseline, formatDutchNumber } from './utils';
 */

// Chart data utilities
export {
  combineScenarioWithBaseline,
  transformCohortData,
  transformGapData,
  transformGenderData,
  filterByYearRange,
  findByYear,
  calculateSummaryStats,
  formatDutchNumber,
  formatThousands,
} from './chartDataUtils';
