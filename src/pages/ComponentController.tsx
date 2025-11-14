import { memo } from 'react';
import { Button, Card } from '@components/common';

export interface ControlConfig {
  type: 'slider' | 'number' | 'checkbox' | 'button' | 'select' | 'group';
  label: React.ReactNode;
  value?: number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // For select type
  controls?: ControlConfig[]; // For group type
  onChange?: (value: number | boolean) => void;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
}

interface ComponentControllerProps {
  title?: string;
  controls?: ControlConfig[];
  onReset?: () => void;
  description?: React.ReactNode;
  highlights?: React.ReactNode;
}

export const ComponentController = memo(function ComponentController({
  title,
  controls = [],
  onReset,
  description,
  highlights,
}: ComponentControllerProps) {
  // If no controls and no description/highlights, don't render
  if (controls.length === 0 && !description && !highlights) {
    return null;
  }

  // Auto-set title based on content
  const autoTitle = title ?? (controls.length > 0 ? 'Demo Controls' : 'Demo Information');

  const headerContent = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <span>{autoTitle}</span>
      {onReset && (
        <Button size="small" variant="secondary" onClick={onReset} style={{ marginLeft: '1rem' }}>
          🔄 Reset
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <Card header={headerContent}>
        {/* Description section */}
        {description && (
          <div
            style={{
              marginBottom: highlights ? '2.5rem' : controls.length > 0 ? '2.5rem' : '0',
              color: 'var(--text-secondary)',
              textAlign: 'left',
            }}
          >
            {description}
          </div>
        )}

        {/* Highlights section */}
        {highlights && (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'rgba(var(--primary-color-rgb, 63, 81, 181), 0.08)',
              borderRadius: '6px',
              border: '2px solid rgba(var(--primary-color-rgb, 63, 81, 181), 0.2)',
              fontSize: '0.95rem',
              textAlign: 'left',
              marginBottom: controls.length > 0 ? '2.5rem' : '0',
            }}
          >
            {highlights}
          </div>
        )}

        {/* Controls grid */}
        {controls.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              alignItems: 'start',
            }}
          >
            {controls.map((control, index) => {
              switch (control.type) {
                case 'slider':
                  return (
                    <div
                      key={index}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <label
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{control.label}</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          {control.value}
                        </span>
                      </label>
                      <input
                        type="range"
                        min={control.min ?? 0}
                        max={control.max ?? 100}
                        step={control.step ?? 1}
                        value={control.value as number}
                        onChange={(e) => control.onChange?.(parseFloat(e.target.value))}
                        disabled={control.disabled}
                        style={{
                          width: '100%',
                          cursor: control.disabled ? 'not-allowed' : 'pointer',
                        }}
                      />
                    </div>
                  );

                case 'number':
                  return (
                    <div
                      key={index}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                    >
                      <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        {control.label}
                      </label>
                      <input
                        type="number"
                        min={control.min ?? 0}
                        max={control.max ?? 100}
                        step={control.step ?? 1}
                        value={control.value as number}
                        onChange={(e) => control.onChange?.(parseInt(e.target.value, 10))}
                        disabled={control.disabled}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          width: '100%',
                        }}
                      />
                    </div>
                  );

                case 'checkbox':
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={control.value as boolean}
                        onChange={(e) => control.onChange?.(e.target.checked)}
                        disabled={control.disabled}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: control.disabled ? 'not-allowed' : 'pointer',
                        }}
                        id={`checkbox-${String(index)}`}
                      />
                      <label
                        htmlFor={`checkbox-${String(index)}`}
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          cursor: control.disabled ? 'not-allowed' : 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {control.label}
                      </label>
                    </div>
                  );

                case 'button':
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <Button
                        onClick={control.onClick}
                        variant={control.variant ?? 'secondary'}
                        size="small"
                        disabled={control.disabled}
                        style={{ width: '100%' }}
                      >
                        {control.label}
                      </Button>
                    </div>
                  );

                case 'select':
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        gridColumn: '1 / -1', // Full width
                      }}
                    >
                      <label style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        {control.label}
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        {control.options?.map((option, optIdx) => (
                          <Button
                            key={optIdx}
                            size="small"
                            variant={control.value === optIdx ? 'primary' : 'secondary'}
                            onClick={() => control.onChange?.(optIdx)}
                            disabled={control.disabled}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );

                case 'group':
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-primary)',
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'rgba(var(--primary-color-rgb, 63, 81, 181), 0.05)';
                        e.currentTarget.style.borderColor =
                          'rgba(var(--primary-color-rgb, 63, 81, 181), 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                      }}
                    >
                      <label
                        style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}
                      >
                        {control.label}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Render sliders first, each on own line */}
                        {control.controls
                          ?.filter((c) => c.type === 'slider')
                          .map((subControl, subIdx) => (
                            <div
                              key={`slider-${String(subIdx)}`}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                            >
                              <label
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span>{subControl.label}</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                  {subControl.value}
                                </span>
                              </label>
                              <input
                                type="range"
                                min={subControl.min ?? 0}
                                max={subControl.max ?? 100}
                                step={subControl.step ?? 1}
                                value={subControl.value as number}
                                onChange={(e) => subControl.onChange?.(parseFloat(e.target.value))}
                                disabled={subControl.disabled}
                                style={{
                                  width: '100%',
                                  cursor: subControl.disabled ? 'not-allowed' : 'pointer',
                                }}
                              />
                            </div>
                          ))}
                        {/* Render buttons horizontally */}
                        {(control.controls?.filter((c) => c.type === 'button').length ?? 0) > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {control.controls
                              ?.filter((c) => c.type === 'button')
                              .map((subControl, subIdx) => (
                                <Button
                                  key={`button-${String(subIdx)}`}
                                  onClick={subControl.onClick}
                                  variant={subControl.variant ?? 'secondary'}
                                  size="small"
                                  disabled={subControl.disabled}
                                  style={{ flex: 1, minWidth: '100px' }}
                                >
                                  {subControl.label}
                                </Button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        )}
      </Card>
    </div>
  );
});
