import { describe, expect, it } from 'vitest';
import { convert, formatDuration, formatInputValue, fromSI, parseNumber, toSI } from './units';

describe('unit conversion', () => {
  it('converts lengths, areas and heat release rates', () => {
    expect(convert(10, 'length', 'imperial', 'SI')).toBeCloseTo(3.048, 9);
    expect(convert(1, 'area', 'SI', 'imperial')).toBeCloseTo(10.7639, 4);
    expect(toSI(1, 'hrr', 'imperial')).toBeCloseTo(1.05506, 5);
    expect(fromSI(1, 'hrr', 'imperial')).toBeCloseTo(0.947817, 6);
  });

  it('converts heat flux consistently in both directions', () => {
    expect(fromSI(11.3565, 'heatFlux', 'imperial')).toBeCloseTo(1, 4);
    expect(toSI(fromSI(5, 'heatFlux', 'imperial'), 'heatFlux', 'imperial')).toBeCloseTo(5, 12);
  });

  it('leaves values alone when the systems match', () => {
    expect(convert(7, 'length', 'SI', 'SI')).toBe(7);
  });
});

describe('parseNumber', () => {
  it('reads plain numbers, decimal commas and whitespace', () => {
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber(' 12.5 ')).toBe(12.5);
    expect(parseNumber('2,5')).toBe(2.5);
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('rejects blanks and malformed input', () => {
    expect(parseNumber('')).toBeNaN();
    expect(parseNumber('abc')).toBeNaN();
    expect(parseNumber('1.2.3')).toBeNaN();
    expect(parseNumber('12ft')).toBeNaN();
  });
});

describe('formatting', () => {
  it('keeps at least four significant figures for converted inputs', () => {
    expect(formatInputValue(2.1336)).toBe('2.134');
    expect(formatInputValue(12345.67)).toBe('12346');
    expect(formatInputValue(0.000123)).toBe('0.000123');
    expect(formatInputValue(3)).toBe('3');
  });

  it('formats durations in minutes and seconds', () => {
    expect(formatDuration(245)).toBe('4 min 5 s');
    expect(formatDuration(42)).toBe('42 s');
  });
});
