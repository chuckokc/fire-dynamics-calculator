// Pure helpers behind useCalculatorState.
//
// A calculator's saved state is { units, values, undo }. `values` holds the
// strings exactly as typed, in `units`. When the app-wide unit system changes,
// the typed values are converted. `undo` remembers what was there before the
// last conversion, so switching back restores the original numbers exactly
// (10 ft -> 3.048 m -> 10 ft) instead of accumulating rounding.

import { convert, formatInputValue, isUnitSystem, parseNumber } from './units';

const sameValues = (a, b) => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const key of keys) if (a?.[key] !== b?.[key]) return false;
  return true;
};

// fieldKinds maps a value name to its quantity kind ('length', 'area', 'hrr',
// 'alpha'); names not listed are left alone (selections, unitless numbers).
export function convertValues(values, fromUnits, toUnits, fieldKinds) {
  const next = { ...values };
  for (const [name, kind] of Object.entries(fieldKinds)) {
    const number = parseNumber(values[name]);
    if (Number.isFinite(number)) next[name] = formatInputValue(convert(number, kind, fromUnits, toUnits));
  }
  return next;
}

export function convertState(state, toUnits, fieldKinds) {
  if (state.units === toUnits) return state;
  const { undo } = state;
  const values =
    undo && undo.units === toUnits && sameValues(undo.convertedValues, state.values)
      ? undo.values
      : convertValues(state.values, state.units, toUnits, fieldKinds);
  return {
    units: toUnits,
    values,
    undo: { units: state.units, values: state.values, convertedValues: values },
  };
}

// Repairs whatever was read from storage into a usable state.
export function normalizeState(stored, initialValues, fallbackUnits) {
  const valid = stored && typeof stored === 'object' && stored.values && typeof stored.values === 'object';
  if (!valid) return { units: fallbackUnits, values: { ...initialValues }, undo: null };
  return {
    units: isUnitSystem(stored.units) ? stored.units : fallbackUnits,
    values: { ...initialValues, ...stored.values },
    undo: stored.undo && typeof stored.undo === 'object' ? stored.undo : null,
  };
}
