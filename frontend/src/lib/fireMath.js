// Fire dynamics correlations (NUREG-1805 methodology). Every function takes
// and returns SI units: kW, m, m², s, kW/m², kW/s², g/m²·s, kJ/g.

// Heat release rate: Q̇ = ṁ" × A × ΔHc
// ṁ" in g/m²·s, A in m², ΔHc in kJ/g  ->  kJ/s = kW
export function heatReleaseRate({ massFlux, area, heatOfCombustion }) {
  return massFlux * area * heatOfCombustion;
}

// Heskestad's correlation: L = 0.235 Q̇^(2/5) − 1.02 D
export function heskestadFlameHeight({ hrr, diameter }) {
  return 0.235 * Math.pow(hrr, 0.4) - 1.02 * diameter;
}

// Heskestad solved for Q̇: Q̇ = ((L + 1.02 D) / 0.235)^(5/2)
export function heskestadHeatRelease({ flameHeight, diameter }) {
  return Math.pow((flameHeight + 1.02 * diameter) / 0.235, 2.5);
}

// Heskestad solved for D: D = (0.235 Q̇^(2/5) − L) / 1.02
export function heskestadDiameter({ hrr, flameHeight }) {
  return (0.235 * Math.pow(hrr, 0.4) - flameHeight) / 1.02;
}

// Point source radiation: q" = χr Q̇ / (4π R²)
export function pointSourceFlux({ hrr, distance, radiativeFraction }) {
  return (radiativeFraction * hrr) / (4 * Math.PI * distance * distance);
}

// Distance at which the point source model gives a heat flux of q".
export function pointSourceDistance({ hrr, radiativeFraction, heatFlux }) {
  return Math.sqrt((radiativeFraction * hrr) / (4 * Math.PI * heatFlux));
}

// Minimum heat release rate for flashover (MQH, Thomas, Babrauskas).
// wall: { k (kW/m·K), rho (kg/m³), c (kJ/kg·K) }; time is the characteristic
// time after ignition used for the wall heat transfer coefficient h_k.
export function flashoverHrr({ roomLength, roomWidth, roomHeight, ventWidth, ventHeight, wall, time = 600 }) {
  const totalArea = 2 * (roomLength * roomWidth + roomLength * roomHeight + roomWidth * roomHeight);
  const ventArea = ventWidth * ventHeight;
  const ventFactor = ventArea * Math.sqrt(ventHeight); // A_o √H_o
  // h_k = √(kρc / t) for the transient regime (t < t_p)
  const hk = Math.sqrt((wall.k * wall.rho * wall.c) / time);
  return {
    totalArea,
    ventArea,
    hk,
    mqh: 610 * Math.sqrt(hk * totalArea * ventFactor),
    thomas: 7.8 * totalArea + 378 * ventFactor,
    babrauskas: 750 * ventFactor,
  };
}

// T-squared fire growth: Q̇ = α t²
export const tSquaredHrr = ({ alpha, time }) => alpha * time * time;

// T-squared solved for time: t = √(Q̇ / α)
export const tSquaredTime = ({ alpha, hrr }) => Math.sqrt(hrr / alpha);
