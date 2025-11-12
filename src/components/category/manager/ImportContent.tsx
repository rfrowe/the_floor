/**
 * ImportContent Component
 *
 * Import view content with sample browser navigation.
 * Fully self-contained - uses hooks directly, no callbacks.
 */

import { useState } from 'react';
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
  // No callbacks needed - fully self-contained
}

export function ImportContent({}: ImportContentProps) {
  const { pushView, popView, replaceView } = useViewStack();
  const [, { add: addCategory, remove: removeCategory }] = useCategories();
  const [, { add: addContestant, remove: removeContestant }] = useContestants();

  // Import function using hooks
  const handleImportCategory = async (data: { name: string; category: Category }): Promise<{ categoryId: string; contestantId?: string }> => {
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
    console.log('[ImportContent] Category added to IndexedDB, broadcast sent');

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
      console.log('[ImportContent] Contestant added to IndexedDB');
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
      throw new Error(`No category at index ${index}`);
    }

    const isLastCategory = index === categories.length - 1;
    const categoryNumber = index + 1;
    const totalPopsToList = 1 + index + popsBeforeResult;

    console.log('[ImportContent] createPreviewView', {
      index,
      categoryName: item.category.name,
      isLastCategory,
      totalPopsToList,
      calculation: `1 (current) + ${index} (previous previews) + ${popsBeforeResult} (views before first preview)`,
    });

    // Create command for this preview using local hook functions
    const command = new ImportCategoryCommand(
      { name: item.name, category: item.category },
      handleImportCategory,
      handleUndoImport
    );

    // Factory to create the next preview view (only if not last)
    const createNextView: ((editedData: { contestantName: string; categoryName: string }) => View) | undefined =
      isLastCategory
        ? undefined
        : () => createPreviewView(categories, index + 1, popsBeforeResult);

    const previewView: View = {
      id: `import-preview-${index}`,
      title: `${item.category.name} - Preview`,
      content: (
        <PreviewContent
          category={item.category}
          contestantName={item.name}
          categoryNumber={categoryNumber}
          totalCategories={categories.length}
          isSample={true}
          fileName={item.category.name}
          isLastCategory={isLastCategory}
          totalPopsToList={totalPopsToList}
          {...(createNextView ? { createNextView } : {})}
          updateCommand={(contestantName, categoryName) => {
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
    console.log('[ImportContent] pushFirstPreview', {
      categoryCount: categories.length,
      popsBeforeResult,
      categories: categories.map(c => c.category.name),
    });
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
