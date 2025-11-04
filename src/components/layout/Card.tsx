import React from 'react';
import styles from '../../styles/common.module.css';

interface CardProps {
  children?: React.ReactNode;
  title?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'info';  // Voor verschillende kleuren
  className?: string;
}

/**
 * Card Component
 *
 * Herbruikbare card container voor metrics, info boxes, etc.
 * Features:
 * - Optionele titel
 * - Verschillende color variants (default, primary, secondary, info)
 * - Consistent styling met design system
 *
 * Gebruikt CSS Modules - GEEN inline styles
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  variant = 'default',
  className = '',
}) => {
  // Variant-specifieke background colors
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#f8f8f8',
    },
    primary: {
      backgroundColor: '#e5f5f5',  // Licht groen-blauw voor scenario cards
    },
    secondary: {
      backgroundColor: '#fff5e5',  // Licht oranje voor highlights
    },
    info: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #ddd',
    },
  };

  return (
    <div
      className={`${styles.card} ${className}`}
      style={{
        ...variantStyles[variant],
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '0.75rem',
      }}
    >
      {title && (
        <div
          className={styles['mb-sm']}
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: variant === 'primary' ? '#006470' : '#0F2B5B',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ fontSize: '0.875rem', color: '#333' }}>
        {children}
      </div>
    </div>
  );
};

export default Card;
