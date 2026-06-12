/**
 * QuickDuelSetup Component
 *
 * Modal for configuring a "quick duel" (exhibition match) between any two existing
 * players in any library category. Unlike the normal duel flow there is no adjacency
 * requirement and eliminated players may participate.
 *
 * Winning a quick duel only increments the winner's win count — no territory transfer,
 * no elimination, and no category-ownership change.
 */

import { useState } from 'react';
import type { Contestant, StoredCategory } from '@types';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { useAudienceConnection } from '@hooks/useAudienceConnection';
import styles from './QuickDuelSetup.module.css';

/**
 * Configuration produced when a quick duel is started.
 */
export interface QuickDuelConfig {
  contestant1: Contestant;
  contestant2: Contestant;
  category: StoredCategory;
}

export interface QuickDuelSetupProps {
  /** All existing contestants (eliminated ones are allowed in quick duels) */
  contestants: Contestant[];

  /** All library categories to choose from */
  categories: StoredCategory[];

  /** Called with the chosen configuration when the quick duel is started */
  onStart: (config: QuickDuelConfig) => void;

  /** Called when the modal is dismissed without starting */
  onCancel: () => void;

  /** Override the audience-connection check (defaults to the real connection state) */
  isAudienceWatching?: boolean;
}

export function QuickDuelSetup({
  contestants,
  categories,
  onStart,
  onCancel,
  isAudienceWatching,
}: QuickDuelSetupProps) {
  const [contestant1Id, setContestant1Id] = useState('');
  const [contestant2Id, setContestant2Id] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const hookConnectionState = useAudienceConnection();
  const audienceConnected = isAudienceWatching ?? hookConnectionState.isConnected;

  const contestant1 = contestants.find((c) => c.id === contestant1Id);
  const contestant2 = contestants.find((c) => c.id === contestant2Id);
  const category = categories.find((c) => c.id === categoryId);

  const samePlayer = contestant1Id !== '' && contestant1Id === contestant2Id;
  const categoryHasSlides = category !== undefined && category.slides.length > 0;

  const canStart =
    contestant1 !== undefined &&
    contestant2 !== undefined &&
    !samePlayer &&
    categoryHasSlides &&
    audienceConnected;

  const getValidationMessage = (): string | null => {
    if (!contestant1 || !contestant2) {
      return 'Select two players for the quick duel';
    }
    if (samePlayer) {
      return 'Pick two different players';
    }
    if (!category) {
      return 'Select a category';
    }
    if (!categoryHasSlides) {
      return 'The selected category has no slides';
    }
    if (!audienceConnected) {
      return '⚠️ No Audience View detected. Open Audience View in a new window to begin.';
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  const handleStart = () => {
    if (!contestant1 || !contestant2 || !category || samePlayer || !categoryHasSlides) {
      return;
    }
    onStart({ contestant1, contestant2, category });
  };

  const formClass = styles['form'] ?? '';
  const introClass = styles['intro'] ?? '';
  const fieldClass = styles['field'] ?? '';
  const labelClass = styles['label'] ?? '';
  const selectClass = styles['select'] ?? '';
  const validationClass = styles['validation'] ?? '';
  const actionsClass = styles['actions'] ?? '';

  return (
    <Modal isOpen onClose={onCancel} title="⚡ Quick Duel">
      <div className={formClass}>
        <p className={introClass}>
          A one-off exhibition match. The winner&apos;s win count goes up — but there are no
          territory, elimination, or category-ownership changes.
        </p>

        <div className={fieldClass}>
          <label htmlFor="quick-duel-player1" className={labelClass}>
            Player 1
          </label>
          <select
            id="quick-duel-player1"
            className={selectClass}
            value={contestant1Id}
            onChange={(e) => {
              setContestant1Id(e.target.value);
            }}
          >
            <option value="">Select a player...</option>
            {contestants.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.eliminated ? ' (eliminated)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="quick-duel-player2" className={labelClass}>
            Player 2
          </label>
          <select
            id="quick-duel-player2"
            className={selectClass}
            value={contestant2Id}
            onChange={(e) => {
              setContestant2Id(e.target.value);
            }}
          >
            <option value="">Select a player...</option>
            {contestants
              .filter((c) => c.id !== contestant1Id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.eliminated ? ' (eliminated)' : ''}
                </option>
              ))}
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="quick-duel-category" className={labelClass}>
            Category
          </label>
          <select
            id="quick-duel-category"
            className={selectClass}
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
            }}
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.slides.length} slides)
              </option>
            ))}
          </select>
        </div>

        {validationMessage && <div className={validationClass}>{validationMessage}</div>}

        <div className={actionsClass}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStart} disabled={!canStart}>
            Start Quick Duel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
