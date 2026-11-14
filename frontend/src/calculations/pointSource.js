// Point source radiation (NUREG-1805 Ch. 5.1, spreadsheet 05.1 Point Source):
// q" = Q χr / (4π R²), R measured from the center of the fire (R = L + D/2).
import { toSI, fromSI } from './units.js';

export const pointSourceFluxSI = (Q, chi, R) => (Q * chi) / (4 * Math.PI * R * R);

/** Distance (m) at which the flux drops to `targetFlux` kW/m². */
export const radiusForFluxSI = (Q, chi, targetFlux) => Math.sqrt((Q * chi) / (4 * Math.PI * targetFlux));

/**
 * @param {number} Q  HRR (kW or BTU/s)
 * @param {number} R  distance from fire center (m or ft)
 * @param {number} chi  radiative fraction (0-1)
 * @returns {null | {kWm2: number, value: number}}  value in display units
 */
export function pointSourceFlux({ Q, R, chi, units = 'SI' }) {
  if (!(Q > 0) || !(R > 0) || !(chi > 0)) return null;
  const kWm2 = pointSourceFluxSI(toSI(Q, 'hrr', units), chi, toSI(R, 'length', units));
  return { kWm2, value: fromSI(kWm2, 'heatFlux', units) };
}
