/**
 * Tests for CategoryNameStep.
 *
 * Covers the Task 56 acceptance criteria for the UI: on entry (with a key) it
 * shows a generated candidate; 🎲 Reroll cycles to the next; "Use this name"
 * confirms via `onConfirm`; the user can type a custom override; and a failed
 * generation surfaces an inline error with a working Retry. `generateCategoryNames`
 * is mocked — no real network.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CategoryNameStep } from './CategoryNameStep';
import { CREDENTIALS_STORAGE_KEY, type OpenAIConfig } from '@hooks/useCredentials';
import { GenerationError, generateCategoryNames } from '@services/openai';

vi.mock('@services/openai', async () => {
  const actual = await vi.importActual<typeof import('@services/openai')>('@services/openai');
  return { ...actual, generateCategoryNames: vi.fn() };
});

const FULL_KEY = `the-floor:${CREDENTIALS_STORAGE_KEY}`;

const generateMock = vi.mocked(generateCategoryNames);

/** Seed localStorage so `useCredentials().isConfigured` is true. */
function seedKey(apiKey = 'sk-test'): void {
  const config: OpenAIConfig = { apiKey, baseURL: '', imageSource: 'openai' };
  localStorage.setItem(FULL_KEY, JSON.stringify(config));
}

beforeEach(() => {
  localStorage.clear();
  generateMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('CategoryNameStep', () => {
  it('without a key: lets the user type a name and confirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<CategoryNameStep onConfirm={onConfirm} />);

    // No key → no generation attempt.
    expect(generateMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Add your OpenAI key on the previous step/i)).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: /Use this name/i });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/Category name/i), 'My Manual Category');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('My Manual Category');
  });

  it('with a key: shows the first generated candidate', async () => {
    seedKey();
    generateMock.mockResolvedValue(['World Capitals', 'Cryptids', 'One-Hit Wonders']);
    render(<CategoryNameStep onConfirm={vi.fn()} />);

    expect(generateMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByLabelText(/Category name/i)).toHaveValue('World Capitals');
    });
  });

  it('🎲 Reroll cycles to the next candidate', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock.mockResolvedValue(['World Capitals', 'Cryptids', 'One-Hit Wonders']);
    render(<CategoryNameStep onConfirm={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Category name/i)).toHaveValue('World Capitals');
    });

    await user.click(screen.getByRole('button', { name: /Reroll/i }));
    expect(screen.getByLabelText(/Category name/i)).toHaveValue('Cryptids');

    await user.click(screen.getByRole('button', { name: /Reroll/i }));
    expect(screen.getByLabelText(/Category name/i)).toHaveValue('One-Hit Wonders');
  });

  it('"Use this name" confirms the shown candidate', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    seedKey();
    generateMock.mockResolvedValue(['World Capitals', 'Cryptids']);
    render(<CategoryNameStep onConfirm={onConfirm} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Category name/i)).toHaveValue('World Capitals');
    });

    await user.click(screen.getByRole('button', { name: /Use this name/i }));
    expect(onConfirm).toHaveBeenCalledWith('World Capitals');
  });

  it('lets the user type a custom override that survives until reroll', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    seedKey();
    generateMock.mockResolvedValue(['World Capitals', 'Cryptids']);
    render(<CategoryNameStep onConfirm={onConfirm} />);

    const input = await screen.findByLabelText(/Category name/i);
    await waitFor(() => {
      expect(input).toHaveValue('World Capitals');
    });

    await user.clear(input);
    await user.type(input, 'Custom Theme');
    expect(input).toHaveValue('Custom Theme');

    await user.click(screen.getByRole('button', { name: /Use this name/i }));
    expect(onConfirm).toHaveBeenCalledWith('Custom Theme');

    // Rerolling abandons the custom edit and resumes following suggestions.
    await user.click(screen.getByRole('button', { name: /Reroll/i }));
    expect(input).toHaveValue('Cryptids');
  });

  it('shows an inline error with a working Retry when generation fails', async () => {
    const user = userEvent.setup();
    seedKey();
    generateMock
      .mockRejectedValueOnce(new GenerationError('auth', 'Your OpenAI API key was rejected.'))
      .mockResolvedValueOnce(['Recovered Name']);

    render(<CategoryNameStep onConfirm={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/key was rejected/i);

    await user.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Category name/i)).toHaveValue('Recovered Name');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not confirm a blank name', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    seedKey();
    generateMock.mockResolvedValue(['   ']);
    render(<CategoryNameStep onConfirm={onConfirm} />);

    // The only candidate is whitespace → the field trims to empty → confirm disabled.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Use this name/i })).toBeDisabled();
    });
    await user.click(screen.getByRole('button', { name: /Use this name/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
