import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';

export type MapStatus = 'loading' | 'ready' | 'error';

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

export function useWorldMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<MapStatus>('loading');

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
        L.geoJSON(data, { style: COUNTRY_STYLE }).addTo(map);
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
      map.remove();
    };
  }, []);

  return { containerRef, status };
}
