import { useMemo } from 'react';
import usePersistentState from '../hooks/usePersistentState';
import { DEFAULT_UNITS, isUnitSystem } from '../lib/units';
import { UnitsContext } from './UnitsContext';

// One remembered unit system for the whole app.
export default function UnitsProvider({ children }) {
  const [units, setUnits] = usePersistentState('fdc.units', DEFAULT_UNITS, (stored, fallback) =>
    isUnitSystem(stored) ? stored : fallback,
  );
  const value = useMemo(() => ({ units, setUnits }), [units, setUnits]);
  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}
