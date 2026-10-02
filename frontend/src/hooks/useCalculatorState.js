import { useCallback, useEffect, useMemo } from 'react';
import { convertState, normalizeState } from '../lib/calculatorState';
import { useUnits } from '../units/UnitsContext';
import usePersistentState from './usePersistentState';

// Inputs for one calculator. They are saved to localStorage, so they survive
// switching calculators and reloading, and they are converted automatically
// when the app-wide unit system changes.
//
// initialValues and fieldKinds must be stable (module-level constants).
export default function useCalculatorState(key, initialValues, fieldKinds) {
  const { units } = useUnits();
  const [stored, setStored] = usePersistentState(`fdc.${key}.inputs`, null);

  // Convert during render so the numbers and their unit labels always match.
  const current = useMemo(
    () => convertState(normalizeState(stored, initialValues, units), units, fieldKinds),
    [stored, units, initialValues, fieldKinds],
  );

  // Save the converted values (and the undo record that lets switching back
  // restore the exact numbers typed).
  useEffect(() => {
    if (!stored || stored.units !== current.units) setStored(current);
  }, [stored, current, setStored]);

  const setValues = useCallback(
    (patch) => {
      setStored((previous) => {
        const latest = convertState(normalizeState(previous, initialValues, units), units, fieldKinds);
        const changes = typeof patch === 'function' ? patch(latest.values) : patch;
        return { units, values: { ...latest.values, ...changes }, undo: null };
      });
    },
    [setStored, units, initialValues, fieldKinds],
  );

  const setValue = useCallback((name, value) => setValues({ [name]: value }), [setValues]);

  const reset = useCallback(
    () => setStored({ units, values: { ...initialValues }, undo: null }),
    [setStored, units, initialValues],
  );

  // Restores saved inputs; they are converted if they were saved in the
  // other unit system.
  const load = useCallback(
    (entry) => setStored({ units: entry.units, values: { ...initialValues, ...entry.values }, undo: null }),
    [setStored, initialValues],
  );

  return { values: current.values, units, setValue, setValues, reset, load };
}
