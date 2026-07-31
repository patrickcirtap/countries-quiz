import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { Browser, marker as createMarker } from 'leaflet';
import { WorldMap } from './WorldMap';
import type { CountriesData } from '../data/countries';

const INITIAL_CENTRE = { lat: 12, lng: 0 };
const INITIAL_ZOOM = 2.75;

const { mapInstance, markerInstance } = vi.hoisted(() => ({
  mapInstance: {
    fitBounds: vi.fn().mockReturnThis(),
    zoomIn: vi.fn().mockReturnThis(),
    setView: vi.fn().mockReturnThis(),
    getCenter: vi.fn(() => ({ lat: 12, lng: 0 })),
    getZoom: vi.fn(() => 2.75),
    remove: vi.fn(),
  },
  markerInstance: {
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  },
}));

vi.mock('leaflet', () => {
  const layer = {
    addTo: vi.fn().mockReturnThis(),
    getBounds: vi.fn(() => ({})),
    setStyle: vi.fn().mockReturnThis(),
  };
  const tooltip = {
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };
  const L = {
    map: vi.fn(() => mapInstance),
    geoJSON: vi.fn(() => layer),
    tooltip: vi.fn(() => tooltip),
    icon: vi.fn(() => ({ _icon: true })),
    marker: vi.fn(() => markerInstance),
    Browser: { touch: false },
  };
  return { ...L, default: L };
});

const MOCK_DATA: CountriesData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        isoName: 'FRA',
        fullName: 'France',
        alternativeNames: [],
        centreCoords: [46, 2],
        capitalCity: 'Paris',
      },
      geometry: { type: 'Point', coordinates: [2, 46] },
    },
    {
      type: 'Feature',
      properties: {
        isoName: 'BRA',
        fullName: 'Brazil',
        alternativeNames: [],
        centreCoords: [-10, -55],
        capitalCity: 'Brasilia',
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
        capitalCity: 'Washington, D.C.',
      },
      geometry: { type: 'Point', coordinates: [-98, 39] },
    },
  ],
};

// @types/leaflet declares Browser.touch readonly; the mock lets us vary it.
const mockBrowser = Browser as { touch: boolean };

function mockFetch(response: Partial<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(response as Response)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch({ ok: true, json: () => Promise.resolve(MOCK_DATA) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockBrowser.touch = false;
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

  // Leaflet enlarges its own controls when Browser.touch is set, so the menu
  // button has to follow the same flag to stay aligned with the zoom buttons.
  it('sizes the controls to match Leaflet on touch-capable browsers', async () => {
    mockBrowser.touch = true;
    const { container } = render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(container.querySelector('.map-root')).toHaveClass('map-root-touch');
  });

  it('uses Leaflet default control sizing otherwise', async () => {
    const { container } = render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(container.querySelector('.map-root')).not.toHaveClass(
      'map-root-touch',
    );
  });

  it('restores the initial framing when reset zoom is used', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /reset zoom/i }));

    // Restores the recorded view rather than re-running the framing, which
    // would land somewhere else once the map is loaded.
    expect(mapInstance.setView).toHaveBeenCalledWith(
      INITIAL_CENTRE,
      INITIAL_ZOOM,
      { animate: false },
    );
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
  });

  it('hides guessed country labels while names are toggled off', async () => {
    const { container } = render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    const root = container.querySelector('.map-root');
    expect(root).not.toHaveClass('map-root-hide-labels');

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    const names = screen.getByRole('menuitemcheckbox', {
      name: /toggle names/i,
    });
    expect(names).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(names);
    expect(root).toHaveClass('map-root-hide-labels');
    // The menu collapses on selection, so reopen it to toggle back.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    const namesAgain = screen.getByRole('menuitemcheckbox', {
      name: /toggle names/i,
    });
    expect(namesAgain).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(namesAgain);
    expect(root).not.toHaveClass('map-root-hide-labels');
  });

  it('drops a marker on every unguessed country while markers are on', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(createMarker).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(
      screen.getByRole('menuitemcheckbox', { name: /toggle markers/i }),
    );

    // One per country in MOCK_DATA, at its centre coordinates.
    expect(createMarker).toHaveBeenCalledTimes(3);
    expect(createMarker).toHaveBeenCalledWith(
      [46, 2],
      expect.objectContaining({ interactive: false }),
    );

    // Toggling off clears every marker.
    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    const markersAgain = screen.getByRole('menuitemcheckbox', {
      name: /toggle markers/i,
    });
    expect(markersAgain).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(markersAgain);
    expect(markerInstance.remove).toHaveBeenCalledTimes(3);
  });

  it('removes a marker once its country is guessed', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('0 / 3'),
    );

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(
      screen.getByRole('menuitemcheckbox', { name: /toggle markers/i }),
    );
    expect(createMarker).toHaveBeenCalledTimes(3);

    fireEvent.change(
      screen.getByRole('textbox', { name: /enter a country/i }),
      { target: { value: 'France' } },
    );
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3'),
    );

    expect(markerInstance.remove).toHaveBeenCalledTimes(1);
  });

  it('opens the hint dialog from the menu and closes it again', async () => {
    render(<WorldMap />);
    await waitFor(() =>
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /^hint$/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/click unguessed countries for hints/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
