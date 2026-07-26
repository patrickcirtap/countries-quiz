import { useEffect, useRef, useState } from 'react';
import { useWorldMap } from '../hooks/useWorldMap';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const INPUT_DEBOUNCE_MS = 400;

export function WorldMap() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { containerRef, status } = useWorldMap({
    onMapClick: () => {
      // Only refocus on desktop; on touch devices this would pop the keyboard.
      if (window.matchMedia('(pointer: fine)').matches) {
        inputRef.current?.focus();
      }
    },
  });
  const [input, setInput] = useState('');
  const debouncedInput = useDebouncedValue(input, INPUT_DEBOUNCE_MS);

  useEffect(() => {
    const query = debouncedInput.trim();
    if (query) console.log('Input:', query);
  }, [debouncedInput]);

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
        onChange={(event) => setInput(event.target.value)}
        maxLength={50}
        autoFocus
      />
      {status !== 'ready' && (
        <div className="map-overlay" role="status">
          {status === 'loading' ? 'Loading...' : 'Could not load the map.'}
        </div>
      )}
    </div>
  );
}
