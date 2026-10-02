import { useCallback } from 'react';
import { isUnitSystem } from '../lib/units';
import usePersistentState from './usePersistentState';

const MAX_ENTRIES = 10;

const isEntry = (entry) =>
  entry && typeof entry === 'object' && isUnitSystem(entry.units) && entry.values && typeof entry.title === 'string';

// Saved calculations for one calculator, kept across reloads (last 10).
export default function useHistory(key) {
  const [entries, setEntries] = usePersistentState(`fdc.${key}.history`, [], (stored, fallback) =>
    Array.isArray(stored) ? stored.filter(isEntry) : fallback,
  );

  const add = useCallback(
    (entry) =>
      setEntries((previous) =>
        [
          { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, savedAt: new Date().toISOString(), ...entry },
          ...previous,
        ].slice(0, MAX_ENTRIES),
      ),
    [setEntries],
  );

  const clear = useCallback(() => setEntries([]), [setEntries]);

  return { entries, add, clear };
}
