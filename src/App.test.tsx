import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Dashboard page by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'The Floor' })).toBeInTheDocument();
  });

  it('renders open audience view button on Dashboard', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Open Audience View' })).toBeInTheDocument();
  });
});
