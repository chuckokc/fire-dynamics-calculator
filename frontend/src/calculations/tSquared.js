// T-squared fire growth: Q = α t²
// Standard growth coefficients (kW/s²): each reaches 1055 kW (1000 BTU/s)
// at the growth time t_g: slow 600 s, medium 300 s, fast 150 s, ultra-fast 75 s.
import { toSI, fromSI, unitLabel, BTU_PER_S_TO_KW, KW_TO_BTU_PER_S } from './units.js';
import { fmt, step, conversionStep } from './work.js';

export const GROWTH_RATES = {
  slow: 0.00293,
  medium: 0.01172,
  fast: 0.0469,
  ultrafast: 0.1876
};

/**
 * Growth coefficient in kW/s².
 * A custom α is entered in kW/s² (SI) or BTU/s³ (imperial).
 */
export function alphaSI({ growthRate, customAlpha, units = 'SI' }) {
  if (growthRate === 'custom') {
    const a = parseFloat(customAlpha);
    return a > 0 ? toSI(a, 'alpha', units) : 0;
  }
  return GROWTH_RATES[growthRate] || 0;
}

/**
 * @param {'heatRelease'|'time'} mode
 * @param {number} alpha  kW/s² (use alphaSI)
 * @param {number} t  seconds (heatRelease mode)
 * @param {number} Q  target HRR in display units (time mode)
 * @returns {null | {error} | {value, type, unit, alpha, kW?}}
 */
export function solveTSquared({ mode, alpha, t, Q, units = 'SI', customAlphaEntered }) {
  if (!(alpha > 0)) return null;
  const imperial = units === 'imperial';
  const steps = [];
  if (imperial && customAlphaEntered !== undefined) {
    steps.push(conversionStep('Convert custom α to kW/s²', parseFloat(customAlphaEntered), 'BTU/s³', BTU_PER_S_TO_KW, '1.055', 'kW/s²'));
  }
  if (mode === 'heatRelease') {
    if (!Number.isFinite(t)) return null;
    const kW = alpha * t * t;
    steps.push(step('Heat release rate at time t', 'Q̇ = α t²', `${fmt(alpha)} × ${fmt(t)}²`, `${fmt(kW)} kW`));
    if (imperial) steps.push(conversionStep('Convert to BTU/s', kW, 'kW', KW_TO_BTU_PER_S, '0.9478', 'BTU/s'));
    return { value: fromSI(kW, 'hrr', units), kW, type: 'Heat Release Rate', unit: unitLabel('hrr', units), alpha, steps };
  }
  if (mode === 'time') {
    if (!Number.isFinite(Q)) return null;
    const kW = toSI(Q, 'hrr', units);
    if (kW < 0) return { error: 'Invalid input values' };
    if (imperial) steps.push(conversionStep('Convert target HRR to kW', Q, 'BTU/s', BTU_PER_S_TO_KW, '1.055', 'kW'));
    const seconds = Math.sqrt(kW / alpha);
    steps.push(step('Time to reach the target HRR', 't = √(Q̇ / α)', `√(${fmt(kW)} / ${fmt(alpha)})`, `${fmt(seconds)} s (${fmt(seconds / 60, 3)} min)`));
    return { value: seconds, type: 'Time', unit: 'seconds', alpha, steps };
  }
  return null;
}
