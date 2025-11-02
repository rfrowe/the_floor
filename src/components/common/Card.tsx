import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
}

export function Card({ children, className = '', header, footer, interactive = false }: CardProps) {
  const cardClass = styles['card'] ?? '';
  const interactiveClass = interactive ? (styles['interactive'] ?? '') : '';

  return (
    <div className={`${cardClass} ${interactiveClass} ${className}`.trim()}>
      {header && <div className={styles['header']}>{header}</div>}
      <div className={styles['body']}>{children}</div>
      {footer && <div className={styles['footer']}>{footer}</div>}
    </div>
  );
}
