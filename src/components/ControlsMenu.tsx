import { useEffect, useRef, useState } from 'react';

interface ControlsMenuProps {
  onResetZoom: () => void;
  namesOn: boolean;
  onToggleNames: () => void;
  markersOn: boolean;
  onToggleMarkers: () => void;
  onShowHint: () => void;
}

export function ControlsMenu({
  onResetZoom,
  namesOn,
  onToggleNames,
  markersOn,
  onToggleMarkers,
  onShowHint,
}: ControlsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Every option collapses the menu once it has run.
  const runAndClose = (action: () => void) => () => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="controls-menu" ref={menuRef}>
      <button
        type="button"
        className="controls-menu-button"
        aria-label="Additional options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="controls-menu-panel" role="menu">
          <button
            type="button"
            className="controls-menu-item"
            role="menuitem"
            onClick={runAndClose(onResetZoom)}
          >
            Reset zoom
          </button>

          <button
            type="button"
            className="controls-menu-item"
            role="menuitemcheckbox"
            aria-checked={namesOn}
            onClick={runAndClose(onToggleNames)}
          >
            Toggle names
            <span className="controls-menu-switch" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="controls-menu-item"
            role="menuitemcheckbox"
            aria-checked={markersOn}
            onClick={runAndClose(onToggleMarkers)}
          >
            Toggle markers
            <span className="controls-menu-switch" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="controls-menu-item"
            role="menuitem"
            onClick={runAndClose(onShowHint)}
          >
            Hint
          </button>

          <button
            type="button"
            className="controls-menu-item controls-menu-item-danger"
            role="menuitem"
          >
            Give up
          </button>
        </div>
      )}
    </div>
  );
}
