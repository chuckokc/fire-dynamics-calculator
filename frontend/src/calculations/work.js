// Helpers for the "Show the work" panel: each calculation returns a list of
// steps (label, equation, numbers substituted, result) so students can follow
// the math and check it by hand.

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
