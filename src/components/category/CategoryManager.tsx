/**
 * CategoryManager Component
 *
 * Displays all available categories in a list view with management capabilities:
 * - View all categories with slide counts and usage info
 * - Search/filter categories by name
 * - Delete categories (with warning if in use)
 * - View category slides with slide animations
 */

import { useState, useMemo, useCallback } from 'react';
import type { StoredCategory, Contestant, Category } from '@types';
import { Modal } from '@components/common/Modal';
import { CategoryImporter } from '@components/CategoryImporter';
import { CategoryStorage } from './CategoryStorage';
import { SlidePreview } from '@components/slide/SlidePreview';
import { useCategories } from '@hooks/useCategories';
import styles from './CategoryManager.module.css';

type ViewMode = 'list' | 'detail' | 'import';

interface CategoryManagerProps {
  onClose: () => void;
  contestants: Contestant[];
  onImport: (contestants: { name: string; category: Category }[]) => void | Promise<void>;
}

export function CategoryManager({ onClose, contestants, onImport }: CategoryManagerProps) {
  const [categories, { remove: removeCategory }] = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingCategory, setViewingCategory] = useState<StoredCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<StoredCategory | null>(null);
  const [deletingAllCategories, setDeletingAllCategories] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDeleteButton, setHoveredDeleteButton] = useState<string | null>(null);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);

  // Filter categories by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase();
    return categories.filter((cat) => cat.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  // Memoize contestants usage map to avoid recomputing on every render
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

  // Get contestants using a specific category (now O(1) lookup)
  const getContestantsUsingCategory = useCallback(
    (categoryId: string): Contestant[] => {
      return categoryUsageMap.get(categoryId) ?? [];
    },
    [categoryUsageMap]
  );

  const handleDeleteClick = (e: React.MouseEvent, category: StoredCategory) => {
    e.stopPropagation();
    const usedBy = getContestantsUsingCategory(category.id);
    if (usedBy.length > 0) {
      // Show warning, don't delete
      return;
    }
    setDeletingCategory(category);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) {
      return;
    }

    try {
      await removeCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(
        `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDeleteAllCategories = () => {
    setDeletingAllCategories(true);
  };

  const handleConfirmDeleteAll = async () => {
    try {
      // Delete all categories one by one
      for (const category of categories) {
        await removeCategory(category.id);
      }
      setDeletingAllCategories(false);
    } catch (error) {
      console.error('Failed to delete all categories:', error);
      alert(
        `Failed to delete all categories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleViewClick = (category: StoredCategory) => {
    setViewingCategory(category);
    setViewMode('detail');
    setExpandedSlideIndex(null);
  };

  const handleSlideAnswerChange = (slideIndex: number, newAnswer: string) => {
    if (!viewingCategory) {
      return;
    }

    const updatedSlides = viewingCategory.slides.map((slide, index) =>
      index === slideIndex ? { ...slide, answer: newAnswer } : slide
    );

    const updatedCategory = {
      ...viewingCategory,
      slides: updatedSlides,
    };

    setViewingCategory(updatedCategory);
    // TODO: Persist changes to storage if needed
  };

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  const handleBackToList = () => {
    setViewMode('list');
    setViewingCategory(null);
    setExpandedSlideIndex(null);
  };

  const handleGoToImport = () => {
    setViewMode('import');
  };

  // Get current title based on view mode
  const currentTitle =
    viewMode === 'list'
      ? 'Manage Categories'
      : viewMode === 'detail' && viewingCategory
        ? `${viewingCategory.name} - ${String(viewingCategory.slides.length)} slides`
        : 'Import Category';

  // Render current view content
  const currentContent =
    viewMode === 'list' ? (
      <>
        {/* Search box - only show if there are categories */}
        {categories.length > 0 && (
          <div className={styles['search-section']}>
            <input
              type="text"
              placeholder={`Search ${String(categories.length)} ${categories.length === 1 ? 'category' : 'categories'}...`}
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
                <button
                  className={styles['import-button']}
                  onClick={handleGoToImport}
                  type="button"
                >
                  Import Category
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Import/Storage section - shown when categories exist */}
            <div className={styles['import-storage-section']}>
              {/* Import Category card */}
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

              {/* Storage component */}
              <div className={styles['storage-container-wrapper']}>
                <CategoryStorage categories={categories} onDeleteAll={handleDeleteAllCategories} />
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
                    {/* Left side - category info */}
                    <div className={styles['category-item-left']}>
                      <h3 className={styles['category-item-title']}>{category.name}</h3>
                      <p className={styles['category-item-slides']}>
                        {category.slides.length} {category.slides.length === 1 ? 'slide' : 'slides'}
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

                    {/* Right side - actions */}
                    <div className={styles['category-item-right']}>
                      {/* Trash icon */}
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

                      {/* Chevron */}
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
    ) : viewMode === 'detail' && viewingCategory ? (
      <div className={styles['slides-viewer']}>
        {viewingCategory.slides.map((slide, index) => (
          <SlidePreview
            key={index}
            slide={slide}
            slideNumber={index + 1}
            mode="edit"
            isExpanded={expandedSlideIndex === index}
            onToggleExpand={() => {
              toggleSlideExpanded(index);
            }}
            onAnswerChange={(newAnswer) => {
              handleSlideAnswerChange(index, newAnswer);
            }}
          />
        ))}
      </div>
    ) : (
      <CategoryImporter
        onImport={(data) => {
          void onImport(data);
          setViewMode('list');
        }}
        onCancel={() => {
          setViewMode('list');
        }}
      />
    );

  const categoryModalClass = styles['category-modal'];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={currentTitle}
      {...(viewMode !== 'list' ? { onBack: handleBackToList } : {})}
      {...(categoryModalClass ? { className: categoryModalClass } : {})}
    >
      {currentContent}

      {/* Delete confirmation modal */}
      {deletingCategory && (
        <Modal
          isOpen={true}
          onClose={() => {
            setDeletingCategory(null);
          }}
          title="Confirm Delete"
        >
          <div className={styles['delete-confirmation']}>
            <p>Are you sure you want to delete the category &quot;{deletingCategory.name}&quot;?</p>
            <div className={styles['modal-footer']}>
              <button
                onClick={() => {
                  setDeletingCategory(null);
                }}
                className={styles['modal-button-secondary']}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleConfirmDelete();
                }}
                className={styles['modal-button-danger']}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete all confirmation modal */}
      {deletingAllCategories && (
        <Modal
          isOpen={true}
          onClose={() => {
            setDeletingAllCategories(false);
          }}
          title="Confirm Delete All"
        >
          <div className={styles['delete-confirmation']}>
            <p>
              Are you sure you want to delete all {categories.length} categories? This action cannot
              be undone.
            </p>
            <div className={styles['modal-footer']}>
              <button
                onClick={() => {
                  setDeletingAllCategories(false);
                }}
                className={styles['modal-button-secondary']}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleConfirmDeleteAll();
                }}
                className={styles['modal-button-danger']}
              >
                Delete All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
