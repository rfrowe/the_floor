import type { ViewStackViewProps } from '@components/common/ViewStackView';
import { ListContent } from './ListContent';
import type { Contestant } from '@types';

interface ListContentViewProps extends ViewStackViewProps {
  categoryMetadata: {
    id: string;
    name: string;
    slideCount: number;
  }[];
  contestants: Contestant[];
  onDeleteAllCategories: () => void;
}

export function ListContentView({
  categoryMetadata,
  contestants,
  onDeleteAllCategories,
}: ListContentViewProps) {
  return (
    <ListContent
      categoryMetadata={categoryMetadata}
      contestants={contestants}
      onDeleteAllCategories={onDeleteAllCategories}
    />
  );
}
