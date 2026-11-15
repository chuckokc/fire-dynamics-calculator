// Flame height for three fire locations.
// Middle of room: Heskestad (NUREG-1805 Ch. 3).
// Wall and corner: NUREG-1805 Chapter 4 (spreadsheet 04_Flame_Height_Calculations,
// Wall_Flame_Height and Corner_Flame_Height sheets).
// Equations are in SI: Q in kW, lengths in m.
import { toSI, fromSI, unitLabel, METRIC, FEET } from './units.js';
import { fmt, step, feetToMetersStep, metersToFeetStep } from './work.js';

export const FIRE_LOCATIONS = {
  center: {
    label: 'Middle of room (away from walls)',
    method: "Heskestad's Correlation",
    equation: 'L = 0.235Q̇²/⁵ - 1.02D',
    sizeName: 'Fire Diameter',
    sizeSymbol: 'D',
    sizeDescription: 'Fire diameter',
    usesSize: true
  },
  wall: {
    label: 'Against a wall',
    method: 'Wall Fire Correlation (Delichatsios, NUREG-1805 Ch. 4)',
    equation: 'L = 0.034(Q̇/W)²/³',
    sizeName: 'Fire Length Along Wall',
    sizeSymbol: 'W',
    sizeDescription: 'Length of the fire along the wall',
    usesSize: true,
    nfpaNote: 'NFPA 921 (2024) 5.6.4.6.4: a wall restricts air entrainment and makes the upper layer hotter, but tests showed no significant increase in flame height compared with the same fire away from the wall.'
  },
  corner: {
    label: 'In a corner',
    method: 'Corner Fire Correlation (Hasemi & Tokunaga, NUREG-1805 Ch. 4)',
    equation: 'L = 0.075Q̇³/⁵',
    usesSize: false,
    nfpaNote: 'NFPA 921 (2024) 5.6.4.6.5: a corner restricts air entrainment even more, and tests showed a significant increase in flame height compared with the same fire in the open.'
  }
};

// ---- SI equations -------------------------------------------------------
export const heskestadHeight = (Q, D) => 0.235 * Math.pow(Q, 0.4) - 1.02 * D;
export const wallHeight = (Q, W) => 0.034 * Math.pow(Q / W, 2 / 3);
export const cornerHeight = (Q) => 0.075 * Math.pow(Q, 0.6);

const has = (v) => Number.isFinite(v);

/**
 * Solve for flame height, HRR or fire size.
 * @param {'flameHeight'|'heatRelease'|'diameter'} mode  what to solve for
 * @param {'center'|'wall'|'corner'} location
 * @param {number} Q  HRR (kW)
 * @param {number} D  fire diameter (center) or length along wall (wall), m or ft
 * @param {number} L  flame height, m or ft
 * @param {'metric'|'feet'} units  how lengths are entered and shown (HRR is always kW)
 * @returns {null | {error: string} | {value, type, unit, valueM?, kW?, flameHeightM?, steps}}
 *   null = not enough input yet. A length answer is `value` in the display
 *   units and `valueM` in meters; an HRR answer is `value` = `kW`.
 */
