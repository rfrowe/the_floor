import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContestantCard } from './ContestantCard';
import type { Contestant } from '@types';

afterEach(() => {
  cleanup();
});

const mockContestant: Contestant = {
  id: 'test-contestant-1',
  name: 'John Doe',
  category: {
    name: '80s Movies',
    slides: [],
  },
  wins: 3,
  eliminated: false,
};

describe('ContestantCard', () => {
  it('renders contestant information correctly', () => {
    render(<ContestantCard contestant={mockContestant} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('80s Movies')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('3 wins')).toBeInTheDocument();
  });

  it('displays category label', () => {
    render(<ContestantCard contestant={mockContestant} />);

    expect(screen.getByText('Category:')).toBeInTheDocument();
  });

  it('renders eliminated badge when contestant is eliminated', () => {
    const eliminatedContestant: Contestant = {
      ...mockContestant,
      eliminated: true,
    };

    const { container } = render(<ContestantCard contestant={eliminatedContestant} />);

    // Check for eliminated class instead of badge text
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('eliminated');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('eliminated'));
  });

  it('does not render eliminated badge for active contestant', () => {
    const { container } = render(<ContestantCard contestant={mockContestant} />);

    // Check that eliminated class is not present
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('eliminated');
  });

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(<ContestantCard contestant={mockContestant} isSelected={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('selected');
  });

  it('does not apply selected styling when isSelected is false', () => {
    const { container } = render(<ContestantCard contestant={mockContestant} isSelected={false} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('selected');
  });

  it('applies eliminated styling when contestant is eliminated', () => {
    const eliminatedContestant: Contestant = {
      ...mockContestant,
      eliminated: true,
    };

    const { container } = render(<ContestantCard contestant={eliminatedContestant} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('eliminated');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ContestantCard contestant={mockContestant} onClick={handleClick} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockContestant);
  });

  it('calls onSelect handler when clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(<ContestantCard contestant={mockContestant} onSelect={handleSelect} />);

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockContestant);
  });

  it('calls both onClick and onSelect when both are provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const handleSelect = vi.fn();

    render(
      <ContestantCard contestant={mockContestant} onClick={handleClick} onSelect={handleSelect} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it('is interactive when onClick is provided', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <ContestantCard contestant={mockContestant} onClick={handleClick} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('interactive');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabIndex')).toBe('0');
  });

  it('is interactive when onSelect is provided', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <ContestantCard contestant={mockContestant} onSelect={handleSelect} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('interactive');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabIndex')).toBe('0');
  });

  it('is not interactive when no handlers are provided', () => {
    const { container } = render(<ContestantCard contestant={mockContestant} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('interactive');
    expect(card.getAttribute('role')).toBeNull();
    expect(card.getAttribute('tabIndex')).toBeNull();
  });

  it('supports keyboard interaction with Enter key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ContestantCard contestant={mockContestant} onClick={handleClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard interaction with Space key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ContestantCard contestant={mockContestant} onClick={handleClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger handler for other keys', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ContestantCard contestant={mockContestant} onClick={handleClick} />);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('a');

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('has proper ARIA label for active contestant', () => {
    render(<ContestantCard contestant={mockContestant} onClick={vi.fn()} />);

    expect(screen.getByLabelText('Contestant John Doe, 3 wins, active')).toBeInTheDocument();
  });

  it('has proper ARIA label for eliminated contestant', () => {
    const eliminatedContestant: Contestant = {
      ...mockContestant,
      eliminated: true,
    };

    render(<ContestantCard contestant={eliminatedContestant} onClick={vi.fn()} />);

    expect(screen.getByLabelText('Contestant John Doe, 3 wins, eliminated')).toBeInTheDocument();
  });

  it('sets aria-pressed to true when selected and interactive', () => {
    render(<ContestantCard contestant={mockContestant} isSelected={true} onClick={vi.fn()} />);

    const card = screen.getByRole('button');
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('does not set aria-pressed when not selected', () => {
    render(<ContestantCard contestant={mockContestant} isSelected={false} onClick={vi.fn()} />);

    const card = screen.getByRole('button');
    expect(card.getAttribute('aria-pressed')).toBeNull();
  });

  it('does not set aria-pressed when not interactive', () => {
    render(<ContestantCard contestant={mockContestant} isSelected={true} />);

    const card = screen.queryByRole('button');
    expect(card).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ContestantCard contestant={mockContestant} className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('handles contestant with 0 wins', () => {
    const newContestant: Contestant = {
      ...mockContestant,
      wins: 0,
    };

    render(<ContestantCard contestant={newContestant} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByLabelText('0 wins')).toBeInTheDocument();
  });

  it('handles long contestant names', () => {
    const longNameContestant: Contestant = {
      ...mockContestant,
      name: 'Alexander Montgomery Fitzwilliam III',
    };

    render(<ContestantCard contestant={longNameContestant} />);

    expect(screen.getByText('Alexander Montgomery Fitzwilliam III')).toBeInTheDocument();
  });

  it('handles long category names', () => {
    const longCategoryContestant: Contestant = {
      ...mockContestant,
      category: {
        name: 'Very Specific Historical Events From The 1980s',
        slides: [],
      },
    };

    render(<ContestantCard contestant={longCategoryContestant} />);

    expect(screen.getByText('Very Specific Historical Events From The 1980s')).toBeInTheDocument();
  });
});
