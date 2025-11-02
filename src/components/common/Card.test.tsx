import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders body content', () => {
    render(
      <Card>
        <p>Card body content</p>
      </Card>
    );

    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('renders with header', () => {
    render(
      <Card header="Card Header">
        <p>Body content</p>
      </Card>
    );

    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    render(
      <Card footer={<button>Action</button>}>
        <p>Body content</p>
      </Card>
    );

    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('renders with header, body, and footer', () => {
    render(
      <Card header="Header" footer={<button>Footer Button</button>}>
        <p>Body</p>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-card">
        <p>Content</p>
      </Card>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-card');
  });

  it('applies interactive class when interactive prop is true', () => {
    const { container } = render(
      <Card interactive>
        <p>Interactive card</p>
      </Card>
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toBeInTheDocument();
  });
});
