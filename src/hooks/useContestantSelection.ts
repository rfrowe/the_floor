/**
 * useContestantSelection Hook
 *
 * Manages contestant selection state for duel setup.
 * Supports manual selection, deselection, clearing, and random selection.
 * Broadcasts selection changes to other windows (e.g., Audience View).
 *
 * Enforces game rule: P2 must be adjacent to P1's territory (share at least one edge).
 */

import { useState, useEffect, useRef } from 'react';
import type { Contestant } from '@types';
import { useRandomSelect } from './useRandomSelect';
import { getAdjacentContestants } from '@utils/gridUtils';
import { createBroadcastSync } from '@/utils/broadcastSync';

const SELECTION_CHANNEL_NAME = 'the_floor_contestant_selection';

interface SelectionMessage {
  contestant1Id: string | null;
  contestant2Id: string | null;
}

export interface ContestantSelection {
  selected: [Contestant | null, Contestant | null];
  select: (contestant: Contestant) => void;
  deselect: (contestant: Contestant) => void;
  clear: () => void;
  randomSelect: () => void;
  canSelectAsP2: (contestant: Contestant) => boolean;
}

export function useContestantSelection(contestants: Contestant[]): ContestantSelection {
  const [selectedContestant1, setSelectedContestant1] = useState<Contestant | null>(null);
  const [selectedContestant2, setSelectedContestant2] = useState<Contestant | null>(null);
  const { randomSelect: randomSelectUtil } = useRandomSelect();
  const broadcastRef = useRef<ReturnType<typeof createBroadcastSync<SelectionMessage>> | null>(
    null
  );

  // Initialize BroadcastChannel for selection sync
  useEffect(() => {
    const broadcast = createBroadcastSync<SelectionMessage>({
      channelName: SELECTION_CHANNEL_NAME,
      onMessage: () => {
        // Audience View doesn't need to update selection state
        // It will just read from this when rendering
      },
    });

    broadcastRef.current = broadcast;

    return () => {
      broadcast.cleanup();
    };
  }, []);

  // Broadcast selection changes whenever they occur
  useEffect(() => {
    broadcastRef.current?.send({
      contestant1Id: selectedContestant1?.id ?? null,
      contestant2Id: selectedContestant2?.id ?? null,
    });
  }, [selectedContestant1, selectedContestant2]);

  /**
   * Check if a contestant can be selected as P2.
   * P2 must be adjacent to P1's territory (share at least one edge).
   * Returns true if P1 is not selected (no adjacency requirement yet).
   */
  const canSelectAsP2 = (contestant: Contestant): boolean => {
    if (!selectedContestant1) {
      return true; // No P1 selected yet, so no adjacency requirement
    }

    // If contestant has no territory, they cannot be P2
    if (!contestant.controlledSquares || contestant.controlledSquares.length === 0) {
      return false;
    }

    // P1 must have territory for adjacency check
    if (
      !selectedContestant1.controlledSquares ||
      selectedContestant1.controlledSquares.length === 0
    ) {
      return true; // P1 has no territory, allow any P2
    }

    // Check if contestant is adjacent to P1
    const adjacentContestants = getAdjacentContestants(selectedContestant1, contestants);
    return adjacentContestants.some((c) => c.id === contestant.id);
  };

  const select = (contestant: Contestant) => {
    // Toggle selection logic: select contestant1, then contestant2
    if (selectedContestant1?.id === contestant.id) {
      // Deselect contestant1
      setSelectedContestant1(null);
    } else if (selectedContestant2?.id === contestant.id) {
      // Deselect contestant2
      setSelectedContestant2(null);
    } else if (!selectedContestant1) {
      // Select as contestant1 (P1 can be anyone)
      setSelectedContestant1(contestant);
    } else if (!selectedContestant2) {
      // Select as contestant2 (P2 must be adjacent to P1)
      if (canSelectAsP2(contestant)) {
        setSelectedContestant2(contestant);
      }
      // Silently ignore non-adjacent selections
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
    // Filter eligible contestants based on selection state
    let eligibleContestants: Contestant[];

    if (!selectedContestant1) {
      // No P1 yet, anyone can be selected
      eligibleContestants = contestants;
    } else if (!selectedContestant2) {
      // P1 selected, P2 must be adjacent
      eligibleContestants = contestants.filter(
        (c) => c.id !== selectedContestant1.id && canSelectAsP2(c)
      );
    } else {
      // Both selected, replace one contestant
      eligibleContestants = contestants.filter(
        (c) => c.id !== selectedContestant1.id && c.id !== selectedContestant2.id
      );
    }

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
    canSelectAsP2,
  };
}
