// Checks the calculator math against the NUREG-1805 spreadsheets and other
// reference values. Runs with `npm test`, and automatically before every
// `npm run build` (including Netlify), so a change that breaks the math
// fails the build instead of going live.
//
// Expected values are copied from the spreadsheet cells named in each test.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toSI, fromSI, convertInput, KW_TO_BTU_PER_S } from '../src/calculations/units.js';
import { MATERIAL_PROPERTIES, heatReleaseRate } from '../src/calculations/hrr.js';
import { solveFlameHeight } from '../src/calculations/flameHeight.js';
import { pointSourceFlux } from '../src/calculations/pointSource.js';
import {
  MATERIALS, T_CHAR_SEC, flashoverHRR, heatTransferCoefficient, mqhHRR
} from '../src/calculations/flashover.js';
import { GROWTH_RATES, alphaSI, solveTSquared } from '../src/calculations/tSquared.js';

/** |actual - expected| within a relative tolerance (default 0.01%). */
const near = (actual, expected, rel = 1e-4, label = '') => {
  assert.ok(Number.isFinite(actual), `${label} not a number: ${actual}`);
  const tol = Math.abs(expected) * rel;
  assert.ok(Math.abs(actual - expected) <= tol,
    `${label} expected ${expected}, got ${actual} (tolerance ${tol})`);
};

// ---------------------------------------------------------------- units
test('units: round trips and known factors', () => {
  near(toSI(1, 'length', 'imperial'), 0.3048, 1e-12, 'ft→m');
  near(toSI(1, 'area', 'imperial'), 0.09290304, 1e-12, 'ft²→m²');
  near(toSI(1, 'hrr', 'imperial'), 1.055056, 1e-9, 'BTU/s→kW');
  near(fromSI(1, 'hrr', 'imperial'), 0.947817, 1e-6, 'kW→BTU/s');
  near(fromSI(1, 'heatFlux', 'imperial'), 0.088055, 1e-9, 'kW/m²→BTU/ft²·s');
  for (const q of ['length', 'area', 'hrr', 'alpha', 'heatFlux']) {
    near(fromSI(toSI(123.4, q, 'imperial'), q, 'imperial'), 123.4, 1e-12, `${q} round trip`);
    assert.equal(toSI(5, q, 'SI'), 5);
  }
  assert.equal(convertInput('10', 'length', true), '32.81');
  assert.equal(convertInput('32.81', 'length', false), '10.00');
  assert.equal(convertInput('', 'length', true), '');
});

// ---------------------------------------------------------------- flashover
// NUREG 13 (SI): 30.48 x 5.49 x 3.048 m, vent 0.914 x 2.44 m, concrete
test('flashover: NUREG 13 SI example (A_T, Babrauskas, Thomas)', () => {
  const r = flashoverHRR({ W: 30.48, L: 5.49, H: 3.048, wv: 0.914, hv: 2.44, material: 'concrete', units: 'SI' });
  near(r.AO, 2.23016, 1e-9, 'Av (E94)');
  near(r.AT, 551.71336, 1e-9, 'A_T (E107)');
  near(r.kW.babrauskas, 2612.715962583, 1e-9, 'Babrauskas (D131)');
  near(r.kW.thomas, 5620.17305314183, 1e-9, 'Thomas (D150)');
});

// NUREG 13 (English): 100 x 18 x 10 ft, vent 3 x 8 ft
test('flashover: NUREG 13 English example, feet in, kW and BTU/s out', () => {
  const r = flashoverHRR({ W: 100, L: 18, H: 10, wv: 3, hv: 8, material: 'concrete', units: 'imperial' });
  near(r.AT, 551.47244544, 1e-9, 'A_T (E107)');
  near(r.kW.babrauskas, 2611.28879542923, 1e-9, 'Babrauskas kW (J168)');
  near(r.kW.thomas, 5617.57462732833, 1e-9, 'Thomas kW (J172)');
  // Sheet uses 0.94785 for BTU/s; ours is 0.947817 (within 0.01%)
  near(r.babrauskas, 2475.1100847476, 1e-4, 'Babrauskas BTU/s (H168)');
  near(r.thomas, 5324.61811051316, 1e-4, 'Thomas BTU/s (H172)');
});

