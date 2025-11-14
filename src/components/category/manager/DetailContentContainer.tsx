/**
 * DetailContentContainer Component
 *
 * Container that loads category data using ViewStack's onLoad hook,
 * then renders DetailContent with the loaded data.
 */

import { useState } from 'react';
import type { StoredCategory } from '@types';
import { getCategoryById } from '@storage/indexedDB';
import { createLogger } from '@/utils/logger';
import { DetailContent } from './DetailContent';

const log = createLogger('DetailContentContainer');

interface DetailContentContainerProps {
  categoryId: string;
}

export function DetailContentContainer({ categoryId }: DetailContentContainerProps) {
  const [category, setCategory] = useState<StoredCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);

  // Load category data - called by ViewStack's onLoad hook
  const loadCategory = async () => {
    try {
      const fullCategory = await getCategoryById<StoredCategory>(categoryId);
      setCategory(fullCategory);
    } catch (error) {
      log.error('Failed to load category:', error);
      alert('Failed to load category details');
    } finally {
      setIsLoading(false);
    }
  };

  // Expose load function to be called by ViewStack
  if (!category && isLoading) {
    // Trigger load on first render
    void loadCategory();
    return <div>Loading category...</div>;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <DetailContent
      category={category}
      expandedSlideIndex={expandedSlideIndex}
      setExpandedSlideIndex={setExpandedSlideIndex}
    />
  );
}
