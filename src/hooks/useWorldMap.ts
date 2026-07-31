import { useCallback, useEffect, useRef } from 'react';
import * as L from 'leaflet';
import markerIconUrl from '../assets/marker.png';
import type { CountriesData, CountryProperties } from '../data/countries';

interface GuessedLabel {
  fullName: string;
  centreCoords: [number, number];
}

export interface CountryTarget extends GuessedLabel {
  isoName: string;
}

interface UseWorldMapOptions {
  onMapClick?: () => void;
  onCountryClick?: (isoName: string, latlng: L.LatLng) => void;
  onPopupClose?: () => void;
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

// The source pin is 128 × 198 with the point at the bottom centre, above about
// 5px of transparent padding — hence the anchor sitting just short of the foot.
const MARKER_ICON = L.icon({
  iconUrl: markerIconUrl,
  iconSize: [28, 43],
  iconAnchor: [14, 42],
});

function applyInitialView(map: L.Map) {
  map.fitBounds(INITIAL_VIEW_BOUNDS);
  map.zoomIn(ZOOM_BOOST, { animate: false });
}

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

// Matches the original app's "give up" styling for countries never guessed.
const REVEALED_STYLE: L.PathOptions = {
  fillColor: '#8a8a8a',
  fillOpacity: 0.7,
  color: '#ffffff',
  weight: 1,
  opacity: 1,
};

export function useWorldMap(
  data: CountriesData | null,
  { onMapClick, onCountryClick, onPopupClose }: UseWorldMapOptions = {},
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onCountryClickRef = useRef(onCountryClick);
  const onPopupCloseRef = useRef(onPopupClose);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef(new Map<string, L.Layer>());
  const labelsRef = useRef(new Map<string, L.Tooltip>());
  const markersRef = useRef(new Map<string, L.Marker>());
  const popupRef = useRef<L.Popup | null>(null);
  const initialViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(
    null,
  );

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onCountryClickRef.current = onCountryClick;
    onPopupCloseRef.current = onPopupClose;
  }, [onMapClick, onCountryClick, onPopupClose]);

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
    applyInitialView(map);
    // Record where the framing actually landed. Recomputing it later would not
    // match: fitBounds applies synchronously only while the map is unloaded,
    // so a repeat call animates and the follow-up zoomIn reads a stale zoom.
    initialViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };

    const handleMapClick = () => {
      // Leaflet's zoom buttons refocus the map on click; defer so we win the focus.
      setTimeout(() => onMapClickRef.current?.(), 0);
    };
    container.addEventListener('click', handleMapClick, true);

    const layers = layersRef.current;
    const labels = labelsRef.current;
    const markers = markersRef.current;
    L.geoJSON<CountryProperties>(data, {
      style: COUNTRY_STYLE,
      onEachFeature: (feature, layer) => {
        const { isoName } = feature.properties;
        layers.set(isoName, layer);
        // e.latlng is where the pointer landed, so the popup opens there
        // rather than at the country's centre.
        layer.on('click', (event: L.LeafletMouseEvent) => {
          onCountryClickRef.current?.(isoName, event.latlng);
        });
      },
    }).addTo(map);

    const handlePopupClose = () => onPopupCloseRef.current?.();
    map.on('popupclose', handlePopupClose);

    return () => {
      container.removeEventListener('click', handleMapClick, true);
      map.off('popupclose', handlePopupClose);
      map.remove();
      mapRef.current = null;
      popupRef.current = null;
      initialViewRef.current = null;
      layers.clear();
      labels.clear();
      markers.clear();
    };
  }, [data]);

  const setStyle = useCallback((isoName: string, style: L.PathOptions) => {
    const layer = layersRef.current.get(isoName);
    if (layer && 'setStyle' in layer) {
      (layer as L.Path).setStyle(style);
    }
  }, []);

  const addLabel = useCallback((isoName: string, label: GuessedLabel) => {
    const map = mapRef.current;
    if (!map || labelsRef.current.has(isoName)) return;
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
  }, []);

  const markGuessed = useCallback(
    (isoName: string, label: GuessedLabel) => {
      if (!mapRef.current) return;
      setStyle(isoName, GUESSED_STYLE);

      // Markers flag what is still missing, so a guessed country drops its own.
      const marker = markersRef.current.get(isoName);
      if (marker) {
        marker.remove();
        markersRef.current.delete(isoName);
      }

      addLabel(isoName, label);
    },
    [setStyle, addLabel],
  );

  const showMarkers = useCallback((targets: CountryTarget[]) => {
    const map = mapRef.current;
    if (!map) return;
    for (const { isoName, centreCoords } of targets) {
      if (markersRef.current.has(isoName)) continue;
      const marker = L.marker(centreCoords, {
        icon: MARKER_ICON,
        // Decorative: never intercept a click meant for the country beneath.
        interactive: false,
        keyboard: false,
      }).addTo(map);
      markersRef.current.set(isoName, marker);
    }
  }, []);

  const hideMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    const initialView = initialViewRef.current;
    if (map && initialView) {
      map.setView(initialView.center, initialView.zoom, { animate: false });
    }
  }, []);

  // One popup instance is reused, so moving it between countries never fires
  // the popupclose that tearing it down and rebuilding it would.
  const openPopup = useCallback(
    (latlng: L.LatLngExpression, content: HTMLElement) => {
      const map = mapRef.current;
      if (!map) return;
      if (!popupRef.current) {
        popupRef.current = L.popup({ className: 'country-popup' });
      }
      popupRef.current.setLatLng(latlng).setContent(content).openOn(map);
    },
    [],
  );

  // Re-measure after the content changes size (a hint being revealed).
  const refreshPopup = useCallback(() => {
    if (popupRef.current?.isOpen()) popupRef.current.update();
  }, []);

  // Give up: grey out everything still missing, name it, and pin it.
  const revealRemaining = useCallback(
    (targets: CountryTarget[]) => {
      if (!mapRef.current) return;
      for (const target of targets) {
        setStyle(target.isoName, REVEALED_STYLE);
        addLabel(target.isoName, target);
      }
      showMarkers(targets);
    },
    [setStyle, addLabel, showMarkers],
  );

  return {
    containerRef,
    markGuessed,
    resetView,
    showMarkers,
    hideMarkers,
    revealRemaining,
    openPopup,
    refreshPopup,
  };
}
