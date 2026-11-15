// Helpers for the "Show the work" panel: each calculation returns a list of
// steps (label, equation, numbers substituted, result) so students can follow
// the math and check it by hand.
import { FT_TO_M, M_TO_FT, FT2_TO_M2 } from './units.js';

/** Format a number with up to `sig` significant digits and thousands separators. */
export const fmt = (n, sig = 4) => {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  return n.toLocaleString('en-US', { maximumSignificantDigits: sig });
};

/**
 * One step of working.
 * @param {string} label    what this step does
 * @param {string} formula  the equation in symbols
 * @param {string} values   the equation with numbers substituted
 * @param {string} result   the answer with units
 */
export const step = (label, formula, values, result) => ({ label, formula, values, result });

/** Unit-conversion step text, e.g. "10 ft × 0.3048 = 3.048 m". */
export const conversionStep = (label, value, fromUnit, factor, factorText, toUnit) =>
  step(label, `${toUnit} = ${fromUnit} × ${factorText}`, `${fmt(value)} ${fromUnit} × ${factorText}`, `${fmt(value * factor)} ${toUnit}`);

// The three conversions between feet and meters. Each label names the quantity
// and gives the conversion factor, so a student sees where the number came from.

/** "Convert room height to m (1 ft = 0.3048 m)": feet in, meters out. */
export const feetToMetersStep = (label, ft) =>
  conversionStep(`${label} (1 ft = 0.3048 m)`, ft, 'ft', FT_TO_M, '0.3048', 'm');

/** Square feet in, square meters out. */
export const squareFeetToSquareMetersStep = (label, ft2) =>
  conversionStep(`${label} (1 ft² = 0.092903 m²)`, ft2, 'ft²', FT2_TO_M2, '0.092903', 'm²');

/** Meters in, feet out. */
export const metersToFeetStep = (label, m) =>
  conversionStep(`${label} (1 m = 3.28084 ft)`, m, 'm', M_TO_FT, '3.28084', 'ft');
