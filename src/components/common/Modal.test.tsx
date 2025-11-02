import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Modal Title">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} footer={<button>Footer Action</button>}>
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('button', { name: /footer action/i })).toBeInTheDocument();
  });

  it('shows close button by default', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} showCloseButton={false}>
        <p>Content</p>
      </Modal>
    );

    expect(screen.queryByRole('button', { name: /close modal/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Content</p>
      </Modal>
    );

    await user.click(screen.getByRole('button', { name: /close modal/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>Content</p>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} className="custom-modal">
        <p>Content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  it('has proper ARIA attributes', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
