// Flame height for three fire locations.
// Middle of room: Heskestad (NUREG-1805 Ch. 3).
// Wall and corner: NUREG-1805 Chapter 4 (spreadsheet 04_Flame_Height_Calculations,
// Wall_Flame_Height and Corner_Flame_Height sheets).
// Equations are in SI: Q in kW, lengths in m.
import { toSI, fromSI, unitLabel } from './units.js';

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
 * @param {number} Q  HRR (kW or BTU/s)
 * @param {number} D  fire diameter (center) or length along wall (wall), m or ft
 * @param {number} L  flame height, m or ft
 * @param {'SI'|'imperial'} units
 * @returns {null | {error: string} | {value, type, unit, kW?}}
 *   null = not enough input yet; value is in display units
 */
export function solveFlameHeight({ mode, location = 'center', Q, D, L, units = 'SI' }) {
  const loc = FIRE_LOCATIONS[location];
  if (!loc) return null;
  const q = toSI(Q, 'hrr', units);
  const d = toSI(D, 'length', units);
  const l = toSI(L, 'length', units);

  if (mode === 'flameHeight') {
    if (!has(Q) || (loc.usesSize && !has(D))) return null;
    let h;
    if (location === 'wall') {
      if (!(d > 0)) return { error: 'Fire length along the wall must be greater than zero.' };
      h = wallHeight(q, d);
    } else if (location === 'corner') {
      h = cornerHeight(q);
    } else {
      h = heskestadHeight(q, d);
    }
    return { value: fromSI(h, 'length', units), type: 'Flame Height', unit: unitLabel('length', units) };
  }

  if (mode === 'heatRelease') {
    if (!has(L) || (loc.usesSize && !has(D))) return null;
    let kW;
    if (location === 'wall') {
      kW = d * Math.pow(l / 0.034, 1.5);              // Q = W (L/0.034)^(3/2)
    } else if (location === 'corner') {
      kW = Math.pow(l / 0.075, 5 / 3);                 // Q = (L/0.075)^(5/3)
    } else {
      const intermediate = (l + 1.02 * d) / 0.235;     // Q = ((L + 1.02D)/0.235)^(5/2)
      if (intermediate <= 0) {
        return { error: 'Invalid input combination. Flame height too small for given diameter.' };
      }
      kW = Math.pow(intermediate, 2.5);
    }
    return { value: fromSI(kW, 'hrr', units), kW, type: 'Heat Release Rate', unit: unitLabel('hrr', units) };
  }

  if (mode === 'diameter') {
    if (!loc.usesSize || !has(Q) || !has(L)) return null;
    let size;
    if (location === 'wall') {
      if (!(l > 0)) return { error: 'Flame height must be greater than zero.' };
      size = q / Math.pow(l / 0.034, 1.5);             // W = Q / (L/0.034)^(3/2)
    } else {
      const numerator = 0.235 * Math.pow(q, 0.4) - l;  // D = (0.235Q^(2/5) - L)/1.02
      if (numerator <= 0) {
        return { error: 'Invalid input combination. Flame height too large for given heat release.' };
      }
      size = numerator / 1.02;
    }
    return { value: fromSI(size, 'length', units), type: loc.sizeName, unit: unitLabel('length', units) };
  }

  return null;
}
