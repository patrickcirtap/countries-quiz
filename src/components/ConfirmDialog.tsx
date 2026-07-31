import { Dialog } from './Dialog';

interface ConfirmDialogProps {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  message,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog labelledBy="confirm-text" onDismiss={onCancel}>
      <p className="dialog-text" id="confirm-text">
        {message}
      </p>
      <div className="dialog-actions">
        {/* No comes first so it takes focus: dismissing is the safe default. */}
        <button type="button" className="dialog-button" onClick={onCancel}>
          No
        </button>
        <button
          type="button"
          className="dialog-button dialog-button-danger"
          onClick={onConfirm}
        >
          Yes
        </button>
      </div>
    </Dialog>
  );
}
