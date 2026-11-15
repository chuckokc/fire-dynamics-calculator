// Checks the calculator math against the NUREG-1805 spreadsheets and other
// reference values. Runs with `npm test`, and automatically before every
// `npm run build` (including Netlify), so a change that breaks the math
// fails the build instead of going live.
//
// Expected values are copied from the spreadsheet cells named in each test.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { toSI, fromSI, convertInput, unitLabel, DEFAULT_UNITS } from '../src/calculations/units.js';
import { MATERIAL_PROPERTIES, heatReleaseRate, labMassFlux } from '../src/calculations/hrr.js';
import { solveFlameHeight } from '../src/calculations/flameHeight.js';
import { pointSourceFlux, centerDistance } from '../src/calculations/pointSource.js';
import {
  MATERIALS, T_CHAR_SEC, flashoverHRR, heatTransferCoefficient, mqhHRR, compareFire
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
test('units: feet and meters convert both ways, and only lengths and areas change', () => {
  near(toSI(1, 'length', 'feet'), 0.3048, 1e-12, 'ft→m');
  near(toSI(1, 'area', 'feet'), 0.09290304, 1e-12, 'ft²→m²');
  near(fromSI(1, 'length', 'feet'), 3.28084, 1e-5, 'm→ft');
  for (const q of ['length', 'area']) {
    near(fromSI(toSI(123.4, q, 'feet'), q, 'feet'), 123.4, 1e-12, `${q} round trip`);
    assert.equal(toSI(5, q, 'metric'), 5, `${q} unchanged in metric`);
    assert.equal(fromSI(5, q, 'metric'), 5, `${q} unchanged in metric`);
  }
  assert.equal(convertInput('10', 'length', true), '32.808');
  assert.equal(convertInput('', 'length', true), '');
  // A round trip gives back what was typed, so switching units never nudges an answer
  for (const typed of ['10', '3.5', '12.25', '30']) {
    const inMeters = convertInput(typed, 'length', false);
    assert.equal(convertInput(inMeters, 'length', true), typed, `${typed} ft → ${inMeters} m → ft`);
  }
  // Other values can differ in the fifth digit (6.7 ft → 2.0422 m → 6.7001 ft), far below what any answer shows
  for (const typed of ['6.7', '8', '13.37', '0.5']) {
    const back = convertInput(convertInput(typed, 'length', false), 'length', true);
    near(parseFloat(back), parseFloat(typed), 2e-5, `${typed} ft round trip`);
  }
  for (const typed of ['10', '8', '2.5']) {
    const back = convertInput(convertInput(typed, 'area', false), 'area', true);
    near(parseFloat(back), parseFloat(typed), 1e-4, `${typed} ft² round trip`);
  }
  assert.equal(convertInput('10', 'length', false), '3.048', '10 ft shown to the millimeter');
  assert.equal(convertInput('10', 'area', false), '0.92903');
  assert.equal(DEFAULT_UNITS, 'feet');
});

test('units: energy is always kW, whatever the length unit', () => {
  for (const units of ['metric', 'feet']) {
    assert.equal(unitLabel('hrr', units), 'kW');
    assert.equal(unitLabel('alpha', units), 'kW/s²');
    assert.equal(unitLabel('heatFlux', units), 'kW/m²');
  }
  assert.equal(unitLabel('length', 'feet'), 'ft');
  assert.equal(unitLabel('length', 'metric'), 'm');
  assert.equal(unitLabel('area', 'feet'), 'ft²');
  assert.equal(unitLabel('area', 'metric'), 'm²');
});

test('units: a leftover unit name or an energy quantity fails loudly, never quietly wrong', () => {
  // 'SI' and 'imperial' were the old names. Treated as metric they would give wrong numbers.
  for (const stale of ['SI', 'imperial', undefined]) {
    assert.throws(() => toSI(1, 'length', stale), /Unknown unit system/);
    assert.throws(() => fromSI(1, 'length', stale), /Unknown unit system/);
    assert.throws(() => unitLabel('length', stale), /Unknown unit system/);
  }
  for (const energy of ['hrr', 'alpha', 'heatFlux']) {
    assert.throws(() => toSI(1, energy, 'feet'), /only length and area/);
  }
});

// ---------------------------------------------------------------- flashover
// NUREG 13 (SI): 30.48 x 5.49 x 3.048 m, vent 0.914 x 2.44 m, concrete
test('flashover: NUREG 13 metric example (A_T, Babrauskas, Thomas)', () => {
  const r = flashoverHRR({ W: 30.48, L: 5.49, H: 3.048, wv: 0.914, hv: 2.44, material: 'concrete', units: 'metric' });
  near(r.AO, 2.23016, 1e-9, 'Av (E94)');
  near(r.AT, 551.71336, 1e-9, 'A_T (E107)');
  near(r.kW.babrauskas, 2612.715962583, 1e-9, 'Babrauskas (D131)');
  near(r.kW.thomas, 5620.17305314183, 1e-9, 'Thomas (D150)');
});

// NUREG 13 (English): 100 x 18 x 10 ft, vent 3 x 8 ft
test('flashover: NUREG 13 English example, feet in, kW out', () => {
  const r = flashoverHRR({ W: 100, L: 18, H: 10, wv: 3, hv: 8, material: 'concrete', units: 'feet' });
  near(r.AT, 551.47244544, 1e-9, 'A_T (E107)');
  near(r.kW.babrauskas, 2611.28879542923, 1e-9, 'Babrauskas kW (J168)');
  near(r.kW.thomas, 5617.57462732833, 1e-9, 'Thomas kW (J172)');
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
test('flame height: NUREG 04 wall fire, meters and feet', () => {
  near(solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: Qw, D: Ww }).value, 4.02699834491514, 1e-9, 'Hf (D145)');
  near(solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: Qw, D: Ww / 0.3048, units: 'feet' }).value,
    13.2119368271494, 1e-9, 'Hf ft (H145)');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'wall', L: 4.02699834491514, D: Ww }).value, Qw, 1e-9, 'back-solve Q');
  near(solveFlameHeight({ mode: 'diameter', location: 'wall', Q: Qw, L: 4.02699834491514 }).value, Ww, 1e-9, 'back-solve W');
});

