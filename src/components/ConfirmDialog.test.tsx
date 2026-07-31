import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

let onCancel: Mock<() => void>;
let onConfirm: Mock<() => void>;

function renderConfirm() {
  return render(
    <ConfirmDialog
      message="Are you sure you want to give up?"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />,
  );
}

beforeEach(() => {
  onCancel = vi.fn();
  onConfirm = vi.fn();
});

describe('ConfirmDialog', () => {
  it('shows the message with No and Yes', () => {
    renderConfirm();

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByText(/are you sure you want to give up\?/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^no$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^yes$/i })).toBeInTheDocument();
  });

  it('focuses No, so the safe choice is the default', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: /^no$/i })).toHaveFocus();
  });

  it('confirms only on Yes', () => {
    renderConfirm();
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels on No, Escape, and a backdrop click', () => {
    const { container } = renderConfirm();

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);

    fireEvent.click(container.querySelector('.dialog-backdrop') as Element);
    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
