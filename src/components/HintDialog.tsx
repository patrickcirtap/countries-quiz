import { Dialog } from './Dialog';
import infoMapUrl from '../assets/info_map.png';

interface HintDialogProps {
  onClose: () => void;
}

export function HintDialog({ onClose }: HintDialogProps) {
  return (
    <Dialog labelledBy="hint-text" onDismiss={onClose}>
      <img
        className="hint-image"
        src={infoMapUrl}
        alt=""
        width={150}
        height={150}
      />
      <p className="dialog-text" id="hint-text">
        Click unguessed countries for hints
      </p>
      <div className="dialog-actions">
        <button type="button" className="dialog-button" onClick={onClose}>
          Close
        </button>
      </div>
    </Dialog>
  );
}