// NUREG 04 Corner_Flame_Height: Q = 979.693 kW
const Qc = 979.692852669948;
test('flame height: NUREG 04 corner fire, meters and feet', () => {
  near(solveFlameHeight({ mode: 'flameHeight', location: 'corner', Q: Qc }).value, 4.67428541519219, 1e-9, 'Hf (D118)');
  near(solveFlameHeight({ mode: 'flameHeight', location: 'corner', Q: Qc, units: 'feet' }).value,
    15.3355820708405, 1e-9, 'Hf ft (H118)');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'corner', L: 4.67428541519219 }).value, Qc, 1e-9, 'back-solve Q');
  assert.equal(solveFlameHeight({ mode: 'diameter', location: 'corner', Q: Qc, L: 4.67 }), null, 'corner has no size term');
});

test('flame height: Heskestad (middle of room)', () => {
  const L = 0.235 * 1000 ** 0.4 - 1.02 * 1;
  near(solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000, D: 1 }).value, L, 1e-12, 'L');
  near(solveFlameHeight({ mode: 'heatRelease', location: 'center', L, D: 1 }).value, 1000, 1e-9, 'Q');
  near(solveFlameHeight({ mode: 'diameter', location: 'center', Q: 1000, L }).value, 1, 1e-9, 'D');
  // feet: the same fire with the lengths in ft and the heat release still in kW
  const ft = solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000, D: 1 / 0.3048, units: 'feet' });
  near(ft.value, L / 0.3048, 1e-9, 'L ft');
  near(ft.valueM, L, 1e-12, 'the same height in meters');
  const q = solveFlameHeight({ mode: 'heatRelease', location: 'center', L: L / 0.3048, D: 1 / 0.3048, units: 'feet' });
  near(q.value, 1000, 1e-9, 'Q kW');
  const d = solveFlameHeight({ mode: 'diameter', location: 'center', Q: 1000, L: L / 0.3048, units: 'feet' });
  near(d.value, 1 / 0.3048, 1e-9, 'D ft');
  near(d.valueM, 1, 1e-9, 'D m');
});

// ---------------------------------------------------------------- point source
// NUREG 05.1 Point Source: heptane, A = 117.15 m², edge distance 29.87 m
test('point source: NUREG 05.1 example', () => {
  const Q = 527713.117489372;                 // F24
  const R = 35.9765541151751;                 // E108 = L + D/2
  const r = pointSourceFlux({ Q, R, chi: 0.3 });
  near(r.kWm2, 9.7335250964314, 1e-9, "q'' kW/m² (C115)");
  // distance in feet, heat release in kW, flux still in kW/m²
  const ri = pointSourceFlux({ Q, R: R / 0.3048, chi: 0.3, units: 'feet' });
  near(ri.kWm2, 9.7335250964314, 1e-9, "q'' from distance in feet");
});

