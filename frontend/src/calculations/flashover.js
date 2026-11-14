// Minimum HRR for compartment flashover (NUREG-1805 Ch. 13,
// spreadsheet 13_Compartment_Flashover_Calculations): MQH, Babrauskas, Thomas.
import { toSI, fromSI } from './units.js';

// Material thermal properties (k in kW/m/K, ρ in kg/m³, c in kJ/kg/K)
// Values from NUREG-1805 (Klote & Milke, Principles of Smoke Management,
// 2002, p. 270), the same table the NUREG flashover and temperature
// spreadsheets use. kρc (thermal inertia) is used in h_k below.
export const MATERIALS = {
  gypsum: {
    name: 'Gypsum Board',
    k: 0.00017,
    ρ: 960,
    c: 1.1
    // kρc ≈ 0.18 (kW/m²·K)²·s
  },
  concrete: {
    name: 'Concrete',
    k: 0.0016,
    ρ: 2400,
    c: 0.75
    // kρc ≈ 2.9
  },
  brick: {
    name: 'Brick',
    k: 0.0008,
    ρ: 2600,
    c: 0.8
    // kρc ≈ 1.7
  }
  // Steel left out on purpose: thin steel heats through in under a
  // second, so the 600 s h_k assumption below doesn't apply to it.
};

// Characteristic time after ignition for h_k. This is a simplification
// chosen for this calculator, NOT the NUREG method: h_k = sqrt(kρc / t)
// with t = 600 s, so students don't need the wall thickness. NUREG's
// flashover spreadsheet instead uses h_k = k/δ (walls heated all the way
// through, t > t_p), which needs the lining thickness δ.
export const T_CHAR_SEC = 600;

// ---- SI equations -------------------------------------------------------
/** h_k = sqrt(kρc / t), kW/m²·K */
export const heatTransferCoefficient = (material, t = T_CHAR_SEC) =>
  Math.sqrt((material.k * material.ρ * material.c) / t);

/** A_T: walls + ceiling + floor, minus the vent opening (NUREG definition), m² */
export const enclosureArea = (W, L, H, AO) => 2 * (L * W + L * H + W * H) - AO;

export const mqhHRR = (hk, AT, AO, HO) => 610 * Math.sqrt(hk * AT * AO * Math.sqrt(HO));
export const babrauskasHRR = (AO, HO) => 750 * AO * Math.sqrt(HO);
export const thomasHRR = (AT, AO, HO) => 7.8 * AT + 378 * AO * Math.sqrt(HO);

/**
 * @param {number} H,W,L  room height, width, length (m or ft)
 * @param {number} hv,wv  opening height, width (m or ft)
 * @param {string} material  key of MATERIALS
 * @returns {null | {kW: {mqh, thomas, babrauskas}, mqh, thomas, babrauskas, hk, AT, AO}}
 *   mqh/thomas/babrauskas are in display units (kW or BTU/s)
 */
export function flashoverHRR({ H, W, L, hv, wv, material, units = 'SI' }) {
  if (![H, W, L, hv, wv].every((v) => v > 0)) return null;
  const mat = MATERIALS[material];
  if (!mat) return null;
  const [h, w, l, ho, wo] = [H, W, L, hv, wv].map((v) => toSI(v, 'length', units));
  const AO = ho * wo;
  const AT = enclosureArea(w, l, h, AO);
  const hk = heatTransferCoefficient(mat);
  const kW = {
    mqh: mqhHRR(hk, AT, AO, ho),
    thomas: thomasHRR(AT, AO, ho),
    babrauskas: babrauskasHRR(AO, ho)
  };
  return {
    kW,
    mqh: fromSI(kW.mqh, 'hrr', units),
    thomas: fromSI(kW.thomas, 'hrr', units),
    babrauskas: fromSI(kW.babrauskas, 'hrr', units),
    hk,
    AT,
    AO
  };
}
