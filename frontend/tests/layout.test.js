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
