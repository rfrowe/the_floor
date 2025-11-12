/**
 * ContestantCreator Component
 *
 * Modal for creating a new contestant by:
 * 1. Entering a contestant name
 * 2. Selecting from existing categories
 * 3. Optionally importing a new category
 */

import { useState, useMemo } from 'react';
import type { StoredCategory, Contestant } from '@types';
import { ViewStack, type View } from '@components/common/ViewStack';
import { CreateContent } from './creator/CreateContent';

interface ContestantCreatorProps {
  onClose: () => void;
  onCreate: (contestants: Contestant[]) => void;
  categories: StoredCategory[];
}

export function ContestantCreator({
  onClose,
  onCreate,
  categories,
}: ContestantCreatorProps) {
  // Lift form state to this level for proper preservation across navigation
  const [formState, setFormState] = useState({
    contestantName: '',
    selectedCategoryId: '',
  });

  // Recreate view whenever formState changes (ensures latest state on back navigation)
  const createView = useMemo(() => ({
    id: 'create',
    title: 'Add Contestant',
    content: (
      <CreateContent
        categories={categories}
        contestantName={formState.contestantName}
        selectedCategoryId={formState.selectedCategoryId}
        onStateChange={setFormState}
      />
    ),
  } satisfies View), [formState, categories]);

  return (
    <ViewStack
      isOpen={true}
      onClose={onClose}
      initialView={createView}
      onComplete={(result?: unknown) => {
        // Handle created contestants
        if (result && typeof result === 'object' && 'created' in result) {
          const typedResult = result as { created: Contestant[] };
          onCreate(typedResult.created);
        }
      }}
    />
  );
}
