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
      result.current[0]('a');
      result.current[0]('b');
    });
    expect(fn).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('drops a waiting run when cancelled', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 400));

    act(() => {
      result.current[0]('a');
      result.current[1]();
      vi.advanceTimersByTime(400);
    });
    expect(fn).not.toHaveBeenCalled();

    // Cancelling does not disable the callback for later runs.
    act(() => {
      result.current[0]('b');
      vi.advanceTimersByTime(400);
    });
    expect(fn).toHaveBeenCalledWith('b');
  });
});
