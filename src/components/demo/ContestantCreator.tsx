import { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkflowCarousel } from './WorkflowCarousel';
import { MockViewStackProvider } from '@components/common/MockViewStackProvider';
import { CreateContent } from '@components/contestant/creator/CreateContent';
import { ImportContent } from '@components/category/manager/ImportContent';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import { useSharedBaseballData } from './useSharedBaseballData';
import type { StoredCategory } from '@types';
import styles from '@pages/ComponentsDemo.module.css';
import workflowStyles from '@pages/ComponentsDemo.workflow.module.css';

interface ContestantCreatorDemoProps {
  onViewChange?: (viewIndex: number) => void;
  initialView?: number;
}

export default function ContestantCreatorDemo({
  initialView = 0,
  onViewChange,
}: ContestantCreatorDemoProps) {
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

  const mockStoredCategories: StoredCategory[] = useMemo(() => {
    if (!baseballSlides) return [];
    return [
      {
        id: 'sample-baseball',
        name: 'Baseball',
        slides: baseballSlides,
        createdAt: new Date().toISOString(),
        thumbnailUrl: baseballSlides[0]?.imageUrl ?? '',
        sizeInBytes: 5 * 1024 * 1024,
      },
    ];
  }, [baseballSlides]);

  const viewLabels = ['CreateContent', 'ImportContent'];

  return (
    <section className={styles['section']} id="contestant-creator">
      <h2>
        <code>&lt;ContestantCreator /&gt;</code> Workflow
      </h2>
      <p>A simpler ViewStack workflow for creating contestants.</p>

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
            <p>Navigate through the two workflow views using the buttons above.</p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Integration:">
            ContestantCreator reuses ImportContent workflow (ImportContent, IndividualPreview,
            SampleCategoryBrowser). The contestant name is pre-filled throughout the import process
            for streamlined creation.
          </DemoHighlights>
        }
      />

      <WorkflowCarousel
        views={useMemo(
          () => [
            {
              label: <code>&lt;CreateContent /&gt;</code>,
              content:
                mockStoredCategories.length > 0 ? (
                  <div className={workflowStyles['workflow-demo-view-interactive']}>
                    <MockViewStackProvider>
                      <CreateContent
                        categories={mockStoredCategories}
                        contestantName=""
                        selectedCategoryId=""
                        onStateChange={() => {
                          /* No-op in demo */
                        }}
                      />
                    </MockViewStackProvider>
                  </div>
                ) : (
                  <p className={workflowStyles['workflow-loading']}>Loading sample categories...</p>
                ),
            },
            {
              label: <code>&lt;ImportContent /&gt;</code>,
              content: (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <ImportContent initialContestantName="John Doe" />
                  </MockViewStackProvider>
                </div>
              ),
            },
          ],
          [mockStoredCategories]
        )}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
        cardWrapperClassName={workflowStyles['workflow-card-wrapper-small']}
        viewContainerClassName={workflowStyles['workflow-view-container-small']}
      />
    </section>
  );
}
