import { memo } from 'react';
import { Card } from '@components/common';
import workflowStyles from '@pages/ComponentsDemo.workflow.module.css';

interface WorkflowView {
  label: React.ReactNode;
  content: React.ReactNode;
}

interface WorkflowCarouselProps {
  views: WorkflowView[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  cardWrapperClassName?: string | undefined;
  viewContainerClassName?: string | undefined;
}

export const WorkflowCarousel = memo(function WorkflowCarousel({
  views,
  currentIndex,
  cardWrapperClassName,
  viewContainerClassName,
}: WorkflowCarouselProps) {
  const wrapperClass = cardWrapperClassName ?? workflowStyles['workflow-card-wrapper'];
  const containerClass = viewContainerClassName ?? workflowStyles['workflow-view-container'];

  return (
    <div className={wrapperClass}>
      <Card>
        <div className={containerClass}>{views[currentIndex]?.content}</div>
      </Card>
    </div>
  );
});