// ---------------------------------------------------------------- HRR
test('HRR: Q = m" A ΔHc with Quintiere (2016) values', () => {
  const g = MATERIAL_PROPERTIES.gasoline;
  assert.deepEqual([g.massFlux, g.heatOfCombustion], [55, 43.7]);
  near(heatReleaseRate({ massFlux: g.massFlux, heatOfCombustion: g.heatOfCombustion, area: 1 }).kW, 2403.5, 1e-12, '1 m² gasoline');
  const imp = heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 1 / 0.09290304, units: 'feet' });
  near(imp.kW, 2403.5, 1e-9, '10.76 ft² gasoline, kW');
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

test('t-squared: everything is kW and seconds, with a custom α in kW/s²', () => {
  const a = alphaSI({ growthRate: 'custom', customAlpha: '0.0469' });
  near(a, 0.0469, 1e-12, 'custom α is used as entered');
  near(alphaSI({ growthRate: 'fast' }), GROWTH_RATES.fast, 1e-12, 'standard rate');
  assert.equal(alphaSI({ growthRate: 'custom', customAlpha: '' }), 0, 'no α yet');
  const r = solveTSquared({ mode: 'heatRelease', alpha: a, t: 100 });
  near(r.value, 469, 1e-9, 'Q = α t²');
  assert.equal(r.unit, 'kW');
  const t = solveTSquared({ mode: 'time', alpha: a, Q: 1000 });
  near(t.value, Math.sqrt(1000 / 0.0469), 1e-9, 'time to 1000 kW');
  assert.equal(t.unit, 'seconds');
});

// ---------------------------------------------------------------- classroom features
test('point source: edge distance + diameter gives NUREG center distance (05.1 E108)', () => {
  const D = 12.2131082303502;                         // E83 = √(4 × 117.15 / π)
  near(centerDistance(29.87, D), 35.9765541151751, 1e-12, 'R = L + D/2 (E108)');
  const r = pointSourceFlux({ Q: 527713.117489372, chi: 0.3, edgeDistance: 29.87, diameter: D });
  near(r.R_m, 35.9765541151751, 1e-12, 'R used');
  near(r.kWm2, 9.7335250964314, 1e-9, "q'' (C115)");
  const ri = pointSourceFlux({ Q: 527713.117489372, chi: 0.3, edgeDistance: 29.87 / 0.3048, diameter: D / 0.3048, units: 'feet' });
  near(ri.kWm2, 9.7335250964314, 1e-9, "q'' from edge distance and diameter in feet");
  assert.ok(r.steps.some((st) => st.formula === 'R = L + D/2'), 'shows R = L + D/2 step');
});

test('lab helper: mass flux from a burn', () => {
  const r = labMassFlux({ initialMass: 250, finalMass: 200, time: 100, area: 0.01 });
  near(r.massFlux, 50, 1e-12, '50 g over 0.01 m² in 100 s');            // 50 / (0.01 × 100)
  const ri = labMassFlux({ initialMass: 250, finalMass: 200, time: 100, area: 0.01 / 0.09290304, units: 'feet' });
  near(ri.massFlux, 50, 1e-9, 'same sample in ft²');
  assert.ok(labMassFlux({ initialMass: 200, finalMass: 250, time: 100, area: 0.01 }).error, 'mass gain is an error');
  assert.ok(labMassFlux({ initialMass: 250, finalMass: 200, time: 0, area: 0.01 }).error, 'zero time is an error');
  assert.equal(labMassFlux({ initialMass: 250, finalMass: NaN, time: 100, area: 0.01 }), null, 'incomplete input');
});

test('flashover: compare a fire with the three estimates', () => {
  const kW = { mqh: 1017, babrauskas: 1988, thomas: 1474 };
  assert.deepEqual(compareFire(1500, kW), { mqh: true, babrauskas: false, thomas: true, count: 2 });
  assert.equal(compareFire(500, kW).count, 0);
  assert.equal(compareFire(2500, kW).count, 3);
});

test('show the work: steps end with the same answer', () => {
  const hrr = heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 1 });
  assert.equal(hrr.steps.at(-1).result, '2,404 kW');
  const fo = flashoverHRR({ W: 30.48, L: 5.49, H: 3.048, wv: 0.914, hv: 2.44, material: 'concrete', units: 'metric' });
  assert.equal(fo.steps.find((st) => st.label === 'Babrauskas').result, '2,613 kW');
  assert.ok(fo.steps.some((st) => st.formula === 'A_T = 2(LW + LH + WH) − Aₒ'));
  const fh = solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: 1525.16847167292, D: Math.sqrt(1.4) });
  assert.equal(fh.steps.at(-2).result, '4.027 m', 'the answer in meters');
  assert.equal(fh.steps.at(-1).result, '13.21 ft', 'then the same height in feet, for reference');
  assert.match(fh.steps.at(-1).label, /for reference/);
  const t2 = solveTSquared({ mode: 'heatRelease', alpha: 0.0469, t: 100 });
  assert.equal(t2.steps.at(-1).result, '469 kW');
});

