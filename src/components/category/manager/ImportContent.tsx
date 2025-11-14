/**
 * ImportContent Component
 *
 * Simple import view content that shows upload and sample options.
 * Delegates to IndividualPreview for one-by-one category preview workflow.
 */

import { useViewStack, type View } from '@components/common/ViewStack';
import { CategoryImporter } from '@components/CategoryImporter';
import { SampleCategoryBrowser } from '../SampleCategoryBrowser';
import { IndividualPreview, type PreviewState } from './IndividualPreview';
import type { Category } from '@types';
import { createLogger } from '@/utils/logger';

const log = createLogger('ImportContent');

interface ImportContentProps {
  // Optional: Pre-fill contestant name in previews
  initialContestantName?: string;
}

interface SampleBrowserState {
  selectedSamples: Set<string>;
}

export function ImportContent({ initialContestantName = '' }: ImportContentProps) {
  const { commitAndPushView, popView } = useViewStack();

  const handleBrowseSamples = () => {
    const samplesView: View<SampleBrowserState> = {
      id: 'samples',
      title: 'Sample Categories',
      content: <SampleCategoryBrowser initialContestantName={initialContestantName} />,
      // SampleCategoryBrowser manages its own state via useViewStateSet
    };
    void commitAndPushView(samplesView);
  };

  const handleFilesLoaded = (categories: { name: string; category: Category }[]) => {
    if (categories.length === 0) return;

    const [firstCategory, ...remainingCategories] = categories;

    if (!firstCategory) return;

    // Create first individual preview for uploaded files
    const firstPreviewView: View<PreviewState, { imported?: number; message?: string }> = {
      id: `preview-upload-${firstCategory.name}-1`,
      title:
        categories.length === 1 ? 'Preview Category' : `Preview 1 of ${String(categories.length)}`,
      content: (
        <IndividualPreview
          key={`upload-${firstCategory.name}-1`}
          currentFile={{
            filename: firstCategory.name,
            category: firstCategory.category,
          }}
          remainingFiles={remainingCategories.map((c) => ({
            filename: c.name,
            category: c.category,
          }))}
          source="upload"
          initialContestantName={initialContestantName}
          categoryNumber={1}
          totalCategories={categories.length}
        />
      ),
      onResult: (result) => {
        if (result.imported) {
          log.success(
            result.message ?? `Imported ${String(result.imported)} categories from upload`
          );
        }
      },
    };

    void commitAndPushView(firstPreviewView);
  };

  return (
    <CategoryImporter
      onImport={(data) => {
        // This callback is for the legacy single-file flow
        // We now handle everything through IndividualPreview
        popView({ imported: data.length });
      }}
      onCancel={() => {
        popView();
      }}
      onBrowseSamples={handleBrowseSamples}
      onFilesLoaded={handleFilesLoaded}
    />
  );
}
