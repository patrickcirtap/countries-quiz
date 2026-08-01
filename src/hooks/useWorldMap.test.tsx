import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useWorldMap } from './useWorldMap';
import type { CountriesData } from '../data/countries';

const { mapInstance, layerInstance, markerInstance, tooltipInstance } =
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
    layerInstance: {
      addTo: vi.fn().mockReturnThis(),
      setStyle: vi.fn().mockReturnThis(),
      on: vi.fn(),
    },
    markerInstance: { addTo: vi.fn().mockReturnThis(), remove: vi.fn() },
    tooltipInstance: {
      setLatLng: vi.fn().mockReturnThis(),
      setContent: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    },
  }));

vi.mock('leaflet', () => {
  const L = {
    map: vi.fn(() => mapInstance),
    geoJSON: vi.fn(
      (
        data: CountriesData,
        options: { onEachFeature: (f: unknown, l: unknown) => void },
      ) => {
        data.features.forEach((f) => options.onEachFeature(f, layerInstance));
        return layerInstance;
      },
    ),
    tooltip: vi.fn(() => tooltipInstance),
    popup: vi.fn(() => ({
      setLatLng: vi.fn().mockReturnThis(),
      setContent: vi.fn().mockReturnThis(),
      openOn: vi.fn().mockReturnThis(),
      isOpen: vi.fn(() => false),
      update: vi.fn(),
    })),
    icon: vi.fn(() => ({})),
    marker: vi.fn(() => markerInstance),
    Browser: { touch: false },
  };
  return { ...L, default: L };
});

const DATA: CountriesData = {
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
  ],
};

type Api = Omit<ReturnType<typeof useWorldMap>, 'containerRef'>;

function renderMapHook(data: CountriesData | null) {
  const api = {} as Api;
  function Harness() {
    const { containerRef, ...rest } = useWorldMap(data);
    Object.assign(api, rest);
    return <div ref={containerRef} />;
  }
  render(<Harness />);
  return api;
}

const FRANCE = {
  isoName: 'FRA',
  fullName: 'France',
  centreCoords: [46, 2] as [number, number],
};

beforeEach(() => vi.clearAllMocks());

describe('useWorldMap', () => {
  it('does nothing until there is data', () => {
    const api = renderMapHook(null);

    expect(mapInstance.fitBounds).not.toHaveBeenCalled();
    // Every operation is a safe no-op without a map.
    act(() => {
      api.markGuessed('FRA', FRANCE);
      api.showMarkers([FRANCE]);
      api.revealRemaining([FRANCE]);
      api.resetView();
      api.refreshPopup();
      api.openPopup([0, 0], document.createElement('div'));
    });
    expect(layerInstance.setStyle).not.toHaveBeenCalled();
    expect(markerInstance.addTo).not.toHaveBeenCalled();
  });

  it('frames the map once data arrives', () => {
    renderMapHook(DATA);
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
    expect(mapInstance.zoomIn).toHaveBeenCalledWith(0.5, { animate: false });
  });

  it('styles a guessed country red and labels it', () => {
    const api = renderMapHook(DATA);
    act(() => api.markGuessed('FRA', FRANCE));

    expect(layerInstance.setStyle).toHaveBeenCalledWith(
      expect.objectContaining({ fillColor: '#ff6666', color: '#ff0000' }),
    );
    expect(tooltipInstance.setContent).toHaveBeenCalledWith('France');
  });

  it('labels a country only once', () => {
    const api = renderMapHook(DATA);
    act(() => {
      api.markGuessed('FRA', FRANCE);
      api.markGuessed('FRA', FRANCE);
    });
    expect(tooltipInstance.addTo).toHaveBeenCalledTimes(1);
  });

  it('drops a marker when its country is guessed', () => {
    const api = renderMapHook(DATA);
    act(() => api.showMarkers([FRANCE]));
    expect(markerInstance.addTo).toHaveBeenCalledTimes(1);

    act(() => api.markGuessed('FRA', FRANCE));
    expect(markerInstance.remove).toHaveBeenCalledTimes(1);
  });

  it('never doubles up markers', () => {
    const api = renderMapHook(DATA);
    act(() => {
      api.showMarkers([FRANCE]);
      api.showMarkers([FRANCE]);
    });
    expect(markerInstance.addTo).toHaveBeenCalledTimes(1);
  });

  it('greys out what is revealed on give up', () => {
    const api = renderMapHook(DATA);
    act(() => api.revealRemaining([FRANCE]));

    expect(layerInstance.setStyle).toHaveBeenCalledWith(
      expect.objectContaining({ fillColor: '#8a8a8a', color: '#ffffff' }),
    );
    expect(markerInstance.addTo).toHaveBeenCalledTimes(1);
    expect(tooltipInstance.setContent).toHaveBeenCalledWith('France');
  });

  it('ignores an unknown country', () => {
    const api = renderMapHook(DATA);
    act(() => api.markGuessed('ZZZ', FRANCE));
    expect(layerInstance.setStyle).not.toHaveBeenCalled();
  });

  it('restores the recorded view rather than re-framing', () => {
    const api = renderMapHook(DATA);
    act(() => api.resetView());

    expect(mapInstance.setView).toHaveBeenCalledWith(
      { lat: 12, lng: 0 },
      2.75,
      { animate: false },
    );
    expect(mapInstance.fitBounds).toHaveBeenCalledTimes(1);
  });
});
