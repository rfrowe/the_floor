import type { Contestant } from '@types';
import styles from './ContestantCard.module.css';

export interface ContestantCardProps {
  contestant: Contestant;
  isSelected?: boolean;
  onSelect?: (contestant: Contestant) => void;
  onClick?: (contestant: Contestant) => void;
  className?: string;
  hasTopWins?: boolean;
  disabled?: boolean;
}

export function ContestantCard({
  contestant,
  isSelected = false,
  onSelect,
  onClick,
  className = '',
  hasTopWins = false,
  disabled = false,
}: ContestantCardProps) {
  const isEliminated = contestant.eliminated;
  // Eliminated or disabled contestants should not be interactive
  const isInteractive = Boolean(onClick ?? onSelect) && !isEliminated && !disabled;

  const handleClick = () => {
    // Don't handle clicks for eliminated or disabled contestants
    if (isEliminated || disabled) {
      return;
    }
    if (onClick) {
      onClick(contestant);
    }
    if (onSelect) {
      onSelect(contestant);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const cardClass = styles['card'] ?? '';
  const eliminatedClass = isEliminated ? (styles['eliminated'] ?? '') : '';
  const disabledClass = disabled ? (styles['disabled'] ?? '') : '';
  const selectedClass = isSelected ? (styles['selected'] ?? '') : '';
  const interactiveClass = isInteractive ? (styles['interactive'] ?? '') : '';

  return (
    <div
      className={`${cardClass} ${eliminatedClass} ${disabledClass} ${selectedClass} ${interactiveClass} ${className}`.trim()}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={`Contestant ${contestant.name}, ${String(contestant.wins)} wins, ${isEliminated ? 'eliminated' : disabled ? 'not eligible' : 'active'}`}
      aria-pressed={isInteractive && isSelected ? true : undefined}
      aria-disabled={disabled || isEliminated ? true : undefined}
    >
      <div className={styles['content']}>
        <div className={styles['header']}>
          <h3 className={styles['name']}>{contestant.name}</h3>
          <div className={styles['wins-badge-wrapper']}>
            {hasTopWins && <span className={styles['crown']}>👑</span>}
            <div className={styles['wins-badge']} aria-label={`${String(contestant.wins)} wins`}>
              {contestant.wins}
            </div>
          </div>
        </div>

        <div className={styles['category-section']}>
          <span className={styles['category-label']}>Category:</span>
          <span className={styles['category-name']}>{contestant.category.name}</span>
        </div>

        {isEliminated && (
          <div className={styles['eliminated-badge']} aria-label="Eliminated">
            Eliminated
          </div>
        )}
      </div>
    </div>
  );
}
