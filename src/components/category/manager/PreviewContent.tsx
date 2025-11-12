/**
 * PreviewContent Component
 *
 * Shows preview of a single category before import.
 * Each category gets its own view on the stack.
 * Matches the original CategoryImporter design.
 */

import { useState, useEffect } from 'react';
import type { Category } from '@types';
import { SlidePreview } from '@components/slide/SlidePreview';
import styles from '../../CategoryImporter.module.css';

interface PreviewContentProps {
  category: Category;
  contestantName: string;
  sizeBytes: number | undefined;
  onImport: (editedContestantName: string, editedCategoryName: string) => void;
  categoryNumber?: number;
  totalCategories?: number;
  isSample?: boolean;
  fileName?: string;
  fileSizeWarningThresholdMB?: number;
}

export function PreviewContent({
  category,
  contestantName,
  sizeBytes,
  onImport,
  categoryNumber,
  totalCategories,
  isSample = true,
  fileName,
  fileSizeWarningThresholdMB = 30,
}: PreviewContentProps) {
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(null);
  const [editedContestantName, setEditedContestantName] = useState(contestantName);
  const [editedCategoryName, setEditedCategoryName] = useState(category.name);

  // Reset state when category changes (important for stack navigation)
  useEffect(() => {
    setEditedContestantName(contestantName);
    setEditedCategoryName(category.name);
    setExpandedSlideIndex(null);
  }, [category.name, contestantName]);

  const toggleSlideExpanded = (slideIndex: number) => {
    setExpandedSlideIndex((prev) => (prev === slideIndex ? null : slideIndex));
  };

  const handleSlideAnswerChange = (_slideIndex: number, _newAnswer: string) => {
    // TODO: Update slide answer if we want to support editing
  };

  const handleImportClick = () => {
    onImport(editedContestantName, editedCategoryName);
  };

  const categoryImporterClass = styles['category-importer'] ?? '';
  const fileInfoClass = styles['file-info'] ?? '';
  const fileNameClass = styles['file-name'] ?? '';

  return (
    <div className={categoryImporterClass}>
      {/* File info header */}
      <div className={fileInfoClass}>
        <div>
          <div className={fileNameClass}>
            {isSample ? (
              <>
                📦 {fileName || category.name}
                {sizeBytes !== undefined && (
                  <span className={styles['file-size'] ?? ''}>
                    {(() => {
                      const sizeInMB = sizeBytes / (1024 * 1024);
                      const sizeText =
                        sizeInMB < 1
                          ? `${(sizeBytes / 1024).toFixed(1)} KB`
                          : `${sizeInMB.toFixed(1)} MB`;
                      return sizeText;
                    })()}
                  </span>
                )}
                <span className={styles['sample-badge'] ?? ''}>Sample</span>
              </>
            ) : fileName ? (
              <>
                📄 {fileName}
                {sizeBytes !== undefined && (
                  <span className={styles['file-size'] ?? ''}>
                    {(() => {
                      const sizeInMB = sizeBytes / (1024 * 1024);
                      const isLarge = sizeInMB > fileSizeWarningThresholdMB;
                      const sizeText =
                        sizeInMB < 1
                          ? `${(sizeBytes / 1024).toFixed(1)} KB`
                          : `${sizeInMB.toFixed(1)} MB`;
                      return (
                        <span className={isLarge ? (styles['file-size-warning'] ?? '') : ''}>
                          {sizeText}
                          {isLarge && ' ⚠️ Large file - may be slow'}
                        </span>
                      );
                    })()}
                  </span>
                )}
                {totalCategories !== undefined && totalCategories > 1 && categoryNumber !== undefined && (
                  <span className={styles['file-counter'] ?? ''}>
                    {' '}
                    (File {categoryNumber} of {totalCategories})
                  </span>
                )}
              </>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={handleImportClick}
          disabled={!editedCategoryName.trim()}
          className={styles['import-button-inline'] ?? ''}
        >
          Import
        </button>
      </div>

      {/* Preview section */}
      <div className={styles['preview-section'] ?? ''}>
        <h3>Preview</h3>

        <div className={styles['form-group'] ?? ''}>
          <label htmlFor="contestant-name-input">
            Contestant Name{' '}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              (optional)
            </span>
            :
          </label>
          <input
            id="contestant-name-input"
            type="text"
            value={editedContestantName}
            onChange={(e) => setEditedContestantName(e.target.value)}
            placeholder="Leave empty to import category only"
          />
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: '0.25rem 0 0 0',
            }}
          >
            If provided, a contestant will be created with this category. Otherwise, only the
            category will be imported.
          </p>
        </div>

        <div className={styles['form-group'] ?? ''}>
          <label htmlFor="category-name-input">Category Name:</label>
          <input
            id="category-name-input"
            type="text"
            value={editedCategoryName}
            onChange={(e) => setEditedCategoryName(e.target.value)}
            placeholder="Enter category name"
            required
          />
        </div>

        <div className={styles['slides-summary'] ?? ''}>
          <h4>Slides: {category.slides.length}</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Click on any slide to expand and edit its answer. Answers are censored by default to
            prevent spoilers.
          </p>
          <div className={styles['slides-list'] ?? ''}>
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
        </div>
      </div>
    </div>
  );
}
