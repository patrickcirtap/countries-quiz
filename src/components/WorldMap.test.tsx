import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WorldMap } from './WorldMap';

vi.mock('leaflet', () => {
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn(() => ({})),
  };
  const map = {
    fitBounds: vi.fn().mockReturnThis(),
    zoomIn: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };
  const L = { map: vi.fn(() => map), geoJSON: vi.fn(() => layer) };
  return { ...L, default: L };
});

function mockFetch(response: Partial<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response as Response)),
  );
}

beforeEach(() => {
  mockFetch({
    ok: true,
    json: () => Promise.resolve({ type: 'FeatureCollection', features: [] }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WorldMap', () => {
  it('shows a loading state, then reveals the map once data loads', async () => {
    render(<WorldMap />);
    expect(screen.getByText(/loading map/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/loading map/i)).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('world-map')).toBeInTheDocument();
  });

  it('shows an error state when the data fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch({ ok: false, status: 500 });
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.getByText(/could not load/i)).toBeInTheDocument(),
    );
  });
});