// ---------------------------------------------------------------- feet and meters in the working
test('show the work: feet are converted to meters step by step, with the factor shown', () => {
  // 10 ft² of gasoline
  const hrr = heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 10, units: 'feet' });
  const area = hrr.steps[0];
  assert.match(area.label, /Convert burning area to m²/);
  assert.match(area.label, /1 ft² = 0.092903 m²/);
  assert.equal(area.formula, 'm² = ft² × 0.092903');
  assert.equal(area.values, '10 ft² × 0.092903');
  assert.equal(area.result, '0.929 m²');
  assert.equal(hrr.steps.at(-1).result, `${(2403.5 * 0.09290304 * 10).toLocaleString('en-US', { maximumSignificantDigits: 4 })} kW`);

  // 30 ft from a 10 ft wide fire: both lengths are converted before R = L + D/2
  const ps = pointSourceFlux({ Q: 1000, chi: 0.3, edgeDistance: 30, diameter: 10, units: 'feet' });
  assert.equal(ps.steps[0].result, '9.144 m');
  assert.equal(ps.steps[1].result, '3.048 m');
  assert.match(ps.steps[0].label, /1 ft = 0.3048 m/);
  assert.ok(ps.steps.findIndex((st) => st.formula === 'R = L + D/2') > 1, 'convert first, then add');

  // Flashover converts all five dimensions
  const fo = flashoverHRR({ W: 12, L: 14, H: 8, wv: 3, hv: 6.7, material: 'gypsum', units: 'feet' });
  assert.deepEqual(fo.steps.slice(0, 5).map((st) => st.formula), Array(5).fill('m = ft × 0.3048'));
});

test('show the work: meters are converted back to feet for a length answer', () => {
  // Flame height in feet: worked in meters, then converted back
  const ft = solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: 1525.16847167292, D: Math.sqrt(1.4) / 0.3048, units: 'feet' });
  assert.equal(ft.steps[0].label, 'Convert fire length along wall to m (1 ft = 0.3048 m)');
  assert.equal(ft.steps[0].result, '1.183 m');
  const back = ft.steps.at(-1);
  assert.equal(back.label, 'Convert flame height to ft (1 m = 3.28084 ft)');
  assert.equal(back.formula, 'ft = m × 3.28084');
  assert.equal(back.result, '13.21 ft');
  // Solving for the fire size ends the same way
  const size = solveFlameHeight({ mode: 'diameter', location: 'wall', Q: 1525.16847167292, L: 4.02699834491514 / 0.3048, units: 'feet' });
  assert.equal(size.steps[0].label, 'Convert flame height to m (1 ft = 0.3048 m)');
  assert.match(size.steps.at(-1).label, /^Convert fire length to ft/);
});

test('show the work: in metric nothing is converted on the way in, and the answer in feet is for reference', () => {
  const m = solveFlameHeight({ mode: 'flameHeight', location: 'wall', Q: 1525.16847167292, D: Math.sqrt(1.4) });
  assert.ok(m.steps.every((st) => st.formula !== 'm = ft × 0.3048'), 'no ft→m step');
  assert.equal(m.valueM, m.value, 'meters answer is the answer');
  assert.match(m.steps.at(-1).label, /^Flame height in feet, for reference \(1 m = 3.28084 ft\)$/);
  const hrr = heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 10, units: 'metric' });
  assert.ok(hrr.steps.every((st) => !/ft/.test(`${st.label}${st.formula}`)), 'metric HRR never mentions feet');
});

test('no BTU anywhere in the results or the working', () => {
  const runs = [
    heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 10, units: 'feet' }),
    pointSourceFlux({ Q: 1000, chi: 0.3, edgeDistance: 30, diameter: 10, units: 'feet' }),
    flashoverHRR({ W: 12, L: 14, H: 8, wv: 3, hv: 6.7, material: 'gypsum', units: 'feet' }),
    solveTSquared({ mode: 'heatRelease', alpha: 0.0469, t: 100 }),
    solveTSquared({ mode: 'time', alpha: 0.0469, Q: 1000 }),
    ...['flameHeight', 'heatRelease', 'diameter'].map((mode) =>
      solveFlameHeight({ mode, location: 'center', Q: 1000, D: 3, L: 9, units: 'feet' }))
  ];
  for (const run of runs) {
    assert.ok(run && !run.error, 'every run produces an answer');
    assert.ok(!/BTU/i.test(JSON.stringify(run)), `BTU found in ${JSON.stringify(run).slice(0, 80)}`);
  }
});
