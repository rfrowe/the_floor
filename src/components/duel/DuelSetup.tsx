import { useState, useImperativeHandle, forwardRef, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_GAME_CONFIG, type Contestant, type Category } from '@types';
import { useDuelState } from '@hooks/useDuelState';
import { useAudienceConnection } from '@hooks/useAudienceConnection';
import timerSyncService from '@services/timerSync';
import { createBroadcastSync } from '@/utils/broadcastSync';
import { createLogger } from '@/utils/logger';
import { Button } from '@components/common/Button';
import styles from './DuelSetup.module.css';

const CATEGORY_SELECTION_CHANNEL = 'the_floor_category_selection';
const log = createLogger('DuelSetup');

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

  /** Optional callback for random contestant selection */
  onRandomSelect?: () => void;

  /** Whether random select is available (i.e., there are contestants on the grid) */
  canRandomSelect?: boolean;

  /** Whether audience view is watching/connected */
  isAudienceWatching?: boolean;

  /** Callback to handle duel start side effects (state, timer, navigation) */
  onDuelStart?: (params: {
    duelState: {
      contestant1: Contestant;
      contestant2: Contestant;
      selectedCategory: Category;
      currentSlideIndex: number;
      activePlayer: 1 | 2;
      timeRemaining1: number;
      timeRemaining2: number;
      isSkipAnimationActive: boolean;
    };
    timePerPlayer: number;
    activePlayer: 1 | 2;
  }) => void;
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
  {
    contestant1,
    contestant2,
    onClear,
    onStartDuel,
    onRandomSelect,
    canRandomSelect = true,
    isAudienceWatching,
    onDuelStart,
  },
  ref
) {
  const navigate = useNavigate();
  const [, setDuelState] = useDuelState();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const broadcastRef = useRef<ReturnType<typeof createBroadcastSync<string | null>> | null>(null);

  // Initialize broadcast channel for category selection
  useEffect(() => {
    const broadcast = createBroadcastSync<string | null>({
      channelName: CATEGORY_SELECTION_CHANNEL,
      onMessage: () => {
        // Dashboard doesn't need to listen, only broadcast
      },
    });

    broadcastRef.current = broadcast;

    return () => {
      broadcast.cleanup();
    };
  }, []);

  // Broadcast category selection changes
  // Note: broadcastRef is intentionally omitted from deps as refs are stable and don't trigger re-renders
  useEffect(() => {
    broadcastRef.current?.send(selectedCategory?.name ?? null);
  }, [selectedCategory]);

  // Check for audience connection - use prop if provided, otherwise check real connection
  const hookConnectionState = useAudienceConnection();
  const audienceConnected = isAudienceWatching ?? hookConnectionState.isConnected;

  // Determine if we can start the duel (only check UI state, not game rules)
  const canStartDuel =
    contestant1 !== null && contestant2 !== null && selectedCategory !== null && audienceConnected;

  const handleStartDuel = useCallback(() => {
    log.debug('🎮 Start Duel clicked!');
    log.debug('Contestant 1:', contestant1?.name);
    log.debug('Contestant 2:', contestant2?.name);
    log.debug('Selected Category:', selectedCategory?.name);

    // Triple-check validation before starting
    if (!contestant1 || !contestant2 || !selectedCategory) {
      log.debug('❌ Validation failed - missing data');
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

    // Call side effects handler (state, timer, navigation)
    if (onDuelStart) {
      onDuelStart({
        duelState: initialDuelState,
        timePerPlayer: DEFAULT_GAME_CONFIG.timePerPlayer,
        activePlayer: 1,
      });
    } else {
      // Default behavior: save state, start timer, navigate
      log.debug('💾 Saving duel state via hook (will store as reference)');
      setDuelState(initialDuelState);
      log.debug('✅ Saved!');

      log.debug('📡 Sending TIMER_START command to Audience View');
      timerSyncService.sendStart(
        DEFAULT_GAME_CONFIG.timePerPlayer,
        DEFAULT_GAME_CONFIG.timePerPlayer,
        1
      );

      log.debug('🧭 Navigating to master view');
      void navigate('/master');
    }

    // Call parent callback
    onStartDuel({
      contestant1,
      contestant2,
      selectedCategory,
    });
  }, [
    contestant1,
    contestant2,
    selectedCategory,
    setDuelState,
    onStartDuel,
    navigate,
    onDuelStart,
  ]);

  // Expose startDuel method via ref
  useImperativeHandle(
    ref,
    () => ({
      startDuel: handleStartDuel,
    }),
    [handleStartDuel]
  );

  // Get validation messages (only validate UI state, not game rules)
  const getValidationMessage = (): string | null => {
    if (!contestant1 || !contestant2) {
      return 'Select 2 contestants to set up a duel';
    }
    if (!selectedCategory) {
      return 'Select a category for the duel';
    }
    if (!audienceConnected) {
      return '⚠️ No Audience View detected. Open Audience View in a new window to begin duel.';
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

  const handleClear = () => {
    setSelectedCategory(null);
    onClear();
  };

  const containerClass = styles['duel-setup'] ?? '';
  const headerClass = styles['header'] ?? '';
  const sectionClass = styles['section'] ?? '';
  const contestantListClass = styles['contestant-list'] ?? '';
  const contestantItemClass = styles['contestant-item'] ?? '';
  const contestantLabelClass = styles['contestant-label'] ?? '';
  const contestantNameClass = styles['contestant-name'] ?? '';
  const categorySelectClass = styles['category-select'] ?? '';
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

      {/* Validation Message */}
      {validationMessage && <div className={validationClass}>{validationMessage}</div>}

      {/* Actions */}
      <div className={actionsClass}>
        {onRandomSelect && (
          <Button variant="secondary" onClick={onRandomSelect} disabled={!canRandomSelect}>
            Random Select
          </Button>
        )}
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
