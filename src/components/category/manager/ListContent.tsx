/**
 * ListContent Component
 *
 * List view content for CategoryManager.
 * Uses useViewStack to push detail/import views.
 */

import { useState, useMemo } from 'react';
import type { Contestant } from '@types';
import { useViewStack } from '@components/common/ViewStack';
import { CategoryStorage } from '../CategoryStorage';
import { DetailContentContainer } from './DetailContentContainer';
import { ImportContent } from './ImportContent';
import { DeleteConfirmationContent } from './DeleteConfirmationContent';
import styles from '../CategoryManager.module.css';

interface CategoryMetadata {
  id: string;
  name: string;
  slideCount: number;
}

interface ListContentProps {
  categoryMetadata: CategoryMetadata[];
  contestants: Contestant[];
  onDeleteAllCategories: () => void;
}

export function ListContent({
  categoryMetadata,
  contestants,
  onDeleteAllCategories,
}: ListContentProps) {
  const { pushView } = useViewStack();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDeleteButton, setHoveredDeleteButton] = useState<string | null>(null);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categoryMetadata;
    }
    const query = searchQuery.toLowerCase();
    return categoryMetadata.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categoryMetadata, searchQuery]);

  // Memoize contestants usage map
  const categoryUsageMap = useMemo(() => {
    const map = new Map<string, Contestant[]>();
    for (const contestant of contestants) {
      if (contestant.categoryId) {
        const existing = map.get(contestant.categoryId);
        if (existing) {
          existing.push(contestant);
        } else {
          map.set(contestant.categoryId, [contestant]);
        }
      }
    }
    return map;
  }, [contestants]);

  const getContestantsUsingCategory = (categoryId: string): Contestant[] => {
    return categoryUsageMap.get(categoryId) ?? [];
  };

  const handleViewClick = (category: CategoryMetadata) => {
    pushView({
      id: `detail-${category.id}`,
      title: `${category.name} - ${String(category.slideCount)} slides`,
      content: <DetailContentContainer categoryId={category.id} />,
    });
  };

  const handleGoToImport = () => {
    pushView({
      id: 'import',
      title: 'Import Category',
      content: <ImportContent />,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, category: CategoryMetadata) => {
    e.stopPropagation();
    const usedBy = getContestantsUsingCategory(category.id);
    if (usedBy.length > 0) {
      return;
    }

    // Push delete confirmation view (fully self-contained, no callbacks)
    pushView({
      id: `delete-confirm-${category.id}`,
      title: 'Confirm Delete',
      content: <DeleteConfirmationContent categoryId={category.id} categoryName={category.name} />,
    });
  };

  return (
    <>
      {/* Search box - only show if there are categories */}
      {categoryMetadata.length > 0 && (
        <div className={styles['search-section']}>
          <input
            type="text"
            placeholder={`Search ${String(categoryMetadata.length)} ${categoryMetadata.length === 1 ? 'category' : 'categories'}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className={styles['search-input']}
          />
        </div>
      )}

      {/* Categories list */}
      {filteredCategories.length === 0 ? (
        <div className={styles['empty-state']}>
          {searchQuery ? (
            'No categories match your search.'
          ) : (
            <>
              <p>No categories yet. Import some contestants to get started!</p>
              <button className={styles['import-button']} onClick={handleGoToImport} type="button">
                Import Category
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Import/Storage section */}
          <div className={styles['import-storage-section']}>
            <div
              className={styles['import-category-card-inline']}
              onClick={handleGoToImport}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleGoToImport();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Import category"
            >
              <div className={styles['import-icon']}>+</div>
              <div className={styles['import-label']}>Import Category</div>
            </div>

            <div className={styles['storage-container-wrapper']}>
              <CategoryStorage categories={categoryMetadata} onDeleteAll={onDeleteAllCategories} />
            </div>
          </div>

          <div className={styles['categories-list']}>
            {filteredCategories.map((category) => {
              const usedBy = getContestantsUsingCategory(category.id);
              const isInUse = usedBy.length > 0;
              const isHovered = hoveredCategory === category.id;
              const isDeleteHovered = hoveredDeleteButton === category.id;

              return (
                <div
                  key={category.id}
                  className={styles['category-item']}
                  onClick={() => {
                    handleViewClick(category);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewClick(category);
                    }
                  }}
                  onMouseEnter={() => {
                    setHoveredCategory(category.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredCategory(null);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles['category-item-left']}>
                    <h3 className={styles['category-item-title']}>{category.name}</h3>
                    <p className={styles['category-item-slides']}>
                      {category.slideCount} {category.slideCount === 1 ? 'slide' : 'slides'}
                    </p>
                    <p
                      className={`${styles['category-item-usage'] ?? ''} ${
                        isInUse && isDeleteHovered ? (styles['pulse'] ?? '') : ''
                      }`.trim()}
                    >
                      {isInUse ? (
                        <span className={styles['in-use']}>
                          Used by {usedBy.length} contestant{usedBy.length === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className={styles['not-in-use']}>Not in use</span>
                      )}
                    </p>
                  </div>

                  <div className={styles['category-item-right']}>
                    <button
                      onClick={(e) => {
                        handleDeleteClick(e, category);
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredDeleteButton(category.id);
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        setHoveredDeleteButton(null);
                      }}
                      className={`${styles['delete-button'] ?? ''} ${
                        isInUse ? (styles['disabled'] ?? '') : ''
                      }`.trim()}
                      title={isInUse ? 'Cannot delete - category is in use' : 'Delete category'}
                      aria-label="Delete category"
                    >
                      🗑️
                    </button>

                    <div
                      className={`${styles['chevron'] ?? ''} ${isHovered ? (styles['nudge'] ?? '') : ''}`.trim()}
                    >
                      ›
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
