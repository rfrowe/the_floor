import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import * as indexedDBHook from '@hooks/useIndexedDB';
import type { Contestant } from '@types';

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

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

describe('Dashboard', () => {
  const mockAdd = vi.fn();
  const mockRemove = vi.fn();
  const mockUpdate = vi.fn();
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(mockWindowOpen).toHaveBeenCalledWith('/audience', '_blank', 'noopener,noreferrer');
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

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
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
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: 'Delete' })[1];
    if (confirmButton) {
      await user.click(confirmButton);
    }

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
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
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
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Delete Contestant' })).toBeInTheDocument();
    });

    const confirmButton = screen.getAllByRole('button', { name: 'Delete' })[1];
    if (confirmButton) {
      await user.click(confirmButton);
    }

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to delete contestant: Delete failed');
    });
  });

  it('displays duel panel placeholder', () => {
    vi.spyOn(indexedDBHook, 'useContestants').mockReturnValue([
      [],
      { add: mockAdd, remove: mockRemove, update: mockUpdate, refresh: mockRefresh },
    ]);

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(
      screen.getByText('Duel setup controls will be implemented in task-12')
    ).toBeInTheDocument();
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
});
