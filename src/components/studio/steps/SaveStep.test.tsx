/**
 * Tests for SaveStep — the final wizard step.
 *
 * Covers the Task 60 acceptance criteria for the UI:
 *  - Save calls `useCategories().add` with a StoredCategory and then clears the
 *    draft (via the injected `onClearDraft`), showing a success confirmation.
 *  - A duplicate name (a non-empty `getCategoriesByName` result) warns first and
 *    only saves on an explicit "Save anyway".
 *  - Download triggers a Blob download (`URL.createObjectURL` mocked) whose JSON
 *    is the import-compatible `{ category: { name, slides } }` envelope.
 *  - Blank-image slides are excluded from the save/export, the count is
 *    surfaced, and saving is blocked when no slide has an image.
 *
 * `useCategories` and `getCategoriesByName` are mocked — no real IndexedDB.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { Slide, StoredCategory } from '@types';
import { SaveStep } from './SaveStep';
import { useCategories } from '@hooks/useCategories';
import { getCategoriesByName } from '@storage/indexedDB';

type AddFn = (category: StoredCategory) => Promise<void>;

vi.mock('@hooks/useCategories', () => ({
  useCategories: vi.fn(),
}));

vi.mock('@storage/indexedDB', async () => {
  const actual = await vi.importActual<typeof import('@storage/indexedDB')>('@storage/indexedDB');
  return { ...actual, getCategoriesByName: vi.fn() };
});

const useCategoriesMock = vi.mocked(useCategories);
const getCategoriesByNameMock = vi.mocked(getCategoriesByName);

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function slide(answer: string, imageUrl = IMAGE): Slide {
  return { imageUrl, answer, censorBoxes: [] };
}

let addMock: ReturnType<typeof vi.fn<AddFn>>;

function setCategories(): void {
  addMock = vi.fn<AddFn>(() => Promise.resolve());
  useCategoriesMock.mockReturnValue([
    [],
    {
      add: addMock,
      addBulk: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      removeAll: vi.fn(),
      refresh: vi.fn(),
    },
  ]);
}

function renderStep(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  setCategories();
  getCategoriesByNameMock.mockReset();
  getCategoriesByNameMock.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('SaveStep', () => {
  it('summarizes the category (name, image count, censor count)', () => {
    const slides = [
      { ...slide('A'), censorBoxes: [{ x: 1, y: 1, width: 1, height: 1, color: '#000' }] },
      slide('B'),
      slide('C', ''), // blank
    ];
    renderStep(<SaveStep categoryName="Cryptids" slides={slides} onClearDraft={vi.fn()} />);

    expect(screen.getByText('Cryptids')).toBeInTheDocument();
    // 2 of 3 slides have images; 1 has censor boxes.
    expect(screen.getByText(/Slides with images:/i)).toHaveTextContent('2');
    expect(screen.getByText(/Slides with censor boxes:/i)).toHaveTextContent('1');
  });

  it('saves to the library and clears the draft on success', async () => {
    const user = userEvent.setup();
    const onClearDraft = vi.fn();
    renderStep(
      <SaveStep
        categoryName="Cryptids"
        slides={[slide('A'), slide('B')]}
        onClearDraft={onClearDraft}
      />
    );

    await user.click(screen.getByRole('button', { name: /Save to library/i }));

    await waitFor(() => {
      expect(addMock).toHaveBeenCalledTimes(1);
    });
    const saved = addMock.mock.calls[0]?.[0] as StoredCategory;
    expect(saved.name).toBe('Cryptids');
    expect(saved.slides).toHaveLength(2);
    expect(saved.id).toBeTruthy();
    expect(saved.thumbnailUrl).toBe(IMAGE);

    expect(onClearDraft).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Saved to your library/i)).toBeInTheDocument();
  });

  it('warns on a duplicate name and only saves after "Save anyway"', async () => {
    const user = userEvent.setup();
    getCategoriesByNameMock.mockResolvedValue([
      { id: 'existing', name: 'Cryptids', slides: [], createdAt: '', thumbnailUrl: '' },
    ]);
    renderStep(<SaveStep categoryName="Cryptids" slides={[slide('A')]} onClearDraft={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Save to library/i }));

    // Warned, not yet saved.
    expect(await screen.findByText(/already exists in your library/i)).toBeInTheDocument();
    expect(addMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Save anyway/i }));
    await waitFor(() => {
      expect(addMock).toHaveBeenCalledTimes(1);
    });
  });

  it('lets the user cancel the duplicate-name prompt without saving', async () => {
    const user = userEvent.setup();
    getCategoriesByNameMock.mockResolvedValue([
      { id: 'existing', name: 'Cryptids', slides: [], createdAt: '', thumbnailUrl: '' },
    ]);
    renderStep(<SaveStep categoryName="Cryptids" slides={[slide('A')]} onClearDraft={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Save to library/i }));
    expect(await screen.findByText(/already exists in your library/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/already exists in your library/i)).not.toBeInTheDocument();
    });
    expect(addMock).not.toHaveBeenCalled();
  });

  it('downloads import-compatible JSON with the slugified filename', async () => {
    const user = userEvent.setup();
    // jsdom does not implement Blob#text(); polyfill it so we can read the blob.
    if (typeof Blob.prototype.text !== 'function') {
      Object.defineProperty(Blob.prototype, 'text', {
        configurable: true,
        writable: true,
        value(this: Blob): Promise<string> {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(typeof reader.result === 'string' ? reader.result : '');
            };
            reader.onerror = () => {
              reject(reader.error ?? new Error('read failed'));
            };
            reader.readAsText(this);
          });
        },
      });
    }
    const capturedBlobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob): string => {
      capturedBlobs.push(blob);
      return 'blob:fake';
    });
    const revokeObjectURL = vi.fn((_url: string): void => undefined);
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    let downloadName = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadName = this.download;
    });

    renderStep(
      <SaveStep
        categoryName="The Real Housewives"
        slides={[slide('A'), slide('B', '')]}
        onClearDraft={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Download JSON/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloadName).toBe('the-real-housewives.json');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    // The blob JSON must be the import-compatible envelope, with the blank slide excluded.
    const blob = capturedBlobs[0];
    if (!blob) {
      throw new Error('expected a blob to be created');
    }
    const text = await blob.text();
    const parsed = JSON.parse(text) as { category: { name: string; slides: Slide[] } };
    expect(parsed.category.name).toBe('The Real Housewives');
    expect(parsed.category.slides).toHaveLength(1);
    expect(parsed.category.slides[0]?.answer).toBe('A');
  });

  it('surfaces the blank-slide count and excludes blanks from the save', async () => {
    const user = userEvent.setup();
    renderStep(
      <SaveStep
        categoryName="Cryptids"
        slides={[slide('A'), slide('B', ''), slide('C', '')]}
        onClearDraft={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/2 slides have no image/i);

    await user.click(screen.getByRole('button', { name: /Save to library/i }));
    await waitFor(() => {
      expect(addMock).toHaveBeenCalledTimes(1);
    });
    const saved = addMock.mock.calls[0]?.[0] as StoredCategory;
    // Only the slide with a real image is saved.
    expect(saved.slides).toHaveLength(1);
    expect(saved.slides[0]?.answer).toBe('A');
  });

  it('blocks saving when no slide has an image', () => {
    renderStep(
      <SaveStep
        categoryName="Cryptids"
        slides={[slide('A', ''), slide('B', '')]}
        onClearDraft={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Save to library/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Download JSON/i })).toBeDisabled();
    expect(screen.getByText(/No slides have an image yet/i)).toBeInTheDocument();
  });
});
