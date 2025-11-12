# ViewStack Migration Implementation Guide

## Overview

This document provides complete implementation details for migrating CategoryManager and ContestantCreator from manual view mode management to a stack-based ViewStack architecture with undo/redo support.

**Estimated Total Time:** 10-13 hours
**Risk Level:** Medium (mitigated by incremental approach)
**Breaking Changes:** None (external APIs remain unchanged)

---

## Phase 1: Enhance ViewStack Component (2-3 hours)

### Objective
Enhance the existing ViewStack component to support:
1. Generic type parameters for type-safe state passing
2. Result passing from child views to parent views via `onResult` callback
3. Passing results through `popView(result)`
4. Current view access and updates
5. Root view completion callback

### Files to Modify
- `src/components/common/ViewStack.tsx` (primary)
- `src/components/common/ViewStack.test.tsx` (create new)

### Detailed Implementation

#### Step 1.1: Update View Interface

**File:** `src/components/common/ViewStack.tsx`
**Lines:** 25-31 (current View interface)

**Current Code:**
```typescript
export interface View {
  id: string;
  title: string;
  content: ReactNode;
  onEnter?: () => void; // Called when view is pushed (redo)
  onExit?: () => void; // Called when view is popped (undo)
}
```

**Replace With:**
```typescript
export interface View<TState = void, TResult = void> {
  id: string;
  title: string;
  content: ReactNode;
  state?: TState; // View-specific state passed from parent
  onEnter?: (state?: TState) => void; // Called when view is pushed (redo)
  onExit?: (result?: TResult) => void; // Called when view is popped (undo)
  onResult?: (result: TResult) => void; // Called when child view returns data
}
```

**Rationale:**
- Generic types enable type-safe state passing
- `state` allows parent to pass data to child view
- `onResult` allows parent to receive data from child view when it pops
- `TResult` allows child to return data via `popView(result)`

#### Step 1.2: Update ViewStackContextValue Interface

**Lines:** 33-39 (current context interface)

**Current Code:**
```typescript
interface ViewStackContextValue {
  pushView: (view: View) => void;
  popView: () => void;
  replaceView: (view: View) => void;
  currentViewId: string;
  stackDepth: number;
}
```

**Replace With:**
```typescript
interface ViewStackContextValue {
  pushView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  popView: <TResult = void>(result?: TResult) => void;
  replaceView: <TState = void, TResult = void>(view: View<TState, TResult>) => void;
  currentViewId: string;
  stackDepth: number;
  getCurrentView: () => View | undefined;
  updateCurrentView: (updater: (view: View) => View) => void;
}
```

**Rationale:**
- Generic methods preserve type information
- `popView` can accept result to pass to parent
- `getCurrentView` allows components to inspect current view
- `updateCurrentView` enables in-place view updates (e.g., changing title)

#### Step 1.3: Add ViewStackProps.onComplete

**Lines:** 48-53 (current ViewStackProps)

**Add this prop:**
```typescript
interface ViewStackProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: View;
  className?: string;
  onComplete?: (result?: unknown) => void; // NEW: Called when root view completes
}
```

**Update function signature:**
```typescript
export function ViewStack({
  isOpen,
  onClose,
  initialView,
  className,
  onComplete // NEW
}: ViewStackProps) {
```

#### Step 1.4: Enhance pushView Implementation

**Lines:** 71-75 (current pushView)

**Current Code:**
```typescript
const pushView = useCallback((view: View) => {
  // Call onEnter lifecycle hook (redo action)
  view.onEnter?.();
  setViewStack((prev) => [...prev, view]);
}, []);
```

**Replace With:**
```typescript
const pushView = useCallback(<TState = void, TResult = void>(view: View<TState, TResult>) => {
  // Call onEnter with state (redo action)
  view.onEnter?.(view.state);
  setViewStack((prev) => [...prev, view as View]);
}, []);
```

**Changes:**
- Pass `view.state` to `onEnter`
- Cast to `View` to store in untyped stack (runtime type erasure)

#### Step 1.5: Enhance popView Implementation

**Lines:** 77-89 (current popView)

**Current Code:**
```typescript
const popView = useCallback(() => {
  setViewStack((prev) => {
    if (prev.length <= 1) {
      return prev;
    }

    // Call onExit lifecycle hook on the view being popped (undo action)
    const poppingView = prev[prev.length - 1];
    poppingView?.onExit?.();

    return prev.slice(0, -1);
  });
}, []);
```

**Replace With:**
```typescript
const popView = useCallback(<TResult = void>(result?: TResult) => {
  setViewStack((prev) => {
    if (prev.length <= 1) {
      // Popping root view - call onComplete and don't pop
      if (result !== undefined) {
        onComplete?.(result);
      }
      return prev;
    }

    // Call onExit on the view being popped (undo action)
    const poppingView = prev[prev.length - 1];
    poppingView?.onExit?.(result);

    // Call onResult on the parent view (pass data up)
    const parentView = prev[prev.length - 2];
    if (result !== undefined && parentView?.onResult) {
      parentView.onResult(result);
    }

    return prev.slice(0, -1);
  });
}, [onComplete]);
```

**Changes:**
- Accept `result` parameter
- If popping root view, call `onComplete` instead of popping
- Pass result to both `onExit` and parent's `onResult`
- Add `onComplete` to dependency array

#### Step 1.6: Add getCurrentView and updateCurrentView

**Insert after popView (around line 90):**

```typescript
const getCurrentView = useCallback(() => {
  return viewStack[viewStack.length - 1];
}, [viewStack]);

const updateCurrentView = useCallback((updater: (view: View) => View) => {
  setViewStack((prev) => {
    if (prev.length === 0) return prev;
    const currentView = prev[prev.length - 1];
    if (!currentView) return prev;
    const updated = updater(currentView);
    return [...prev.slice(0, -1), updated];
  });
}, []);
```

#### Step 1.7: Update Context Value

**Lines:** 95-104 (current contextValue)

