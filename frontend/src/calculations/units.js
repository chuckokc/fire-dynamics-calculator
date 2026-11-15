// Unit conversions shared by all calculators.
//
// Every calculation runs in metric (kW, m, m², kW/m², kW/s²). The only choice
// the user makes is how LENGTHS and AREAS are entered and shown: meters or
// feet. Energy quantities (heat release rate, heat flux, growth coefficient)
// are always kW-based, the way NFPA 921 and the fire dynamics literature
// publish them, so there is no BTU conversion anywhere.

export const FT_TO_M = 0.3048;            // exact
export const M_TO_FT = 1 / FT_TO_M;       // ≈ 3.28084
export const FT2_TO_M2 = 0.09290304;      // exact (0.3048²)

export const METRIC = 'metric';
export const FEET = 'feet';

/** Default unit system for every calculator. */
export const DEFAULT_UNITS = FEET;

// A mistyped or leftover unit name (for example the old 'SI' / 'imperial')
// must fail loudly. Treating it as metric would quietly give wrong numbers.
const checkUnits = (units) => {
  if (units !== METRIC && units !== FEET) throw new Error(`Unknown unit system: ${units}`);
};

// Metric value = value as entered (ft or ft²) × factor
const TO_METRIC = { length: FT_TO_M, area: FT2_TO_M2 };

const factorFor = (quantity) => {
  const factor = TO_METRIC[quantity];
  if (factor === undefined) throw new Error(`No unit conversion for "${quantity}"; only length and area change with the unit system`);
  return factor;
};

/** Convert a length or area entered in `units` to metric (m or m²). */
export const toSI = (value, quantity, units) => {
  checkUnits(units);
  const factor = factorFor(quantity);
  return units === FEET ? value * factor : value;
};

/** Convert a metric length or area to the display `units`. */
export const fromSI = (value, quantity, units) => {
  checkUnits(units);
  const factor = factorFor(quantity);
  return units === FEET ? value / factor : value;
};

/**
 * Convert an input-box string when the user switches unit systems.
 * Returns '' for empty input so the box stays empty. Five significant digits
 * keep a round trip clean at any size (10 ft becomes 3.048 m and back to 10 ft),
 * so switching units never visibly nudges the answer. Trailing zeros are dropped.
 */
export const convertInput = (value, quantity, toFeet, sig = 5) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '';
  const factor = factorFor(quantity);
  return String(Number((toFeet ? num / factor : num * factor).toPrecision(sig)));
};

/** Display labels for each quantity. Only length and area follow the unit system. */
export const unitLabel = (quantity, units) => {
  checkUnits(units);
  switch (quantity) {
    case 'length': return units === FEET ? 'ft' : 'm';
    case 'area': return units === FEET ? 'ft²' : 'm²';
    case 'hrr': return 'kW';
    case 'alpha': return 'kW/s²';
    case 'heatFlux': return 'kW/m²';
    default: return '';
  }
};
