// Reference data used by the calculators.

// Heat of combustion ΔHc (kJ/g) and, where published, mass flux ṁ" (g/m²·s).
export const FUELS = {
  // Liquids
  liquefied_propane: { type: 'Liquids', name: 'Liquefied Propane', heatOfCombustion: 46.5, massFlux: 115.0 },
  liquefied_natural_gas: { type: 'Liquids', name: 'Liquefied Natural Gas', heatOfCombustion: 50.0, massFlux: 90.0 },
  benzene: { type: 'Liquids', name: 'Benzene', heatOfCombustion: 40.0, massFlux: 90.0 },
  butane: { type: 'Liquids', name: 'Butane', heatOfCombustion: 45.7, massFlux: 80.0 },
  hexane: { type: 'Liquids', name: 'Hexane', heatOfCombustion: 43.8, massFlux: 75.0 },
  xylene: { type: 'Liquids', name: 'Xylene', heatOfCombustion: 40.0, massFlux: 70.0 },
  'jp-4': { type: 'Liquids', name: 'JP-4', heatOfCombustion: 43.2, massFlux: 60.0 },
  heptane: { type: 'Liquids', name: 'Heptane', heatOfCombustion: 44.6, massFlux: 70.0 },
  gasoline: { type: 'Liquids', name: 'Gasoline', heatOfCombustion: 43.7, massFlux: 55.0 },
  acetone: { type: 'Liquids', name: 'Acetone', heatOfCombustion: 30.8, massFlux: 40.0 },
  methanol: { type: 'Liquids', name: 'Methanol', heatOfCombustion: 19.8, massFlux: 22.0 },
  kerosene: { type: 'Liquids', name: 'Kerosene', heatOfCombustion: 43.2 },
  ethanol: { type: 'Liquids', name: 'Ethanol', heatOfCombustion: 26.8 },

  // Polymers and solids
  hdpe: { type: 'Polymers', name: 'High-density Polyethylene (HDPE)', heatOfCombustion: 40.0 },
  polyethylene: { type: 'Polymers', name: 'Polyethylene', heatOfCombustion: 43.4 },
  polypropylene: { type: 'Polymers', name: 'Polypropylene', heatOfCombustion: 44.0 },
  polystyrene: { type: 'Polymers', name: 'Polystyrene', heatOfCombustion: 35.8 },
  polystyrene_granular: { type: 'Polymers', name: 'Polystyrene (Granular)', heatOfCombustion: 35.8, massFlux: 38.0 },
  pmma_granular: { type: 'Polymers', name: 'PMMA (Granular)', heatOfCombustion: 24.2, massFlux: 28.0 },
  polyethylene_granular: { type: 'Polymers', name: 'Polyethylene (Granular)', heatOfCombustion: 43.4, massFlux: 26.0 },
  polypropylene_granular: { type: 'Polymers', name: 'Polypropylene (Granular)', heatOfCombustion: 44.0, massFlux: 24.0 },
  nylon: { type: 'Polymers', name: 'Nylon', heatOfCombustion: 27.9 },
  nylon_6: { type: 'Polymers', name: 'Nylon 6', heatOfCombustion: 28.8 },
  abs: { type: 'Polymers', name: 'ABS', heatOfCombustion: 30.0 },
  abs_fr: { type: 'Polymers', name: 'ABS-FR', heatOfCombustion: 11.7 },
  rigid_polyurethane_foam: { type: 'Polymers', name: 'Rigid Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 23.5 },
  flexible_polyurethane_foam: { type: 'Polymers', name: 'Flexible Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 24.0 },
  pvc_granular: { type: 'Polymers', name: 'PVC (Granular)', heatOfCombustion: 10.0, massFlux: 16.0 },

  // Woods and cellulosics
  corrugated_paper: { type: 'Woods', name: 'Corrugated Paper', heatOfCombustion: 13.2, massFlux: 14.0 },
  wood_crib: { type: 'Woods', name: 'Wood Crib', heatOfCombustion: 14.7, massFlux: 11.0 },
  douglas_fir: { type: 'Woods', name: 'Douglas Fir', heatOfCombustion: 14.7 },
  hemlock: { type: 'Woods', name: 'Hemlock', heatOfCombustion: 13.3 },
  plywood: { type: 'Woods', name: 'Plywood', heatOfCombustion: 11.9 },
  plywood_fr: { type: 'Woods', name: 'Plywood FR', heatOfCombustion: 11.2 },
};

export const FUEL_GROUPS = Object.entries(FUELS).reduce((groups, [key, fuel]) => {
  (groups[fuel.type] ||= []).push({ key, ...fuel });
  return groups;
}, {});

// Wall thermal properties for MQH (NUREG-1805 / SFPE Handbook).
// k in kW/m·K, rho in kg/m³, c in kJ/kg·K.
export const WALL_MATERIALS = {
  gypsum: { name: 'Gypsum Board', k: 0.00017, rho: 960, c: 1.1 },
  concrete: { name: 'Concrete', k: 0.0016, rho: 2400, c: 0.75 },
  brick: { name: 'Brick', k: 0.0008, rho: 2600, c: 0.92 },
};

// Characteristic time after ignition for h_k (NUREG-1805 transient regime).
export const FLASHOVER_TIME_S = 600;

// Standard t-squared growth coefficients α (kW/s²).
export const GROWTH_RATES = {
  slow: { name: 'Slow', alpha: 0.00293, color: '#48BB78' },
  medium: { name: 'Medium', alpha: 0.01172, color: '#D69E2E' },
  fast: { name: 'Fast', alpha: 0.0469, color: '#ED8936' },
  ultrafast: { name: 'Ultra-fast', alpha: 0.1876, color: '#E53E3E' },
};

export const CUSTOM_GROWTH_COLOR = '#805AD5';

// Critical heat flux values (kW/m²) from NFPA 921 (2024 ed.) Table 5.5.4.2
// plus SCBA research, highest first.
export const CRITICAL_HEAT_FLUX = [
  { value: 170, description: 'Maximum in postflashover compartment' },
  { value: 80, description: 'Protective clothing TPP test' },
  { value: 52, description: 'Fiberboard ignites (5 s)' },
  { value: 20, description: 'Residential floor at flashover' },
  { value: 20, description: 'Pain (2 s exposure), blisters (4 s)' },
  { value: 15, description: 'Pain (3 s exposure), blisters (6 s)' },
  { value: 12.5, description: 'Wood ignites with pilot' },
  { value: 10, description: 'SCBA facepiece lens failure (holes)' },
  { value: 10, description: 'Pain (5 s exposure), blisters (10 s)' },
  { value: 5, description: 'SCBA facepiece lens degradation onset' },
  { value: 5, description: 'Pain (13 s exposure), blisters (29 s)' },
  { value: 4.5, description: 'Operational limit for firefighters in gear' },
  { value: 2.5, description: 'Common firefighting exposure' },
  { value: 2.5, description: 'Pain (33 s exposure), blisters (79 s)' },
  { value: 1.7, description: 'Tenability limit for humans' },
  { value: 1.0, description: 'Normal solar radiation (clear day)' },
];

// Zones drawn on the radiation diagram (kW/m²), lowest flux first.
export const RADIATION_ZONES = [
  { name: 'Tenability limit', flux: 1.7, color: 'green.500', fill: 'green.100' },
  { name: 'Firefighter gear working limit', flux: 4.5, color: 'yellow.500', fill: 'yellow.100' },
  { name: 'SCBA lens degradation', flux: 5, color: 'orange.500', fill: 'orange.100' },
  { name: 'Flashover conditions', flux: 20, color: 'red.600', fill: 'red.100' },
];

export const RADIATIVE_FRACTIONS = {
  Propane: '0.28–0.30',
  Methanol: '0.19–0.22',
  Gasoline: '0.30–0.35',
  Wood: '0.25–0.35',
  Plastics: '0.30–0.40',
};

export const COMMON_HRR = {
  'Wastepaper basket': '4–8 kW',
  'Office chair': '100–400 kW',
  Sofa: '1,500–3,000 kW',
  'Christmas tree': '3,000–5,000 kW',
  'Car (peak)': '4,000–5,000 kW',
};
