import { describe, expect, it } from 'vitest';
import {
  flashoverHrr,
  heatReleaseRate,
  heskestadDiameter,
  heskestadFlameHeight,
  heskestadHeatRelease,
  pointSourceDistance,
  pointSourceFlux,
  tSquaredHrr,
  tSquaredTime,
} from './fireMath';
import { GROWTH_RATES, WALL_MATERIALS } from './materials';

describe('heat release rate', () => {
  it('multiplies mass flux, area and heat of combustion', () => {
    // Gasoline: 55 g/m²·s × 1 m² × 43.7 kJ/g
    expect(heatReleaseRate({ massFlux: 55, area: 1, heatOfCombustion: 43.7 })).toBeCloseTo(2403.5, 6);
  });
});

describe("Heskestad's correlation", () => {
  it('gives the flame height for a 500 kW, 1 m fire', () => {
    expect(heskestadFlameHeight({ hrr: 500, diameter: 1 })).toBeCloseTo(1.8026, 4);
  });

  it('solves back for heat release rate and diameter', () => {
    const flameHeight = heskestadFlameHeight({ hrr: 500, diameter: 1 });
    expect(heskestadHeatRelease({ flameHeight, diameter: 1 })).toBeCloseTo(500, 6);
    expect(heskestadDiameter({ hrr: 500, flameHeight })).toBeCloseTo(1, 6);
  });

  it('goes negative when the diameter is too large for the HRR', () => {
    expect(heskestadFlameHeight({ hrr: 500, diameter: 3 })).toBeLessThan(0);
  });
});

describe('point source radiation', () => {
  it('gives the flux for 1,000 kW at 3 m with χr = 0.3', () => {
    expect(pointSourceFlux({ hrr: 1000, distance: 3, radiativeFraction: 0.3 })).toBeCloseTo(2.6526, 4);
  });

  it('inverts to the distance for a given flux', () => {
    expect(pointSourceDistance({ hrr: 1000, radiativeFraction: 0.3, heatFlux: 2.6526 })).toBeCloseTo(3, 3);
  });
});

describe('flashover correlations', () => {
  // 4 × 3 × 2.4 m gypsum room with a 0.9 × 2 m door, checked by hand:
  // A_T = 57.6 m², A_o√H_o = 2.5456, h_k = √(0.17952 / 600) = 0.017297
  const result = flashoverHrr({
    roomLength: 4,
    roomWidth: 3,
    roomHeight: 2.4,
    ventWidth: 0.9,
    ventHeight: 2,
    wall: WALL_MATERIALS.gypsum,
    time: 600,
  });

  it('computes the room geometry', () => {
    expect(result.totalArea).toBeCloseTo(57.6, 9);
    expect(result.ventArea).toBeCloseTo(1.8, 9);
    expect(result.hk).toBeCloseTo(0.017297, 6);
  });

  it('computes MQH without square-rooting A_o', () => {
    expect(result.mqh).toBeCloseTo(971.46, 2);
  });

  it('computes Thomas and Babrauskas', () => {
    expect(result.thomas).toBeCloseTo(1411.51, 2);
    expect(result.babrauskas).toBeCloseTo(1909.19, 2);
  });
});

describe('t-squared growth', () => {
  it('reaches about 1 MW at 300 s for a medium fire', () => {
    expect(tSquaredHrr({ alpha: GROWTH_RATES.medium.alpha, time: 300 })).toBeCloseTo(1054.8, 6);
  });

  it('solves for the time to a heat release rate', () => {
    expect(tSquaredTime({ alpha: GROWTH_RATES.fast.alpha, hrr: 1055 })).toBeCloseTo(149.98, 2);
  });
});
