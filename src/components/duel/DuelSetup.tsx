import { useState, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_GAME_CONFIG, type Contestant, type Category } from '@types';
import { useDuelState } from '@hooks/useDuelState';
import { Button } from '@components/common/Button';
import styles from './DuelSetup.module.css';

/**
 * Configuration for starting a duel
 */
export interface DuelConfig {
  contestant1: Contestant;
  contestant2: Contestant;
  selectedCategory: Category;
}

/**
 * Props for the DuelSetup component
 */
export interface DuelSetupProps {
  /** First selected contestant (can be null if not yet selected) */
  contestant1: Contestant | null;

  /** Second selected contestant (can be null if not yet selected) */
  contestant2: Contestant | null;

  /** Callback to clear the current selection */
  onClear: () => void;

  /** Callback when duel is started with valid configuration */
  onStartDuel: (duelConfig: DuelConfig) => void;
}

/**
 * Ref handle for DuelSetup component
 */
export interface DuelSetupHandle {
  /** Programmatically trigger the start duel action */
  startDuel: () => void;
}

/**
 * DuelSetup component for configuring and starting a duel between two contestants.
 *
 * Features:
 * - Displays selected contestants
 * - Category selection dropdown (one category from each contestant)
 * - Validation for required selections
 * - Clear and Start Duel actions
 * - Information about winner receiving unplayed category
 */
export const DuelSetup = forwardRef<DuelSetupHandle, DuelSetupProps>(function DuelSetup(
  { contestant1, contestant2, onClear, onStartDuel },
  ref
) {
  const navigate = useNavigate();
  const [, setDuelState] = useDuelState();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Determine if we can start the duel
  const canStartDuel = contestant1 !== null && contestant2 !== null && selectedCategory !== null;

  // Expose startDuel method via ref
  useImperativeHandle(ref, () => ({
    startDuel: handleStartDuel,
  }));

  // Get validation messages
  const getValidationMessage = (): string | null => {
    if (!contestant1 || !contestant2) {
      return 'Select 2 contestants to set up a duel';
    }
    if (!selectedCategory) {
      return 'Select a category for the duel';
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryName = event.target.value;

    // Find the matching category from either contestant
    if (contestant1?.category.name === categoryName) {
      setSelectedCategory(contestant1.category);
    } else if (contestant2?.category.name === categoryName) {
      setSelectedCategory(contestant2.category);
    } else {
      setSelectedCategory(null);
    }
  };

  const handleStartDuel = () => {
    console.log('🎮 Start Duel clicked!');
    console.log('Contestant 1:', contestant1?.name);
    console.log('Contestant 2:', contestant2?.name);
    console.log('Selected Category:', selectedCategory?.name);

    // Triple-check validation before starting
    if (!contestant1 || !contestant2 || !selectedCategory) {
      console.log('❌ Validation failed - missing data');
      return;
    }

    // Create initial duel state
    const initialDuelState = {
      contestant1,
      contestant2,
      selectedCategory,
      activePlayer: 1 as const,
      timeRemaining1: DEFAULT_GAME_CONFIG.timePerPlayer,
      timeRemaining2: DEFAULT_GAME_CONFIG.timePerPlayer,
      currentSlideIndex: 0,
      isSkipAnimationActive: false,
    };

    console.log('💾 Saving duel state via hook (will store as reference)');

    // Save via hook - it will convert to reference and store in localStorage
    setDuelState(initialDuelState);

    console.log('✅ Saved!');

    // Call parent callback
    onStartDuel({
      contestant1,
      contestant2,
      selectedCategory,
    });

    // Navigate to master view
    void navigate('/master');
  };

  const handleClear = () => {
    setSelectedCategory(null);
    onClear();
  };

  // Get the unplayed category name for the info message
  const getUnplayedCategoryName = (): string => {
    if (!selectedCategory || !contestant1 || !contestant2) {
      return 'unplayed category';
    }

    // The unplayed category is the one NOT selected for the duel
    if (selectedCategory.name === contestant1.category.name) {
      return contestant2.category.name;
    }
    return contestant1.category.name;
  };

  const containerClass = styles['duel-setup'] ?? '';
  const headerClass = styles['header'] ?? '';
  const sectionClass = styles['section'] ?? '';
  const contestantListClass = styles['contestant-list'] ?? '';
  const contestantItemClass = styles['contestant-item'] ?? '';
  const contestantLabelClass = styles['contestant-label'] ?? '';
  const contestantNameClass = styles['contestant-name'] ?? '';
  const categorySelectClass = styles['category-select'] ?? '';
  const infoBoxClass = styles['info-box'] ?? '';
  const infoIconClass = styles['info-icon'] ?? '';
  const validationClass = styles['validation-message'] ?? '';
  const actionsClass = styles['actions'] ?? '';

  return (
    <div className={containerClass}>
      <h3 className={headerClass}>Duel Setup</h3>

      {/* Contestants Section */}
      <div className={sectionClass}>
        <div className={contestantListClass}>
          <div className={contestantItemClass}>
            <span className={contestantLabelClass}>Contestant 1:</span>
            <span className={contestantNameClass}>{contestant1?.name ?? '(Not selected)'}</span>
          </div>
          <div className={contestantItemClass}>
            <span className={contestantLabelClass}>Contestant 2:</span>
            <span className={contestantNameClass}>{contestant2?.name ?? '(Not selected)'}</span>
          </div>
        </div>
      </div>

      {/* Category Selection Section */}
      <div className={sectionClass}>
        <label htmlFor="duel-category" className={contestantLabelClass}>
          Duel Category:
        </label>
        <select
          id="duel-category"
          className={categorySelectClass}
          value={selectedCategory?.name ?? ''}
          onChange={handleCategoryChange}
          disabled={!contestant1 || !contestant2}
        >
          <option value="">Select a category...</option>
          {contestant1 && (
            <option value={contestant1.category.name}>
              {contestant1.category.name} (from {contestant1.name})
            </option>
          )}
          {contestant2 && (
            <option value={contestant2.category.name}>
              {contestant2.category.name} (from {contestant2.name})
            </option>
          )}
        </select>
      </div>

      {/* Info Box */}
      <div className={infoBoxClass}>
        <span className={infoIconClass}>ℹ️</span>
        <span>
          Winner receives the <strong>UNPLAYED category</strong> from the loser
          {selectedCategory && ` (${getUnplayedCategoryName()})`}
        </span>
      </div>

      {/* Validation Message */}
      {validationMessage && <div className={validationClass}>{validationMessage}</div>}

      {/* Actions */}
      <div className={actionsClass}>
        <Button variant="secondary" onClick={handleClear} disabled={!contestant1 && !contestant2}>
          Clear
        </Button>
        <Button variant="primary" onClick={handleStartDuel} disabled={!canStartDuel}>
          Start Duel
        </Button>
      </div>
    </div>
  );
});
