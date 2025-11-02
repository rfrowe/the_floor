import type { ReactNode } from 'react';
import styles from './Container.module.css';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className = '' }: ContainerProps) {
  const containerClass = styles['container'] ?? '';
  return <div className={`${containerClass} ${className}`.trim()}>{children}</div>;
}
