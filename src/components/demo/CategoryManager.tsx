import { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkflowCarousel } from './WorkflowCarousel';
import { MockViewStackProvider } from '@components/common/MockViewStackProvider';
import { ListContent } from '@components/category/manager/ListContent';
import { ImportContent } from '@components/category/manager/ImportContent';
import { DeleteConfirmationContent } from '@components/category/manager/DeleteConfirmationContent';
import { ComponentController } from '@pages/ComponentController';
import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import { getSampleCategories } from '@utils/sampleCategories';
import { useSharedBaseballData } from './useSharedBaseballData';
import type { Contestant, StoredCategory } from '@types';
import styles from '@pages/ComponentsDemo.module.css';
import workflowStyles from '@pages/ComponentsDemo.workflow.module.css';

interface CategoryManagerDemoProps {
  initialView?: number;
  onViewChange?: (viewIndex: number) => void;
}

const mockContestants: Contestant[] = [
  {
    id: 'demo-contestant-1',
    name: 'Alice Johnson',
    category: { name: '80s Movies', slides: [] },
    wins: 8,
    eliminated: false,
  },
];

export default function CategoryManagerDemo({
  initialView = 0,
  onViewChange,
}: CategoryManagerDemoProps) {
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

  const baseballCategory: StoredCategory | null = useMemo(() => {
    if (!baseballSlides) return null;
    return {
      id: 'sample-baseball',
      name: 'Baseball',
      slides: baseballSlides,
      createdAt: new Date().toISOString(),
      thumbnailUrl: baseballSlides[0]?.imageUrl ?? '',
      sizeInBytes: 5 * 1024 * 1024,
    };
  }, [baseballSlides]);

  const mockCategoryMetadata = useMemo(() => {
    const sampleList = getSampleCategories();
    return sampleList.slice(0, 10).map((sample, idx) => ({
      id: `sample-${String(idx)}`,
      name: sample.name,
      slideCount: Math.floor(Math.random() * 30) + 10,
      sizeInBytes: (Math.floor(Math.random() * 15) + 5) * 1024 * 1024,
    }));
  }, []);

  const viewLabels = ['ListContent', 'ImportContent', 'DeleteConfirmation'];

  return (
    <section className={styles['section']} id="category-manager">
      <h2>
        <code>&lt;CategoryManager /&gt;</code> Workflow
      </h2>
      <p>
        A ViewStack-based modal for managing categories. Uses the shared ImportContent workflow.
      </p>

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
            <p>
              Manages category library with list, import, and delete workflows. Uses the shared{' '}
              <strong>ImportContent workflow</strong> (also used by ContestantCreator) for importing
              categories. Displays categories with thumbnails and storage info.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Try These Workflows:">
            - <strong>Navigate buttons:</strong> Switch between List, Import, and Delete views
            <br />- <strong>List view:</strong> Browse all categories
            <br />- <strong>Import view:</strong> Multi-step workflow for adding categories
            <br />- <strong>Delete view:</strong> Confirmation flow for removing categories
          </DemoHighlights>
        }
      />

      <WorkflowCarousel
        views={useMemo(
          () => [
            {
              label: <code>&lt;ListContent /&gt;</code>,
              content: (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <ListContent
                      categoryMetadata={mockCategoryMetadata}
                      contestants={mockContestants}
                      onDeleteAllCategories={() => {
                        console.log('Delete all');
                      }}
                    />
                  </MockViewStackProvider>
                </div>
              ),
            },
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
              label: <code>&lt;DeleteConfirmation /&gt;</code>,
              content: baseballCategory ? (
                <div className={workflowStyles['workflow-demo-view-interactive']}>
                  <MockViewStackProvider>
                    <DeleteConfirmationContent
                      categoryId={baseballCategory.id}
                      categoryName={baseballCategory.name}
                    />
                  </MockViewStackProvider>
                </div>
              ) : (
                <p className={workflowStyles['workflow-loading']}>Loading...</p>
              ),
            },
          ],
          [mockCategoryMetadata, baseballCategory]
        )}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
      />
    </section>
  );
}
