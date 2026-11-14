// Heat release rate: Q = m" × A × ΔHc
// Material values: Quintiere, J. G. (2016). Principles of fire behavior
// (2nd ed.). Where Quintiere gives a range, the midpoint is used. Materials
// without a massFlux value ask the user for one (e.g., measured in a lab).
import { toSI, fromSI, FT2_TO_M2, KW_TO_BTU_PER_S } from './units.js';
import { fmt, step, conversionStep } from './work.js';

export const MATERIAL_PROPERTIES = {
    // Liquids with both heat of combustion and mass flux
    'liquefied_propane': { type: 'Liquids', name: 'Liquefied Propane', heatOfCombustion: 46.5, massFlux: 115.0 },
    'liquefied_natural_gas': { type: 'Liquids', name: 'Liquefied Natural Gas', heatOfCombustion: 50.0, massFlux: 90.0 },
    'benzene': { type: 'Liquids', name: 'Benzene', heatOfCombustion: 40.0, massFlux: 90.0 },
    'butane': { type: 'Liquids', name: 'Butane', heatOfCombustion: 45.7, massFlux: 80.0 },
    'hexane': { type: 'Liquids', name: 'Hexane', heatOfCombustion: 43.8, massFlux: 75.0 },
    'xylene': { type: 'Liquids', name: 'Xylene', heatOfCombustion: 40.0, massFlux: 70.0 },
    'jp-4': { type: 'Liquids', name: 'JP-4', heatOfCombustion: 43.2, massFlux: 60.0 },
    'heptane': { type: 'Liquids', name: 'Heptane', heatOfCombustion: 44.6, massFlux: 70.0 },
    'gasoline': { type: 'Liquids', name: 'Gasoline', heatOfCombustion: 43.7, massFlux: 55.0 },
    'acetone': { type: 'Liquids', name: 'Acetone', heatOfCombustion: 30.8, massFlux: 40.0 },
    'methanol': { type: 'Liquids', name: 'Methanol', heatOfCombustion: 19.8, massFlux: 22.0 },
    'kerosene': { type: 'Liquids', name: 'Kerosene', heatOfCombustion: 43.2 },
    'ethanol': { type: 'Liquids', name: 'Ethanol', heatOfCombustion: 26.8 },
    
    // Polymers and Solids
    'hdpe': { type: 'Polymers', name: 'High-density Polyethylene (HDPE)', heatOfCombustion: 40.0 },
    'polyethylene': { type: 'Polymers', name: 'Polyethylene', heatOfCombustion: 43.4 },
    'polypropylene': { type: 'Polymers', name: 'Polypropylene', heatOfCombustion: 44.0 },
    'polystyrene': { type: 'Polymers', name: 'Polystyrene', heatOfCombustion: 35.8 },
    'polystyrene_granular': { type: 'Polymers', name: 'Polystyrene (Granular)', heatOfCombustion: 35.8, massFlux: 38.0 },
    'pmma_granular': { type: 'Polymers', name: 'PMMA (Granular)', heatOfCombustion: 24.2, massFlux: 28.0 },
    'polyethylene_granular': { type: 'Polymers', name: 'Polyethylene (Granular)', heatOfCombustion: 43.4, massFlux: 26.0 },
    'polypropylene_granular': { type: 'Polymers', name: 'Polypropylene (Granular)', heatOfCombustion: 44.0, massFlux: 24.0 },
    'nylon': { type: 'Polymers', name: 'Nylon', heatOfCombustion: 27.9 },
    'nylon_6': { type: 'Polymers', name: 'Nylon 6', heatOfCombustion: 28.8 },
    'abs': { type: 'Polymers', name: 'ABS', heatOfCombustion: 30.0 },
    'abs_fr': { type: 'Polymers', name: 'ABS-FR', heatOfCombustion: 11.7 },
    'rigid_polyurethane_foam': { type: 'Polymers', name: 'Rigid Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 23.5 },
    'flexible_polyurethane_foam': { type: 'Polymers', name: 'Flexible Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 24.0 },
    'pvc_granular': { type: 'Polymers', name: 'PVC (Granular)', heatOfCombustion: 10.0, massFlux: 16.0 },
    
    // Woods and Cellulosics
    'corrugated_paper': { type: 'Woods', name: 'Corrugated Paper', heatOfCombustion: 13.2, massFlux: 14.0 },
    'wood_crib': { type: 'Woods', name: 'Wood Crib', heatOfCombustion: 14.7, massFlux: 11.0 },
    'douglas_fir': { type: 'Woods', name: 'Douglas Fir', heatOfCombustion: 14.7 },
    'hemlock': { type: 'Woods', name: 'Hemlock', heatOfCombustion: 13.3 },
    'plywood': { type: 'Woods', name: 'Plywood', heatOfCombustion: 11.9 },
    'plywood_fr': { type: 'Woods', name: 'Plywood FR', heatOfCombustion: 11.2 }
};

/**
 * Q = m" × A × ΔHc
 * @param {number} massFlux  g/m²·s
 * @param {number} heatOfCombustion  kJ/g
 * @param {number} area  m² (SI) or ft² (imperial)
 * @param {string} units  'SI' | 'imperial'
 * @returns {{ kW: number, value: number }|null}  value is in display units
 */
export function heatReleaseRate({ massFlux, heatOfCombustion, area, units = 'SI' }) {
  if (!(massFlux > 0) || !(heatOfCombustion > 0) || !(area > 0)) return null;
  const areaM2 = toSI(area, 'area', units);
  // (g/m²·s ÷ 1000) = kg/m²·s;  kJ/g = MJ/kg, × 1000 = kJ/kg  →  kW
  const kW = (massFlux / 1000) * areaM2 * heatOfCombustion * 1000;
  const value = fromSI(kW, 'hrr', units);

  const steps = [];
  if (units === 'imperial') {
    steps.push(conversionStep('Convert burning area to m²', area, 'ft²', FT2_TO_M2, '0.0929', 'm²'));
  }
  steps.push(step('Mass flux in kg/m²·s', 'ṁ″ (kg/m²·s) = ṁ″ (g/m²·s) ÷ 1000',
    `${fmt(massFlux)} ÷ 1000`, `${fmt(massFlux / 1000)} kg/m²·s`));
  steps.push(step('Heat of combustion in kJ/kg', 'ΔHc (kJ/kg) = ΔHc (kJ/g) × 1000',
    `${fmt(heatOfCombustion)} × 1000`, `${fmt(heatOfCombustion * 1000)} kJ/kg`));
  steps.push(step('Heat release rate', 'Q̇ = ṁ″ × A × ΔHc',
    `${fmt(massFlux / 1000)} × ${fmt(areaM2)} × ${fmt(heatOfCombustion * 1000)}`, `${fmt(kW)} kW`));
  if (units === 'imperial') {
    steps.push(conversionStep('Convert to BTU/s', kW, 'kW', KW_TO_BTU_PER_S, '0.9478', 'BTU/s'));
  }
  return { kW, value, steps };
}

/**
 * Mass flux from a lab burn: ṁ″ = (m_initial − m_final) / (A × t)
 * @param {number} initialMass  g
 * @param {number} finalMass  g
 * @param {number} time  s (burn duration)
 * @param {number} area  sample burning area, m² or ft²
 * @returns {null | {error} | {massFlux: number (g/m²·s), steps}}
 */
export function labMassFlux({ initialMass, finalMass, time, area, units = 'SI' }) {
  if (![initialMass, finalMass, time, area].every(Number.isFinite)) return null;
  if (!(time > 0) || !(area > 0)) return { error: 'Burn time and sample area must be greater than zero.' };
  const lost = initialMass - finalMass;
  if (!(lost > 0)) return { error: 'Final mass must be less than the starting mass.' };
  const areaM2 = toSI(area, 'area', units);
  const massFlux = lost / (areaM2 * time);
  const steps = [
    step('Mass lost', 'Δm = m(start) − m(end)', `${fmt(initialMass)} g − ${fmt(finalMass)} g`, `${fmt(lost)} g`)
  ];
  if (units === 'imperial') {
    steps.push(conversionStep('Convert sample area to m²', area, 'ft²', FT2_TO_M2, '0.0929', 'm²'));
  }
  steps.push(step('Mass flux', 'ṁ″ = Δm ÷ (A × t)',
    `${fmt(lost)} g ÷ (${fmt(areaM2)} m² × ${fmt(time)} s)`, `${fmt(massFlux)} g/m²·s`));
  return { massFlux, steps };
}
