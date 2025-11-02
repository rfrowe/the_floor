import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Container className="custom-class">
        <div>Test</div>
      </Container>
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('custom-class');
  });

  it('renders multiple children', () => {
    render(
      <Container>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </Container>
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });
});
