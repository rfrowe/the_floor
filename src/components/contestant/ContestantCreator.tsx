/**
 * ContestantCreator Component
 *
 * Modal for creating a new contestant by:
 * 1. Entering a contestant name
 * 2. Selecting from existing categories
 * 3. Optionally importing a new category
 */

import { useState } from 'react';
import type { StoredCategory, Contestant } from '@types';
import { ViewStack } from '@components/common/ViewStack';
import { CreateContentView } from './creator/CreateContentView';

interface ContestantCreatorProps {
  onClose: () => void;
  onCreate: (contestants: Contestant[]) => void;
  categories: StoredCategory[];
}

export function ContestantCreator({ onClose, onCreate, categories }: ContestantCreatorProps) {
  const [formState, setFormState] = useState({
    contestantName: '',
    selectedCategoryId: '',
  });

  return (
    <ViewStack
      isOpen={true}
      onClose={onClose}
      onComplete={(result?: unknown) => {
        if (result && typeof result === 'object' && 'created' in result) {
          const typedResult = result as { created: Contestant[] };
          onCreate(typedResult.created);
        }
        onClose();
      }}
    >
      <CreateContentView
        viewId="create"
        viewTitle="Add Contestant"
        categories={categories}
        contestantName={formState.contestantName}
        selectedCategoryId={formState.selectedCategoryId}
        onStateChange={setFormState}
      />
    </ViewStack>
  );
}
