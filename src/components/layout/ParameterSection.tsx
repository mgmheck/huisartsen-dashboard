import React from 'react';

interface ParameterSectionProps {
  title: string;
  icon: string;  // Emoji icon
  onReset: () => void;
  children: React.ReactNode;
}

/**
 * ParameterSection Component
 *
 * Herbruikbare sectie container voor parameter groepen
 * Features:
 * - Sectie titel met emoji icon
 * - Reset knop (🔄)
 * - Styling consistent met design system
 */
const ParameterSection: React.FC<ParameterSectionProps> = ({
  title,
  icon,
  onReset,
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#f8f8f8',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '0.75rem',
        border: '2px solid #000',
      }}
    >
      <div style={{ paddingTop: '0', marginTop: '0', marginBottom: '0.5rem' }}>
        {/* Header met titel en reset knop */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '0.875rem',
              fontWeight: 'bold',
              color: '#0F2B5B',
              marginBottom: '0',
            }}
          >
            {icon} {title}
          </h3>
          <button
            onClick={onReset}
            title="Reset naar voorkeursscenario"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              border: 'none',
              backgroundColor: '#0F2B5B',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔄
          </button>
        </div>

        {/* Parameter controls (children) */}
        {children}
      </div>
    </div>
  );
};

export default ParameterSection;
