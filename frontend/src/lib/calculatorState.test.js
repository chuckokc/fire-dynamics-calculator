import { describe, expect, it } from 'vitest';
import { convertState, normalizeState } from './calculatorState';

const KINDS = { roomLength: 'length', burningArea: 'area' };

describe('convertState', () => {
  const start = { units: 'imperial', values: { roomLength: '7', burningArea: '', wall: 'gypsum' }, undo: null };

  it('converts typed values when the unit system changes', () => {
    const si = convertState(start, 'SI', KINDS);
    expect(si.units).toBe('SI');
    expect(si.values).toEqual({ roomLength: '2.134', burningArea: '', wall: 'gypsum' });
  });

  it('restores the exact numbers when switching back without edits', () => {
    const back = convertState(convertState(start, 'SI', KINDS), 'imperial', KINDS);
    expect(back.values.roomLength).toBe('7');
  });

  it('converts numerically after the person edits the converted values', () => {
    const si = convertState(start, 'SI', KINDS);
    const edited = { units: 'SI', values: { ...si.values, roomLength: '3' }, undo: null };
    expect(convertState(edited, 'imperial', KINDS).values.roomLength).toBe('9.843');
  });

  it('leaves values that are not numbers untouched', () => {
    const state = { units: 'SI', values: { roomLength: 'abc' }, undo: null };
    expect(convertState(state, 'imperial', KINDS).values.roomLength).toBe('abc');
  });
});

describe('normalizeState', () => {
  const initial = { roomLength: '', wall: 'gypsum' };

  it('falls back to the initial values for unreadable storage', () => {
    expect(normalizeState('garbage', initial, 'SI')).toEqual({ units: 'SI', values: initial, undo: null });
    expect(normalizeState(null, initial, 'imperial').units).toBe('imperial');
  });

  it('fills in fields added since the state was saved', () => {
    const state = normalizeState({ units: 'SI', values: { roomLength: '4' } }, initial, 'imperial');
    expect(state).toEqual({ units: 'SI', values: { roomLength: '4', wall: 'gypsum' }, undo: null });
  });
});
