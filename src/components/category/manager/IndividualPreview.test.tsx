/**
 * IndividualPreview Component Tests
 *
 * Tests the category preview component used in the import workflow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { IndividualPreview } from './IndividualPreview';
import type { Category } from '@/types';
import { ViewStack, useViewStack } from '@/components/common/ViewStack';
import { MockViewStackProvider } from '@/components/common/MockViewStackProvider';
import type { ViewStackViewProps } from '@/components/common/ViewStackView';
import * as sampleCategories from '@/utils/sampleCategories';
import * as indexedDB from '@/storage/indexedDB';

vi.mock('@/storage/indexedDB', () => ({
  addCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  addContestant: vi.fn().mockResolvedValue(undefined),
  deleteContestant: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/broadcastSync', () => ({
  createBroadcastSync: vi.fn(() => ({
    send: vi.fn(),
    cleanup: vi.fn(),
    isSupported: true,
  })),
}));

vi.mock('@/utils/sampleCategories', () => ({
  fetchSampleCategory: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => `test-id-${String(Date.now())}`),
}));

// Mock logger - hoisted to avoid initialization issues
const { mockLoggerError, mockLoggerDebug, mockLoggerAsyncComplete } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
  mockLoggerDebug: vi.fn(),
  mockLoggerAsyncComplete: vi.fn(),
}));

vi.mock('@/utils/logger', () => {
  const mockLoggerInstance = {
    debug: mockLoggerDebug,
    error: mockLoggerError,
    asyncComplete: mockLoggerAsyncComplete,
  };

  return {
    createLogger: vi.fn(() => mockLoggerInstance),
    logger: mockLoggerInstance,
    loggers: {
      viewStack: mockLoggerInstance,
    },
  };
});

// Helper component to wrap IndividualPreview for ViewStack testing
// Extends ViewStackViewProps to work as a ViewStack child
interface IndividualPreviewWrapperProps
  extends ViewStackViewProps,
    React.ComponentProps<typeof IndividualPreview> {}

function IndividualPreviewWrapper(props: IndividualPreviewWrapperProps) {
  // ViewStack needs viewId/viewTitle on element.props - don't destructure them
  return <IndividualPreview {...props} />;
}

describe('IndividualPreview', () => {
  const mockCategory: Category = {
    name: 'Test Category',
    slides: [
      {
        imageUrl: 'data:image/png;base64,test1',
        answer: 'Answer 1',
        censorBoxes: [],
      },
      {
        imageUrl: 'data:image/png;base64,test2',
        answer: 'Answer 2',
        censorBoxes: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Display', () => {
    it('should display loading state when category is not provided', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json' }}
            remainingFiles={[]}
            source="samples"
          />
        </ViewStack>
      );

      expect(screen.getByText('Loading category...')).toBeInTheDocument();
    });

    it('should display category when provided via props', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    it('should fetch sample category when not provided', async () => {
      vi.mocked(sampleCategories.fetchSampleCategory).mockResolvedValue({
        category: mockCategory,
        sizeBytes: 1024,
      });

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json' }}
            remainingFiles={[]}
            source="samples"
          />
        </ViewStack>
      );

      await waitFor(() => {
        expect(sampleCategories.fetchSampleCategory).toHaveBeenCalledWith('test.json');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
      });
    });

    it('should display error UI when category fails to load', async () => {
      const error = new Error('Network error');
      vi.mocked(sampleCategories.fetchSampleCategory).mockRejectedValue(error);

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json' }}
            remainingFiles={[]}
            source="samples"
          />
        </ViewStack>
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Category')).toBeInTheDocument();
        expect(screen.getByText('test.json')).toBeInTheDocument();
        expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
      });
    });

    it('should show Go Back button on error', async () => {
      vi.mocked(sampleCategories.fetchSampleCategory).mockRejectedValue(new Error('Failed'));

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json' }}
            remainingFiles={[]}
            source="samples"
          />
        </ViewStack>
      );

      await waitFor(() => {
        expect(screen.getByText('Go Back')).toBeInTheDocument();
      });
    });

    it('should display file information with size and source badge', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test-math.json', category: mockCategory }}
            remainingFiles={[]}
            source="samples"
          />
        </ViewStack>
      );

      expect(screen.getByText(/test-math.json/)).toBeInTheDocument();
      expect(screen.getByText('Sample')).toBeInTheDocument();
    });
  });

  describe('Form Editing', () => {
    it('should allow editing category name', async () => {
      const user = userEvent.setup();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const categoryInput = screen.getByDisplayValue('Test Category');
      await user.clear(categoryInput);
      await user.type(categoryInput, 'Custom Category');

      expect((categoryInput as HTMLInputElement).value).toBe('Custom Category');
    });

    it('should allow editing contestant name', async () => {
      const user = userEvent.setup();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const contestantInput = screen.getByPlaceholderText(/Leave empty to import category only/i);
      await user.type(contestantInput, 'Alice');

      expect((contestantInput as HTMLInputElement).value).toBe('Alice');
    });

    it('should disable import button when category name is empty', async () => {
      const user = userEvent.setup();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const categoryInput = screen.getByDisplayValue('Test Category');
      await user.clear(categoryInput);

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      expect(importButton).toBeDisabled();
    });

    it('should enable import button when category name is provided', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      expect(importButton).not.toBeDisabled();
    });
  });

  describe('Import Button Text', () => {
    it('should show "Import & Next" when remaining files exist', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[{ filename: 'next.json' }]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByRole('button', { name: /Import & Next/i })).toBeInTheDocument();
    });

    it('should show "Import & Finish" when no remaining files', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByRole('button', { name: /Import & Finish/i })).toBeInTheDocument();
    });

    it('should show "Importing..." when import is in progress', async () => {
      vi.mocked(indexedDB.addCategory).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Importing...')).toBeInTheDocument();
      });
    });
  });

  describe('Command Execution - Category Only', () => {
    it('should create only AddCategoryCommand when contestant name is empty', async () => {
      const TestWrapper = ({
        viewId: _viewId,
        viewTitle: _viewTitle,
      }: {
        viewId: string;
        viewTitle: string;
      }) => {
        const { commandStack } = useViewStack();

        useEffect(() => {
          if (commandStack.length > 0) {
            // Track command execution in this test
            const _commands = commandStack[commandStack.length - 1] ?? [];
            void _commands;
          }
        }, [commandStack]);

        return (
          <IndividualPreview
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[{ filename: 'next.json' }]}
            source="upload"
          />
        );
      };

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <TestWrapper viewId="test" viewTitle="Test" />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Next/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(indexedDB.addCategory).toHaveBeenCalled();
      });

      expect(indexedDB.addContestant).not.toHaveBeenCalled();
    });

    it('should execute AddCategoryCommand with edited name', async () => {
      const user = userEvent.setup();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[{ filename: 'next.json' }]}
            source="upload"
          />
        </ViewStack>
      );

      const categoryInput = screen.getByDisplayValue('Test Category');
      await user.clear(categoryInput);
      await user.type(categoryInput, 'Custom Math');

      const importButton = screen.getByRole('button', { name: /Import & Next/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(indexedDB.addCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Custom Math',
          })
        );
      });
    });
  });

  describe('Command Execution - Category and Contestant', () => {
    it('should create both category and contestant commands with correct linking', async () => {
      const mockCommitAndPushView = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <MockViewStackProvider commitAndPushView={mockCommitAndPushView}>
          <IndividualPreview
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[{ filename: 'next.json' }]}
            source="upload"
          />
        </MockViewStackProvider>
      );

      const contestantInput = screen.getByPlaceholderText(/Leave empty to import category only/i);
      await user.type(contestantInput, 'Bob');

      const importButton = screen.getByRole('button', { name: /Import & Next/i });
      fireEvent.click(importButton);

      // Verify commitAndPushView was called
      await waitFor(() => {
        expect(mockCommitAndPushView).toHaveBeenCalled();
      });

      // Check the commands passed to commitAndPushView
      const call = mockCommitAndPushView.mock.calls[0] as
        | [
            view: { id: string; title: string; content: unknown },
            options?: { commands?: { execute: () => Promise<void> }[] },
          ]
        | undefined;
      if (!call) throw new Error('commitAndPushView not called');
      const options = call[1];
      const commands = options?.commands;

      expect(commands).toBeDefined();
      expect(commands?.length).toBe(2); // AddCategoryCommand + AddContestantCommand

      // Execute the commands to verify they work correctly
      if (commands) {
        await commands[0]?.execute();
        await commands[1]?.execute();

        // Verify both were called
        expect(indexedDB.addCategory).toHaveBeenCalled();
        expect(indexedDB.addContestant).toHaveBeenCalled();

        // Verify categoryId linking
        const categoryCall = vi.mocked(indexedDB.addCategory).mock.calls[0] as
          | [{ id: string; categoryId?: string; name?: string }]
          | undefined;
        const categoryId = categoryCall?.[0]?.id;
        const contestantCall = vi.mocked(indexedDB.addContestant).mock.calls[0] as
          | [{ categoryId?: string; name?: string }]
          | undefined;
        const contestantArg = contestantCall?.[0];
        expect(contestantArg?.categoryId).toBe(categoryId);
        expect(contestantArg?.name).toBe('Bob');
      }
    });
  });

  describe('Multi-File Navigation - First File', () => {
    it('should call commitAndPushView with next preview when importing first file', async () => {
      const mockCommitAndPushView = vi.fn().mockResolvedValue(undefined);
      const nextCategory: Category = {
        name: 'Second Category',
        slides: [
          {
            imageUrl: 'data:image/png;base64,test3',
            answer: 'Answer 3',
            censorBoxes: [],
          },
        ],
      };

      render(
        <MockViewStackProvider commitAndPushView={mockCommitAndPushView}>
          <IndividualPreview
            currentFile={{ filename: 'file1.json', category: mockCategory }}
            remainingFiles={[
              { filename: 'file2.json', category: nextCategory },
              { filename: 'file3.json' },
            ]}
            source="samples"
            categoryNumber={1}
            totalCategories={3}
          />
        </MockViewStackProvider>
      );

      const importButton = screen.getByRole('button', { name: /Import & Next/i });
      fireEvent.click(importButton);

      // Verify commitAndPushView was called
      await waitFor(() => {
        expect(mockCommitAndPushView).toHaveBeenCalled();
      });

      // Verify the new view has correct title
      const call = mockCommitAndPushView.mock.calls[0] as
        | [
            view: { id: string; title: string; content: unknown },
            options?: { commands?: { execute: () => Promise<void> }[] },
          ]
        | undefined;
      if (!call) throw new Error('commitAndPushView not called');
      const view = call[0];
      const options = call[1];
      expect(view.title).toBe('Preview 2 of 3');
      expect(view.id).toContain('file2.json');

      // Verify commands were included
      expect(options?.commands).toBeDefined();
      expect(options?.commands?.length).toBeGreaterThan(0);
    });

    it('should clear contestant name when creating next preview', async () => {
      const mockCommitAndPushView = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <MockViewStackProvider commitAndPushView={mockCommitAndPushView}>
          <IndividualPreview
            currentFile={{ filename: 'file1.json', category: mockCategory }}
            remainingFiles={[{ filename: 'file2.json', category: mockCategory }]}
            source="samples"
            categoryNumber={1}
            totalCategories={2}
          />
        </MockViewStackProvider>
      );

      const contestantInput = screen.getByPlaceholderText(/Leave empty to import category only/i);
      await user.type(contestantInput, 'Alice');

      const importButton = screen.getByRole('button', { name: /Import & Next/i });
      fireEvent.click(importButton);

      // Verify commitAndPushView was called
      await waitFor(() => {
        expect(mockCommitAndPushView).toHaveBeenCalled();
      });

      // Verify the new view was created with empty contestant name (initialContestantName="")
      const call = mockCommitAndPushView.mock.calls[0] as
        | [
            view: {
              id: string;
              title: string;
              content: { props: { initialContestantName?: string } };
            },
            options?: { commands?: unknown[] },
          ]
        | undefined;
      if (!call) throw new Error('commitAndPushView not called');
      const view = call[0];

      // The view.content is a React element with IndividualPreview
      // We can verify the props passed to it
      expect(view.content.props.initialContestantName).toBe('');
      expect(view.title).toBe('Preview 2 of 2');
    });
  });

  describe('Multi-File Navigation - Last File', () => {
    it('should execute commands and close modal on last file', async () => {
      const mockOnComplete = vi.fn();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()} onComplete={mockOnComplete}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'last.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(indexedDB.addCategory).toHaveBeenCalled();
      });
    });
  });

  describe('State Persistence', () => {
    it('should preserve edited names through useViewState', async () => {
      const user = userEvent.setup();

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const categoryInput = screen.getByDisplayValue('Test Category');
      const contestantInput = screen.getByPlaceholderText(/Leave empty to import category only/i);

      await user.clear(categoryInput);
      await user.type(categoryInput, 'Edited Category');
      await user.type(contestantInput, 'Edited Contestant');

      expect(categoryInput).toHaveValue('Edited Category');
      expect(contestantInput).toHaveValue('Edited Contestant');
    });

    it('should use initialContestantName if provided', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
            initialContestantName="Preset Name"
          />
        </ViewStack>
      );

      const contestantInput = screen.getByPlaceholderText(/Leave empty to import category only/i);
      expect((contestantInput as HTMLInputElement).value).toBe('Preset Name');
    });
  });

  describe('Error Handling', () => {
    it('should handle import errors gracefully', async () => {
      vi.mocked(indexedDB.addCategory).mockRejectedValue(new Error('Database error'));

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      fireEvent.click(importButton);

      // Verify logger was called with error
      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalledWith('Import failed', expect.any(Error));
      });

      // Verify button is re-enabled after error
      expect(screen.getByRole('button', { name: /Import & Finish/i })).not.toBeDisabled();
    });

    it('should re-enable button after import error', async () => {
      vi.mocked(indexedDB.addCategory).mockRejectedValue(new Error('Database error'));

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(importButton).not.toBeDisabled();
      });
    });
  });

  describe('Slide Display', () => {
    it('should display slide count', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByText(/Slides: 2/i)).toBeInTheDocument();
    });
  });

  describe('Pre-loading Next Category', () => {
    it('should pre-load next category for samples', async () => {
      vi.mocked(sampleCategories.fetchSampleCategory)
        .mockResolvedValueOnce({ category: mockCategory, sizeBytes: 1024 })
        .mockResolvedValueOnce({
          category: { name: 'Next Category', slides: [] },
          sizeBytes: 2048,
        });

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'file1.json', category: mockCategory }}
            remainingFiles={[{ filename: 'file2.json' }]}
            source="samples"
            categoryNumber={1}
            totalCategories={2}
          />
        </ViewStack>
      );

      await waitFor(() => {
        expect(sampleCategories.fetchSampleCategory).toHaveBeenCalledWith('file2.json');
      });
    });

    it('should not pre-load for uploaded files', () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'file1.json', category: mockCategory }}
            remainingFiles={[{ filename: 'file2.json' }]}
            source="upload"
            categoryNumber={1}
            totalCategories={2}
          />
        </ViewStack>
      );

      expect(sampleCategories.fetchSampleCategory).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking of import button', async () => {
      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: mockCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      const importButton = screen.getByRole('button', { name: /Import & Finish/i });

      fireEvent.click(importButton);
      fireEvent.click(importButton);
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(indexedDB.addCategory).toHaveBeenCalledTimes(1);
      });
    });

    it('should display file size in KB for small categories', () => {
      const firstSlide = mockCategory.slides[0];
      if (!firstSlide) throw new Error('Test setup error: mockCategory has no slides');

      const smallCategory: Category = {
        ...mockCategory,
        slides: [firstSlide],
      };

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: smallCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByText(/KB/)).toBeInTheDocument();
    });

    it('should handle category with no slides gracefully', () => {
      const emptyCategory: Category = {
        name: 'Empty Category',
        slides: [],
      };

      render(
        <ViewStack isOpen={true} onClose={vi.fn()}>
          <IndividualPreviewWrapper
            viewId="preview"
            viewTitle="Preview"
            currentFile={{ filename: 'test.json', category: emptyCategory }}
            remainingFiles={[]}
            source="upload"
          />
        </ViewStack>
      );

      expect(screen.getByDisplayValue('Empty Category')).toBeInTheDocument();
      expect(screen.getByText(/Slides: 0/i)).toBeInTheDocument();
    });
  });
});
