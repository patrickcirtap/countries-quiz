import { useWorldMap } from '../hooks/useWorldMap';

export function WorldMap() {
  const { containerRef, status } = useWorldMap();

  return (
    <div className="map-root">
      <div
        ref={containerRef}
        className="map"
        data-testid="world-map"
        aria-label="World map"
      />
      {status !== 'ready' && (
        <div className="map-overlay" role="status">
          {status === 'loading' ? 'Loading...' : 'Could not load the map.'}
        </div>
      )}
    </div>
  );
}
