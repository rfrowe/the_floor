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

  // Re-validate P2 selection when contestants' positions change
  useEffect(() => {
    // If we have both P1 and P2 selected, check if P2 is still valid
    if (selectedContestant1 && selectedContestant2) {
      // Find the updated versions of the selected contestants
      const updatedP1 = contestants.find((c) => c.id === selectedContestant1.id);
      const updatedP2 = contestants.find((c) => c.id === selectedContestant2.id);

      if (updatedP1 && updatedP2) {
        // Update the selected contestants with their latest data
        setSelectedContestant1(updatedP1);
        setSelectedContestant2(updatedP2);

        // Check if P2 is still adjacent to P1
        if (updatedP1.controlledSquares && updatedP1.controlledSquares.length > 0) {
          const adjacentContestants = getAdjacentContestants(updatedP1, contestants);
          const isStillAdjacent = adjacentContestants.some((c) => c.id === updatedP2.id);

          if (!isStillAdjacent) {
            // P2 is no longer adjacent to P1, clear P2 selection
            setSelectedContestant2(null);
          }
        }
      }
    } else if (selectedContestant1) {
      // Just update P1 with latest data
      const updatedP1 = contestants.find((c) => c.id === selectedContestant1.id);
      if (updatedP1) {
        setSelectedContestant1(updatedP1);
      }
    }
  }, [contestants, selectedContestant1, selectedContestant2]);

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
    // Only allow selection of contestants who are on the board
    const isOnBoard = contestant.controlledSquares && contestant.controlledSquares.length > 0;

    // Toggle selection logic: select contestant1, then contestant2
    if (selectedContestant1?.id === contestant.id) {
      // Only allow deselecting P1 if P2 is not selected
      if (!selectedContestant2) {
        setSelectedContestant1(null);
      }
      // Silently ignore if P2 is selected (can't deselect P1 while P2 exists)
    } else if (selectedContestant2?.id === contestant.id) {
      // Always allow deselecting P2
      setSelectedContestant2(null);
    } else if (!selectedContestant1 && isOnBoard) {
      // Select as contestant1 (P1 must be on the board)
      setSelectedContestant1(contestant);
    } else if (!selectedContestant2 && isOnBoard) {
      // Select as contestant2 (P2 must be adjacent to P1 and on the board)
      if (canSelectAsP2(contestant)) {
        setSelectedContestant2(contestant);
      }
      // Silently ignore non-adjacent selections
    } else if (selectedContestant1 && selectedContestant2 && isOnBoard) {
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
    // Random select only picks P1 (the challenger)
    // P1 then manually chooses which neighbor to challenge

    // If P2 is selected, clear it first since we're picking a new P1
    if (selectedContestant2) {
      setSelectedContestant2(null);
    }

    // Select from active contestants who are on the board (have territory)
    const activeContestants = contestants.filter(
      (c) => !c.eliminated && c.controlledSquares && c.controlledSquares.length > 0
    );

    if (activeContestants.length === 0) {
      return;
    }

    // Find minimum territory size
    const minTerritory = Math.min(
      ...activeContestants.map((c) => c.controlledSquares?.length ?? 0)
    );

    // Filter to only contestants with minimum territory
    // Exclude current P1 if already selected to ensure we pick someone different
    const eligibleContestants = activeContestants.filter(
      (c) => (c.controlledSquares?.length ?? 0) === minTerritory && c.id !== selectedContestant1?.id
    );

    // If no other contestants with min territory exist, include current P1
    if (eligibleContestants.length === 0) {
      const allMinTerritoryContestants = activeContestants.filter(
        (c) => (c.controlledSquares?.length ?? 0) === minTerritory
      );
      const selected = randomSelectUtil(allMinTerritoryContestants);
      if (selected) {
        setSelectedContestant1(selected);
      }
    } else {
      const selected = randomSelectUtil(eligibleContestants);
      if (selected) {
        setSelectedContestant1(selected);
      }
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
