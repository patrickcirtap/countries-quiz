import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  labelledBy: string;
  onDismiss: () => void;
  children: ReactNode;
}

/**
 * Modal shell over the map. Dismisses on Escape and on a backdrop click, and
 * moves focus to the first button so the keyboard works straight away. A
 * dialog with no buttons takes focus itself, so Escape still reaches it.
 */
export function Dialog({ labelledBy, onDismiss, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    (dialog?.querySelector('button') ?? dialog)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
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
