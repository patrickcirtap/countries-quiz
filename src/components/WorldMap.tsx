import { useRef, useState } from 'react';
import { Browser } from 'leaflet';
import { ControlsMenu } from './ControlsMenu';
import { HintDialog } from './HintDialog';
import { useWorldMap } from '../hooks/useWorldMap';
import { useGameState } from '../hooks/useGameState';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const DEBOUNCE_MS = 400;

export function WorldMap() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, data, guessedCount, total, unguessed, guess } =
    useGameState();
  // Only refocus on desktop; on touch devices this would pop the keyboard.
  const focusInputOnDesktop = () => {
    if (window.matchMedia('(pointer: fine)').matches) {
      inputRef.current?.focus();
    }
  };
  const { containerRef, markGuessed, resetView, showMarkers, hideMarkers } =
    useWorldMap(data, { onMapClick: focusInputOnDesktop });
  const [input, setInput] = useState('');
  const [namesOn, setNamesOn] = useState(true);
  const [markersOn, setMarkersOn] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  const runGuess = useDebouncedCallback((value: string) => {
    const hit = guess(value);
    if (hit) {
      markGuessed(hit.isoName, hit);
      setInput('');
    }
  }, DEBOUNCE_MS);

  const rootClasses = ['map-root'];
  if (Browser.touch) rootClasses.push('map-root-touch');
  if (!namesOn) rootClasses.push('map-root-hide-labels');

  return (
    <div className={rootClasses.join(' ')}>
      <div
        ref={containerRef}
        className="map"
        data-testid="world-map"
        aria-label="World map"
      />
      <input
        ref={inputRef}
        className="country-input"
        type="text"
        placeholder="Enter a country..."
        aria-label="Enter a country"
        value={input}
        onChange={(event) => {
          const value = event.target.value;
          setInput(value);
          runGuess(value);
        }}
        maxLength={50}
        autoFocus
      />
      <ControlsMenu
        onResetZoom={() => {
          resetView();
          focusInputOnDesktop();
        }}
        namesOn={namesOn}
        onToggleNames={() => {
          setNamesOn((on) => !on);
          focusInputOnDesktop();
        }}
        markersOn={markersOn}
        onToggleMarkers={() => {
          const next = !markersOn;
          setMarkersOn(next);
          if (next) showMarkers(unguessed);
          else hideMarkers();
          focusInputOnDesktop();
        }}
        onShowHint={() => setHintOpen(true)}
      />
      <div className="counter" data-testid="counter" aria-live="polite">
        {guessedCount} / {total}
      </div>
      {hintOpen && (
        <HintDialog
          onClose={() => {
            setHintOpen(false);
            focusInputOnDesktop();
          }}
        />
      )}
      {status !== 'ready' && (
        <div className="map-overlay" role="status">
          {status === 'loading' ? 'Loading...' : 'Could not load the map.'}
        </div>
      )}
    </div>
  );
}