export function solveFlameHeight({ mode, location = 'center', Q, D, L, units = METRIC }) {
  const loc = FIRE_LOCATIONS[location];
  if (!loc) return null;
  const feet = units === FEET;
  const q = Q;
  const d = toSI(D, 'length', units);
  const l = toSI(L, 'length', units);
  const sym = loc.sizeSymbol;

  // Conversion steps for the lengths this mode uses (the HRR is already kW)
  const inputSteps = (useD, useL) => {
    if (!feet) return [];
    const out = [];
    if (useD && loc.usesSize) out.push(feetToMetersStep(`Convert ${loc.sizeName.toLowerCase()} to m`, D));
    if (useL) out.push(feetToMetersStep('Convert flame height to m', L));
    return out;
  };
  // A length answer is worked in meters, then shown in feet as well: converted
  // for the answer in feet mode, given for reference in metric mode.
  const lengthOut = (m, label) => [metersToFeetStep(
    feet ? `Convert ${label} to ft` : `${label[0].toUpperCase()}${label.slice(1)} in feet, for reference`, m)];

  if (mode === 'flameHeight') {
    if (!has(Q) || (loc.usesSize && !has(D))) return null;
    const steps = inputSteps(true, false);
    let h;
    if (location === 'wall') {
      if (!(d > 0)) return { error: 'Fire length along the wall must be greater than zero.' };
      h = wallHeight(q, d);
      steps.push(step('Heat release rate per meter of wall', "Q̇′ = Q̇ / W", `${fmt(q)} kW / ${fmt(d)} m`, `${fmt(q / d)} kW/m`));
      steps.push(step('Wall fire flame height', "L = 0.034 (Q̇′)^(2/3)", `0.034 × (${fmt(q / d)})^(2/3)`, `${fmt(h)} m`));
    } else if (location === 'corner') {
      h = cornerHeight(q);
      steps.push(step('Corner fire flame height', 'L = 0.075 Q̇^(3/5)', `0.075 × (${fmt(q)})^(3/5)`, `${fmt(h)} m`));
    } else {
      h = heskestadHeight(q, d);
      steps.push(step('Heskestad flame height', 'L = 0.235 Q̇^(2/5) − 1.02 D',
        `0.235 × (${fmt(q)})^(2/5) − 1.02 × ${fmt(d)} = ${fmt(0.235 * Math.pow(q, 0.4))} − ${fmt(1.02 * d)}`, `${fmt(h)} m`));
    }
    steps.push(...lengthOut(h, 'flame height'));
    return { value: fromSI(h, 'length', units), valueM: h, flameHeightM: h, type: 'Flame Height', unit: unitLabel('length', units), steps };
  }

  if (mode === 'heatRelease') {
    if (!has(L) || (loc.usesSize && !has(D))) return null;
    const steps = inputSteps(true, true);
    let kW;
    if (location === 'wall') {
      kW = d * Math.pow(l / 0.034, 1.5);              // Q = W (L/0.034)^(3/2)
      steps.push(step('Solve the wall equation for Q̇', 'Q̇ = W × (L / 0.034)^(3/2)', `${fmt(d)} × (${fmt(l)} / 0.034)^(3/2)`, `${fmt(kW)} kW`));
    } else if (location === 'corner') {
      kW = Math.pow(l / 0.075, 5 / 3);                 // Q = (L/0.075)^(5/3)
      steps.push(step('Solve the corner equation for Q̇', 'Q̇ = (L / 0.075)^(5/3)', `(${fmt(l)} / 0.075)^(5/3)`, `${fmt(kW)} kW`));
    } else {
      const intermediate = (l + 1.02 * d) / 0.235;     // Q = ((L + 1.02D)/0.235)^(5/2)
      if (intermediate <= 0) {
        return { error: 'Invalid input combination. Flame height too small for given diameter.' };
      }
      kW = Math.pow(intermediate, 2.5);
      steps.push(step('Solve Heskestad for Q̇', 'Q̇ = ((L + 1.02 D) / 0.235)^(5/2)',
        `((${fmt(l)} + 1.02 × ${fmt(d)}) / 0.235)^(5/2)`, `${fmt(kW)} kW`));
    }
    return { value: kW, kW, type: 'Heat Release Rate', unit: 'kW', steps };
  }

  if (mode === 'diameter') {
    if (!loc.usesSize || !has(Q) || !has(L)) return null;
    const steps = inputSteps(false, true);
    let size;
    if (location === 'wall') {
      if (!(l > 0)) return { error: 'Flame height must be greater than zero.' };
      size = q / Math.pow(l / 0.034, 1.5);             // W = Q / (L/0.034)^(3/2)
      steps.push(step('Solve the wall equation for W', 'W = Q̇ / (L / 0.034)^(3/2)', `${fmt(q)} / (${fmt(l)} / 0.034)^(3/2)`, `${fmt(size)} m`));
    } else {
      const numerator = 0.235 * Math.pow(q, 0.4) - l;  // D = (0.235Q^(2/5) - L)/1.02
      if (numerator <= 0) {
        return { error: 'Invalid input combination. Flame height too large for given heat release.' };
      }
      size = numerator / 1.02;
      steps.push(step('Solve Heskestad for D', 'D = (0.235 Q̇^(2/5) − L) / 1.02',
        `(0.235 × (${fmt(q)})^(2/5) − ${fmt(l)}) / 1.02`, `${fmt(size)} m`));
    }
    steps.push(...lengthOut(size, `${sym === 'W' ? 'fire length' : 'fire diameter'}`));
    return { value: fromSI(size, 'length', units), valueM: size, type: loc.sizeName, unit: unitLabel('length', units), steps };
  }

  return null;
}
