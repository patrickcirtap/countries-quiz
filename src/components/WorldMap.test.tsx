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

const { mapInstance, markerInstance, layerInstance, popupInstance } =
  vi.hoisted(() => ({
    mapInstance: {
      fitBounds: vi.fn().mockReturnThis(),
      zoomIn: vi.fn().mockReturnThis(),
      setView: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ lat: 12, lng: 0 })),
      getZoom: vi.fn(() => 2.75),
      remove: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
    markerInstance: {
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    },
    layerInstance: {
      addTo: vi.fn().mockReturnThis(),
      getBounds: vi.fn(() => ({})),
      setStyle: vi.fn().mockReturnThis(),
      on: vi.fn(),
    },
    popupInstance: {
      setLatLng: vi.fn().mockReturnThis(),
      setContent: vi.fn().mockReturnThis(),
      openOn: vi.fn().mockReturnThis(),
      isOpen: vi.fn(() => true),
      update: vi.fn(),
    },
  }));

vi.mock('leaflet', () => {
  const tooltip = {
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  };
  const L = {
    map: vi.fn(() => mapInstance),
    // Real Leaflet calls onEachFeature per feature; the hook relies on that to
    // build its isoName -> layer index, so the mock has to do it too.
    geoJSON: vi.fn(
      (
        data: CountriesData,
        options: { onEachFeature: (f: unknown, l: unknown) => void },
      ) => {
        data.features.forEach((f) => options.onEachFeature(f, layerInstance));
        return layerInstance;
      },
    ),
    tooltip: vi.fn(() => tooltip),
    popup: vi.fn(() => popupInstance),
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

// The map is built in a passive effect, which React flushes after committing
// the DOM. Waiting on the DOM alone can therefore win the race and assert
// before Leaflet exists, so wait until the map has actually been created.
async function renderReadyMap() {
  const result = render(<WorldMap />);
  await waitFor(() => expect(mapInstance.fitBounds).toHaveBeenCalled());
  return result;
}

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
    await renderReadyMap();
    const input = screen.getByRole('textbox', { name: /enter a country/i });
    input.blur();

    fireEvent.click(screen.getByTestId('world-map'));
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('does not refocus on coarse-pointer (touch) devices', async () => {
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: false } as unknown as MediaQueryList);
    await renderReadyMap();
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
    const { container } = await renderReadyMap();
    expect(container.querySelector('.map-root')).toHaveClass('map-root-touch');
  });

  it('uses Leaflet default control sizing otherwise', async () => {
    const { container } = await renderReadyMap();
    expect(container.querySelector('.map-root')).not.toHaveClass(
      'map-root-touch',
    );
  });

  it('restores the initial framing when reset zoom is used', async () => {
    await renderReadyMap();
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
    const { container } = await renderReadyMap();
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
    await renderReadyMap();
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
    await renderReadyMap();
    expect(screen.getByTestId('counter')).toHaveTextContent('0 / 3');

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
    await renderReadyMap();
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

  it('asks for confirmation before giving up, and No changes nothing', async () => {
    await renderReadyMap();

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /give up/i }));

    expect(
      screen.getByText(/are you sure you want to give up\?/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^no$/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(layerInstance.setStyle).not.toHaveBeenCalled();
    expect(createMarker).not.toHaveBeenCalled();
    expect(
      screen.getByRole('textbox', { name: /enter a country/i }),
    ).toBeEnabled();
  });

  it('reveals every remaining country in grey with markers on Yes', async () => {
    await renderReadyMap();
    expect(screen.getByTestId('counter')).toHaveTextContent('0 / 3');

    // Guess one so only two are left to reveal.
    fireEvent.change(
      screen.getByRole('textbox', { name: /enter a country/i }),
      { target: { value: 'France' } },
    );
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3'),
    );
    const stylesAfterGuess = layerInstance.setStyle.mock.calls.length;

    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /give up/i }));
    fireEvent.click(screen.getByRole('button', { name: /^yes$/i }));

    // The two unguessed countries go grey; the guessed one keeps its red.
    expect(layerInstance.setStyle).toHaveBeenCalledTimes(stylesAfterGuess + 2);
    expect(layerInstance.setStyle).toHaveBeenLastCalledWith(
      expect.objectContaining({ fillColor: '#8a8a8a', color: '#ffffff' }),
    );
    expect(createMarker).toHaveBeenCalledTimes(2);

    // The game is over: no more guessing, and give up cannot run twice.
    expect(
      screen.getByRole('textbox', { name: /enter a country/i }),
    ).toBeDisabled();
    expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3');
    fireEvent.click(
      screen.getByRole('button', { name: /additional options/i }),
    );
    expect(screen.getByRole('menuitem', { name: /give up/i })).toBeDisabled();
  });

  it('congratulates the player once every country is named', async () => {
    await renderReadyMap();
    const input = screen.getByRole('textbox', { name: /enter a country/i });

    for (const [name, count] of [
      ['France', '1 / 3'],
      ['Brazil', '2 / 3'],
      ['America', '3 / 3'],
    ]) {
      fireEvent.change(input, { target: { value: name } });
      await waitFor(() =>
        expect(screen.getByTestId('counter')).toHaveTextContent(count),
      );
    }

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(
      /congratulations! you named every country/i,
    );

    // Dismissing it leaves the finished map visible and does not bring it back.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('counter')).toHaveTextContent('3 / 3');
  });

  it('does not congratulate before every country is named', async () => {
    await renderReadyMap();

    fireEvent.change(
      screen.getByRole('textbox', { name: /enter a country/i }),
      { target: { value: 'France' } },
    );
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3'),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  const shownValue = (line: Element) =>
    line.querySelector(
      '.country-popup-value > b:not(.country-popup-value-hidden)',
    )?.textContent;
  const hiddenValue = (line: Element) =>
    line.querySelector('.country-popup-value-hidden')?.textContent;

  // The hook registers one click handler per feature, in MOCK_DATA order.
  function clickCountry(index: number) {
    const handler = layerInstance.on.mock.calls.filter(
      ([event]) => event === 'click',
    )[index][1] as (e: { latlng: unknown }) => void;
    act(() => handler({ latlng: { lat: 46, lng: 2 } }));
  }

  it('opens a hint popup where an unguessed country was clicked', async () => {
    await renderReadyMap();
    clickCountry(0);

    // Anchored to the click position, not the country's centre.
    expect(popupInstance.setLatLng).toHaveBeenCalledWith({ lat: 46, lng: 2 });
    expect(popupInstance.openOn).toHaveBeenCalled();

    const popup = popupInstance.setContent.mock.calls[0][0] as HTMLElement;
    expect(popup).toHaveTextContent('Click for hints:');
    expect(popup.textContent).toContain('First letter');
    expect(popup.textContent).toContain('Capital city');
    const lines = popup.querySelectorAll('.country-popup-hint');
    expect(lines).toHaveLength(2);
    // Both hidden until asked for...
    expect(shownValue(lines[0])).toBe('???');
    expect(shownValue(lines[1])).toBe('???');
    // ...but each answer is already in the layout, reserving its width.
    expect(hiddenValue(lines[0])).toBe('F -  -  -  -  - ');
    expect(hiddenValue(lines[1])).toBe('Paris');
  });

  it('reveals each hint only when its own line is clicked', async () => {
    await renderReadyMap();
    clickCountry(0);
    const popup = popupInstance.setContent.mock.calls[0][0] as HTMLElement;
    const [nameLine, capitalLine] = Array.from(
      popup.querySelectorAll('.country-popup-hint'),
    );

    const measuredOnOpen = popupInstance.update.mock.calls.length;

    fireEvent.click(nameLine);
    expect(shownValue(nameLine)).toBe('F -  -  -  -  - ');
    expect(shownValue(capitalLine)).toBe('???');

    fireEvent.click(capitalLine);
    expect(shownValue(capitalLine)).toBe('Paris');

    // The width already allowed for both answers, so Leaflet never re-measures
    // and the popup cannot grow as hints are revealed.
    expect(popupInstance.update).toHaveBeenCalledTimes(measuredOnOpen);
  });

  it('shows name and capital straight away for a guessed country', async () => {
    await renderReadyMap();
    fireEvent.change(
      screen.getByRole('textbox', { name: /enter a country/i }),
      { target: { value: 'France' } },
    );
    await waitFor(() =>
      expect(screen.getByTestId('counter')).toHaveTextContent('1 / 3'),
    );

    clickCountry(0);
    const calls = popupInstance.setContent.mock.calls;
    const popup = calls[calls.length - 1][0] as HTMLElement;

    expect(popup.textContent).toContain('France');
    expect(popup.textContent).toContain('Paris');
    expect(popup.textContent).not.toContain('Click for hints');
    expect(popup.textContent).not.toContain('???');
    expect(popup.querySelectorAll('.country-popup-hint')).toHaveLength(0);
  });

  it('marks a country and updates the counter when guessed correctly', async () => {
    await renderReadyMap();
    expect(screen.getByTestId('counter')).toHaveTextContent('0 / 3');

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