**Update to include new methods:**
```typescript
const contextValue: ViewStackContextValue = useMemo(
  () => ({
    pushView,
    popView,
    replaceView,
    currentViewId: currentView?.id ?? '',
    stackDepth: viewStack.length,
    getCurrentView, // NEW
    updateCurrentView, // NEW
  }),
  [pushView, popView, replaceView, currentView?.id, viewStack.length, getCurrentView, updateCurrentView]
);
```

#### Step 1.8: Update useEffect for initialView

**Lines:** 60-66 (current useEffect)

**Current Code:**
```typescript
useEffect(() => {
  if (isOpen) {
    setViewStack([initialView]);
  }
}, [isOpen, initialView]);
```

**Replace With:**
```typescript
useEffect(() => {
  if (isOpen) {
    setViewStack([initialView]);
    initialView.onEnter?.(initialView.state); // Call onEnter for initial view
  } else {
    // When closing, call onExit for all views in stack (cleanup)
    viewStack.forEach(view => view.onExit?.());
  }
}, [isOpen, initialView]); // Note: viewStack deliberately omitted to avoid loop
```

**Rationale:**
- Initial view gets its `onEnter` called when modal opens
- All views get cleanup when modal closes entirely

### Testing Requirements for Phase 1

**Create:** `src/components/common/ViewStack.test.tsx`

**Test Cases:**
```typescript
describe('ViewStack Lifecycle', () => {
  it('calls onEnter when view is pushed');
  it('passes state to onEnter');
  it('calls onExit when view is popped');
  it('passes result to onExit');
  it('calls parent onResult when child pops with result');
  it('calls onComplete when root view pops with result');
  it('does not pop below initial view');
});

describe('ViewStack State Management', () => {
  it('getCurrentView returns current view');
  it('updateCurrentView modifies current view in place');
  it('preserves stack order during updates');
});

describe('ViewStack Navigation', () => {
  it('pushView adds to stack');
  it('popView removes from stack');
  it('replaceView swaps current view');
  it('back button appears when stack depth > 1');
  it('back button calls popView');
});
```

### Acceptance Criteria for Phase 1
- [ ] All new methods implemented
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] No regressions in existing ViewStack behavior
- [ ] Documentation updated with usage examples

---

## Phase 2: Migrate CategoryManager (4-5 hours)

### Objective
Refactor CategoryManager to use ViewStack instead of manual viewMode state management, eliminating the need for conditional back button logic and manual state cleanup.

### Files to Modify
- `src/components/category/CategoryManager.tsx` (major refactor)
- Create new: `src/components/category/CategoryManagerListContent.tsx`
- Create new: `src/components/category/CategoryManagerDetailContent.tsx`
- Create new: `src/components/category/CategoryManagerImportContent.tsx`

### Current State Analysis

**CategoryManager currently has:**
- 3 view modes: 'list', 'detail', 'import' (line 22)
- 7 state variables for view management (lines 36-43)
- 3 navigation handlers with manual cleanup (lines 128-173)
- Conditional back button logic (line 376)

**Navigation Flow:**
```
List View
  ├─> Detail View (clicking category)
  │    └─> Back to List
  └─> Import View (clicking import)
       └─> Back to List
```

### Detailed Implementation

#### Step 2.1: Create CategoryManagerListContent Component

**Create File:** `src/components/category/CategoryManagerListContent.tsx`

**Purpose:** Extract the list view content (currently lines 186-337 in CategoryManager)

**Full Implementation:**
```typescript
/**
 * CategoryManagerListContent Component
 *
 * List view content for CategoryManager.
 * Uses useViewStack to push detail/import views.
 */

import { useState, useMemo } from 'react';
import type { Contestant } from '@types';
import { useViewStack } from '@components/common/ViewStack';
import { CategoryStorage } from './CategoryStorage';
import { CategoryManagerDetailContent } from './CategoryManagerDetailContent';
import { CategoryManagerImportContent } from './CategoryManagerImportContent';
import styles from './CategoryManager.module.css';

interface CategoryMetadata {
  id: string;
  name: string;
  slideCount: number;
}

interface CategoryManagerListContentProps {
  categoryMetadata: CategoryMetadata[];
  contestants: Contestant[];
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onDeleteAllCategories: () => void;
}

export function CategoryManagerListContent({
  categoryMetadata,
  contestants,
  onDeleteCategory,
  onDeleteAllCategories,
}: CategoryManagerListContentProps) {
  const { pushView } = useViewStack();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
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
      content: <CategoryManagerDetailContent categoryId={category.id} />,
    });
  };

  const handleGoToImport = () => {
    pushView({
      id: 'import',
      title: 'Import Category',
      content: <CategoryManagerImportContent />,
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, category: CategoryMetadata) => {
    e.stopPropagation();
    const usedBy = getContestantsUsingCategory(category.id);
    if (usedBy.length > 0) {
      return;
    }
    setDeletingCategory(category);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await onDeleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <CategoryStorage
                categories={categoryMetadata}
                onDeleteAll={onDeleteAllCategories}
              />
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
                  onClick={() => handleViewClick(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleViewClick(category);
                    }
                  }}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
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
                      onClick={(e) => handleDeleteClick(e, category)}
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

      {/* Delete confirmation overlay */}
      {deletingCategory && (
        <div className={styles['delete-confirmation']}>
          <p>Are you sure you want to delete the category &quot;{deletingCategory.name}&quot;?</p>
          <div className={styles['modal-footer']}>
            <button
              onClick={() => setDeletingCategory(null)}
              className={styles['modal-button-secondary']}
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirmDelete()}
              className={styles['modal-button-danger']}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

**Key Points:**
- Uses `useViewStack()` hook to access `pushView`
- Manages only list-specific state (search, hover, delete confirmation)
- Pushes detail/import views with `pushView()` - no manual viewMode switching
- Detail view includes category ID in view ID for uniqueness

#### Step 2.2: Create CategoryManagerDetailContent Component

**Create File:** `src/components/category/CategoryManagerDetailContent.tsx`

**Purpose:** Show category slides with edit capability

**Full Implementation:**
```typescript
/**
 * CategoryManagerDetailContent Component
 *
 * Detail view showing all slides in a category.
 * Loaded lazily when view is pushed to stack.
 */

