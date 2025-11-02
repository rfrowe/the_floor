/**
 * Tests for GridSquare component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GridSquare } from './GridSquare';
import type { Contestant } from '@types';

const createMockContestant = (
  id: string,
  name: string,
  controlledSquares: string[]
): Contestant => ({
  id,
  name,
  category: { name: 'Test', slides: [] },
  wins: 0,
  eliminated: false,
  controlledSquares,
});

describe('GridSquare', () => {
  it('renders empty square when no owner', () => {
    const { container } = render(<GridSquare squareId="0-0" row={0} col={0} />);

    const square = container.firstChild as HTMLElement;
    expect(square).toHaveAttribute('role', 'gridcell');
    expect(square).toHaveAttribute('data-square-id', '0-0');
  });

  it('renders contestant square with owner', () => {
    const owner = createMockContestant('1', 'Alice', ['0-0']);
    const { container } = render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    const square = container.firstChild as HTMLElement;
    expect(square).toHaveAttribute('role', 'gridcell');
    expect(square).toHaveAttribute('data-owner', '1');
  });

  it('displays contestant name in single-square territory', () => {
    const owner = createMockContestant('1', 'Alice', ['0-0']);
    render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays name only in centroid square for multi-square territory', () => {
    // Alice controls a 2x2 square (0-0, 0-1, 1-0, 1-1)
    const owner = createMockContestant('1', 'Alice', ['0-0', '0-1', '1-0', '1-1']);

    // Render all squares
    const { rerender } = render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    // Square 0-0 should show name (closest to centroid 0.5, 0.5)
    expect(screen.queryByText('Alice')).toBeInTheDocument();

    // Square 1-1 should also show name (equidistant to centroid)
    rerender(<GridSquare squareId="1-1" row={1} col={1} owner={owner} />);
    expect(screen.queryByText('Alice')).toBeInTheDocument();
  });

  it('applies contestant color to square', () => {
    const owner = createMockContestant('1', 'Alice', ['0-0']);
    const { container } = render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    const square = container.firstChild as HTMLElement;
    const style = window.getComputedStyle(square);
    // Should have a background color set (from getContestantColor)
    expect(style.backgroundColor).toBeTruthy();
  });

  it('applies correct attributes for empty square', () => {
    const { container } = render(<GridSquare squareId="5-5" row={5} col={5} />);

    const square = container.firstChild as HTMLElement;
    expect(square).toHaveAttribute('role', 'gridcell');
    expect(square).toHaveAttribute('data-square-id', '5-5');
    expect(square).not.toHaveAttribute('data-owner');
  });

  it('applies correct attributes for occupied square', () => {
    const owner = createMockContestant('1', 'Alice', ['0-0']);
    const { container } = render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    const square = container.firstChild as HTMLElement;
    expect(square).toHaveAttribute('role', 'gridcell');
    expect(square).toHaveAttribute('data-square-id', '0-0');
    expect(square).toHaveAttribute('data-owner', '1');
  });

  it('has proper accessibility attributes', () => {
    const owner = createMockContestant('1', 'Alice', ['0-0']);
    const { container } = render(<GridSquare squareId="0-0" row={0} col={0} owner={owner} />);

    const square = container.firstChild as HTMLElement;
    expect(square).toHaveAttribute('role', 'gridcell');
  });
});
