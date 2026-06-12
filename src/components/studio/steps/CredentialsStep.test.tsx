/**
 * Tests for the CredentialsStep component.
 *
 * Covers: Continue is gated until a key is entered, the key input is password-
 * masked, the optional base URL persists, the prominent security warning is
 * present, Clear empties the fields, and entering a key enables Continue (which
 * invokes the onContinue callback).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CredentialsStep } from './CredentialsStep';

describe('CredentialsStep', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('disables Continue until a key is entered', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<CredentialsStep onContinue={onContinue} />);

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-live-key');

    expect(continueButton).toBeEnabled();
    await user.click(continueButton);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('does not advance on Continue while unconfigured', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<CredentialsStep onContinue={onContinue} />);

    // Whitespace-only key must not satisfy the guard.
    await user.type(screen.getByLabelText(/OpenAI API key/i), '   ');
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('masks the API key input', () => {
    render(<CredentialsStep onContinue={vi.fn()} />);
    expect(screen.getByLabelText(/OpenAI API key/i)).toHaveAttribute('type', 'password');
  });

  it('renders a prominent security warning', () => {
    render(<CredentialsStep onContinue={vi.fn()} />);

    const warning = screen.getByRole('note', { name: /security warning/i });
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent(/plaintext/i);
    expect(warning).toHaveTextContent(/spend-limited/i);
    // Documents that Reset App also wipes the credentials.
    expect(warning).toHaveTextContent(/Reset App/i);
  });

  it('persists the optional custom base URL', async () => {
    const user = userEvent.setup();
    render(<CredentialsStep onContinue={vi.fn()} />);

    const baseUrlInput = screen.getByLabelText(/Custom base URL/i);
    expect(baseUrlInput).toHaveAttribute('placeholder', 'https://api.openai.com/v1');

    await user.type(baseUrlInput, 'https://proxy.example/v1');

    expect(baseUrlInput).toHaveValue('https://proxy.example/v1');
    const stored = JSON.parse(localStorage.getItem('the-floor:studio:openai') ?? '{}') as {
      baseURL?: string;
    };
    expect(stored.baseURL).toBe('https://proxy.example/v1');
  });

  it('Clear empties the fields and re-disables Continue', async () => {
    const user = userEvent.setup();
    render(<CredentialsStep onContinue={vi.fn()} />);

    const keyInput = screen.getByLabelText(/OpenAI API key/i);
    await user.type(keyInput, 'sk-to-be-cleared');
    expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /Clear credentials/i }));

    expect(keyInput).toHaveValue('');
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });
});
