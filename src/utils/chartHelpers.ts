import { CHART_COLORS } from '../styles/constants';

/**
 * Krijg lijn styling voor een specifieke chart categorie
 */
export const getLineStyle = (index: number, varName: string, selectedSubCategory: string) => {
  if (selectedSubCategory === 'zorgvraag' && varName in CHART_COLORS.zorgvraag) {
    return CHART_COLORS.zorgvraag[varName as keyof typeof CHART_COLORS.zorgvraag];
  }

  if (selectedSubCategory === 'uitstroom' && varName in CHART_COLORS.uitstroom) {
    return CHART_COLORS.uitstroom[varName as keyof typeof CHART_COLORS.uitstroom];
  }

  // Standaard kleuren voor andere categorieën
  return {
    stroke: CHART_COLORS.default[index % CHART_COLORS.default.length],
    strokeWidth: 2,
    strokeDasharray: 'none'
  };
};

/**
 * Transformeer data voor charts
 */
export const transformDataForChart = (categoryData: any[], years: string[]) => {
  return years.map((year, idx) => {
    const point: any = { jaar: year };
    categoryData.forEach(metric => {
      point[metric.var] = metric.data[idx];
    });
    return point;
  });
};

/**
 * Transformeer data voor bar chart (laatste 3 jaren)
 */
export const transformDataForBarChart = (categoryData: any[]) => {
  return categoryData.map(metric => ({
    name: metric.label,
    '2019': metric.data[3],
    '2022': metric.data[4],
    '2025': metric.data[5]
  }));
};
