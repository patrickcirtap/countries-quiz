import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  labelledBy: string;
  onDismiss: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea';

/**
 * Modal shell over the map. Dismisses on Escape and on a backdrop click, and
 * moves focus to the first button so the keyboard works straight away. A
 * dialog with no buttons takes focus itself, so Escape still reaches it.
 *
 * Tab is kept inside the dialog: aria-modal promises the rest of the page is
 * unavailable, and the backdrop only enforces that for the mouse.
 */
export function Dialog({ labelledBy, onDismiss, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    (dialog?.querySelector('button') ?? dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) {
        // Nothing to move to, so keep focus on the dialog itself.
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const isLeaving = event.shiftKey ? active === first : active === last;
      if (isLeaving || !dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div className="dialog-backdrop" onClick={onDismiss}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
