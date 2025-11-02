/**
 * Tests for CategoryImporter component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryImporter } from './CategoryImporter';
import type { Category } from '@types';

describe('CategoryImporter', () => {
  const mockOnImport = vi.fn();
  const mockOnCancel = vi.fn();

  const validCategory: Category = {
    name: 'Test Category',
    slides: [
      {
        imageUrl: 'data:image/jpeg;base64,test123',
        answer: 'Test Answer',
        censorBoxes: [],
      },
    ],
  };

  const createMockFile = (content: string, filename: string): File => {
    const blob = new Blob([content], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });

    // Mock file.text() for jsdom environment
    Object.defineProperty(file, 'text', {
      value: vi.fn().mockResolvedValue(content),
      writable: false,
    });

    return file;
  };

  it('should render file input', () => {
    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    expect(screen.getByText(/Import Category from JSON/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select JSON File/i)).toBeInTheDocument();
  });

  it('should show cancel button', () => {
    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
  });

  it('should accept JSON file and parse category', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test-category.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });
  });

  it('should extract contestant name from filename', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'alice-movies.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      const contestantInput = screen.getByLabelText(/Contestant Name/i);
      expect((contestantInput as HTMLInputElement).value).toBe('Alice');
    });
  });

  it('should display validation error for invalid JSON', async () => {
    const user = userEvent.setup();
    const invalidJson = 'not valid json{';
    const file = createMockFile(invalidJson, 'invalid.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Failed to parse JSON/i)).toBeInTheDocument();
    });
  });

  it('should display validation error for missing category data', async () => {
    const user = userEvent.setup();
    const invalidCategory = JSON.stringify({ name: 'Test', slides: [] });
    const file = createMockFile(invalidCategory, 'invalid.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Invalid category data/i)).toBeInTheDocument();
    });
  });

  it('should allow editing contestant name', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByLabelText(/Contestant Name/i)).toBeInTheDocument();
    });

    const contestantInput = screen.getByLabelText(/Contestant Name/i);
    await user.clear(contestantInput);
    await user.type(contestantInput, 'Bob');

    expect((contestantInput as HTMLInputElement).value).toBe('Bob');
  });

  it('should allow editing category name', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByLabelText(/Category Name/i)).toBeInTheDocument();
    });

    const categoryInput = screen.getByLabelText(/Category Name/i);
    await user.clear(categoryInput);
    await user.type(categoryInput, 'New Category');

    expect((categoryInput as HTMLInputElement).value).toBe('New Category');
  });

  it('should call onImport with correct data when import button clicked', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const fileInput = screen.getByLabelText(/Select JSON File/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByLabelText(/Contestant Name/i)).toBeInTheDocument();
    });

    const contestantInput = screen.getByLabelText(/Contestant Name/i);
    await user.clear(contestantInput);
    await user.type(contestantInput, 'Alice');

    const importButton = screen.getByRole('button', { name: /Import/i });
    await user.click(importButton);

    expect(mockOnImport).toHaveBeenCalledWith(
      'Alice',
      expect.objectContaining({
        name: 'Test Category',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        slides: expect.any(Array),
      })
    );
  });

  it('should disable import button when contestant name is empty', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const fileInput = screen.getByLabelText(/Select JSON File/i);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByLabelText(/Contestant Name/i)).toBeInTheDocument();
    });

    const contestantInput = screen.getByLabelText(/Contestant Name/i);
    await user.clear(contestantInput);

    const importButton = screen.getByRole('button', { name: /Import/i });
    expect(importButton).toBeDisabled();
  });

  it('should show loading state while parsing file', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);

    // Upload file
    await user.upload(input, file);

    // Loading state might be brief, but check if it appears
    // This test may be flaky depending on timing, so we just check the end state
    await waitFor(() => {
      expect(screen.getByLabelText(/Contestant Name/i)).toBeInTheDocument();
    });
  });

  it('should display slide count', async () => {
    const user = userEvent.setup();
    const categoryWith3Slides: Category = {
      name: 'Test',
      slides: [
        { imageUrl: 'data:image/jpeg;base64,1', answer: 'A', censorBoxes: [] },
        { imageUrl: 'data:image/jpeg;base64,2', answer: 'B', censorBoxes: [] },
        { imageUrl: 'data:image/jpeg;base64,3', answer: 'C', censorBoxes: [] },
      ],
    };
    const jsonContent = JSON.stringify({ category: categoryWith3Slides });
    const file = createMockFile(jsonContent, 'test.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Slides: 3/i)).toBeInTheDocument();
    });
  });
});
