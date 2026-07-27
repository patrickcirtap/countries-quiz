import { useCallback, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import type { CountriesData, CountryProperties } from '../data/countries';

interface GuessedLabel {
  fullName: string;
  centreCoords: [number, number];
}

interface UseWorldMapOptions {
  onMapClick?: () => void;
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

// Matches the original app's "guessed" styling.
const GUESSED_STYLE: L.PathOptions = {
  fillColor: '#ff6666',
  fillOpacity: 0.7,
  color: '#ff0000',
  weight: 2,
  opacity: 1,
};

export function useWorldMap(
  data: CountriesData | null,
  { onMapClick }: UseWorldMapOptions = {},
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<string, L.Layer>());
  const labelsRef = useRef(new Map<string, L.Tooltip>());

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !data) return;

    const map = L.map(container, {
      minZoom: 1,
      maxZoom: 8,
      maxBounds: WORLD_BOUNDS,
      maxBoundsViscosity: 1,
      worldCopyJump: false,
      attributionControl: false,
      zoomSnap: 0.25,
    });
    mapRef.current = map;
    map.fitBounds(INITIAL_VIEW_BOUNDS);
    map.zoomIn(ZOOM_BOOST, { animate: false });

    const handleMapClick = () => {
      // Leaflet's zoom buttons refocus the map on click; defer so we win the focus.
      setTimeout(() => onMapClickRef.current?.(), 0);
    };
    container.addEventListener('click', handleMapClick, true);

    const layers = layersRef.current;
    const labels = labelsRef.current;
    L.geoJSON<CountryProperties>(data, {
      style: COUNTRY_STYLE,
      onEachFeature: (feature, layer) => {
        layers.set(feature.properties.isoName, layer);
      },
    }).addTo(map);

    return () => {
      container.removeEventListener('click', handleMapClick, true);
      map.remove();
      mapRef.current = null;
      layers.clear();
      labels.clear();
    };
  }, [data]);

  const markGuessed = useCallback((isoName: string, label: GuessedLabel) => {
    const map = mapRef.current;
    if (!map) return;

    const layer = layersRef.current.get(isoName);
    if (layer && 'setStyle' in layer) {
      (layer as L.Path).setStyle(GUESSED_STYLE);
    }

    if (!labelsRef.current.has(isoName)) {
      const tooltip = L.tooltip({
        permanent: true,
        direction: 'center',
        className: 'country-label',
        interactive: false,
      })
        .setLatLng(label.centreCoords)
        .setContent(label.fullName)
        .addTo(map);
      labelsRef.current.set(isoName, tooltip);
    }
  }, []);

  return { containerRef, markGuessed };
}
