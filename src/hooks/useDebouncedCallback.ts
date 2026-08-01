import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns `[run, cancel]`. `cancel` drops a run that is still waiting, for when
 * the same action is taken directly instead.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number,
): [(...args: A) => void, () => void] {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const run = useCallback(
    (...args: A) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  );

  const cancel = useCallback(() => clearTimeout(timeoutRef.current), []);

  return [run, cancel];
}
