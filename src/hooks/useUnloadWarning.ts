import { useEffect } from 'react';

/**
 * Asks the browser to confirm before the page is closed or reloaded, since
 * progress is only held in memory. The wording is the browser's own; pages
 * have not been able to supply their own message for years.
 */
export function useUnloadWarning() {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers only show the prompt when returnValue is set.
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}
