// Unit handling shared by every calculator.
//
// All fire-dynamics math runs in SI. Values are converted to SI on the way in
// and back to the display units on the way out, using one table of factors so
// every conversion (and its inverse) is consistent.

export const UNIT_SYSTEMS = ['imperial', 'SI'];
export const DEFAULT_UNITS = 'imperial';

const FT_PER_M = 1 / 0.3048;
const KJ_PER_BTU = 1.05505585262; // International Table BTU

// Multiply an SI value by this factor to get the imperial value.
const IMPERIAL_PER_SI = {
  length: FT_PER_M, // m -> ft
  area: FT_PER_M * FT_PER_M, // m² -> ft²
  hrr: 1 / KJ_PER_BTU, // kW -> BTU/s
  heatFlux: 1 / (KJ_PER_BTU * FT_PER_M * FT_PER_M), // kW/m² -> BTU/ft²·s
  alpha: 1 / KJ_PER_BTU, // kW/s² -> BTU/s³
};

export const UNIT_LABELS = {
  SI: { length: 'm', area: 'm²', hrr: 'kW', heatFlux: 'kW/m²', alpha: 'kW/s²' },
  imperial: { length: 'ft', area: 'ft²', hrr: 'BTU/s', heatFlux: 'BTU/ft²·s', alpha: 'BTU/s³' },
};

export const isUnitSystem = (value) => UNIT_SYSTEMS.includes(value);

export const unitLabel = (kind, units) => UNIT_LABELS[units][kind];

export function toSI(value, kind, units) {
  return units === 'imperial' ? value / IMPERIAL_PER_SI[kind] : value;
}

export function fromSI(value, kind, units) {
  return units === 'imperial' ? value * IMPERIAL_PER_SI[kind] : value;
}

export function convert(value, kind, fromUnits, toUnits) {
  if (fromUnits === toUnits) return value;
  return fromSI(toSI(value, kind, fromUnits), kind, toUnits);
}

const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

// Parses what a person typed. Accepts a comma as the decimal separator because
// the iPhone decimal keypad shows one in many locales. Returns NaN for blanks
// and anything that is not a plain number.
export function parseNumber(input) {
  if (typeof input === 'number') return input;
  if (typeof input !== 'string') return NaN;
  const text = input.trim().replace(',', '.');
  if (!NUMBER_PATTERN.test(text)) return NaN;
  return Number(text);
}

export const isBlank = (input) => input === undefined || input === null || String(input).trim() === '';

// Formats a converted input value: at least 4 significant figures, never
// fewer digits than the integer part, no trailing zeros.
export function formatInputValue(value) {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const integerDigits = Math.floor(Math.log10(Math.abs(value))) + 1;
  const precision = Math.min(15, Math.max(4, integerDigits));
  return String(Number(value.toPrecision(precision)));
}

// Formats a result for display, with thousands separators.
export function formatNumber(value, decimals = 0) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Picks a sensible number of decimals for a result based on its size.
export function autoDecimals(value) {
  const abs = Math.abs(value);
  if (abs >= 100) return 0;
  if (abs >= 10) return 1;
  if (abs >= 1) return 2;
  return 3;
}

export const formatAuto = (value) => formatNumber(value, autoDecimals(value));

// The same SI value shown in the other unit system, e.g. "2,404 kW".
export function formatAlternate(valueSI, kind, units) {
  const other = units === 'SI' ? 'imperial' : 'SI';
  return `${formatAuto(fromSI(valueSI, kind, other))} ${unitLabel(kind, other)}`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '—';
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  if (minutes === 0) return `${secs} s`;
  return `${minutes} min ${secs} s`;
}
