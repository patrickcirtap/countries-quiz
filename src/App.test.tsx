import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

vi.mock('leaflet', () => {
  const chainable = {
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    setStyle: vi.fn().mockReturnThis(),
    on: vi.fn(),
  };
  const L = {
    map: vi.fn(() => ({
      fitBounds: vi.fn().mockReturnThis(),
      zoomIn: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ lat: 0, lng: 0 })),
      getZoom: vi.fn(() => 2),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })),
    geoJSON: vi.fn(() => chainable),
    tooltip: vi.fn(() => chainable),
    popup: vi.fn(() => chainable),
    icon: vi.fn(() => ({})),
    marker: vi.fn(() => chainable),
    Browser: { touch: false },
  };
  return { ...L, default: L };
});

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ type: 'FeatureCollection', features: [] }),
      } as Response),
    ),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('App', () => {
  it('mounts the world map', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('world-map')).toBeInTheDocument();
  });
});
