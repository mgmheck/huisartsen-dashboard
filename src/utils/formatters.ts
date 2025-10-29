// Utility functies voor nummer formatting

/**
 * Formatteer nummer naar Nederlandse notatie (komma i.p.v. punt)
 */
export const formatDutchNumber = (value: number, decimals: number = 0): string => {
  return value.toFixed(decimals).replace('.', ',');
};

/**
 * Formatteer nummer met duizendtal scheidingstekens (Nederlandse stijl)
 */
export const formatWithThousandsSeparator = (value: number): string => {
  return Math.round(value).toLocaleString('nl-NL');
};

/**
 * Formatteer percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatDutchNumber(value * 100, decimals)}%`;
};
