// Point source radiation (NUREG-1805 Ch. 5.1, spreadsheet 05.1 Point Source):
// q" = Q χr / (4π R²), R measured from the center of the fire (R = L + D/2).
import { toSI, METRIC, FEET } from './units.js';
import { fmt, step, feetToMetersStep } from './work.js';

export const pointSourceFluxSI = (Q, chi, R) => (Q * chi) / (4 * Math.PI * R * R);

/** Distance (m) at which the flux drops to `targetFlux` kW/m². */
export const radiusForFluxSI = (Q, chi, targetFlux) => Math.sqrt((Q * chi) / (4 * Math.PI * targetFlux));

/** Center distance from the edge distance L and fire diameter D (NUREG: R = L + D/2). */
export const centerDistance = (edgeDistance, diameter) => edgeDistance + diameter / 2;

/**
 * @param {number} Q  HRR (kW)
 * @param {number} chi  radiative fraction (0-1)
 * @param {number} R  distance from fire center (m or ft) — or, instead:
 * @param {number} edgeDistance  distance from the fire's edge (m or ft)
 * @param {number} diameter  fire diameter (m or ft), used with edgeDistance
 * @returns {null | {kWm2, R_m, steps}}  flux is always in kW/m²
 */
export function pointSourceFlux({ Q, R, chi, edgeDistance, diameter, units = METRIC }) {
  const feet = units === FEET;
  const fromEdge = edgeDistance !== undefined;
  if (!(Q > 0) || !(chi > 0)) return null;
  if (fromEdge ? !(edgeDistance >= 0 && diameter > 0) : !(R > 0)) return null;

  const steps = [];
  const q = Q;

  let r;
  if (fromEdge) {
    const L = toSI(edgeDistance, 'length', units);
    const D = toSI(diameter, 'length', units);
    if (feet) {
      steps.push(feetToMetersStep('Convert edge distance to m', edgeDistance));
      steps.push(feetToMetersStep('Convert fire diameter to m', diameter));
    }
    r = centerDistance(L, D);
    steps.push(step('Distance from the center of the fire', 'R = L + D/2', `${fmt(L)} m + ${fmt(D)} m / 2`, `${fmt(r)} m`));
  } else {
    r = toSI(R, 'length', units);
    if (feet) steps.push(feetToMetersStep('Convert distance to m', R));
  }
  if (!(r > 0)) return null;

  const kWm2 = pointSourceFluxSI(q, chi, r);
  steps.push(step('Radiant heat flux at the target', 'q″ = Q̇ χr / (4π R²)',
    `(${fmt(q)} × ${fmt(chi)}) / (4π × ${fmt(r)}²)`, `${fmt(kWm2)} kW/m²`));

  return { kWm2, R_m: r, steps };
}
