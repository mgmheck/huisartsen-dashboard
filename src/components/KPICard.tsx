import React from 'react';
import { STYLES } from '../styles/constants';

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  backgroundColor?: string;
  textColor?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  backgroundColor = '#f8f8f8',
  textColor = '#333'
}) => {
  return (
    <div style={{ ...STYLES.card, backgroundColor, padding: '0.75rem' }}>
      <div style={{ ...STYLES.kpiLabel, color: STYLES.colors.primary }}>
        {label}
      </div>
      <div style={{ ...STYLES.kpiValue, color: textColor }}>
        {value}
      </div>
      {subtext && (
        <div style={STYLES.kpiSubtext}>
          {subtext}
        </div>
      )}
    </div>
  );
};

export default KPICard;
