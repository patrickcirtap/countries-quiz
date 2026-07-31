import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionDialog } from './CompletionDialog';

let onClose: Mock<() => void>;

beforeEach(() => {
  onClose = vi.fn();
});

describe('CompletionDialog', () => {
  it('congratulates the player without offering any button', () => {
    render(<CompletionDialog onClose={onClose} />);

    expect(
      screen.getByText(/congratulations! you named every country/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('takes focus itself so Escape works with no button present', () => {
    render(<CompletionDialog onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('closes on a backdrop click and on Escape', () => {
    const { container } = render(<CompletionDialog onClose={onClose} />);

    fireEvent.click(container.querySelector('.dialog-backdrop') as Element);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('stays open when the message itself is clicked', () => {
    render(<CompletionDialog onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
