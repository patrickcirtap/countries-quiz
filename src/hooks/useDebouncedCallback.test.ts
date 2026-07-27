import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback } from './useDebouncedCallback';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedCallback', () => {
  it('runs the callback once after the delay, with the latest args', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 400));

    act(() => {
      result.current('a');
      result.current('b');
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });
});