import { useState, useEffect } from 'react';
import type { StoredCategory } from '@types';
import { SlidePreview } from '@components/slide/SlidePreview';
import { getCategoryById } from '@storage/indexedDB';
import styles from './CategoryManager.module.css';

interface CategoryManagerDetailContentProps {
  categoryId: string;
}

export function CategoryManagerDetailContent({ categoryId }: CategoryManagerDetailContentProps) {
  const [category, setCategory] = useState<StoredCategory | null>(null);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCategory() {
      try {
        const fullCategory = await getCategoryById<StoredCategory>(categoryId);
        setCategory(fullCategory);
      } catch (error) {
        console.error('Failed to load category:', error);
        alert('Failed to load category details');
      } finally {
        setIsLoading(false);
      }
    }

    void loadCategory();
  }, [categoryId]);

  const handleSlideAnswerChange = (slideIndex: number, newAnswer: string) => {
    if (!category) return;

    const updatedSlides = category.slides.map((slide, index) =>
      index === slideIndex ? { ...slide, answer: newAnswer } : slide
    );

    setCategory({
      ...category,
      slides: updatedSlides,
    });
    // TODO: Persist changes to storage if needed
  };

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  if (isLoading) {
    return <div>Loading category...</div>;
  }

  if (!category) {
    return <div>Category not found</div>;
  }

  return (
    <div className={styles['slides-viewer']}>
      {category.slides.map((slide, index) => (
        <SlidePreview
          key={index}
          slide={slide}
          slideNumber={index + 1}
          mode="edit"
          isExpanded={expandedSlideIndex === index}
          onToggleExpand={() => toggleSlideExpanded(index)}
          onAnswerChange={(newAnswer) => handleSlideAnswerChange(index, newAnswer)}
        />
      ))}
    </div>
  );
}
```

**Key Points:**
- Self-contained component with own state
- No manual cleanup needed - when view pops, component unmounts and state is garbage collected
- Lazy loading of full category data (only loads when viewed)

#### Step 2.3: Create CategoryManagerImportContent Component

**Create File:** `src/components/category/CategoryManagerImportContent.tsx`

**Purpose:** Wrap CategoryImporter and handle sample browser navigation

**Full Implementation:**
```typescript
/**
 * CategoryManagerImportContent Component
 *
 * Import view content with sample browser navigation.
 * Manages nested navigation to sample browser view.
 */

import { useState } from 'react';
import type { Category } from '@types';
import { useViewStack, type View } from '@components/common/ViewStack';
import { CategoryImporter } from '@components/CategoryImporter';
import { SampleCategoryBrowser } from './SampleCategoryBrowser';

interface ImportResult {
  imported: { name: string; category: Category }[];
}

interface SampleBrowserResult {
  loadedCategories: { name: string; category: Category; sizeBytes: number | undefined }[];
}

export function CategoryManagerImportContent() {
  const { pushView, popView } = useViewStack();
  const [preloadedCategories, setPreloadedCategories] = useState<
    { name: string; category: Category; sizeBytes: number | undefined }[] | null
  >(null);

  const handleBrowseSamples = () => {
    const samplesView: View<void, SampleBrowserResult> = {
      id: 'samples',
      title: 'Sample Categories',
      content: (
        <SampleCategoryBrowser
          onLoadCategories={(categories) => {
            // Return loaded categories to parent view
            popView<SampleBrowserResult>({ loadedCategories: categories });
          }}
        />
      ),
      onResult: (result: SampleBrowserResult) => {
        // Parent (import view) receives loaded categories
        setPreloadedCategories(result.loadedCategories);

        // Push preview view with preloaded data
        const previewView: View = {
          id: 'import-preview',
          title: 'Import Category',
          content: (
            <CategoryImporter
              onImport={(data) => {
                // Import completed - pop preview and import views, return to list
                popView(); // Pop preview
                popView<ImportResult>({ imported: data }); // Pop import with result
              }}
              onCancel={() => {
                popView(); // Pop preview, go back to samples
              }}
              preloadedCategories={preloadedCategories}
            />
          ),
          onExit: () => {
            // Cleanup preloaded data when leaving preview
            setPreloadedCategories(null);
          },
        };

        pushView(previewView);
      },
    };

    pushView(samplesView);
  };

  return (
    <CategoryImporter
      onImport={(data) => {
        // File upload completed - pop import view and return to list
        popView<ImportResult>({ imported: data });
      }}
      onCancel={() => {
        popView(); // Cancel - go back to list
      }}
      onBrowseSamples={handleBrowseSamples}
      preloadedCategories={preloadedCategories}
    />
  );
}
```

**Critical Design Decisions:**

1. **Nested onResult:** When samples view pops with loadedCategories, the import view's `onResult` receives it and:
   - Stores categories in local state
   - Pushes a NEW preview view

2. **State Cleanup:** The preview view's `onExit` clears `preloadedCategories` when popping

3. **Result Chaining:** Import → Samples → Preview each handle their own results via `onResult`

**Navigation Flow with ViewStack:**
```
Import View (pushes Samples)
  ├─> Samples View
  │    ├─> (user selects categories)
  │    ├─> popView({ loadedCategories })
  │    └─> Import's onResult receives loadedCategories
  │         ├─> Sets preloadedCategories state
  │         └─> Pushes Preview View
  │              ├─> Preview View shows preloaded data
  │              ├─> Back button → popView() → onExit clears preloadedCategories → back to Samples
  │              └─> Import → popView() twice → back to List
  └─> Back button → popView() → back to List
