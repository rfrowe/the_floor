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
    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    // Check for the drop zone elements
    expect(screen.getByText(/Drag & drop category files here/i)).toBeInTheDocument();

    // Check for file input element
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.json,application/json');
  });

  it('should accept JSON file and parse category', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test-category.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });
  });

  it('should display validation error for invalid JSON', async () => {
    const user = userEvent.setup();
    const invalidJson = 'not valid json{';
    const file = createMockFile(invalidJson, 'invalid.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to parse JSON/i);
    });
  });

  it('should display validation error for missing category data', async () => {
    const user = userEvent.setup();
    const invalidCategory = JSON.stringify({ name: 'Test', slides: [] });
    const file = createMockFile(invalidCategory, 'invalid.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/category/i);
    });
  });

  it('should allow editing contestant name', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Contestant Name/i)).toBeInTheDocument();
    });

    const contestantInput = container.querySelector('#contestant-name-input') as HTMLInputElement;
    await user.clear(contestantInput);
    await user.type(contestantInput, 'Bob');

    expect(contestantInput.value).toBe('Bob');
  });

  it('should allow editing category name', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Category Name/i)).toBeInTheDocument();
    });

    const categoryInput = container.querySelector('#category-name-input') as HTMLInputElement;
    await user.clear(categoryInput);
    await user.type(categoryInput, 'New Category');

    expect(categoryInput.value).toBe('New Category');
  });

  it('should call onImport with correct data when import button clicked', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Contestant Name/i)).toBeInTheDocument();
    });

    const contestantInput = container.querySelector('#contestant-name-input') as HTMLInputElement;
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

  it('should show loading state while parsing file', async () => {
    const user = userEvent.setup();
    const jsonContent = JSON.stringify({ category: validCategory });
    const file = createMockFile(jsonContent, 'test.json');

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Contestant Name/i)).toBeInTheDocument();
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

    const { container } = render(
      <CategoryImporter onImport={mockOnImport} onCancel={mockOnCancel} />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Slides: 3/i)).toBeInTheDocument();
    });
  });
});
