import type { ViewStackViewProps } from '@components/common/ViewStackView';
import type { StoredCategory } from '@types';
import { CreateContent } from './CreateContent';

interface CreateContentViewProps extends ViewStackViewProps {
  categories: StoredCategory[];
  contestantName: string;
  selectedCategoryId: string;
  onStateChange: (state: { contestantName: string; selectedCategoryId: string }) => void;
}

export function CreateContentView({
  categories,
  contestantName,
  selectedCategoryId,
  onStateChange,
}: CreateContentViewProps) {
  return (
    <CreateContent
      categories={categories}
      contestantName={contestantName}
      selectedCategoryId={selectedCategoryId}
      onStateChange={onStateChange}
    />
  );
}
