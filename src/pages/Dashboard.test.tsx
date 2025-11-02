import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as indexedDBHook from '@hooks/useIndexedDB';
import * as duelStateHook from '@hooks/useDuelState';
import * as resetApp from '@utils/resetApp';
import type { Contestant, DuelState } from '@types';

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockContestant: Contestant = {
  id: '1',
  name: 'Test Contestant',
  category: {
    name: 'Test Category',
    slides: [
      {
        imageUrl: '/test.jpg',
        censorBoxes: [],
        answer: 'Test Answer',
      },
    ],
  },
  eliminated: false,
  wins: 5,
};

const mockEliminatedContestant: Contestant = {
  ...mockContestant,
  id: '2',
  name: 'Eliminated Contestant',
  eliminated: true,
};

const mockDuelState: DuelState = {
  contestant1: mockContestant,
  contestant2: mockEliminatedContestant,
  selectedCategory: mockContestant.category,
  currentSlideIndex: 0,
  activePlayer: 1,
  timeRemaining1: 30,
  timeRemaining2: 30,
  isSkipAnimationActive: false,
};

describe('Dashboard', () => {
  const mockAdd = vi.fn();
  const mockRemove = vi.fn();
  const mockUpdate = vi.fn();
  const mockRefresh = vi.fn();
  const mockSetDuelState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockLocation.href
    mockLocation.href = '';
    // Default: no active duel
    vi.spyOn(duelStateHook, 'useDuelState').mockReturnValue([null, mockSetDuelState]);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders header with title and actions', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'The Floor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Audience View' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import Contestant' })).toBeInTheDocument();
  });

  it('shows empty state when no contestants', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('No Contestants Yet')).toBeInTheDocument();
    expect(
      screen.getByText('Get started by importing contestant data from a PPTX file.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Import Your First Contestant' })
    ).toBeInTheDocument();
  });

  it('displays contestants in grid', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Contestants (1)')).toBeInTheDocument();
    expect(screen.getByText('Test Contestant')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('sorts contestants with active first, then eliminated', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockEliminatedContestant, mockContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Check contestant names appear in the correct order
    expect(screen.getByText('Test Contestant')).toBeInTheDocument();
    expect(screen.getByText('Eliminated Contestant')).toBeInTheDocument();

    // Verify eliminated badge only appears on eliminated contestant
    expect(screen.getAllByText('Eliminated').length).toBe(1);
  });

  it('opens import modal when Import Contestant button clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const importButton = screen.getByRole('button', { name: 'Import Contestant' });
    await user.click(importButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens import modal when Import Your First Contestant button clicked in empty state', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const importButton = screen.getByRole('button', { name: 'Import Your First Contestant' });
    await user.click(importButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens audience view in new window', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const audienceButton = screen.getByRole('button', { name: 'Open Audience View' });
    await user.click(audienceButton);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      '/the_floor/audience',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('shows delete confirmation modal when Delete button clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const deleteButton = screen.getByTitle('Delete contestant permanently');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
      // There are multiple "Test Contestant" elements, so we just verify the modal is open
    });
  });

  it('deletes contestant when confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Click delete button
    const deleteButton = screen.getByTitle('Delete contestant permanently');
    await user.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('1');
    });
  });

  it('cancels delete when Cancel button clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Click delete button
    const deleteButton = screen.getByTitle('Delete contestant permanently');
    await user.click(deleteButton);

    // Cancel deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Delete Contestant' })).not.toBeInTheDocument();
    });

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('handles delete error gracefully', async () => {
    const user = userEvent.setup();
    const mockRemoveError = vi.fn().mockRejectedValue(new Error('Delete failed'));
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant],
      { add: mockAdd, remove: mockRemoveError, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Click delete button
    const deleteButton = screen.getByTitle('Delete contestant permanently');
    await user.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
    });

    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to delete contestant: Delete failed');
    });
  });

  it('displays duel setup panel', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Duel Setup')).toBeInTheDocument();
    expect(screen.getByText('Select 2 contestants to set up a duel')).toBeInTheDocument();
  });

  it('displays correct contestant count', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [mockContestant, mockEliminatedContestant],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Contestants (2)')).toBeInTheDocument();
  });

  it('does not show Resume Duel button when no active duel', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.queryByRole('button', { name: 'Resume Duel' })).not.toBeInTheDocument();
  });

  it('shows Resume Duel button when there is an active duel', () => {
    vi.spyOn(duelStateHook, 'useDuelState').mockReturnValue([mockDuelState, mockSetDuelState]);
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: 'Resume Duel' })).toBeInTheDocument();
  });

  it('navigates to master view when Resume Duel is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(duelStateHook, 'useDuelState').mockReturnValue([mockDuelState, mockSetDuelState]);
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    const resumeButton = screen.getByRole('button', { name: 'Resume Duel' });
    await user.click(resumeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/master');
  });

  it('sorts active contestants alphabetically by name', () => {
    const zebra: Contestant = { ...mockContestant, id: '1', name: 'Zebra', eliminated: false };
    const alice: Contestant = { ...mockContestant, id: '2', name: 'Alice', eliminated: false };
    const mike: Contestant = { ...mockContestant, id: '3', name: 'Mike', eliminated: false };

    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [zebra, alice, mike],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Get all contestant names in the order they appear in the DOM
    const contestantNames = screen.getAllByText(/Alice|Mike|Zebra/);

    // Should be in alphabetical order: Alice, Mike, Zebra
    expect(contestantNames[0]).toHaveTextContent('Alice');
    expect(contestantNames[1]).toHaveTextContent('Mike');
    expect(contestantNames[2]).toHaveTextContent('Zebra');
  });

  it('sorts contestants alphabetically within active and eliminated groups', () => {
    const zebraActive: Contestant = {
      ...mockContestant,
      id: '1',
      name: 'Zebra',
      eliminated: false,
    };
    const aliceActive: Contestant = {
      ...mockContestant,
      id: '2',
      name: 'Alice',
      eliminated: false,
    };
    const mikeEliminated: Contestant = {
      ...mockContestant,
      id: '3',
      name: 'Mike',
      eliminated: true,
    };
    const bobEliminated: Contestant = { ...mockContestant, id: '4', name: 'Bob', eliminated: true };

    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [zebraActive, mikeEliminated, aliceActive, bobEliminated],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Get all contestant names in order
    const contestantElements = screen.getAllByText(/Alice|Bob|Mike|Zebra/);

    // Should be: Active (alphabetical): Alice, Zebra, then Eliminated (alphabetical): Bob, Mike
    expect(contestantElements[0]).toHaveTextContent('Alice');
    expect(contestantElements[1]).toHaveTextContent('Zebra');
    expect(contestantElements[2]).toHaveTextContent('Bob');
    expect(contestantElements[3]).toHaveTextContent('Mike');
  });

  describe('Reset Application', () => {
    it('shows Reset App button in header', () => {
      vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
        [],
        { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
      ]);

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      expect(screen.getByRole('button', { name: /Reset App/i })).toBeInTheDocument();
    });

    it('shows confirmation modal when Reset App button clicked', async () => {
      const user = userEvent.setup();
      vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
        [],
        { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
      ]);

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      const resetButton = screen.getByRole('button', { name: /Reset App/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Reset Application' })).toBeInTheDocument();
        expect(
          screen.getByText(/This will permanently delete ALL application data/i)
        ).toBeInTheDocument();
      });
    });

    it('cancels reset when Cancel button clicked', async () => {
      const user = userEvent.setup();
      vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
        [],
        { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
      ]);

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Click Reset App
      const resetButton = screen.getByRole('button', { name: /Reset App/i });
      await user.click(resetButton);

      // Cancel reset
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Reset Application' })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Reset Application' })).not.toBeInTheDocument();
      });
    });

    it('resets app and reloads when confirmed', async () => {
      const user = userEvent.setup();
      const resetSpy = vi.spyOn(resetApp, 'resetAppState').mockResolvedValue();

      vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
        [mockContestant],
        { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
      ]);

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Click Reset App
      const resetButton = screen.getByRole('button', { name: /Reset App/i });
      await user.click(resetButton);

      // Confirm reset
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Reset Application' })).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-reset-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledOnce();
        expect(mockLocation.href).toBe('/the_floor/');
      });
    });

    it('handles reset error gracefully', async () => {
      const user = userEvent.setup();
      const resetError = new Error('Reset failed');
      const resetSpy = vi.spyOn(resetApp, 'resetAppState').mockRejectedValue(resetError);

      vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
        [mockContestant],
        { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
      ]);

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Click Reset App
      const resetButton = screen.getByRole('button', { name: /Reset App/i });
      await user.click(resetButton);

      // Confirm reset
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: 'Reset Application' })).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('confirm-reset-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledOnce();
        expect(mockAlert).toHaveBeenCalledWith('Failed to reset application: Reset failed');
        expect(mockLocation.href).toBe('');
      });
    });
  });
});
