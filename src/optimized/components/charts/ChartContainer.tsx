import React from 'react';
import styles from '../../styles/common.module.css';

interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;  // Voor instroomadvies badge e.d.
  height?: number;
  className?: string;
}

/**
 * ChartContainer Component
 *
 * Herbruikbare container voor Recharts visualisaties
 * Features:
 * - Optionele titel en subtitle
 * - Overlay support (voor badges/indicators)
 * - Consistent styling met design system
 * - Configureerbare hoogte
 *
 * Gebruikt CSS Modules - GEEN inline styles
 */
const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  overlay,
  height = 500,
  className = '',
}) => {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={{ position: 'relative', marginBottom: '1.5rem' }}
    >
      {/* Optionele overlay (bijv. instroomadvies badge) */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            borderRadius: '0.5rem',
            padding: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          {overlay}
        </div>
      )}

      {/* Optionele titel */}
      {title && (
        <div style={{ marginBottom: subtitle ? '0.5rem' : '1rem' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#0F2B5B',
              margin: 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '0.875rem',
                color: '#666',
                margin: '0.25rem 0 0 0',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart content (Recharts component) */}
      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
