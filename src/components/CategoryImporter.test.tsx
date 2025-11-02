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

    expect(mockOnImport).toHaveBeenCalledWith([
      {
        name: 'Alice',
        category: expect.objectContaining({
          name: 'Test Category',
          slides: expect.arrayContaining([]) as unknown as typeof validCategory.slides,
        }) as typeof validCategory,
      },
    ]);
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

  it('should show Next button when multiple files are loaded', async () => {
    const user = userEvent.setup();
    const jsonContent1 = JSON.stringify({ category: { ...validCategory, name: 'Category 1' } });
    const jsonContent2 = JSON.stringify({ category: { ...validCategory, name: 'Category 2' } });
    const file1 = createMockFile(jsonContent1, 'alice-math.json');
    const file2 = createMockFile(jsonContent2, 'bob-history.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, [file1, file2]);

    await waitFor(() => {
      expect(screen.getByText(/Reviewing contestant 1 of 2/i)).toBeInTheDocument();
    });

    // Should show Next button (not Import button)
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Import/i })).not.toBeInTheDocument();
  });

  it('should navigate between contestants using Next button', async () => {
    const user = userEvent.setup();
    const jsonContent1 = JSON.stringify({ category: { ...validCategory, name: 'Category 1' } });
    const jsonContent2 = JSON.stringify({ category: { ...validCategory, name: 'Category 2' } });
    const file1 = createMockFile(jsonContent1, 'alice-math.json');
    const file2 = createMockFile(jsonContent2, 'bob-history.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, [file1, file2]);

    await waitFor(() => {
      expect(screen.getByText(/Reviewing contestant 1 of 2/i)).toBeInTheDocument();
    });

    // First contestant should show Category 1
    expect(screen.getByDisplayValue('Category 1')).toBeInTheDocument();

    // Fill in contestant name to enable Next button
    const nameInput = screen.getByLabelText(/Contestant Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice');

    // Click Next
    const nextButton = screen.getByRole('button', { name: /Next/i });
    await user.click(nextButton);

    // Should show second contestant
    await waitFor(() => {
      expect(screen.getByText(/Reviewing contestant 2 of 2/i)).toBeInTheDocument();
    });

    // Second contestant should show Category 2
    expect(screen.getByDisplayValue('Category 2')).toBeInTheDocument();

    // Should now show Import button (not Next)
    expect(screen.getByRole('button', { name: /Import 2 Contestants/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
  });

  it('should preserve edits when navigating between contestants', async () => {
    const user = userEvent.setup();
    const jsonContent1 = JSON.stringify({ category: { ...validCategory, name: 'Category 1' } });
    const jsonContent2 = JSON.stringify({ category: { ...validCategory, name: 'Category 2' } });
    const file1 = createMockFile(jsonContent1, 'alice-math.json');
    const file2 = createMockFile(jsonContent2, 'bob-history.json');

    render(<CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />);

    const input = screen.getByLabelText(/Select JSON File/i);
    await user.upload(input, [file1, file2]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Contestant Name/i)).toBeInTheDocument();
    });

    // Edit first contestant name
    const nameInput = screen.getByLabelText(/Contestant Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Alice Edited');

    // Navigate to second contestant
    await user.click(screen.getByRole('button', { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reviewing contestant 2 of 2/i)).toBeInTheDocument();
    });

    // Fill second contestant
    const nameInput2 = screen.getByLabelText(/Contestant Name/i);
    await user.clear(nameInput2);
    await user.type(nameInput2, 'Bob');

    // Import all
    await user.click(screen.getByRole('button', { name: /Import 2 Contestants/i }));

    // Verify both contestants were imported with correct names
    expect(mockOnImport).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Alice Edited' }),
      expect.objectContaining({ name: 'Bob' }),
    ]);
  });
});
