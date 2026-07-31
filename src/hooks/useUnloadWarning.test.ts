import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUnloadWarning } from './useUnloadWarning';

function fireBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe('useUnloadWarning', () => {
  it('cancels the unload so the browser prompts', () => {
    renderHook(() => useUnloadWarning());

    // Cancelling the event is what makes the browser prompt. returnValue is
    // not asserted: jsdom implements it as a legacy mirror of defaultPrevented.
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it('stops warning once unmounted', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useUnloadWarning());
    const handler = addSpy.mock.calls.find(
      ([type]) => type === 'beforeunload',
    )?.[1];
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', handler);
    expect(fireBeforeUnload().defaultPrevented).toBe(false);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
