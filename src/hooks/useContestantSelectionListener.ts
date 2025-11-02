/**
 * useContestantSelectionListener Hook
 *
 * Listens to contestant and category selections from Dashboard (via BroadcastChannel)
 * Used by Audience View to show selected contestants for upcoming duel
 */

import { useState, useEffect } from 'react';
import { createBroadcastSync } from '@/utils/broadcastSync';

const SELECTION_CHANNEL_NAME = 'the_floor_contestant_selection';
const CATEGORY_SELECTION_CHANNEL = 'the_floor_category_selection';

interface SelectionMessage {
  contestant1Id: string | null;
  contestant2Id: string | null;
}

/**
 * Listen for contestant and category selection changes from Dashboard
 * Returns selected contestant IDs and selected category name
 */
export function useContestantSelectionListener(): {
  selectedIds: string[];
  selectedCategoryName: string | null;
} {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // Listen for contestant selections
  useEffect(() => {
    const broadcast = createBroadcastSync<SelectionMessage>({
      channelName: SELECTION_CHANNEL_NAME,
      onMessage: (message) => {
        const ids: string[] = [];
        if (message.contestant1Id) ids.push(message.contestant1Id);
        if (message.contestant2Id) ids.push(message.contestant2Id);
        setSelectedIds(ids);
      },
    });

    return () => {
      broadcast.cleanup();
    };
  }, []);

  // Listen for category selections
  useEffect(() => {
    const broadcast = createBroadcastSync<string | null>({
      channelName: CATEGORY_SELECTION_CHANNEL,
      onMessage: (categoryName) => {
        setSelectedCategoryName(categoryName);
      },
    });

    return () => {
      broadcast.cleanup();
    };
  }, []);

  return { selectedIds, selectedCategoryName };
}
