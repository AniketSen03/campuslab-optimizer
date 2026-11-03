import { useEffect, useState } from 'react';

// useState that mirrors to localStorage. Falls back silently if storage is blocked.
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: state still works in memory */
    }
  }, [key, value]);
  return [value, setValue];
}
