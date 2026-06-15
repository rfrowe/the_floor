/**
 * SaveStep — the final wizard step.
 *
 * Summarizes the finished category, saves it to the local IndexedDB library
 * (immediately playable) via `useCategories().add`, warns on a duplicate name,
 * clears the Studio draft after a successful save, and offers a Download JSON
 * action that emits the import-compatible `{ category: { name, slides } }`
 * envelope so the file round-trips through the existing importer.
 *
 * Blank-image slides: the importer's `isSlide` guard requires every slide's
 * `imageUrl` to be a `data:image/...` URL, so image-less slides cannot be
 * saved or exported as valid. This step excludes blank slides from both the
 * saved category and the download, surfaces the excluded count up front, and
 * blocks entirely when no slide has an image (a category needs ≥1 valid slide).
 */

import { useMemo, useState } from 'react';
import { Button } from '@components/common/Button';
import { LinkButton } from '@components/common/LinkButton';
import { useCategories } from '@hooks/useCategories';
import { getCategoriesByName } from '@storage/indexedDB';
import { buildStoredCategory } from '@utils/buildStoredCategory';
import { categoryToFileName } from '@utils/categoryToFileName';
import { partitionSlidesByImage, serializeCategoryForExport } from '@utils/categoryExport';
import { createLogger } from '@/utils/logger';
import type { Slide, StoredCategory } from '@types';
import styles from './SaveStep.module.css';

const log = createLogger('SaveStep');

export interface SaveStepProps {
  /** The confirmed category name. */
  categoryName: string;
  /** The finished slides from the draft (may include image-less ones). */
  slides: Slide[];
  /**
   * Clear the persisted Studio draft after a successful save so returning to
   * the Studio starts fresh. Wired to the draft store's clear/reset in Studio.
   */
  onClearDraft: () => void;
}

/** Trigger a browser download of `text` as a file named `filename`. */
function downloadTextFile(text: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function SaveStep({ categoryName, slides, onClearDraft }: SaveStepProps) {
  const [, categoryOps] = useCategories();

  // Saved category once committed; drives the success confirmation.
  const [savedCategory, setSavedCategory] = useState<StoredCategory | null>(null);
  // A pending duplicate-name confirmation (the user must choose Save anyway).
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive the exportable subset (slides with a real image) and a summary.
  const { withImage, blank } = useMemo(() => partitionSlidesByImage(slides), [slides]);
  const censoredCount = useMemo(
    () => withImage.filter((slide) => slide.censorBoxes.length > 0).length,
    [withImage]
  );

  const trimmedName = categoryName.trim();
  const hasName = trimmedName.length > 0;
  const blankCount = blank.length;
  const validCount = withImage.length;
  const canSave = hasName && validCount > 0 && !isSaving;

  const containerClass = styles['container'] ?? '';
  const summaryClass = styles['summary'] ?? '';
  const summaryListClass = styles['summary-list'] ?? '';
  const warningClass = styles['warning'] ?? '';
  const blockedClass = styles['blocked'] ?? '';
  const actionsClass = styles['actions'] ?? '';
  const noteClass = styles['note'] ?? '';
  const errorClass = styles['error'] ?? '';
  const successClass = styles['success'] ?? '';
  const duplicateClass = styles['duplicate'] ?? '';
  const duplicateActionsClass = styles['duplicate-actions'] ?? '';

  const persist = async (): Promise<void> => {
    setIsSaving(true);
    setError(null);
    try {
      const category = buildStoredCategory(trimmedName, withImage);
      await categoryOps.add(category);
      setDuplicateName(null);
      setSavedCategory(category);
      onClearDraft();
    } catch (err) {
      log.error('Failed to save category', err);
      setError('Could not save the category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!canSave) {
      return;
    }
    setError(null);
    // Duplicate-name check before saving: warn and let the user choose.
    try {
      const existing = await getCategoriesByName<StoredCategory>(trimmedName);
      if (existing.length > 0) {
        setDuplicateName(trimmedName);
        return;
      }
    } catch (err) {
      log.error('Duplicate-name check failed', err);
      // A failed lookup must not block saving; fall through to persist.
    }
    await persist();
  };

  const handleDownload = (): void => {
    if (validCount === 0) {
      return;
    }
    const json = serializeCategoryForExport({ name: trimmedName || 'category', slides: withImage });
    downloadTextFile(json, categoryToFileName(trimmedName || 'category'));
  };

  // Success view: confirmation + a link back to the Dashboard / Category Manager.
  if (savedCategory) {
    return (
      <div className={containerClass}>
        <div className={successClass} role="status">
          <h3>Saved to your library</h3>
          <p>
            <strong>{savedCategory.name}</strong> ({savedCategory.slides.length}{' '}
            {savedCategory.slides.length === 1 ? 'slide' : 'slides'}) is now playable. Manage it
            from the Dashboard via <em>Manage Categories</em>.
          </p>
          <div className={actionsClass}>
            <LinkButton to="/" variant="primary">
              Back to Dashboard
            </LinkButton>
            <Button variant="secondary" onClick={handleDownload}>
              Download JSON
            </Button>
          </div>
          <p className={noteClass}>
            To contribute this category to the repo, open a pull request adding the downloaded file
            to <code>public/categories/</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={summaryClass}>
        <h3>Review your category</h3>
        <ul className={summaryListClass}>
          <li>
            Name: <strong>{hasName ? trimmedName : '(unnamed)'}</strong>
          </li>
          <li>
            Slides with images: <strong>{validCount}</strong> of {slides.length}
          </li>
          <li>
            Slides with censor boxes: <strong>{censoredCount}</strong>
          </li>
        </ul>
      </div>

      {blankCount > 0 && validCount > 0 && (
        <p className={warningClass} role="alert">
          {blankCount} {blankCount === 1 ? 'slide has' : 'slides have'} no image and will be
          excluded from the saved category and the download. Go back to the Images step to generate
          them, or continue with the {validCount} completed {validCount === 1 ? 'slide' : 'slides'}.
        </p>
      )}

      {validCount === 0 && (
        <p className={blockedClass} role="alert">
          {hasName
            ? 'No slides have an image yet. Generate at least one image on the Images step before saving or downloading.'
            : 'Add a category name and generate at least one image before saving.'}
        </p>
      )}

      {error && (
        <p className={errorClass} role="alert">
          {error}
        </p>
      )}

      {duplicateName !== null ? (
        <div className={duplicateClass} role="alertdialog" aria-label="Duplicate category name">
          <p>
            A category named <strong>{duplicateName}</strong> already exists in your library. Save a
            second copy anyway, or go back and rename it.
          </p>
          <div className={duplicateActionsClass}>
            <Button
              variant="secondary"
              onClick={() => {
                setDuplicateName(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSaving}
              onClick={() => {
                void persist();
              }}
            >
              Save anyway
            </Button>
          </div>
        </div>
      ) : (
        <div className={actionsClass}>
          <Button
            variant="primary"
            disabled={!canSave}
            loading={isSaving}
            onClick={() => {
              void handleSave();
            }}
          >
            Save to library
          </Button>
          <Button variant="secondary" disabled={validCount === 0} onClick={handleDownload}>
            Download JSON
          </Button>
        </div>
      )}

      <p className={noteClass}>
        Saving adds the category to this browser&apos;s library so it&apos;s immediately playable.
        To contribute it to the repo, download the JSON and open a pull request adding the file to{' '}
        <code>public/categories/</code>.
      </p>
    </div>
  );
}
