import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState, type GuessResult } from './useGameState';
import type { CountriesData } from '../data/countries';

function feature(
  isoName: string,
  fullName: string,
  alternativeNames?: string[],
) {
  return {
    type: 'Feature' as const,
    properties: {
      isoName,
      fullName,
      alternativeNames,
      centreCoords: [0, 0] as [number, number],
    },
    geometry: { type: 'Point' as const, coordinates: [0, 0] },
  };
}

const MOCK_DATA: CountriesData = {
  type: 'FeatureCollection',
  features: [
    feature('FRA', 'France'),
    feature('BRA', 'Brazil'),
    feature('USA', 'United States of America', ['America']),
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_DATA),
      } as Response),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useGameState', () => {
  it('loads the data and starts with nothing guessed', async () => {
    const { result } = renderHook(() => useGameState());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.total).toBe(3);
    expect(result.current.guessedCount).toBe(0);
  });

  it('marks by full name and alias, and ignores repeats and non-countries', async () => {
    const { result } = renderHook(() => useGameState());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    // Holder object avoids TS narrowing the result to `never` after the
    // assignment happens inside the act() callback.
    const box: { hit: GuessResult | null } = { hit: null };

    act(() => {
      box.hit = result.current.guess('France');
    });
    expect(box.hit?.isoName).toBe('FRA');
    expect(result.current.guessedCount).toBe(1);

    act(() => {
      box.hit = result.current.guess('  aMERica ');
    });
    expect(box.hit?.isoName).toBe('USA');
    expect(result.current.guessedCount).toBe(2);

    act(() => {
      box.hit = result.current.guess('France');
    });
    expect(box.hit).toBeNull();
    act(() => {
      box.hit = result.current.guess('Narnia');
    });
    expect(box.hit).toBeNull();
    expect(result.current.guessedCount).toBe(2);
  });
});
