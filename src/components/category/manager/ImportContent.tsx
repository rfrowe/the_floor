/**
 * ImportContent Component
 *
 * Import view content with sample browser navigation.
 * Fully self-contained - uses hooks directly, no callbacks.
 */

import { useState, useRef } from 'react';
import { nanoid } from 'nanoid';
import type { Category, StoredCategory, Contestant } from '@types';
import { useViewStack, type View } from '@components/common/ViewStack';
import { CategoryImporter } from '@components/CategoryImporter';
import { SampleCategoryBrowser } from '../SampleCategoryBrowser';
import { PreviewContent } from './PreviewContent';
import { ImportCategoryCommand } from './ImportCategoryCommand';
import { useCategories } from '@hooks/useCategories';
import { useContestants } from '@hooks/useIndexedDB';
import { calculateCategorySize } from '@utils/storageUtils';

interface ImportResult {
  imported: { name: string; category: Category }[];
}

interface ImportContentProps {
  // Optional: Pre-fill contestant name in previews (from ContestantCreator)
  initialContestantName?: string;
}

export function ImportContent({ initialContestantName = '' }: ImportContentProps) {
  const { pushView, popView, replaceView } = useViewStack();
  const [, { add: addCategory, remove: removeCategory }] = useCategories();
  const [, { add: addContestant, remove: removeContestant }] = useContestants();

  // Track edited contestant names for each preview (by index)
  const editedNamesRef = useRef<Map<number, string>>(new Map());

  // Import function using hooks
  const handleImportCategory = async (data: {
    name: string;
    category: Category;
  }): Promise<{ categoryId: string; contestantId?: string }> => {
    const categoryId = nanoid();
    const firstSlide = data.category.slides[0];
    const thumbnailUrl = firstSlide?.imageUrl ?? '';
    const sizeInBytes = calculateCategorySize(data.category);

    const storedCategory: StoredCategory = {
      id: categoryId,
      name: data.category.name,
      slides: data.category.slides,
      createdAt: new Date().toISOString(),
      thumbnailUrl,
      sizeInBytes,
    };

    await addCategory(storedCategory);
    console.log(`📦 Category imported: ${data.category.name}`);

    let contestantId: string | undefined;
    if (data.name.trim()) {
      const newContestant: Contestant = {
        id: nanoid(),
        name: data.name,
        category: data.category,
        categoryId,
        wins: 0,
        eliminated: false,
      };
      await addContestant(newContestant);
      contestantId = newContestant.id;
      console.log(`👤 Contestant created: ${data.name}`);
    }

    // Note: No need to call refreshMetadata() here - the broadcast from addCategory()
    // will trigger all useCategoryMetadata hooks to reload automatically

    const result: { categoryId: string; contestantId?: string } = { categoryId };
    if (contestantId) {
      result.contestantId = contestantId;
    }
    return result;
  };

  // Undo function using hooks
  const handleUndoImport = async (categoryId: string, contestantId?: string): Promise<void> => {
    await Promise.all([
      removeCategory(categoryId),
      contestantId ? removeContestant(contestantId) : Promise.resolve(),
    ]);
    // Note: No need to call refreshMetadata() - the broadcast from removeCategory()
    // will trigger all useCategoryMetadata hooks to reload automatically
  };
  // Preserve sample selections across navigation
  const [selectedSampleFilenames, setSelectedSampleFilenames] = useState<Set<string>>(new Set());

  // Create preview view factory - each view knows how to create the next one
  const createPreviewView = (
    categories: { name: string; category: Category }[],
    index: number,
    popsBeforeResult: number
  ): View => {
    const item = categories[index];
    if (!item) {
      throw new Error(`No category at index ${String(index)}`);
    }

    const isLastCategory = index === categories.length - 1;
    const categoryNumber = index + 1;
    const totalPopsToList = 1 + index + popsBeforeResult;

    // Use edited name if available, otherwise use original name or initialContestantName
    const contestantName =
      editedNamesRef.current.get(index) ?? (item.name || initialContestantName);

    // Create command for this preview using local hook functions
    const command = new ImportCategoryCommand(
      { name: contestantName, category: item.category },
      handleImportCategory,
      handleUndoImport
    );

    // Factory to create the next preview view (only if not last)
    const createNextView:
      | ((editedData: { contestantName: string; categoryName: string }) => View)
      | undefined = isLastCategory
      ? undefined
      : (editedData) => {
          // Store edited name for current index only (don't propagate forward)
          editedNamesRef.current.set(index, editedData.contestantName);
          return createPreviewView(categories, index + 1, popsBeforeResult);
        };

    const previewView: View = {
      id: `import-preview-${String(index)}`,
      title: `${item.category.name} - Preview`,
      content: (
        <PreviewContent
          category={item.category}
          contestantName={contestantName}
          categoryNumber={categoryNumber}
          totalCategories={categories.length}
          isSample={true}
          fileName={item.category.name}
          isLastCategory={isLastCategory}
          totalPopsToList={totalPopsToList}
          {...(createNextView ? { createNextView } : {})}
          updateCommand={(contestantName, categoryName) => {
            // Store edited name in ref for future previews
            editedNamesRef.current.set(index, contestantName);
            command.updateData(contestantName, categoryName);
          }}
        />
      ),
      // Attach command to view - ViewStack will execute on commit (forward) and undo on back
      command,
    };

    return previewView;
  };

  // Push the first preview view to start the flow
  const pushFirstPreview = (
    categories: { name: string; category: Category }[],
    popsBeforeResult: number
  ) => {
    const firstView = createPreviewView(categories, 0, popsBeforeResult);
    pushView(firstView);
  };

  // Create samples view with given selections
  const createSamplesView = (selections: Set<string>): View => ({
    id: 'samples',
    title: 'Sample Categories',
    content: (
      <SampleCategoryBrowser
        initialSelections={selections}
        initialContestantName={initialContestantName}
        onLoadCategories={(categories, currentSelections) => {
          setSelectedSampleFilenames(currentSelections);
          const updatedSamplesView = createSamplesView(currentSelections);
          replaceView(updatedSamplesView);
          // Stack at this point: [list, import, samples]
          // popsBeforeResult = 2 (import + samples)
          pushFirstPreview(categories, 2);
        }}
      />
    ),
  });

  const handleBrowseSamples = () => {
    const samplesView = createSamplesView(selectedSampleFilenames);
    pushView(samplesView);
  };

  const handleFilesLoaded = (categories: { name: string; category: Category }[]) => {
    pushFirstPreview(categories, 0);
  };

  return (
    <CategoryImporter
      onImport={(data) => {
        popView<ImportResult>({ imported: data });
      }}
      onCancel={() => {
        popView(); // Cancel - go back to list
      }}
      onBrowseSamples={handleBrowseSamples}
      onFilesLoaded={handleFilesLoaded}
    />
  );
}
