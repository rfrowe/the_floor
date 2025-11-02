import { useTheme } from '@hooks/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles['toggle']}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Current: ${theme} mode. Click to switch.`}
    >
      <span className={styles['icon']} role="img" aria-hidden="true">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
      <span className={styles['label']}>{theme === 'light' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
