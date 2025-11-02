import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { DuelSetup, type DuelSetupProps } from './DuelSetup';
import type { Contestant } from '@types';
import * as useDuelStateModule from '@hooks/useDuelState';

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DuelSetup', () => {
  const mockSetDuelState = vi.fn();

  beforeEach(() => {
    // Mock useDuelState hook
    vi.spyOn(useDuelStateModule, 'useDuelState').mockReturnValue([null, mockSetDuelState]);
  });

  const mockContestant1: Contestant = {
    id: '1',
    name: 'Alice',
    category: {
      name: 'Math',
      slides: [
        {
          answer: '4',
          imageUrl: 'https://example.com/q1.png',
          censorBoxes: [],
        },
      ],
    },
    wins: 2,
    eliminated: false,
  };

  const mockContestant2: Contestant = {
    id: '2',
    name: 'Bob',
    category: {
      name: 'History',
      slides: [
        {
          answer: 'George Washington',
          imageUrl: 'https://example.com/q2.png',
          censorBoxes: [],
        },
      ],
    },
    wins: 1,
    eliminated: false,
  };

  const defaultProps: DuelSetupProps = {
    contestant1: null,
    contestant2: null,
    onClear: vi.fn(),
    onStartDuel: vi.fn(),
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const renderDuelSetup = (props: Partial<DuelSetupProps> = {}) => {
    return render(
      <BrowserRouter>
        <DuelSetup {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    it('should render duel setup component', () => {
      renderDuelSetup();
      expect(screen.getByText('Duel Setup')).toBeInTheDocument();
    });

    it('should show placeholder text when no contestants selected', () => {
      renderDuelSetup();
      expect(screen.getAllByText('(Not selected)')).toHaveLength(2);
    });

    it('should show validation message when no contestants selected', () => {
      renderDuelSetup();
      expect(screen.getByText('Select 2 contestants to set up a duel')).toBeInTheDocument();
    });

    it('should disable Start Duel button when no contestants selected', () => {
      renderDuelSetup();
      const startButton = screen.getByRole('button', { name: /start duel/i });
      expect(startButton).toBeDisabled();
    });

    it('should disable category dropdown when no contestants selected', () => {
      renderDuelSetup();
      const categorySelect = screen.getByLabelText(/duel category/i);
      expect(categorySelect).toBeDisabled();
    });

    it('should disable Clear button when no contestants selected', () => {
      renderDuelSetup();
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('With One Contestant', () => {
    it('should display contestant1 name when selected', () => {
      renderDuelSetup({ contestant1: mockContestant1 });
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should still show validation message with only one contestant', () => {
      renderDuelSetup({ contestant1: mockContestant1 });
      expect(screen.getByText('Select 2 contestants to set up a duel')).toBeInTheDocument();
    });

    it('should keep Start Duel button disabled with only one contestant', () => {
      renderDuelSetup({ contestant1: mockContestant1 });
      const startButton = screen.getByRole('button', { name: /start duel/i });
      expect(startButton).toBeDisabled();
    });

    it('should enable Clear button with one contestant', () => {
      renderDuelSetup({ contestant1: mockContestant1 });
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeEnabled();
    });
  });

  describe('With Two Contestants', () => {
    it('should display both contestant names', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should enable category dropdown with two contestants', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });
      const categorySelect = screen.getByLabelText(/duel category/i);
      expect(categorySelect).toBeEnabled();
    });

    it('should show both categories in dropdown', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });
      expect(screen.getByText(/Math \(from Alice\)/i)).toBeInTheDocument();
      expect(screen.getByText(/History \(from Bob\)/i)).toBeInTheDocument();
    });

    it('should show validation message when no category selected', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });
      expect(screen.getByText('Select a category for the duel')).toBeInTheDocument();
    });

    it('should keep Start Duel button disabled without category selection', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });
      const startButton = screen.getByRole('button', { name: /start duel/i });
      expect(startButton).toBeDisabled();
    });
  });

  describe('Category Selection', () => {
    it('should allow selecting a category', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      expect(categorySelect).toHaveValue('Math');
    });

    it('should hide validation message after selecting category', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      expect(screen.queryByText('Select a category for the duel')).not.toBeInTheDocument();
    });

    it('should enable Start Duel button after selecting category', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      const startButton = screen.getByRole('button', { name: /start duel/i });
      expect(startButton).toBeEnabled();
    });

    it('should show unplayed category name after selection', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      expect(screen.getByText(/\(History\)/i)).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should call onClear when Clear button clicked', async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
        onClear,
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('should clear selected category when Clear is clicked', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(categorySelect).toHaveValue('');
    });
  });

  describe('Start Duel Functionality', () => {
    it('should save duel state via hook when starting duel', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      const startButton = screen.getByRole('button', { name: /start duel/i });
      await user.click(startButton);

      expect(mockSetDuelState).toHaveBeenCalledTimes(1);
      expect(mockSetDuelState).toHaveBeenCalledWith({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
        selectedCategory: mockContestant1.category,
        activePlayer: 1,
        timeRemaining1: 30,
        timeRemaining2: 30,
        currentSlideIndex: 0,
        isSkipAnimationActive: false,
      });
    });

    it('should call onStartDuel with correct config', async () => {
      const user = userEvent.setup();
      const onStartDuel = vi.fn();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
        onStartDuel,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'History');

      const startButton = screen.getByRole('button', { name: /start duel/i });
      await user.click(startButton);

      expect(onStartDuel).toHaveBeenCalledTimes(1);
      expect(onStartDuel).toHaveBeenCalledWith({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
        selectedCategory: mockContestant2.category,
      });
    });

    it('should navigate to /master when starting duel', async () => {
      const user = userEvent.setup();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      const startButton = screen.getByRole('button', { name: /start duel/i });
      await user.click(startButton);

      expect(mockNavigate).toHaveBeenCalledWith('/master');
    });
  });

  describe('Info Messages', () => {
    it('should display info about winner receiving unplayed category', () => {
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: mockContestant2,
      });

      expect(screen.getByText(/Winner receives the/i)).toBeInTheDocument();
      expect(screen.getByText(/UNPLAYED category/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle contestants with same category name', async () => {
      const user = userEvent.setup();
      const contestant1Same = { ...mockContestant1 };
      const contestant2Same = {
        ...mockContestant2,
        category: { ...mockContestant1.category },
      };

      renderDuelSetup({
        contestant1: contestant1Same,
        contestant2: contestant2Same,
      });

      // Both options should be present (distinguished by owner)
      expect(screen.getByText(/Math \(from Alice\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Math \(from Bob\)/i)).toBeInTheDocument();

      const categorySelect = screen.getByLabelText(/duel category/i);
      await user.selectOptions(categorySelect, 'Math');

      expect(categorySelect).toHaveValue('Math');
    });

    it('should not start duel without valid setup', async () => {
      const user = userEvent.setup();
      const onStartDuel = vi.fn();
      renderDuelSetup({
        contestant1: mockContestant1,
        contestant2: null,
        onStartDuel,
      });

      const startButton = screen.getByRole('button', { name: /start duel/i });
      await user.click(startButton);

      expect(onStartDuel).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
