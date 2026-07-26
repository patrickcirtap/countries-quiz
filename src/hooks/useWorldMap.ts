import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';

export type MapStatus = 'loading' | 'ready' | 'error';

export interface CountryProperties {
  name: string;
  iso_a3: string;
}

const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [-90, -180],
  [90, 180],
];

const INITIAL_VIEW_BOUNDS: L.LatLngBoundsExpression = [
  [-56, -180],
  [80, 180],
];

const ZOOM_BOOST = 0.5;

const COUNTRY_STYLE: L.PathOptions = {
  fillColor: '#ffffff',
  fillOpacity: 1,
  color: '#000000',
  weight: 1,
  opacity: 1,
};

interface UseWorldMapOptions {
  onMapClick?: () => void;
}

export function useWorldMap({ onMapClick }: UseWorldMapOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      minZoom: 1,
      maxZoom: 8,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1,
      worldCopyJump: false,
      attributionControl: false,
      zoomSnap: 0.25,
    });
    map.fitBounds(INITIAL_VIEW_BOUNDS);
    map.zoomIn(ZOOM_BOOST, { animate: false });

    const handleMapClick = () => {
      // Leaflet's zoom buttons refocus the map on click; defer so we win the focus.
      setTimeout(() => onMapClickRef.current?.(), 0);
    };
    container.addEventListener('click', handleMapClick, true);

    let isCancelled = false;
    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}countries.geojson`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<GeoJSON.GeoJsonObject>;
      })
      .then((data) => {
        if (isCancelled) return;
        L.geoJSON<CountryProperties>(data, { style: COUNTRY_STYLE }).addTo(map);
        setStatus('ready');
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('Failed to load map data:', err);
        setStatus('error');
      });

    return () => {
      isCancelled = true;
      controller.abort();
      container.removeEventListener('click', handleMapClick, true);
      map.remove();
    };
  }, []);

  return { containerRef, status };
}
