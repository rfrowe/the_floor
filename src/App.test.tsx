import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Dashboard page by default', () => {
    render(<App />);
    expect(screen.getByText(/Dashboard - Game Master Control Center/i)).toBeInTheDocument();
  });

  it('renders navigation links on Dashboard', () => {
    render(<App />);
    expect(screen.getByText(/Go to Master View/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Audience View/i)).toBeInTheDocument();
  });
});
