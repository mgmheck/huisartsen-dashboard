import React from 'react';
import { STYLES } from '../styles/constants';

interface SectionHeaderProps {
  icon: string;
  title: string;
  onReset?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, onReset }) => {
  return (
    <div style={STYLES.sectionHeader}>
      <h3 style={STYLES.sectionTitle}>
        {icon} {title}
      </h3>
      {onReset && (
        <button onClick={onReset} title="Reset naar voorkeursscenario" style={STYLES.resetButton}>
          🔄
        </button>
      )}
    </div>
  );
};

export default SectionHeader;