test('flashover: MQH equation reproduces NUREG with NUREG h_k = k/δ', () => {
  // The calculator uses h_k = sqrt(kρc/600 s) on purpose; plugging in NUREG's
  // h_k = k/δ (15.24 cm concrete) must give the sheet's MQH answer.
  const hk = 0.0016 / 0.1524;
  near(mqhHRR(hk, 551.71336, 2.23016, 2.44), 2740.11986260369, 1e-9, 'MQH (D113)');
});

test('flashover: materials and 600 s h_k', () => {
  assert.deepEqual(Object.keys(MATERIALS), ['gypsum', 'concrete', 'brick']);
  // NUREG / Klote & Milke k, ρ, c
  assert.deepEqual([MATERIALS.gypsum.k, MATERIALS.gypsum.ρ, MATERIALS.gypsum.c], [0.00017, 960, 1.1]);
  assert.deepEqual([MATERIALS.concrete.k, MATERIALS.concrete.ρ, MATERIALS.concrete.c], [0.0016, 2400, 0.75]);
  assert.deepEqual([MATERIALS.brick.k, MATERIALS.brick.ρ, MATERIALS.brick.c], [0.0008, 2600, 0.8]);
  assert.equal(T_CHAR_SEC, 600);
  near(heatTransferCoefficient(MATERIALS.concrete), Math.sqrt(0.0016 * 2400 * 0.75 / 600), 1e-12, 'h_k concrete');
});

// ---------------------------------------------------------------- flame height
// NUREG 04 Wall_Flame_Height: Q = 1525.168 kW, fire length √1.4 m
const Qw = 1525.16847167292, Ww = Math.sqrt(1.4);
test('flame height: NUREG 04 wall fire, SI and imperial', () => {
  near(solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: Qw, D: Ww }).value, 4.02699834491514, 1e-9, 'Hf (D145)');
  near(solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: Qw * KW_TO_BTU_PER_S, D: Ww / 0.3048, units: 'imperial' }).value,
    13.2119368271494, 1e-9, 'Hf ft (H145)');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'wall', L: 4.02699834491514, D: Ww }).value, Qw, 1e-9, 'back-solve Q');
  near(solveFlameHeight({ mode: 'diameter', location: 'wall', Q: Qw, L: 4.02699834491514 }).value, Ww, 1e-9, 'back-solve W');
});

// NUREG 04 Corner_Flame_Height: Q = 979.693 kW
const Qc = 979.692852669948;
test('flame height: NUREG 04 corner fire, SI and imperial', () => {
  near(solveFlameHeight({ mode: 'flameHeight', location: 'corner', Q: Qc }).value, 4.67428541519219, 1e-9, 'Hf (D118)');
  near(solveFlameHeight({ mode: 'flameHeight', location: 'corner', Q: Qc * KW_TO_BTU_PER_S, units: 'imperial' }).value,
    15.3355820708405, 1e-9, 'Hf ft (H118)');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'corner', L: 4.67428541519219 }).value, Qc, 1e-9, 'back-solve Q');
  assert.equal(solveFlameHeight({ mode: 'diameter', location: 'corner', Q: Qc, L: 4.67 }), null, 'corner has no size term');
});

test('flame height: Heskestad (middle of room)', () => {
  const L = 0.235 * 1000 ** 0.4 - 1.02 * 1;
  near(solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000, D: 1 }).value, L, 1e-12, 'L');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'center', L, D: 1 }).value, 1000, 1e-9, 'Q');
  near(solveFlameHeight({ mode: 'diameter', location: 'center', Q: 1000, L }).value, 1, 1e-9, 'D');
  // imperial: same fire in ft and BTU/s
  const ft = solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000 * KW_TO_BTU_PER_S, D: 1 / 0.3048, units: 'imperial' });
  near(ft.value, L / 0.3048, 1e-9, 'L ft');
  const q = solveFlameHeight({ mode: 'heatRelease', location: 'center', L: L / 0.3048, D: 1 / 0.3048, units: 'imperial' });
  near(q.kW, 1000, 1e-9, 'kW alongside BTU/s');
});

