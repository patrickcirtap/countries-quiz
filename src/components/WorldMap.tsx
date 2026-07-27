import { useRef, useState } from 'react';
import { useWorldMap } from '../hooks/useWorldMap';
import { useGameState } from '../hooks/useGameState';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const DEBOUNCE_MS = 400;

export function WorldMap() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { status, data, guessedCount, total, guess } = useGameState();
  const { containerRef, markGuessed } = useWorldMap(data, {
    onMapClick: () => {
      // Only refocus on desktop; on touch devices this would pop the keyboard.
      if (window.matchMedia('(pointer: fine)').matches) {
        inputRef.current?.focus();
      }
    },
  });
  const [input, setInput] = useState('');

  const runGuess = useDebouncedCallback((value: string) => {
    const hit = guess(value);
    if (hit) {
      markGuessed(hit.isoName, hit);
      setInput('');
    }
  }, DEBOUNCE_MS);

  return (
    <div className="map-root">
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
      <div className="counter" data-testid="counter" aria-live="polite">
        {guessedCount} / {total}
      </div>
      {status !== 'ready' && (
        <div className="map-overlay" role="status">
          {status === 'loading' ? 'Loading...' : 'Could not load the map.'}
        </div>
      )}
    </div>
  );
}
