import { createContext, useContext } from 'react';
import { DEFAULT_UNITS } from '../lib/units';

export const UnitsContext = createContext({ units: DEFAULT_UNITS, setUnits: () => {} });

export const useUnits = () => useContext(UnitsContext);
