import { useEffect, useRef } from 'react';
import infoMapUrl from '../assets/info_map.png';

interface HintDialogProps {
  onClose: () => void;
}

export function HintDialog({ onClose }: HintDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="hint-backdrop" onClick={onClose}>
      <div
        className="hint-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-text"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          className="hint-image"
          src={infoMapUrl}
          alt=""
          width={150}
          height={150}
        />
        <p className="hint-text" id="hint-text">
          Click unguessed countries for hints
        </p>
        <button
          ref={closeRef}
          type="button"
          className="hint-close"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
