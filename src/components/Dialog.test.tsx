import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

let onDismiss: Mock<() => void>;

beforeEach(() => {
  onDismiss = vi.fn();
});

describe('Dialog', () => {
  it('labels itself as a modal and focuses the first button', () => {
    render(
      <Dialog labelledBy="t" onDismiss={onDismiss}>
        <p id="t">Message</p>
        <button type="button">First</button>
        <button type="button">Second</button>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 't');
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('takes focus itself when there is no button', () => {
    render(
      <Dialog labelledBy="t" onDismiss={onDismiss}>
        <p id="t">Message</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('dismisses on Escape and on the backdrop, but not on itself', () => {
    const { container } = render(
      <Dialog labelledBy="t" onDismiss={onDismiss}>
        <p id="t">Message</p>
      </Dialog>,
    );

    fireEvent.click(screen.getByRole('dialog'));
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('.dialog-backdrop') as Element);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('keeps Tab inside the dialog', () => {
    render(
      <Dialog labelledBy="t" onDismiss={onDismiss}>
        <p id="t">Message</p>
        <button type="button">First</button>
        <button type="button">Last</button>
      </Dialog>,
    );
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Last' });

    // Forward off the end wraps to the start.
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    // Backward off the start wraps to the end.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('pulls focus back if it has escaped the dialog', () => {
    render(
      <>
        <button type="button">Outside</button>
        <Dialog labelledBy="t" onDismiss={onDismiss}>
          <p id="t">Message</p>
          <button type="button">Inside</button>
        </Dialog>
      </>,
    );

    screen.getByRole('button', { name: 'Outside' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Inside' })).toHaveFocus();
  });

  it('holds focus on a dialog that has nothing focusable', () => {
    render(
      <Dialog labelledBy="t" onDismiss={onDismiss}>
        <p id="t">Message</p>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(dialog).toHaveFocus();
  });
});
