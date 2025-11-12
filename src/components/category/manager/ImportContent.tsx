/**
 * ImportContent Component
 *
 * Import view content with sample browser navigation.
 * Manages nested navigation to sample browser view.
 */

import { useState } from 'react';
import type { Category } from '@types';
import { useViewStack, type View } from '@components/common/ViewStack';
import { CategoryImporter } from '@components/CategoryImporter';
import { SampleCategoryBrowser } from '../SampleCategoryBrowser';
import { PreviewContent } from './PreviewContent';
import { ImportCategoryCommand } from './ImportCategoryCommand';

interface ImportResult {
  imported: { name: string; category: Category }[];
}

interface ImportContentProps {
  onImportCategory?: (data: { name: string; category: Category }) => Promise<{ categoryId: string; contestantId?: string }>;
  onUndoImport?: (categoryId: string, contestantId?: string) => Promise<void>;
}

export function ImportContent({ onImportCategory, onUndoImport }: ImportContentProps) {
  const { pushView, popView, replaceView, updateCurrentView } = useViewStack();
  // Preserve sample selections across navigation
  const [selectedSampleFilenames, setSelectedSampleFilenames] = useState<Set<string>>(new Set());

  // Push preview views progressively using Command pattern
  const pushFirstPreview = (
    categories: { name: string; category: Category; sizeBytes: number | undefined }[],
    popsBeforeResult: number,
    onImportCategory: (data: { name: string; category: Category }) => Promise<{ categoryId: string; contestantId?: string }>,
    onUndoImport: (categoryId: string, contestantId?: string) => Promise<void>,
    updateCurrentView: (updater: (view: any) => any) => void
  ) => {
    const pushPreview = (index: number) => {
      const item = categories[index];
      if (!item) return;

      const isLastCategory = index === categories.length - 1;
      const categoryNumber = index + 1;

      // Create command for this preview
      const command = new ImportCategoryCommand(
        { name: item.name, category: item.category },
        onImportCategory,
        onUndoImport
      );

      const previewView: View = {
        id: `import-preview-${index}`,
        title: `${item.category.name} - Preview`,
        content: (
          <PreviewContent
            category={item.category}
            contestantName={item.name}
            sizeBytes={item.sizeBytes}
            categoryNumber={categoryNumber}
            totalCategories={categories.length}
            isSample={true}
            fileName={item.category.name}
            onImport={async (editedContestantName, editedCategoryName) => {
              // Update command with edited values before execution
              command.updateData(editedContestantName, editedCategoryName);

              // Update current view with edited values so they're preserved on undo
              updateCurrentView((view) => ({
                ...view,
                content: (
                  <PreviewContent
                    category={{ ...item.category, name: editedCategoryName }}
                    contestantName={editedContestantName}
                    sizeBytes={item.sizeBytes}
                    categoryNumber={categoryNumber}
                    totalCategories={categories.length}
                    isSample={true}
                    fileName={item.category.name}
                    onImport={view.content.props.onImport}
                  />
                ),
              }));

              if (isLastCategory) {
                // Last one - execute command, then pop all
                await command.execute();
                for (let i = 0; i <= index; i++) {
                  popView();
                }
                for (let i = 0; i < popsBeforeResult; i++) {
                  popView();
                }
                popView();
              } else {
                // Not last - just push next (ViewStack will execute command)
                pushPreview(index + 1);
              }
            }}
          />
        ),
        command, // ViewStack handles execute/undo automatically
      };

      pushView(previewView);
    };

    pushPreview(0);
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

          if (onImportCategory && onUndoImport) {
            pushFirstPreview(categories, 1, onImportCategory, onUndoImport, updateCurrentView);
          }
        }}
      />
    ),
  });

  const handleBrowseSamples = () => {
    const samplesView = createSamplesView(selectedSampleFilenames);
    pushView(samplesView);
  };

  const handleFilesLoaded = (categories: { name: string; category: Category; sizeBytes: number | undefined }[]) => {
    if (onImportCategory && onUndoImport) {
      pushFirstPreview(categories, 0, onImportCategory, onUndoImport, updateCurrentView);
    }
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
