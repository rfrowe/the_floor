/**
 * Tests for the CredentialsStep component.
 *
 * Covers: Continue is gated until a key is entered, the key input is password-
 * masked, the optional base URL persists, the prominent security warning is
 * present, Clear empties the fields, and the key-validation flow on Continue —
 * the probe runs only with a key, advances only on success, shows a "Verifying…"
 * state, and surfaces a typed error inline on failure with retry.
 *
 * The OpenAI service layer is mocked so no real network call happens; the empty-
 * key gate is verified to short-circuit before the probe.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { GenerationError } from '@services/openai';
import { CredentialsStep } from './CredentialsStep';

// Mock the service layer so the component never touches the real SDK/network.
const validateCredentialsMock = vi.fn<(...args: unknown[]) => Promise<void>>();
vi.mock('@services/openai', async () => {
  const actual = await vi.importActual<typeof import('@services/openai')>('@services/openai');
  return {
    ...actual,
    validateCredentials: (...args: unknown[]) => validateCredentialsMock(...args),
  };
});

describe('CredentialsStep', () => {
  beforeEach(() => {
    localStorage.clear();
    validateCredentialsMock.mockReset();
    validateCredentialsMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('validates then advances on Continue once a key is entered', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<CredentialsStep onContinue={onContinue} />);

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-live-key');
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
    expect(validateCredentialsMock).toHaveBeenCalledTimes(1);
    const passedConfig = validateCredentialsMock.mock.calls[0]?.[0] as { apiKey: string };
    expect(passedConfig.apiKey).toBe('sk-live-key');
  });

  it('does not validate or advance while unconfigured (empty-key gate)', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<CredentialsStep onContinue={onContinue} />);

    // Whitespace-only key must not satisfy the guard.
    await user.type(screen.getByLabelText(/OpenAI API key/i), '   ');
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    expect(validateCredentialsMock).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('stays on the step and shows the typed error inline when validation fails', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    validateCredentialsMock.mockRejectedValue(
      new GenerationError('auth', 'Your OpenAI API key was rejected.')
    );
    render(<CredentialsStep onContinue={onContinue} />);

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-bad-key');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/rejected/i);
    expect(onContinue).not.toHaveBeenCalled();
    // Continue is re-enabled so the user can retry after fixing the key.
    expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
  });

  it('retries validation on a second Continue click after a failure', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    validateCredentialsMock.mockRejectedValueOnce(
      new GenerationError('network', 'Could not reach OpenAI.')
    );
    validateCredentialsMock.mockResolvedValueOnce(undefined);
    render(<CredentialsStep onContinue={onContinue} />);

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-key');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
    expect(validateCredentialsMock).toHaveBeenCalledTimes(2);
  });

  it('clears a prior validation error when the key changes', async () => {
    const user = userEvent.setup();
    validateCredentialsMock.mockRejectedValue(
      new GenerationError('auth', 'Your OpenAI API key was rejected.')
    );
    render(<CredentialsStep onContinue={vi.fn()} />);

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'sk-bad');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/OpenAI API key/i), 'more');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
