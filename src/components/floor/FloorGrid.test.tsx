/**
 * Tests for FloorGrid component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Contestant } from '@types';
import { FloorGrid } from './FloorGrid';

describe('FloorGrid', () => {
  it('renders grid with correct dimensions (5x9 = 45 squares)', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'],
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(45); // 5 rows × 9 cols
  });

  it('renders empty grid when no contestants positioned', () => {
    const contestants: Contestant[] = [];

    render(<FloorGrid contestants={contestants} />);

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();

    const gridCells = screen.getAllByRole('gridcell');
    expect(gridCells).toHaveLength(45);
  });

  it('displays contestant name on their controlled square', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['2-3'],
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays multiple contestants with their territories', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0', '0-1'],
      },
      {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-0'],
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    // Alice controls 2 squares, name may appear on one or both (based on centroid logic)
    const aliceLabels = screen.getAllByText('Alice');
    expect(aliceLabels.length).toBeGreaterThan(0);

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('sets data-owner attribute for owned squares', () => {
    const contestants: Contestant[] = [
      {
        id: 'contestant-1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['0-0'],
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    const ownedSquare = screen.getByLabelText(/Square 0-0 owned by Alice/i);
    expect(ownedSquare).toHaveAttribute('data-owner', 'contestant-1');
  });

  it('renders accessibility attributes correctly', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        controlledSquares: ['1-2'],
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', 'The Floor game board');

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(5);
  });

  it('handles contestants with no controlled squares', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 0,
        eliminated: false,
        // controlledSquares omitted (optional)
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    // Should render grid but Alice's name won't appear
    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('handles eliminated contestants still controlling squares', () => {
    const contestants: Contestant[] = [
      {
        id: '1',
        name: 'Alice',
        category: { name: 'Math', slides: [] },
        wins: 3,
        eliminated: false,
        controlledSquares: ['0-0', '0-1', '1-0', '1-1'],
      },
      {
        id: '2',
        name: 'Bob',
        category: { name: 'Science', slides: [] },
        wins: 0,
        eliminated: true,
        controlledSquares: [], // Lost all squares
      },
    ];

    render(<FloorGrid contestants={contestants} />);

    // Alice controls 4 squares, name may appear on multiple (based on centroid logic)
    const aliceLabels = screen.getAllByText('Alice');
    expect(aliceLabels.length).toBeGreaterThan(0);

    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});
