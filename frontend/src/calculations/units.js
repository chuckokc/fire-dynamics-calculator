// Unit conversions shared by all calculators.
// Every calculation runs in SI (kW, m, m², kW/m², kW/s²); these helpers move
// values between SI and the imperial units shown on screen.

export const FT_TO_M = 0.3048;                 // exact
export const FT2_TO_M2 = 0.09290304;           // exact (0.3048²)
export const BTU_PER_S_TO_KW = 1.055056;       // 1 BTU/s = 1.055056 kW
export const KW_TO_BTU_PER_S = 1 / BTU_PER_S_TO_KW; // ≈ 0.947817
export const KW_M2_TO_BTU_FT2_S = 0.088055;    // 1 kW/m² ≈ 0.088055 BTU/ft²·s

const isImperial = (units) => units === 'imperial';

// Quantity-specific factors: SI value = imperial value × toSI
const TO_SI = {
  length: FT_TO_M,          // ft → m
  area: FT2_TO_M2,          // ft² → m²
  hrr: BTU_PER_S_TO_KW,     // BTU/s → kW
  alpha: BTU_PER_S_TO_KW,   // BTU/s³ → kW/s² (same energy factor)
  heatFlux: 1 / KW_M2_TO_BTU_FT2_S // BTU/ft²·s → kW/m²
};

/** Convert a number entered in `units` to SI. */
export const toSI = (value, quantity, units) =>
  isImperial(units) ? value * TO_SI[quantity] : value;

/** Convert an SI number to the display `units`. */
export const fromSI = (value, quantity, units) =>
  isImperial(units) ? value / TO_SI[quantity] : value;

/**
 * Convert an input-box string when the user switches unit systems.
 * Returns '' for empty input so the box stays empty.
 */
export const convertInput = (value, quantity, toImperial, digits = 2) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '';
  const converted = toImperial ? num / TO_SI[quantity] : num * TO_SI[quantity];
  return converted.toFixed(digits);
};

/** Display labels for each quantity. */
export const unitLabel = (quantity, units) => {
  const imperial = isImperial(units);
  switch (quantity) {
    case 'length': return imperial ? 'ft' : 'm';
    case 'area': return imperial ? 'ft²' : 'm²';
    case 'hrr': return imperial ? 'BTU/s' : 'kW';
    case 'alpha': return imperial ? 'BTU/s³' : 'kW/s²';
    case 'heatFlux': return imperial ? 'BTU/ft²·s' : 'kW/m²';
    default: return '';
  }
};

/** Default unit system for every calculator. */
export const DEFAULT_UNITS = 'imperial';
