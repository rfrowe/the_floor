import { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkflowCarousel } from './WorkflowCarousel';
import { MockViewStackProvider } from '@components/common/MockViewStackProvider';
import { ImportContent } from '@components/category/manager/ImportContent';
import { SampleCategoryBrowser } from '@components/category/SampleCategoryBrowser';
import { IndividualPreview } from '@components/category/manager/IndividualPreview';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import { useSharedBaseballData } from './useSharedBaseballData';
import styles from '@pages/ComponentsDemo.module.css';
import workflowStyles from '@pages/ComponentsDemo.workflow.module.css';

interface ImportContentDemoProps {
  onViewChange?: (viewIndex: number) => void;
  initialView?: number;
}

export default function ImportContentDemo({
  initialView = 0,
  onViewChange,
}: ImportContentDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(initialView);
  const { slides: baseballSlides } = useSharedBaseballData();

  useEffect(() => {
    setCurrentIndex(initialView);
  }, [initialView]);

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      onViewChange?.(newIndex);
    },
    [onViewChange]
  );

  const previewFile = useMemo(() => {
    if (!baseballSlides) return null;
    return {
      filename: 'Baseball',
      category: {
        name: 'Baseball',
        slides: baseballSlides,
      },
    };
  }, [baseballSlides]);

  const viewLabels = [
    'ImportContent',
    'SampleBrowser',
    'Preview 1/N',
    'Preview JSON',
    'Preview N/N',
  ];

  return (
    <section className={styles['section']} id="import-content">
      <h2>&lt;ImportContent /&gt;</h2>
      <p>The ImportContent workflow is used by both CategoryManager and ContestantCreator.</p>

      <ComponentController
        controls={[
          {
            type: 'group',
            label: 'Navigate Views',
            controls: viewLabels.map((label, idx) => ({
              type: 'button',
              label:
                currentIndex === idx ? (
                  <>
                    ✓ <code>&lt;{label} /&gt;</code>
                  </>
                ) : (
                  <code>&lt;{label} /&gt;</code>
                ),
              onClick: () => {
                handleIndexChange(idx);
              },
              variant: currentIndex === idx ? 'primary' : 'secondary',
            })),
          },
        ]}
        description={
          <DemoDescription>
            <p>Navigate through the five workflow views using the buttons above.</p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Reusable Workflow:">
            This ImportContent workflow is shared by both CategoryManager and ContestantCreator.
            Demonstrates drag/drop, sample browsing, and one-by-one preview. Shows both sample
            category imports and JSON file uploads.
          </DemoHighlights>
        }
      />

      <WorkflowCarousel
        views={useMemo(
          () => [
            {
              label: <code>&lt;ImportContent /&gt;</code>,
              content: (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <ImportContent />
                  </MockViewStackProvider>
                </div>
              ),
            },
            {
              label: <code>&lt;SampleCategoryBrowser /&gt;</code>,
              content: (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <SampleCategoryBrowser
                      initialSelections={new Set(['Dogs.json', 'Bears.json', 'Clouds.json'])}
                    />
                  </MockViewStackProvider>
                </div>
              ),
            },
            {
              label: <code>&lt;IndividualPreview 1 of N/&gt;</code>,
              content: previewFile ? (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <IndividualPreview
                      currentFile={previewFile}
                      remainingFiles={[
                        { filename: 'Dogs.json', category: { name: 'Dogs', slides: [] } },
                        { filename: 'Bears.json', category: { name: 'Bears', slides: [] } },
                      ]}
                      source="samples"
                      initialContestantName=""
                      categoryNumber={1}
                      totalCategories={3}
                    />
                  </MockViewStackProvider>
                </div>
              ) : (
                <p className={workflowStyles['workflow-loading']}>Loading...</p>
              ),
            },
            {
              label: <code>&lt;IndividualPreview JSON/&gt;</code>,
              content: previewFile ? (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <IndividualPreview
                      currentFile={previewFile}
                      remainingFiles={[]}
                      source="upload"
                      initialContestantName=""
                      categoryNumber={1}
                      totalCategories={1}
                    />
                  </MockViewStackProvider>
                </div>
              ) : (
                <p className={workflowStyles['workflow-loading']}>Loading...</p>
              ),
            },
            {
              label: <code>&lt;IndividualPreview N of N/&gt;</code>,
              content: previewFile ? (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <IndividualPreview
                      currentFile={previewFile}
                      remainingFiles={[]}
                      source="samples"
                      initialContestantName=""
                      categoryNumber={3}
                      totalCategories={3}
                    />
                  </MockViewStackProvider>
                </div>
              ) : (
                <p className={workflowStyles['workflow-loading']}>Loading...</p>
              ),
            },
          ],
          [previewFile]
        )}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
      />
    </section>
  );
}
