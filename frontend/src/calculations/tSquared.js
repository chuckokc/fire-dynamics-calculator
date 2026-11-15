// T-squared fire growth: Q = α t²
// Standard growth coefficients (kW/s²): each reaches 1055 kW (1000 BTU/s)
// at the growth time t_g: slow 600 s, medium 300 s, fast 150 s, ultra-fast 75 s.
// Everything here is in kW and seconds, so there is no unit choice to make.
import { fmt, step } from './work.js';

export const GROWTH_RATES = {
  slow: 0.00293,
  medium: 0.01172,
  fast: 0.0469,
  ultrafast: 0.1876
};

/** Growth coefficient in kW/s². A custom α is entered in kW/s². */
export function alphaSI({ growthRate, customAlpha }) {
  if (growthRate === 'custom') {
    const a = parseFloat(customAlpha);
    return a > 0 ? a : 0;
  }
  return GROWTH_RATES[growthRate] || 0;
}

/**
 * @param {'heatRelease'|'time'} mode
 * @param {number} alpha  kW/s² (use alphaSI)
 * @param {number} t  seconds (heatRelease mode)
 * @param {number} Q  target HRR in kW (time mode)
 * @returns {null | {error} | {value, type, unit, alpha, kW?}}
 */
export function solveTSquared({ mode, alpha, t, Q }) {
  if (!(alpha > 0)) return null;
  const steps = [];
  if (mode === 'heatRelease') {
    if (!Number.isFinite(t)) return null;
    const kW = alpha * t * t;
    steps.push(step('Heat release rate at time t', 'Q̇ = α t²', `${fmt(alpha)} × ${fmt(t)}²`, `${fmt(kW)} kW`));
    return { value: kW, kW, type: 'Heat Release Rate', unit: 'kW', alpha, steps };
  }
  if (mode === 'time') {
    if (!Number.isFinite(Q)) return null;
    const kW = Q;
    if (kW < 0) return { error: 'Invalid input values' };
    const seconds = Math.sqrt(kW / alpha);
    steps.push(step('Time to reach the target HRR', 't = √(Q̇ / α)', `√(${fmt(kW)} / ${fmt(alpha)})`, `${fmt(seconds)} s (${fmt(seconds / 60, 3)} min)`));
    return { value: seconds, type: 'Time', unit: 'seconds', alpha, steps };
  }
  return null;
}