```

#### Step 2.4: Refactor CategoryManager.tsx

**File:** `src/components/category/CategoryManager.tsx`

**Changes:**

1. **Remove imports (lines 13-17):**
```typescript
// REMOVE:
import { CategoryImporter } from '@components/CategoryImporter';
import { CategoryStorage } from './CategoryStorage';
import { SlidePreview } from '@components/slide/SlidePreview';
import { getCategoryById } from '@storage/indexedDB';
```

2. **Add new imports:**
```typescript
// ADD:
import { ViewStack, type View } from '@components/common/ViewStack';
import { CategoryManagerListContent } from './CategoryManagerListContent';
```

3. **Remove state variables (lines 36-43):**
```typescript
// REMOVE all these:
const [searchQuery, setSearchQuery] = useState('');
const [viewingCategory, setViewingCategory] = useState<StoredCategory | null>(null);
const [deletingCategory, setDeletingCategory] = useState<StoredCategory | null>(null);
const [viewMode, setViewMode] = useState<ViewMode>('list');
const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
const [hoveredDeleteButton, setHoveredDeleteButton] = useState<string | null>(null);
const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
```

4. **Remove ViewMode type (line 22):**
```typescript
// REMOVE:
type ViewMode = 'list' | 'detail' | 'import';
```

5. **Remove all navigation handlers (lines 45-173):**
```typescript
// REMOVE: categoryUsageMap, getContestantsUsingCategory, handleDeleteClick,
//         handleConfirmDelete, handleDeleteAllCategories, handleConfirmDeleteAll,
//         handleViewClick, handleSlideAnswerChange, toggleSlideExpanded,
//         handleBackToList, handleGoToImport
```

6. **Simplify component body (replace lines 175-448):**
```typescript
export function CategoryManager({ onClose, contestants, onImport }: CategoryManagerProps) {
  const [categoryMetadata] = useCategoryMetadata();
  const [, { remove: removeCategory, removeAll: removeAllCategories }] = useCategories();

  const [deletingAllCategories, setDeletingAllCategories] = useState(false);

  const handleDeleteCategory = async (categoryId: string) => {
    await removeCategory(categoryId);
  };

  const handleDeleteAllCategories = () => {
    setDeletingAllCategories(true);
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await removeAllCategories();
      setDeletingAllCategories(false);
    } catch (error) {
      console.error('Failed to delete all categories:', error);
      alert(`Failed to delete all categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const categoryModalClass = styles['category-modal'];

  const listView: View = {
    id: 'list',
    title: 'Manage Categories',
    content: (
      <CategoryManagerListContent
        categoryMetadata={categoryMetadata}
        contestants={contestants}
        onDeleteCategory={handleDeleteCategory}
        onDeleteAllCategories={handleDeleteAllCategories}
      />
    ),
    onResult: (result: { imported?: { name: string; category: Category }[] }) => {
      // Import view returned imported data
      if (result.imported) {
        void onImport(result.imported);
      }
    },
  };

  return (
    <>
      <ViewStack
        isOpen={true}
        onClose={onClose}
        initialView={listView}
        {...(categoryModalClass ? { className: categoryModalClass } : {})}
      />

      {/* Delete all confirmation modal - separate from ViewStack */}
      {deletingAllCategories && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingAllCategories(false)}
          title="Confirm Delete All"
        >
          <div className={styles['delete-confirmation']}>
            <p>
              Are you sure you want to delete all {categoryMetadata.length} categories? This action
              cannot be undone.
            </p>
            <div className={styles['modal-footer']}>
              <button
                onClick={() => setDeletingAllCategories(false)}
                className={styles['modal-button-secondary']}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmDeleteAll()}
                className={styles['modal-button-danger']}
              >
                Delete All
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
```

**Before vs After Comparison:**

| Aspect | Before | After |
|--------|--------|-------|
| Lines of code | ~450 | ~85 |
| State variables | 7 | 1 (deletingAllCategories) |
| Navigation handlers | 3 | 0 |
| Back button logic | Conditional (line 376) | Automatic |
| Cleanup code | Manual in 3 places | Automatic via component unmount |

### Testing Requirements for Phase 2

**Update:** `src/components/category/CategoryManager.test.tsx` (if exists, otherwise create)

**Test Cases:**
```typescript
describe('CategoryManager with ViewStack', () => {
  describe('List View', () => {
    it('renders list of categories');
    it('searches categories by name');
    it('navigates to detail view when category clicked');
    it('navigates to import view when import button clicked');
  });

  describe('Detail View Navigation', () => {
    it('pushes detail view with category data');
    it('shows category name and slide count in title');
    it('pops back to list when back button clicked');
    it('cleans up expandedSlideIndex when popping');
  });

  describe('Import View Navigation', () => {
    it('pushes import view');
    it('pops back to list when import cancelled');
    it('pops back to list and calls onImport when import completed');
    it('receives import result via onResult');
  });

  describe('Delete Operations', () => {
    it('shows delete confirmation for single category');
    it('deletes category when confirmed');
    it('shows delete all confirmation');
    it('deletes all categories when confirmed');
  });
});
```

### Edge Cases to Handle

1. **Rapid Navigation:** User clicks multiple categories quickly
   - **Solution:** Disable navigation during transitions or debounce clicks

2. **Category Deleted While Viewing:** User deletes category from another window
   - **Solution:** Detail view handles missing category gracefully (already does)

3. **Import Cancelled Mid-Load:** User clicks back while categories loading
   - **Solution:** CategoryImporter handles this already

### Acceptance Criteria for Phase 2
- [ ] CategoryManagerListContent renders correctly
- [ ] CategoryManagerDetailContent loads categories lazily
- [ ] CategoryManagerImportContent handles sample browser flow
- [ ] CategoryManager uses ViewStack
- [ ] All tests passing
- [ ] Back button works correctly at all levels
- [ ] No manual viewMode state
- [ ] State cleanup is automatic
- [ ] TypeScript compiles without errors
- [ ] Manual testing confirms all flows work

---

## Phase 3: Migrate ContestantCreator (4-5 hours)

### Objective
Refactor ContestantCreator to use ViewStack, eliminating the complex conditional back button logic and manual preloadedCategories state management.

### Files to Modify
- `src/components/contestant/ContestantCreator.tsx` (major refactor)
- Create new: `src/components/contestant/CreateContestantForm.tsx`
- Update: `src/components/CategoryImporter.tsx` (pass callbacks through ViewStack context)

### Current State Analysis

**ContestantCreator currently has:**
- 3 view modes: 'create', 'import', 'samples' (line 24)
- preloadedCategories state that persists across views (lines 45-47)
- Complex conditional back button logic (line 222)
- Manual view switching in 4 handlers (lines 98-112)

**The Specific Bug:**
```
User Flow: Create → Import → Samples → (select) → Import Preview → Back
Expected: Back to Samples
Actual: Back to Samples ✅

Then: Samples → Back
Expected: Back to Import
Actual: Back to Import ✅

Then: Import → Back
Expected: Back to Create
Actual: Loops between Import and Samples ❌

Root Cause: Line 222 hardcodes back button destinations
```

### Detailed Implementation

#### Step 3.1: Create CreateContestantForm Component

**Create File:** `src/components/contestant/CreateContestantForm.tsx`

**Purpose:** Extract create form UI from ContestantCreator

**Full Implementation:**
```typescript
/**
 * CreateContestantForm Component
 *
 * Form for creating a contestant by selecting name and category.
 * Uses ViewStack to navigate to import view.
 */

import { useState, useEffect } from 'react';
import type { StoredCategory, Category } from '@types';
import { useViewStack } from '@components/common/ViewStack';
import { Button } from '@components/common/Button';
import { CategoryManagerImportContent } from '@components/category/CategoryManagerImportContent';
import {
  getSampleCategories,
  fetchSampleCategory,
  type SampleCategoryMeta,
} from '@utils/sampleCategories';
import styles from './ContestantCreator.module.css';

interface CreateContestantFormProps {
  categories: StoredCategory[];
  onCreateContestant: (name: string, categoryId: string) => Promise<void>;
  onImportAndCreate: (contestants: { name: string; category: Category }[]) => Promise<void>;
}

interface ImportResult {
  imported: { name: string; category: Category }[];
}

export function CreateContestantForm({
  categories,
  onCreateContestant,
  onImportAndCreate,
}: CreateContestantFormProps) {
  const { pushView, popView } = useViewStack();
  const [contestantName, setContestantName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [sampleCategories, setSampleCategories] = useState<SampleCategoryMeta[]>([]);

  useEffect(() => {
    try {
      const samples = getSampleCategories();
      setSampleCategories(samples);
    } catch (error) {
      console.error('Failed to load sample categories:', error);
    }
  }, []);

  const handleCreate = async () => {
    if (!contestantName.trim() || !selectedCategoryId) return;

    setIsCreating(true);
    try {
      // Check if sample category
      if (selectedCategoryId.startsWith('sample:')) {
        const filename = selectedCategoryId.substring(7);
        const { category } = await fetchSampleCategory(filename);
        await onImportAndCreate([{ name: contestantName.trim(), category }]);
        popView(); // Close the create view
      } else {
        await onCreateContestant(contestantName.trim(), selectedCategoryId);
        popView(); // Close the create view
      }
    } catch (error) {
      console.error('Failed to create contestant:', error);
      alert(`Failed to create contestant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreating(false);
    }
  };

  const handleGoToImport = () => {
    const importView: View<void, ImportResult> = {
      id: 'import',
      title: 'Import Category',
      content: <CategoryManagerImportContent />,
      onResult: (result: ImportResult) => {
        // Import view returned imported data
        if (result.imported) {
          void onImportAndCreate(result.imported);
          popView(); // Close create view after import completes
        }
      },
    };

    pushView(importView);
  };

  const canCreate = contestantName.trim() && selectedCategoryId;

  return (
    <>
      <div className={styles['form-group']}>
        <label htmlFor="contestant-name">Contestant Name:</label>
        <input
          id="contestant-name"
          type="text"
          value={contestantName}
          onChange={(e) => setContestantName(e.target.value)}
          placeholder="Enter contestant name"
          className={styles['input']}
        />
      </div>

      <div className={styles['form-group']}>
        <label htmlFor="category-select">Category:</label>
        <select
          id="category-select"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className={styles['select']}
        >
          <option value="">Select a category...</option>
          {categories.length > 0 && (
            <optgroup label="Your Categories">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.slides.length} slides)
                </option>
              ))}
            </optgroup>
          )}
          {sampleCategories.length > 0 && (
            <optgroup label="Sample Categories (Demo Data)">
              {sampleCategories.map((sample) => (
                <option key={`sample-${sample.filename}`} value={`sample:${sample.filename}`}>
                  {sample.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <Button
          variant="secondary"
          onClick={handleGoToImport}
          className={styles['import-button-inline'] ?? ''}
        >
          Or Import New Category
        </Button>
      </div>

      <div className={styles['footer-actions']}>
        <Button
          variant="primary"
          onClick={() => void handleCreate()}
          disabled={!canCreate || isCreating}
        >
          {isCreating ? 'Creating...' : 'Create Contestant'}
        </Button>
      </div>
    </>
  );
}
```

**Key Changes:**
- Uses `useViewStack()` to access `pushView` and `popView`
- Creates import view declaratively with `onResult` callback
- When import completes, calls `onImportAndCreate` then pops the create view entirely
- No manual viewMode switching
- No preloadedCategories state needed here (managed by CategoryManagerImportContent)

#### Step 3.2: Refactor ContestantCreator.tsx

**File:** `src/components/contestant/ContestantCreator.tsx`

**Replace entire component (lines 32-195):**

```typescript
export function ContestantCreator({
  onClose,
  onCreate,
  onImport,
  categories,
}: ContestantCreatorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const createView: View = {
    id: 'create',
    title: 'Add Contestant',
    content: (
      <CreateContestantForm
        categories={categories}
        onCreateContestant={onCreate}
        onImportAndCreate={async (contestants) => {
          await onImport(contestants);
          handleClose(); // Close modal after import
        }}
      />
    ),
  };

  return (
    <ViewStack
      isOpen={isOpen}
      onClose={handleClose}
      initialView={createView}
      onComplete={() => {
        // Root view completed (create succeeded) - close modal
        handleClose();
      }}
    />
  );
}
```

**Before vs After:**

| Aspect | Before (Lines) | After (Lines) | Reduction |
|--------|---------------|---------------|-----------|
| Total lines | 195 | ~40 | 80% |
| State variables | 3 (viewMode, isOpen, preloadedCategories) | 1 (isOpen) | 67% |
| Navigation handlers | 4 | 0 | 100% |
| Conditional logic | Complex (line 222) | None | 100% |

### Testing Requirements for Phase 3

**Update:** `src/components/contestant/ContestantCreator.test.tsx` (if exists)

**Test Cases:**
```typescript
describe('ContestantCreator with ViewStack', () => {
  describe('Create View', () => {
    it('renders contestant name input');
    it('renders category dropdown');
    it('creates contestant with selected category');
    it('navigates to import view when import button clicked');
  });

  describe('Import Navigation', () => {
    it('pushes import view');
    it('returns to create view when import cancelled');
    it('imports categories and closes modal when import completed');
  });

  describe('Sample Browser Navigation', () => {
    it('navigates Create → Import → Samples');
    it('navigates back Samples → Import');
    it('navigates back Import → Create');
    it('loads sample categories into import view');
    it('shows preview after loading samples');
    it('navigates back from preview to samples');
  });

  describe('Data Flow', () => {
    it('passes contestantName to imported categories');
    it('sample categories show in dropdown');
    it('creates contestant with sample category');
  });
});
```

### Edge Cases to Handle

1. **User Closes Modal Mid-Import:** Import in progress when modal closes
   - **Solution:** ViewStack's useEffect cleanup calls onExit for all views

2. **Contestant Name Changes During Import Flow:** User types name, goes to import, comes back
   - **Solution:** contestantName is in CreateContestantForm component state, persists during navigation

3. **Sample Category Load Failure:** Network error loading sample
   - **Solution:** SampleCategoryBrowser already handles this

### Acceptance Criteria for Phase 3
- [ ] CreateContestantForm renders correctly
- [ ] ContestantCreator uses ViewStack
- [ ] All tests passing
- [ ] Back button works correctly at all levels
- [ ] No manual viewMode state
- [ ] No preloadedCategories state in ContestantCreator
- [ ] State cleanup is automatic
- [ ] Import → Samples → Preview → Back navigation works correctly
- [ ] TypeScript compiles without errors

---

## Implementation Checklist

### Pre-Implementation
- [ ] Review this document thoroughly
- [ ] Ensure understanding of undo/redo pattern
- [ ] Set up feature branch: `git checkout -b feat/viewstack-migration`
- [ ] Ensure dev server running: `npm run dev`

### Phase 1: ViewStack Enhancement
- [ ] Update View interface with generics
- [ ] Update ViewStackContextValue
- [ ] Add onComplete prop
- [ ] Enhance pushView to pass state
- [ ] Enhance popView to pass results
- [ ] Add getCurrentView method
- [ ] Add updateCurrentView method
- [ ] Update contextValue memoization
- [ ] Update useEffect for initialView onEnter
- [ ] Create ViewStack.test.tsx
- [ ] Run tests: `npm test -- ViewStack`
- [ ] Run build: `npm run build`
- [ ] Commit: `git commit -m "feat: enhance ViewStack with undo/redo support"`

### Phase 2: CategoryManager Migration
- [ ] Create CategoryManagerListContent.tsx
- [ ] Create CategoryManagerDetailContent.tsx
- [ ] Create CategoryManagerImportContent.tsx
- [ ] Refactor CategoryManager.tsx to use ViewStack
- [ ] Remove all manual viewMode state
- [ ] Remove all navigation handlers
- [ ] Update tests for CategoryManager
- [ ] Manual test: List → Detail → Back
- [ ] Manual test: List → Import → Back
- [ ] Manual test: List → Import → Samples → Preview → Back → Back → Back
- [ ] Run tests: `npm test -- CategoryManager`
- [ ] Run build: `npm run build`
- [ ] Commit: `git commit -m "feat: migrate CategoryManager to ViewStack"`

### Phase 3: ContestantCreator Migration
- [ ] Create CreateContestantForm.tsx
- [ ] Refactor ContestantCreator.tsx to use ViewStack
- [ ] Remove viewMode and preloadedCategories state
- [ ] Remove all navigation handlers
- [ ] Update tests for ContestantCreator
- [ ] Manual test: Create → Import → Back
- [ ] Manual test: Create → Import → Samples → Back → Back
- [ ] Manual test: Create → Import → Samples → Preview → Back → Back → Back
- [ ] Run tests: `npm test -- ContestantCreator`
- [ ] Run build: `npm run build`
- [ ] Commit: `git commit -m "feat: migrate ContestantCreator to ViewStack"`

### Post-Implementation
- [ ] Run full test suite: `npm test -- --run`
- [ ] Run build: `npm run build`
- [ ] Manual testing of all user flows
- [ ] Create PR with detailed description
- [ ] Code review
- [ ] Merge to main

---

## Common Pitfalls to Avoid

### 1. Forgetting to Call popView in Child Components

**Problem:** Child component calls parent's `onImport` directly instead of `popView(result)`

**Example (Wrong):**
```typescript
<CategoryImporter
  onImport={(data) => {
    onImport(data); // ❌ Doesn't pop view!
  }}
/>
```

**Fix:**
```typescript
<CategoryImporter
  onImport={(data) => {
    popView({ imported: data }); // ✅ Pops and passes result
  }}
/>
```

### 2. Incorrect Dependency Arrays in useMemo/useCallback

**Problem:** Adding `pushView` or `popView` to dependency arrays causes re-creation

**Example (Wrong):**
```typescript
const handleGoToImport = useCallback(() => {
  pushView(importView);
}, [pushView, importView]); // ❌ importView is recreated every render!
```

**Fix:**
```typescript
// Define view inline, pushView is already memoized
const handleGoToImport = () => {
  pushView({
    id: 'import',
    title: 'Import Category',
    content: <CategoryManagerImportContent />,
  });
};
```

### 3. Accessing Stale State in onExit

**Problem:** onExit closure captures state from when view was created

**Example (Wrong):**
```typescript
const importView: View = {
  id: 'import',
  content: <CategoryImporter />,
  onExit: () => {
    console.log(preloadedCategories); // ❌ Stale closure!
  },
};
```

**Fix:** Use refs or ensure onExit doesn't need to read state:
```typescript
const preloadedRef = useRef<Category[] | null>(null);

const importView: View = {
  id: 'import',
  content: <CategoryImporter />,
  onExit: () => {
    preloadedRef.current = null; // ✅ Refs are always current
  },
};
```

Or better - manage state in the child component:
```typescript
// CategoryManagerImportContent manages preloadedCategories internally
// onExit just needs to clean up, no need to access state
```

### 4. Not Cleaning Up State in onExit

**Problem:** State persists when navigating away

**Example (Wrong):**
```typescript
const detailView: View = {
  id: 'detail',
  content: <CategoryDetail />,
  // ❌ No onExit - expandedSlideIndex might leak!
};
```

**Fix:**
```typescript
// State is local to CategoryDetail component
// When view pops, component unmounts, state is garbage collected automatically
// No onExit needed! ✅
```

### 5. Circular Navigation Loops

**Problem:** onResult pushes a view that calls onResult that pushes a view...

**Prevention:** Always ensure result flow goes UP the stack (parent receives from child), never creates a new child in onResult unless it's intentional.

---

## Debugging Guide

### Issue: Back Button Not Working

**Symptoms:** Clicking back does nothing or goes to wrong view

**Debug Steps:**
1. Check ViewStack context is available: `console.log(useViewStack())`
2. Check stack depth: `console.log('Stack depth:', stackDepth)`
3. Add logging to popView: `console.log('Popping view:', currentView.id)`
4. Check onExit is called: Add `console.log` in onExit hooks

**Common Causes:**
- Component not wrapped in ViewStack Provider
- popView not being called in child component
- Multiple ViewStacks interfering (modal-in-modal)

### Issue: State Not Cleaning Up

**Symptoms:** Stale data appears when returning to view

**Debug Steps:**
1. Add logging to onExit: `console.log('onExit called')`
2. Check if onExit is defined on the view
3. Verify state is being cleared in onExit

**Common Causes:**
- onExit not defined
- onExit has stale closure (see Pitfall #3)
- State managed in wrong component (should be in view content component)

### Issue: onResult Not Firing

**Symptoms:** Parent doesn't receive child's result

**Debug Steps:**
1. Check result is passed to popView: `popView({ myData: 123 })`
2. Add logging to onResult: `console.log('onResult:', result)`
3. Verify onResult is defined on parent view

**Common Causes:**
- Forgot to pass result to popView
- onResult not defined on parent view
- Result type mismatch (TypeScript should catch this)

---

## Code Review Checklist

### For Reviewers

**ViewStack Enhancement (Phase 1):**
- [ ] Generic types properly constrained
- [ ] onEnter receives state parameter
- [ ] onExit receives result parameter
- [ ] popView passes result to parent's onResult
- [ ] onComplete called when root view completes
- [ ] getCurrentView and updateCurrentView work correctly
- [ ] All tests passing
- [ ] No memory leaks in lifecycle hooks

**CategoryManager Migration (Phase 2):**
- [ ] No manual viewMode state
- [ ] No manual state cleanup in handlers
- [ ] All view content extracted to separate components
- [ ] Back button works at all levels
- [ ] Delete operations still work
- [ ] Search functionality works
- [ ] Category detail loads correctly
- [ ] Import flow works end-to-end
- [ ] Sample browser flow works end-to-end

**ContestantCreator Migration (Phase 3):**
- [ ] No manual viewMode state
- [ ] No preloadedCategories state in ContestantCreator
- [ ] CreateContestantForm extracted properly
- [ ] Back button works at all levels
- [ ] Sample categories in dropdown still work
- [ ] Import flow works end-to-end
- [ ] contestant name persists during navigation

---

## Performance Considerations

### Memory Usage

**Before:** Each navigation keeps all state in memory (viewMode + view-specific state)

**After:** Stack grows with navigation depth, but:
- Typical depth: 2-3 views
- Each view: ~1KB overhead
- Total: ~3KB max (negligible)

**Optimization:** If stack gets deep (>5 views), consider limiting stack depth

### Re-renders

**Before:** Changing viewMode re-renders entire Modal

**After:** Changing view re-renders Modal with new content

**Impact:** Neutral - same number of re-renders

**Optimization:** Memoize view content components if they're expensive

### Bundle Size

**Before:** All view logic in one component

**After:** Split into multiple components

**Impact:** +~5KB total (3 new components × ~1.5KB each)

**Benefit:** Better code splitting, tree-shaking opportunities

---

## Rollback Plan

### If Migration Fails

**Option A: Git Revert**
```bash
git revert <commit-hash>
git push origin main
```

**Option B: Feature Flag (Advanced)**

1. Add flag to localStorage: `VIEWSTACK_ENABLED`
2. Wrap CategoryManager in conditional:
```typescript
export function CategoryManager(props) {
  const useViewStack = localStorage.getItem('VIEWSTACK_ENABLED') === 'true';

  if (useViewStack) {
    return <CategoryManagerWithViewStack {...props} />;
  }

  return <CategoryManagerLegacy {...props} />;
}
```

3. Deploy with flag disabled
4. Enable for testing
5. Enable for all users after validation
6. Remove legacy code after 1 week

### Monitoring

**Metrics to Track:**
- Modal navigation errors (check console logs)
- "Category not found" errors (detail view loading)
- Import success/failure rates
- User complaints about navigation

**Alert Thresholds:**
- >5% increase in navigation errors → investigate immediately
- >10% increase in errors → consider rollback

---

## Success Metrics

### Code Quality
- [ ] Lines of navigation code reduced by >60%
- [ ] State variables reduced by >60%
- [ ] Conditional back button logic eliminated
- [ ] TypeScript strict mode compliance maintained

### Functionality
- [ ] All existing features work identically
- [ ] Back button works correctly at all levels
- [ ] No navigation bugs reported in first week
- [ ] Modal animations smooth

### Developer Experience
- [ ] Adding new views requires <10 lines of code
- [ ] No manual state cleanup needed
- [ ] Navigation logic is declarative
- [ ] Code is more testable

---

## Appendix: Complete Example Flows

### Example A: CategoryManager Full Flow

```typescript
// Initial render
<ViewStack
  isOpen={true}
  onClose={onClose}
  initialView={listView}
/>

// Stack: [list]
// Title: "Manage Categories"
// Back button: Hidden

// User clicks "Import Category"
handleGoToImport() calls:
  pushView({
    id: 'import',
    title: 'Import Category',
    content: <CategoryManagerImportContent />,
    onResult: (result) => { /* handle import */ }
  })

// Stack: [list, import]
// Title: "Import Category"
// Back button: Visible → popView()

// User clicks "Browse Sample Categories"
// (Inside CategoryManagerImportContent)
handleBrowseSamples() calls:
  pushView({
    id: 'samples',
    title: 'Sample Categories',
    content: <SampleCategoryBrowser ... />,
    onResult: (result) => { /* receive loaded categories */ }
  })

// Stack: [list, import, samples]
// Title: "Sample Categories"
// Back button: Visible → popView()

// User selects categories and clicks "Load"
// (Inside SampleCategoryBrowser)
popView({ loadedCategories: [...] })

// Stack: [list, import]
// Title: "Import Category"
// Import view's onResult fires → receives loadedCategories
//   → Sets preloadedCategories state
//   → Pushes preview view

pushView({
  id: 'import-preview',
  title: 'Import Category',
  content: <CategoryImporter preloadedCategories={...} />,
  onExit: () => { setPreloadedCategories(null); } // Cleanup
})

// Stack: [list, import, preview]
// Title: "Import Category"
// Back button: Visible → popView()

// User clicks back button
popView()

// Stack: [list, import]
// Preview's onExit fires → clears preloadedCategories
// Title: "Import Category"
// Back button: Visible → popView()

// User clicks back button again
popView()

// Stack: [list]
// Title: "Manage Categories"
// Back button: Hidden

// ✅ Perfect! No infinite loops, no bugs!
```

### Example B: State Passing Between Views

```typescript
// Parent view wants to pass data to child
const parentView: View<ParentState> = {
  id: 'parent',
  title: 'Parent',
  state: { userId: 123 }, // Data to pass
  content: <ParentComponent />,
};

// Inside ParentComponent
const handleGoToChild = () => {
  pushView({
    id: 'child',
    title: 'Child',
    state: { userId: 456 }, // Different data for child
    content: <ChildComponent />,
    onEnter: (state) => {
      console.log('Child entered with:', state); // { userId: 456 }
    },
  });
};

// Child component wants to return data to parent
// Inside ChildComponent
const handleComplete = (data: string) => {
  popView({ result: data }); // Pass data back
};

// Parent view receives data
const parentView: View<void, ChildResult> = {
  id: 'parent',
  title: 'Parent',
  content: <ParentComponent />,
  onResult: (result: ChildResult) => {
    console.log('Child returned:', result); // { result: "data" }
    // Parent can update its state, push new view, etc.
  },
};
```

---

## Glossary

**View:** A screen/page shown in the modal with its own UI and logic

**ViewStack:** Container managing a stack of views with automatic navigation

**pushView:** Add a new view to the stack and navigate to it (forward navigation)

**popView:** Remove current view from stack and go back (back navigation)

**onEnter:** Lifecycle hook called when view becomes active (redo operation)

**onExit:** Lifecycle hook called when view is removed from stack (undo operation)

**onResult:** Callback on parent view to receive data from child view

**state:** Data passed from parent to child view when pushing

**result:** Data passed from child to parent view when popping

**stackDepth:** Number of views currently in the stack

---

## Questions for Implementation

### Q: Should onResult be called before or after onExit?

**Answer:** After onExit. Order:
1. Child's `onExit(result)` - cleanup child state
2. Parent's `onResult(result)` - parent processes child's result
3. View pops from stack

**Rationale:** Child should cleanup before parent receives result

### Q: What happens if popView() is called on root view?

**Answer:** Don't pop, call `onComplete` instead

**Rationale:** Popping root view would leave modal empty. Better to signal completion and let parent decide (usually close modal).

### Q: Can views update their own title dynamically?

**Answer:** Yes, via `updateCurrentView`:
```typescript
const { updateCurrentView } = useViewStack();

updateCurrentView((view) => ({
  ...view,
  title: 'New Title',
}));
```

### Q: How to handle modal-in-modal (e.g., delete confirmation)?

**Answer:** Two approaches:

**Approach A:** Separate Modal (current approach for delete-all)
```typescript
{deletingCategory && <Modal isOpen={true} ... />}
```

**Approach B:** Push view onto stack (more consistent)
```typescript
pushView({
  id: 'delete-confirm',
  title: 'Confirm Delete',
  content: <DeleteConfirmation ... />,
});
```

**Recommendation:** Use Approach B for consistency, but Approach A is acceptable for simple confirmations.

---

## Resources

### Files to Reference During Implementation

1. **Current Modal Implementation:** `src/components/common/Modal.tsx`
   - Shows how back button is wired (line 146-157)
   - Shows onClose animation handling

2. **Current CategoryImporter:** `src/components/CategoryImporter.tsx`
   - Shows multi-file preview pattern (lines 42-67)
   - Shows preloadedCategories handling (lines 48-64)

3. **Current SampleCategoryBrowser:** `src/components/category/SampleCategoryBrowser.tsx`
   - Shows how categories are loaded and passed to parent

4. **TypeScript Strict Mode Config:** `tsconfig.app.json`
   - Reference for type safety requirements

### Related Documentation

- React Context API: https://react.dev/reference/react/useContext
- Undo/Redo Patterns: https://redux.js.org/usage/implementing-undo-history
- TypeScript Generics: https://www.typescriptlang.org/docs/handbook/2/generics.html

---

## Conclusion

This migration eliminates brittle manual view state management in favor of a declarative, stack-based approach. The undo/redo pattern ensures automatic state cleanup and makes navigation logic trivial to understand and maintain.

After completion:
- 60-70% reduction in navigation code
- Zero conditional back button logic
- Automatic state cleanup
- Type-safe view state passing
- Foundation for future modal-based workflows

**Next Step:** Begin with Phase 1 - enhance ViewStack component with the features documented above.
