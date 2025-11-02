import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled ?? loading;

  const buttonClass = styles['button'] ?? '';
  const variantClass = styles[variant] ?? '';
  const sizeClass = styles[size] ?? '';
  const disabledClass = isDisabled ? (styles['disabled'] ?? '') : '';
  const loadingClass = loading ? (styles['loading'] ?? '') : '';

  return (
    <button
      className={`${buttonClass} ${variantClass} ${sizeClass} ${disabledClass} ${loadingClass} ${className}`.trim()}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <span className={styles['loadingSpinner']} aria-hidden="true">
          ⏳
        </span>
      )}
      {!loading && icon && (
        <span className={styles['icon']} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles['content']}>{children}</span>
    </button>
  );
}
