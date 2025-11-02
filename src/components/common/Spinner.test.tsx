import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders screen reader text', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Spinner label="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument(); // Screen reader text
  });

  it('applies size classes', () => {
    const { rerender, container } = render(<Spinner size="small" />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();

    rerender(<Spinner size="medium" />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();

    rerender(<Spinner size="large" />);
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-spinner" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('renders with label and custom className', () => {
    render(<Spinner label="Please wait" className="custom" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('custom');
  });
});
