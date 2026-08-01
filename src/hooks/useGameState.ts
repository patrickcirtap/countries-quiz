import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CountriesData } from '../data/countries';
import { normaliseString } from '../lib/normaliseString';

type GameStatus = 'loading' | 'ready' | 'error';

export interface GuessResult {
  isoName: string;
  fullName: string;
  centreCoords: [number, number];
}

interface CountryGameState {
  fullName: string;
  capitalCity: string;
  matchNames: Set<string>;
  centreCoords: [number, number];
  isGuessed: boolean;
}

type Countries = Record<string, CountryGameState>;

function buildCountries(data: CountriesData): Countries {
  const countries: Countries = {};
  for (const feature of data.features) {
    const p = feature.properties;
    const names = [p.fullName, ...p.alternativeNames];
    countries[p.isoName] = {
      fullName: p.fullName,
      capitalCity: p.capitalCity,
      matchNames: new Set(names.map(normaliseString)),
      centreCoords: p.centreCoords,
      isGuessed: false,
    };
  }
  return countries;
}

/**
 * Loads the country data and holds the single game-state object. `data` is
 * returned so the map can render the same fetched GeoJSON.
 */
export function useGameState() {
  const [status, setStatus] = useState<GameStatus>('loading');
  const [data, setData] = useState<CountriesData | null>(null);
  const [countries, setCountries] = useState<Countries>({});
  const countriesRef = useRef(countries);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}countries.geojson`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<CountriesData>;
      })
      .then((json) => {
        if (controller.signal.aborted) return;
        setData(json);
        setCountries(buildCountries(json));
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load map data:', err);
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  const total = useMemo(() => Object.keys(countries).length, [countries]);
  const guessedCount = useMemo(
    () => Object.values(countries).filter((c) => c.isGuessed).length,
    [countries],
  );
  const unguessed = useMemo(
    () =>
      Object.entries(countries)
        .filter(([, c]) => !c.isGuessed)
        .map(([isoName, c]) => ({
          isoName,
          fullName: c.fullName,
          centreCoords: c.centreCoords,
        })),
    [countries],
  );

  // Returns the matched country if this input newly guesses one, else null.
  const guess = useCallback((input: string): GuessResult | null => {
    const q = normaliseString(input);
    if (!q) return null;
    const current = countriesRef.current;
    for (const isoName in current) {
      const c = current[isoName];
      if (!c.isGuessed && c.matchNames.has(q)) {
        setCountries((prev) =>
          prev[isoName].isGuessed
            ? prev
            : { ...prev, [isoName]: { ...prev[isoName], isGuessed: true } },
        );
        return { isoName, fullName: c.fullName, centreCoords: c.centreCoords };
      }
    }
    return null;
  }, []);

  return { status, data, countries, guessedCount, total, unguessed, guess };
}