// ---------------------------------------------------------------- point source
// NUREG 05.1 Point Source: heptane, A = 117.15 m², edge distance 29.87 m
test('point source: NUREG 05.1 example', () => {
  const Q = 527713.117489372;                 // F24
  const R = 35.9765541151751;                 // E108 = L + D/2
  const r = pointSourceFlux({ Q, R, chi: 0.3 });
  near(r.kWm2, 9.7335250964314, 1e-9, "q'' kW/m² (C115)");
  // Sheet's BTU/ft²·s: q'' × 317 / 3600 (E115)
  const ri = pointSourceFlux({ Q: Q * KW_TO_BTU_PER_S, R: R / 0.3048, chi: 0.3, units: 'imperial' });
  near(ri.kWm2, 9.7335250964314, 1e-9, "q'' from imperial inputs");
  near(ri.value, 0.857090959880209, 1e-4, "q'' BTU/ft²·s (E115)");
});

// ---------------------------------------------------------------- HRR
test('HRR: Q = m" A ΔHc with Quintiere (2016) values', () => {
  const g = MATERIAL_PROPERTIES.gasoline;
  assert.deepEqual([g.massFlux, g.heatOfCombustion], [55, 43.7]);
  near(heatReleaseRate({ massFlux: g.massFlux, heatOfCombustion: g.heatOfCombustion, area: 1 }).kW, 2403.5, 1e-12, '1 m² gasoline');
  const imp = heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 1 / 0.09290304, units: 'imperial' });
  near(imp.kW, 2403.5, 1e-9, '10.76 ft² gasoline, kW');
  near(imp.value, 2403.5 * KW_TO_BTU_PER_S, 1e-9, 'BTU/s');
  // Spot checks against the Quintiere table (range midpoints)
  assert.equal(MATERIAL_PROPERTIES.heptane.massFlux, 70);            // 65-75
  assert.equal(MATERIAL_PROPERTIES.liquefied_propane.massFlux, 115); // 100-130
  assert.equal(MATERIAL_PROPERTIES.flexible_polyurethane_foam.massFlux, 24); // 21-27
  // Lab-measured materials stay input-only
  for (const key of ['kerosene', 'ethanol', 'douglas_fir', 'plywood']) {
    assert.equal(MATERIAL_PROPERTIES[key].massFlux, undefined, `${key} should ask for mass flux`);
  }
});

// ---------------------------------------------------------------- t-squared
test('t-squared: standard α reach 1055 kW (1000 BTU/s) at t_g', () => {
  const tg = { slow: 600, medium: 300, fast: 150, ultrafast: 75 };
  for (const [rate, t] of Object.entries(tg)) {
    near(GROWTH_RATES[rate] * t * t, 1055, 2.5e-3, `${rate} at ${t} s`);
  }
});

test('t-squared: custom α entered in BTU/s³ is converted (imperial)', () => {
  const alphaKW = 0.0469;
  const alphaBTU = alphaKW * KW_TO_BTU_PER_S;
  const a = alphaSI({ growthRate: 'custom', customAlpha: String(alphaBTU), units: 'imperial' });
  near(a, alphaKW, 1e-9, 'α back in kW/s²');
  const r = solveTSquared({ mode: 'heatRelease', alpha: a, t: 100, units: 'imperial' });
  near(r.value, alphaBTU * 100 * 100, 1e-9, 'Q in BTU/s = α(BTU/s³) t²');
  const t = solveTSquared({ mode: 'time', alpha: a, Q: 1000, units: 'imperial' });
  near(t.value, Math.sqrt(1000 / alphaBTU), 1e-9, 'time to 1000 BTU/s');
});
