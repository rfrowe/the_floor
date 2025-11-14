/**
 * CensorBox Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CensorBox } from './CensorBox';
import type { CensorBox as CensorBoxType } from '@types';

describe('CensorBox', () => {
  it('renders with correct positioning and dimensions', () => {
    const box: CensorBoxType = {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      color: '#FF0000',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      position: 'absolute',
      left: '10%',
      top: '20%',
      width: '30%',
      height: '40%',
      backgroundColor: '#FF0000',
      pointerEvents: 'none',
    });
  });

  it('applies custom className', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: '#000000',
    };

    const { container } = render(<CensorBox box={box} className="custom-class" />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass('custom-class');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: '#000000',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveAttribute('aria-hidden', 'true');
  });

  it('strips alpha channel from rgba colors', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: 'rgba(255, 0, 0, 0.5)',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      backgroundColor: 'rgb(255, 0, 0)',
    });
    expect(element.style.backgroundColor).not.toContain('rgba');
  });

  it('strips alpha channel from 8-digit hex colors', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: '#FF0000AA',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      backgroundColor: '#FF0000',
    });
    expect(element.style.backgroundColor).not.toContain('AA');
  });

  it('strips alpha channel from 4-digit hex colors', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: '#F0A8',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      backgroundColor: '#F0A',
    });
  });

  it('leaves opaque hex colors unchanged', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: '#0000FF',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      backgroundColor: '#0000FF',
    });
  });

  it('leaves opaque rgb colors unchanged', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: 'rgb(0, 255, 0)',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      backgroundColor: 'rgb(0, 255, 0)',
    });
  });

  it('handles edge coordinates (0% and 100%)', () => {
    const box: CensorBoxType = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: '#000000',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      left: '0%',
      top: '0%',
      width: '100%',
      height: '100%',
    });
  });

  it('handles fractional percentages', () => {
    const box: CensorBoxType = {
      x: 12.5,
      y: 33.3,
      width: 45.7,
      height: 22.1,
      color: '#ABCDEF',
    };

    const { container } = render(<CensorBox box={box} />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveStyle({
      left: '12.5%',
      top: '33.3%',
      width: '45.7%',
      height: '22.1%',
    });
  });
});
