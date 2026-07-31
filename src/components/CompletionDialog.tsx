import { Dialog } from './Dialog';

interface CompletionDialogProps {
  onClose: () => void;
}

export function CompletionDialog({ onClose }: CompletionDialogProps) {
  return (
    <Dialog labelledBy="completion-text" onDismiss={onClose}>
      <p className="dialog-text" id="completion-text">
        Congratulations! You named every country
      </p>
    </Dialog>
  );
}
