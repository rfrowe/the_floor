import { DemoHighlights, DemoDescription } from '@pages/DemoControlsContent';
import { useState, useCallback } from 'react';
import { CategoryStorage } from '@components/category/CategoryStorage';
import { ComponentController } from '@pages/ComponentController';
import styles from '@pages/ComponentsDemo.module.css';

const MAX_STORAGE_MB = 500; // Match storageUtils quota

export default function CategoryStorageDemo() {
  const [storageUsedMB, setStorageUsedMB] = useState(60);
  const [categoryCount, setCategoryCount] = useState(3);
  const [slidesPerCategory, setSlidesPerCategory] = useState(10);
  const [categories, setCategories] = useState([
    { id: 'cat-1', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
    { id: 'cat-2', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
    { id: 'cat-3', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
  ]);

  const handleRandomize = useCallback(() => {
    // Randomize all parameters
    const newCount = Math.floor(Math.random() * 15) + 3; // 3-17 categories
    const newSlides = Math.floor(Math.random() * 40) + 5; // 5-44 slides
    const newStorageMB = Math.floor(Math.random() * 400) + 50; // 50-449 MB

    setCategoryCount(newCount);
    setSlidesPerCategory(newSlides);
    setStorageUsedMB(newStorageMB);

    const perCategory = (newStorageMB * 1024 * 1024) / newCount;
    setCategories(
      Array.from({ length: newCount }, (_, idx) => ({
        id: `cat-${String(idx + 1)}`,
        slideCount: newSlides,
        sizeInBytes: perCategory,
      }))
    );
  }, []);

  const handleDeleteAll = useCallback(() => {
    setCategories([]);
    setStorageUsedMB(0);
    setCategoryCount(0);
  }, []);

  const handleReset = useCallback(() => {
    setStorageUsedMB(60);
    setCategoryCount(3);
    setSlidesPerCategory(10);
    setCategories([
      { id: 'cat-1', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
      { id: 'cat-2', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
      { id: 'cat-3', slideCount: 10, sizeInBytes: 20 * 1024 * 1024 },
    ]);
  }, []);

  return (
    <section className={styles['section']} id="category-storage">
      <h2>
        <code>&lt;CategoryStorage /&gt;</code>
      </h2>
      <p>
        Displays current category storage capacity and provides action to delete all categories.
      </p>

      <ComponentController
        controls={[
          {
            type: 'slider',
            label: 'Storage Used (MB)',
            value: storageUsedMB,
            min: 0,
            max: MAX_STORAGE_MB,
            step: 10,
            onChange: (val) => {
              setStorageUsedMB(val as number);
              const targetBytes = (val as number) * 1024 * 1024;
              const perCategory = categoryCount > 0 ? targetBytes / categoryCount : 0;
              setCategories(
                Array.from({ length: categoryCount }, (_, idx) => ({
                  id: `cat-${String(idx + 1)}`,
                  slideCount: slidesPerCategory,
                  sizeInBytes: perCategory,
                }))
              );
            },
          },
          {
            type: 'slider',
            label: 'Number of Categories',
            value: categoryCount,
            min: 0,
            max: 20,
            step: 1,
            onChange: (val) => {
              const count = val as number;
              setCategoryCount(count);
              const targetBytes = storageUsedMB * 1024 * 1024;
              const perCategory = count > 0 ? targetBytes / count : 0;
              setCategories(
                Array.from({ length: count }, (_, idx) => ({
                  id: `cat-${String(idx + 1)}`,
                  slideCount: slidesPerCategory,
                  sizeInBytes: perCategory,
                }))
              );
            },
          },
          {
            type: 'slider',
            label: 'Slides Per Category',
            value: slidesPerCategory,
            min: 1,
            max: 50,
            step: 1,
            onChange: (val) => {
              setSlidesPerCategory(val as number);
              setCategories((prev) =>
                prev.map((cat) => ({
                  ...cat,
                  slideCount: val as number,
                }))
              );
            },
          },
          {
            type: 'button',
            label: '🎲 Randomize Sizes',
            onClick: handleRandomize,
            variant: 'secondary',
          },
        ]}
        onReset={handleReset}
        description={
          <DemoDescription>
            <p>
              Adjust storage parameters to see how the progress bar responds. Storage limit is 500
              MB matching the IndexedDB quota. Randomize creates varied configurations.
            </p>
          </DemoDescription>
        }
        highlights={
          <DemoHighlights title="Interactive Controls:">
            - Storage slider: 0-500 MB (matches quota from storageUtils)
            <br />
            - Category count: 0-20 categories
            <br />
            - Slides per category: 1-50 slides
            <br />
            - Randomize adjusts all three parameters at once
            <br />
            - Delete All button resets controls to zero
            <br />- Progress bar updates in real-time
          </DemoHighlights>
        }
      />

      <CategoryStorage categories={categories} onDeleteAll={handleDeleteAll} />
    </section>
  );
}
