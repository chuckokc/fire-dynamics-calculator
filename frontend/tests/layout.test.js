import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { theme as chakraDefaults } from '@chakra-ui/theme';
import { MUTED_TEXT } from '../src/theme.js';

// Layout and readability rules for the calculator UI. They read the source (like
// forms.test.js) so a later edit cannot quietly bring back a problem we fixed.

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const read = (path) => readFileSync(join(SRC, path), 'utf8');

const jsxFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? jsxFiles(full) : full.endsWith('.jsx') ? [full] : [];
  });

// WCAG contrast ratio between two Chakra color names such as "gray.300".
const hex = (name) => {
  const [group, shade] = name.split('.');
  return chakraDefaults.colors[group][shade] ?? chakraDefaults.colors[name];
};
const luminance = (color) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(hex(a)), luminance(hex(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('secondary text meets 4.5:1 contrast on every page and card background in both modes', () => {
  const lightBackgrounds = ['gray.50', 'white'];
  const darkBackgrounds = ['gray.800', 'gray.700']; // page, and the T-Squared / Point Source boxes
  for (const bg of lightBackgrounds) {
    assert.ok(contrast(MUTED_TEXT.light, bg) >= 4.5, `light: ${MUTED_TEXT.light} on ${bg}`);
  }
  for (const bg of darkBackgrounds) {
    assert.ok(contrast(MUTED_TEXT.dark, bg) >= 4.5, `dark: ${MUTED_TEXT.dark} on ${bg}`);
  }
});

test('no component hardcodes a gray text color (use color="fd.muted", which adapts to dark mode)', () => {
  const offenders = jsxFiles(SRC.slice(0, -1)).flatMap((file) =>
    readFileSync(file, 'utf8').split('\n')
      .map((line, i) => ({ line, n: i + 1 }))
      .filter(({ line }) => /\bcolor="gray\.\d+"/.test(line))
      .map(({ n }) => `${file.replace(SRC, 'src/')}:${n}`));
  assert.deepEqual(offenders, []);
});

test('every calculator opens with the shared, collapsible equation card', () => {
  for (const name of ['HeatRelease', 'FlameHeight', 'PointSource', 'Flashover', 'TSquared']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.match(source, /import EquationCard from '..\/EquationCard'/, name);
    assert.match(source, /<EquationCard\b/, name);
  }
});

test('the equation card starts closed below the md breakpoint and open above it', () => {
  const card = read('components/EquationCard.jsx');
  const md = chakraDefaults.breakpoints.md; // "48em"
  assert.ok(card.includes(`(min-width: ${md})`), `EquationCard should use (min-width: ${md})`);
  assert.match(card, /aria-expanded=\{isOpen\}/);
  assert.match(card, /aria-controls=\{panelId\}/);
});

test('all five calculators share one column and the flashover caution is a warning callout', () => {
  const app = read('App.jsx');
  assert.equal((app.match(/<CalculatorPanel\b/g) || []).length, 5);
  assert.ok(!app.includes('Chakra.Center'), 'Center shrinks each form to its content, so widths differ per tab');
  assert.match(app, /status="warning"/);
  assert.match(app, /Do not use in a room that has been through flashover or full involvement/);
  // The caution lives in the callout, not buried in the description sentence.
  assert.ok(!/DO NOT USE IN A ROOM/.test(app));
});

// ---------- second pass: tab strip, result card, Flashover form ----------

import { centerTabLeft, fadeMask, hiddenEdges } from '../src/tabFade.js';
import { RESULT_BUTTON } from '../src/resultButtons.js';

test('the tab strip fades only the edges that have tabs hidden beyond them', () => {
  assert.equal(fadeMask({ left: false, right: false }), 'none');
  assert.match(fadeMask({ left: false, right: true }), /^linear-gradient\(to left, transparent, #000 32px\)$/);
  assert.match(fadeMask({ left: true, right: false }), /^linear-gradient\(to right, transparent, #000 32px\)$/);
  const both = fadeMask({ left: true, right: true });
  assert.ok(both.startsWith('linear-gradient(to right, transparent, #000 32px, #000 calc(100% - 32px), transparent'), both);
});

test('hidden edges follow the scroll position (phone: 351px visible of 884px)', () => {
  assert.deepEqual(hiddenEdges({ scrollLeft: 0, clientWidth: 351, scrollWidth: 884 }), { left: false, right: true });
  assert.deepEqual(hiddenEdges({ scrollLeft: 200, clientWidth: 351, scrollWidth: 884 }), { left: true, right: true });
  assert.deepEqual(hiddenEdges({ scrollLeft: 533, clientWidth: 351, scrollWidth: 884 }), { left: true, right: false });
  // Everything fits (desktop): no fades. One pixel of rounding noise is ignored.
  assert.deepEqual(hiddenEdges({ scrollLeft: 0, clientWidth: 900, scrollWidth: 900 }), { left: false, right: false });
  assert.deepEqual(hiddenEdges({ scrollLeft: 1, clientWidth: 900, scrollWidth: 901 }), { left: false, right: false });
});

test('the selected tab is centred in the strip, but never scrolled past the start', () => {
  assert.equal(centerTabLeft({ tabLeft: 500, tabWidth: 100, clientWidth: 300 }), 400);
  assert.equal(centerTabLeft({ tabLeft: 0, tabWidth: 100, clientWidth: 300 }), 0);
});

test('both tab strips (main tabs and Reference sub-tabs) use ScrollableTabList', () => {
  assert.match(read('App.jsx'), /<ScrollableTabList>/);
  assert.match(read('components/reference/ReferenceGuide.jsx'), /<ScrollableTabList\b/);
  const stragglers = jsxFiles(SRC.slice(0, -1))
    .filter((file) => !file.endsWith('ScrollableTabList.jsx'))
    .filter((file) => /<Chakra\.TabList\b/.test(readFileSync(file, 'utf8')))
    .map((file) => file.replace(SRC, 'src/'));
  assert.deepEqual(stragglers, []);
});

test('every calculator shows its answer in the shared ResultCard with one button style', () => {
  for (const name of ['HeatRelease', 'FlameHeight', 'PointSource', 'Flashover', 'TSquared']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.match(source, /import ResultCard from '..\/ResultCard'/, name);
    assert.match(source, /<ResultCard\b/, name);
    assert.ok(!/Copy Results|Save to History/.test(source), `${name} should not build its own Copy / Save buttons`);
  }
  // No purple or teal action buttons anywhere: Copy, Save and "Use this HRR in…" are all outline blue.
  const strays = jsxFiles(SRC.slice(0, -1))
    .filter((file) => /colorScheme="(purple|teal)"/.test(readFileSync(file, 'utf8')))
    .map((file) => file.replace(SRC, 'src/'));
  assert.deepEqual(strays, []);
  const card = read('components/ResultCard.jsx');
  assert.match(card, /Copy Results/);
  assert.match(card, /Save to History/);
});

test('"Use this HRR in…" sits in the result card row, in the same style', () => {
  assert.match(read('components/HrrTransfer.jsx'), /\{\.\.\.RESULT_BUTTON\}/);
  assert.match(read('components/ResultCard.jsx'), /\{\.\.\.RESULT_BUTTON\}/);
  assert.equal(RESULT_BUTTON.variant, 'outline');
  assert.equal(RESULT_BUTTON.colorScheme, 'blue');
  assert.deepEqual(RESULT_BUTTON.width, { base: '100%', sm: 'auto' }); // stacked full-width on phones
  for (const name of ['HeatRelease', 'FlameHeight', 'TSquared']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.match(source, /actions=\{.*<SendHRRMenu/, name);
    assert.ok(!/<Chakra\.Flex justify="flex-end">\s*<SendHRRMenu/.test(source), `${name}: menu should be inside the card`);
  }
});

test('Flashover groups its five length inputs into room dimensions and ventilation opening', () => {
  const source = read('components/calculators/FlashoverCalculator.jsx');
  assert.match(source, /Room dimensions/);
  assert.match(source, /Ventilation opening/);
  assert.equal((source.match(/dimensionField\('/g) || []).length, 5);
  assert.equal((source.match(/<Chakra\.SimpleGrid columns=\{\{ base: 2, sm: 3 \}\}/g) || []).length, 2);
});

// ---------- live results: no Calculate buttons, and no stale answers ----------

import { heatReleaseRate } from '../src/calculations/hrr.js';
import { pointSourceFlux } from '../src/calculations/pointSource.js';
import { flashoverHRR } from '../src/calculations/flashover.js';
import { solveTSquared } from '../src/calculations/tSquared.js';
import { solveFlameHeight } from '../src/calculations/flameHeight.js';

test('no calculator has a Calculate button: every result follows the inputs live', () => {
  for (const name of ['HeatRelease', 'FlameHeight', 'PointSource', 'Flashover', 'TSquared']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.ok(!/onClick=\{calculate/.test(source), `${name} has a Calculate button`);
    assert.match(source, /useEffect\(\(\) => \{[\s\S]{0,400}?calculate\w*\(\)/, `${name} should recalculate when an input changes`);
  }
});

test('an empty field gives no answer from every solver, and a full form does', () => {
  // The calculators show a result only when the solver returns one, so null here is
  // what removes the result card when a field is cleared.
  assert.equal(heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: NaN, units: 'metric' }), null);
  assert.equal(pointSourceFlux({ Q: 1000, chi: 0.3, R: NaN, units: 'metric' }), null);
  assert.equal(flashoverHRR({ H: 2.4, W: 3.6, L: 4.2, hv: 2, wv: NaN, material: 'gypsum', units: 'metric' }), null);
  assert.equal(solveTSquared({ mode: 'heatRelease', alpha: 0.0117, t: NaN, Q: NaN }), null);
  assert.equal(solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000, D: NaN, L: NaN, units: 'metric' }), null);

  assert.ok(heatReleaseRate({ massFlux: 55, heatOfCombustion: 43.7, area: 10, units: 'metric' }));
  assert.ok(pointSourceFlux({ Q: 1000, chi: 0.3, R: 10, units: 'metric' }));
  assert.ok(flashoverHRR({ H: 2.4, W: 3.6, L: 4.2, hv: 2, wv: 0.9, material: 'gypsum', units: 'metric' }));
  assert.ok(solveTSquared({ mode: 'heatRelease', alpha: 0.0117, t: 120, Q: NaN }));
  assert.ok(solveFlameHeight({ mode: 'flameHeight', location: 'center', Q: 1000, D: 3, L: NaN, units: 'metric' }));
});

test('each calculator clears its result when the inputs give no answer', () => {
  const clears = {
    HeatRelease: /if \(!r\) return clearResult\(\);[\s\S]*else \{\s*clearResult\(\);/,
    PointSource: /if \(!r\) return clearResult\(\);[\s\S]*else \{\s*clearResult\(\);/,
    Flashover: /setResults\(r \? \{[^}]*\} : null\);[\s\S]*else \{[^}]*setResults\(null\);/,
    TSquared: /if \(!r\) \{\s*setResult\(null\);\s*return;/,
    FlameHeight: /setResult\(solveFlameHeight\(/, // the solver's null is stored as is
  };
  for (const [name, pattern] of Object.entries(clears)) {
    assert.match(read(`components/calculators/${name}Calculator.jsx`), pattern, name);
  }
});

// ---------- units: meters or feet for lengths, kW for energy ----------

// Every source file under src/ (not tests), so a leftover BTU label can't hide in one component.
const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const full = join(dir, name);
  return statSync(full).isDirectory() ? sourceFiles(full) : /\.jsx?$/.test(name) ? [full] : [];
});

test('no screen or calculation shows BTU, SI or Imperial any more', () => {
  for (const file of sourceFiles(SRC)) {
    const code = readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))      // comments may mention the history
      .join('\n');
    assert.ok(!/BTU/i.test(code), `${file} still mentions BTU`);
    assert.ok(!/'SI'|'imperial'|"SI"|"imperial"|>\s*Imperial|>\s*SI\b/.test(code), `${file} still uses the old SI / imperial names`);
  }
});

test('the four length-based calculators share one Meters / Feet toggle; T-Squared has none', () => {
  for (const name of ['HeatRelease', 'FlameHeight', 'PointSource', 'Flashover']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.match(source, /<UnitToggle value=\{units\} onChange=\{handleUnitsChange\}/, `${name} should use UnitToggle`);
    assert.match(source, /DEFAULT_UNITS/, `${name} should start from the default unit`);
  }
  const tSquared = read('components/calculators/TSquaredCalculator.jsx');
  assert.ok(!/UnitToggle|units/.test(tSquared.replace(/\/\/.*$/gm, '')), 'T-Squared is kW and seconds only, so it has no unit choice');
  const toggle = read('components/UnitToggle.jsx');
  assert.match(toggle, /Meters \(m\)/);
  assert.match(toggle, /Feet \(ft\)/);
  assert.match(toggle, /Square meters \(m²\)/);
  assert.match(toggle, /Square feet \(ft²\)/);
});

test('switching units converts lengths and areas only, never the heat release rate', () => {
  for (const name of ['HeatRelease', 'FlameHeight', 'PointSource', 'Flashover']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.ok(!/convertInput\([^)]*'(hrr|alpha|heatFlux)'/.test(source), `${name} converts an energy value`);
    assert.match(source, /convertInput\([^)]*'(length|area)'/, `${name} should convert its lengths or area`);
  }
});

test('a transferred heat release rate arrives in kW as it is', () => {
  for (const name of ['FlameHeight', 'PointSource', 'Flashover', 'TSquared']) {
    const source = read(`components/calculators/${name}Calculator.jsx`);
    assert.match(source, /\(kW\.toFixed\(2\)\)|kW\.toFixed\(2\)/, `${name} should take the kW value directly`);
    assert.ok(!/fromSI\(kW/.test(source), `${name} should not convert a transferred kW`);
  }
});

test('flame height shows a length answer in both feet and meters', () => {
  const source = read('components/calculators/FlameHeightCalculator.jsx');
  assert.match(source, /const otherLength = /);
  assert.match(source, /note: otherLength \? `\(\$\{otherLength\}\)` : null/);
  assert.match(source, /M_TO_FT/);
});
