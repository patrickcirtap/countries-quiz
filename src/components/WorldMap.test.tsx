import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { WorldMap } from './WorldMap';
import type { CountriesData } from '../data/countries';

vi.mock('leaflet', () => {
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn(() => ({})),
    setStyle: vi.fn().mockReturnThis(),
  };
  const map = {
    fitBounds: vi.fn().mockReturnThis(),
    zoomIn: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  };
  const tooltip = {
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };
  const L = {
    map: vi.fn(() => map),
    geoJSON: vi.fn(() => layer),
    tooltip: vi.fn(() => tooltip),
  };
  return { ...L, default: L };
});

const MOCK_DATA: CountriesData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { isoName: 'FRA', fullName: 'France', centreCoords: [46, 2] },
      geometry: { type: 'Point', coordinates: [2, 46] },
    },
    {
      type: 'Feature',
      properties: {
        isoName: 'BRA',
        fullName: 'Brazil',
        centreCoords: [-10, -55],
      },
      geometry: { type: 'Point', coordinates: [-55, -10] },
    },
    {
      type: 'Feature',
      properties: {
        isoName: 'USA',
        fullName: 'United States of America',
        alternativeNames: ['America'],
        centreCoords: [39, -98],
      },
      geometry: { type: 'Point', coordinates: [-98, 39] },
    },
  ],
};

function mockFetch(response: Partial<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response as Response)),
  );
}

beforeEach(() => {
  mockFetch({ ok: true, json: () => Promise.resolve(MOCK_DATA) });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WorldMap', () => {
  it('shows a loading state, then reveals the map once data loads', async () => {
    render(<WorldMap />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
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

  it('focuses the input when the map is clicked', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    const input = screen.getByRole('textbox', { name: /enter a country/i });
    input.blur();

    fireEvent.click(screen.getByTestId('world-map'));
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('does not refocus on coarse-pointer (touch) devices', async () => {
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: false } as unknown as MediaQueryList);
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    const input = screen.getByRole('textbox', { name: /enter a country/i });
    input.blur();

    fireEvent.click(screen.getByTestId('world-map'));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(input).not.toHaveFocus();
    spy.mockRestore();
  });

  it('marks a country and updates the counter when guessed correctly', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('0 / 3'),
    );

    fireEvent.change(
      screen.getByRole('textbox', { name: /enter a country/i }),
      {
        target: { value: 'France' },
      },
    );

    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3'),
    );
  });
});
