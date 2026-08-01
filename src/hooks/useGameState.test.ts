import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameState, type GuessResult } from './useGameState';
import type { CountriesData } from '../data/countries';

function feature(
  isoName: string,
  fullName: string,
  alternativeNames: string[] = [],
) {
  return {
    type: 'Feature' as const,
    properties: {
      isoName,
      fullName,
      alternativeNames,
      centreCoords: [0, 0] as [number, number],
      capitalCity: '',
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
  it('ignores a response that lands after unmount', async () => {
    let settle!: (response: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((resolve) => (settle = resolve))),
    );

    const { result, unmount } = renderHook(() => useGameState());
    unmount();
    await act(async () => {
      settle({ ok: true, json: () => Promise.resolve(MOCK_DATA) });
      await Promise.resolve();
    });

    // The abort guard means the late response never becomes state.
    expect(result.current.status).toBe('loading');
    expect(result.current.total).toBe(0);
  });

  it('ignores a failure that lands after unmount', async () => {
    let fail!: (reason: unknown) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((_resolve, reject) => (fail = reject))),
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result, unmount } = renderHook(() => useGameState());
    unmount();
    await act(async () => {
      fail(new Error('offline'));
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loading');
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

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
