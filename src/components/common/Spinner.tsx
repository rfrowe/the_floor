import styles from './Spinner.module.css';

export type SpinnerSize = 'small' | 'medium' | 'large';

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({ size = 'medium', label, className = '' }: SpinnerProps) {
  const containerClass = styles['container'] ?? '';
  const spinnerClass = styles['spinner'] ?? '';
  const sizeClass = styles[size] ?? '';
  const labelClass = styles['label'] ?? '';

  return (
    <div className={`${containerClass} ${className}`.trim()} role="status">
      <div className={`${spinnerClass} ${sizeClass}`} aria-hidden="true"></div>
      {label && <span className={labelClass}>{label}</span>}
      <span className={styles['srOnly']}>Loading...</span>
    </div>
  );
}
