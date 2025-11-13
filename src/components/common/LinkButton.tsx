import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ButtonVariant, ButtonSize } from './Button';
import styles from './Button.module.css';

interface LinkButtonProps {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
  title?: string;
}

/**
 * LinkButton - A Link component styled as a Button
 *
 * Reuses Button CSS modules to maintain consistent styling while
 * providing React Router navigation capabilities with support for
 * opening links in new windows/tabs.
 *
 * @example
 * // Open in same window
 * <LinkButton to="/dashboard" variant="primary">
 *   Go to Dashboard
 * </LinkButton>
 *
 * @example
 * // Open in new window
 * <LinkButton to="/audience" variant="secondary" target="_blank" rel="noopener noreferrer">
 *   Open Audience View
 * </LinkButton>
 */
export function LinkButton({
  to,
  variant = 'primary',
  size = 'medium',
  children,
  target,
  rel,
  className = '',
  title,
}: LinkButtonProps) {
  const buttonClass = styles['button'] ?? '';
  const variantClass = styles[variant] ?? '';
  const sizeClass = styles[size] ?? '';

  return (
    <Link
      to={to}
      target={target}
      rel={rel}
      title={title}
      className={`${buttonClass} ${variantClass} ${sizeClass} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
