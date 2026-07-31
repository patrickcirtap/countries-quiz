import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HintDialog } from './HintDialog';

let onClose: Mock<() => void>;

beforeEach(() => {
  onClose = vi.fn();
});

describe('HintDialog', () => {
  it('shows the hint text and image', () => {
    render(<HintDialog onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByText(/click unguessed countries for hints/i),
    ).toBeInTheDocument();
    // Decorative: the text carries the meaning, so the image is not announced.
    expect(dialog.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('focuses the close button so Escape and Enter both work', () => {
    render(<HintDialog onClose={onClose} />);
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
  });

  it('closes on the button, Escape, and a backdrop click', () => {
    const { container, unmount } = render(<HintDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(container.querySelector('.hint-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(3);
    unmount();
  });

  it('stays open when the dialog itself is clicked', () => {
    render(<HintDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
