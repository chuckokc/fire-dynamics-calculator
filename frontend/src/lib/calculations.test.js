import { describe, expect, it } from 'vitest';
import {
  computeFlameHeight,
  computeFlashover,
  computeHeatRelease,
  computePointSource,
  computeTSquared,
} from './calculations';

describe('computeHeatRelease', () => {
  it('lists what is still missing', () => {
    expect(computeHeatRelease({ material: '', burningArea: '' }, 'SI')).toEqual({
      status: 'empty',
      missing: ['material', 'burning area'],
    });
  });

  it('asks for mass flux when the material has none', () => {
    const result = computeHeatRelease({ material: 'kerosene', burningArea: '1', massFlux: '' }, 'SI');
    expect(result).toMatchObject({ status: 'empty', missing: ['mass flux'] });
  });

  it('converts an imperial area before calculating', () => {
    // 10 ft² of gasoline = 0.929 m² × 55 × 43.7 = 2,232.9 kW = 2,116.4 BTU/s
    const result = computeHeatRelease({ material: 'gasoline', burningArea: '10' }, 'imperial');
    expect(result.status).toBe('ok');
    expect(result.hrrSI).toBeCloseTo(2232.9, 1);
    expect(result.hrr).toBeCloseTo(2116.4, 1);
  });

  it('flags input that is not a positive number', () => {
    expect(computeHeatRelease({ material: 'gasoline', burningArea: '-2' }, 'SI').status).toBe('invalid');
    expect(computeHeatRelease({ material: 'gasoline', burningArea: 'abc' }, 'SI').status).toBe('invalid');
  });
});

describe('computeFlameHeight', () => {
  it('returns no result until both inputs are entered (no stale results)', () => {
    expect(computeFlameHeight({ mode: 'flameHeight', heatRelease: '500', diameter: '' }, 'SI').status).toBe('empty');
  });

  it('gives the same flame height in either unit system', () => {
    const si = computeFlameHeight({ mode: 'flameHeight', heatRelease: '500', diameter: '1' }, 'SI');
    const imperial = computeFlameHeight(
      { mode: 'flameHeight', heatRelease: String(500 / 1.05505585262), diameter: String(1 / 0.3048) },
      'imperial',
    );
    expect(si.value).toBeCloseTo(1.8026, 4);
    expect(imperial.valueSI).toBeCloseTo(si.valueSI, 9);
    expect(imperial.value).toBeCloseTo(1.8026 / 0.3048, 3);
  });

  it('explains a zero or negative flame height instead of showing N/A', () => {
    const result = computeFlameHeight({ mode: 'flameHeight', heatRelease: '500', diameter: '3' }, 'SI');
    expect(result.status).toBe('warning');
    expect(result.message).toMatch(/too large for this heat release rate/);
  });

  it('explains when no diameter can produce the flame height', () => {
    const result = computeFlameHeight({ mode: 'diameter', heatRelease: '500', flameHeight: '5' }, 'SI');
    expect(result.status).toBe('warning');
    expect(result.message).toMatch(/No fire diameter/);
  });
});

describe('computePointSource', () => {
  it('rates the flux against the critical values', () => {
    const result = computePointSource({ heatRelease: '1000', distance: '3', radiativeFraction: '0.3' }, 'SI');
    expect(result.fluxSI).toBeCloseTo(2.6526, 4);
    expect(result.highestExceeded).toMatchObject({ value: 2.5 });
    const levels = Object.fromEntries(result.thresholds.map((t) => [t.description, t.level]));
    expect(levels['Tenability limit for humans']).toBe('exceeded');
    expect(levels['Operational limit for firefighters in gear']).toBe('below');
  });

  it('rejects a radiative fraction above 1', () => {
    expect(computePointSource({ heatRelease: '1000', distance: '3', radiativeFraction: '1.5' }, 'SI').status).toBe(
      'invalid',
    );
  });
});

describe('computeFlashover', () => {
  it('gives the same answer for the same room in feet', () => {
    const si = computeFlashover(
      { roomLength: '4', roomWidth: '3', roomHeight: '2.4', ventWidth: '0.9', ventHeight: '2', wall: 'gypsum' },
      'SI',
    );
    const ft = (m) => String(m / 0.3048);
    const imperial = computeFlashover(
      { roomLength: ft(4), roomWidth: ft(3), roomHeight: ft(2.4), ventWidth: ft(0.9), ventHeight: ft(2), wall: 'gypsum' },
      'imperial',
    );
    expect(si.mqh).toBeCloseTo(971.46, 2);
    expect(imperial.si.mqh).toBeCloseTo(si.mqh, 6);
    expect(imperial.mqh).toBeCloseTo(971.46 / 1.05505585262, 2);
  });
});

describe('computeTSquared', () => {
  it('uses a custom α typed in BTU/s³ without converting it twice', () => {
    // 0.05 BTU/s³ × (100 s)² = 500 BTU/s. Before the fix this showed 473.9.
    const result = computeTSquared(
      { mode: 'heatRelease', growthRate: 'custom', customAlpha: '0.05', time: '100', timeUnit: 's' },
      'imperial',
    );
    expect(result.hrr).toBeCloseTo(500, 9);
  });

  it('solves for time with a custom imperial α', () => {
    const result = computeTSquared(
      { mode: 'time', growthRate: 'custom', customAlpha: '0.05', heatRelease: '500' },
      'imperial',
    );
    expect(result.timeS).toBeCloseTo(100, 9);
  });

  it('accepts time in minutes', () => {
    const result = computeTSquared({ mode: 'heatRelease', growthRate: 'medium', time: '5', timeUnit: 'min' }, 'SI');
    expect(result.timeS).toBe(300);
    expect(result.hrr).toBeCloseTo(1054.8, 6);
  });
});
