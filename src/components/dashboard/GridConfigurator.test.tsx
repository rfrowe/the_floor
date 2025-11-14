/**
 * Tests for GridConfigurator component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridConfigurator } from './GridConfigurator';
import type { Contestant } from '@types';

const createMockContestant = (
  id: string,
  name: string,
  controlledSquares?: string[]
): Contestant => {
  const contestant: Contestant = {
    id,
    name,
    category: { name: 'Test', slides: [] },
    wins: 0,
    eliminated: false,
  };
  if (controlledSquares) {
    contestant.controlledSquares = controlledSquares;
  }
  return contestant;
};

describe('GridConfigurator', () => {
  it('renders grid dimensions section', () => {
    const contestants: Contestant[] = [];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    expect(screen.getByText('Grid Dimensions')).toBeInTheDocument();
    expect(screen.getByLabelText(/Rows:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Columns:/)).toBeInTheDocument();
  });

  it('displays current grid configuration', () => {
    const contestants: Contestant[] = [];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    expect(screen.getByText(/Current: 5 rows × 9 cols = 45 squares/)).toBeInTheDocument();
  });

  it('allows editing grid dimensions', () => {
    const contestants: Contestant[] = [];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    // Click Edit Dimensions button
    const editButton = screen.getByRole('button', { name: /Edit Dimensions/ });
    fireEvent.click(editButton);

    // Check that inputs are enabled
    const rowsInput = screen.getByLabelText(/Rows:/);
    const colsInput = screen.getByLabelText(/Columns:/);

    expect(rowsInput).toHaveProperty('disabled', false);
    expect(colsInput).toHaveProperty('disabled', false);
  });

  it('shows Apply and Cancel buttons when editing', () => {
    const contestants: Contestant[] = [];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    const editButton = screen.getByRole('button', { name: /Edit Dimensions/ });
    fireEvent.click(editButton);

    expect(screen.getByRole('button', { name: /Apply/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
  });

  it('displays positioned contestants in grid preview when expanded', () => {
    const contestants: Contestant[] = [
      createMockContestant('1', 'Alice', ['0-0']),
      createMockContestant('2', 'Bob', ['0-1']),
    ];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    // Grid starts collapsed when all contestants positioned - need to expand
    const expandButton = screen.getByRole('button', { name: /Expand/ });
    fireEvent.click(expandButton);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('displays unpositioned contestants list', () => {
    const contestants: Contestant[] = [
      createMockContestant('1', 'Alice', ['0-0']),
      createMockContestant('2', 'Bob'),
      createMockContestant('3', 'Charlie'),
    ];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    expect(screen.getByText('Unpositioned Contestants')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('validates grid has enough space for positioned contestants', () => {
    const contestants: Contestant[] = [
      createMockContestant('1', 'Alice', ['0-0']),
      createMockContestant('2', 'Bob', ['0-1']),
      createMockContestant('3', 'Charlie', ['1-0']),
    ];
    const onUpdate = vi.fn();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {
      // Mock implementation
    });

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    // Expand first since all contestants are positioned
    const expandButton = screen.getByRole('button', { name: /Expand/ });
    fireEvent.click(expandButton);

    const editButton = screen.getByRole('button', { name: /Edit Dimensions/ });
    fireEvent.click(editButton);

    // Try to change to 1x1 (only 1 square, but 3 contestants positioned)
    const rowsInput = screen.getByLabelText(/Rows:/);
    const colsInput = screen.getByLabelText(/Columns:/);
    fireEvent.change(rowsInput, { target: { value: '1' } });
    fireEvent.change(colsInput, { target: { value: '1' } });

    const applyButton = screen.getByRole('button', { name: /Apply/ });
    fireEvent.click(applyButton);

    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Grid too small!'));
    alertMock.mockRestore();
  });

  it('removes button calls onUpdateContestants', () => {
    const contestants: Contestant[] = [createMockContestant('1', 'Alice', ['0-0'])];
    const onUpdate = vi.fn().mockResolvedValue(undefined);

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    // Expand first since all contestants are positioned
    const expandButton = screen.getByRole('button', { name: /Expand/ });
    fireEvent.click(expandButton);

    // Find and click the remove button (×) by title attribute
    const removeButton = screen.getByTitle('Remove from grid');
    fireEvent.click(removeButton);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: '1',
          name: 'Alice',
        }),
      ])
    );
  });

  it('shows grid preview with correct dimensions', () => {
    const contestants: Contestant[] = [];
    const onUpdate = vi.fn();

    render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

    // Should have 5 rows x 9 cols = 45 squares by default
    const gridContainer = screen.getByText('Contestant Positions (Drag & Drop)').parentElement;
    expect(gridContainer).toBeInTheDocument();
  });

  describe('Collapsible behavior', () => {
    it('renders with expand/collapse button', () => {
      const contestants: Contestant[] = [];
      const onUpdate = vi.fn();

      render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

      const toggleButton = screen.getByRole('button', { name: /Collapse|Expand/ });
      expect(toggleButton).toBeInTheDocument();
    });

    it('starts expanded when contestants are unpositioned', () => {
      const contestants: Contestant[] = [
        createMockContestant('1', 'Alice'), // No controlledSquares
        createMockContestant('2', 'Bob'),
      ];
      const onUpdate = vi.fn();

      render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

      // Should show content (Grid Dimensions section)
      expect(screen.getByText('Grid Dimensions')).toBeInTheDocument();
      const toggleButton = screen.getByRole('button', { name: /Collapse/ });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('starts collapsed when all contestants are positioned', () => {
      const contestants: Contestant[] = [
        createMockContestant('1', 'Alice', ['0-0']),
        createMockContestant('2', 'Bob', ['0-1']),
      ];
      const onUpdate = vi.fn();

      render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

      // Should NOT show content initially
      expect(screen.queryByText('Grid Dimensions')).not.toBeInTheDocument();
      const toggleButton = screen.getByRole('button', { name: /Expand/ });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('toggles expanded state when button clicked', () => {
      const contestants: Contestant[] = [
        createMockContestant('1', 'Alice', ['0-0']),
        createMockContestant('2', 'Bob', ['0-1']),
      ];
      const onUpdate = vi.fn();

      render(<GridConfigurator contestants={contestants} onUpdateContestants={onUpdate} />);

      // Start collapsed
      expect(screen.queryByText('Grid Dimensions')).not.toBeInTheDocument();

      // Click to expand
      const expandButton = screen.getByRole('button', { name: /Expand/ });
      fireEvent.click(expandButton);

      // Should now show content
      expect(screen.getByText('Grid Dimensions')).toBeInTheDocument();
      const collapseButton = screen.getByRole('button', { name: /Collapse/ });
      expect(collapseButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      fireEvent.click(collapseButton);

      // Should hide content again
      expect(screen.queryByText('Grid Dimensions')).not.toBeInTheDocument();
    });
  });
});
