/**
 * useContestantSelection Hook
 *
 * Manages contestant selection state for duel setup.
 * Supports manual selection, deselection, clearing, and random selection.
 */

import { useState } from 'react';
import type { Contestant } from '@types';
import { useRandomSelect } from './useRandomSelect';

export interface ContestantSelection {
  selected: [Contestant | null, Contestant | null];
  select: (contestant: Contestant) => void;
  deselect: (contestant: Contestant) => void;
  clear: () => void;
  randomSelect: () => void;
}

export function useContestantSelection(contestants: Contestant[]): ContestantSelection {
  const [selectedContestant1, setSelectedContestant1] = useState<Contestant | null>(null);
  const [selectedContestant2, setSelectedContestant2] = useState<Contestant | null>(null);
  const { randomSelect: randomSelectUtil } = useRandomSelect();

  const select = (contestant: Contestant) => {
    // Toggle selection logic: select contestant1, then contestant2
    if (selectedContestant1?.id === contestant.id) {
      // Deselect contestant1
      setSelectedContestant1(null);
    } else if (selectedContestant2?.id === contestant.id) {
      // Deselect contestant2
      setSelectedContestant2(null);
    } else if (!selectedContestant1) {
      // Select as contestant1
      setSelectedContestant1(contestant);
    } else if (!selectedContestant2) {
      // Select as contestant2
      setSelectedContestant2(contestant);
    } else {
      // Both slots full, replace contestant1 and shift contestant2 to contestant1
      setSelectedContestant1(selectedContestant2);
      setSelectedContestant2(contestant);
    }
  };

  const deselect = (contestant: Contestant) => {
    if (selectedContestant1?.id === contestant.id) {
      setSelectedContestant1(null);
    } else if (selectedContestant2?.id === contestant.id) {
      setSelectedContestant2(null);
    }
  };

  const clear = () => {
    setSelectedContestant1(null);
    setSelectedContestant2(null);
  };

  const randomSelect = () => {
    // Filter out already selected contestants to avoid toggling them off
    const eligibleContestants = contestants.filter(
      (c) => c.id !== selectedContestant1?.id && c.id !== selectedContestant2?.id
    );

    const selected = randomSelectUtil(eligibleContestants);
    if (selected) {
      // Add to selection using the same logic as manual selection
      select(selected);
    }
  };

  return {
    selected: [selectedContestant1, selectedContestant2],
    select,
    deselect,
    clear,
    randomSelect,
  };
}
