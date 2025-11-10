import React from 'react';
import { getParamsBySection } from '../forms/parameterConfig';
import RangeInputControl from '../forms/RangeInputControl';
import { ScenarioParams } from '../../types';

interface ParameterSectionsProps {
  scenario: ScenarioParams;
  onParameterChange: (paramName: string, value: number | null) => void;
  isParameterChanged: (paramName: string) => boolean;
  onReset: () => void;
}

/**
 * ParameterSections Component
 * Render all parameter controls grouped by section (aanbod, opleiding, vraag)
 * Uses config-driven approach with parameterConfig.ts
 */
export const ParameterSections: React.FC<ParameterSectionsProps> = ({
  scenario,
  onParameterChange,
  isParameterChanged,
  onReset
}) => {
  const sections = [
    { id: 'aanbod' as const, title: '📊 Aanbod Parameters', icon: '📊' },
    { id: 'opleiding' as const, title: '🎓 Opleiding Parameters', icon: '🎓' },
    { id: 'vraag' as const, title: '📈 Vraag Parameters', icon: '📈' }
  ];

  return (
    <>
      {sections.map(section => {
        const params = getParamsBySection(section.id);

        return (
          <div
            key={section.id}
            style={{
              backgroundColor: '#f8f8f8',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {/* Section header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #006470'
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#006583',
                  margin: 0
                }}
              >
                {section.title}
              </h3>
            </div>

            {/* Parameter controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {params.map(config => {
                // Get baseline value from BASELINE scenario (needs to be imported or passed)
                const BASELINE_VALUES: any = {
                  instroom: 865,
                  intern_rendement: 0.94,
                  opleidingsduur: 3.0,
                  fte_vrouw: 0.72,
                  fte_man: 0.81,
                  extern_rendement_vrouw_1jaar: 0.989,
                  extern_rendement_vrouw_5jaar: 0.943,
                  extern_rendement_vrouw_10jaar: 0.889,
                  extern_rendement_vrouw_15jaar: 0.851,
                  extern_rendement_man_1jaar: 0.992,
                  extern_rendement_man_5jaar: 0.959,
                  extern_rendement_man_10jaar: 0.931,
                  extern_rendement_man_15jaar: 0.905,
                  uitstroom_vrouw_5j: 0.116,
                  uitstroom_man_5j: 0.226,
                  uitstroom_vrouw_10j: 0.232,
                  uitstroom_man_10j: 0.373,
                  uitstroom_vrouw_15j: 0.371,
                  uitstroom_man_15j: 0.502,
                  uitstroom_vrouw_20j: 0.51,
                  uitstroom_man_20j: 0.632,
                  epi_midden: 0.01,
                  soc_midden: 0.019,
                  vak_midden: -0.003,
                  eff_midden: -0.005,
                  hor_midden: 0.016,
                  tijd_midden: 0.0,
                  ver_midden: -0.011,
                  totale_zorgvraag_excl_ATV_midden: 0.026,
                };

                return (
                  <RangeInputControl
                    key={config.key}
                    label={config.label}
                    value={scenario[config.key]}
                    onChange={(value) => onParameterChange(config.key, value)}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    baseline={BASELINE_VALUES[config.key] || 0}
                    transform={config.transform}
                    inverseTransform={config.inverseTransform}
                    decimals={config.decimals}
                    unit={config.unit}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};
