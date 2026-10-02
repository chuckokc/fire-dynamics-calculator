// Turns what a person typed into a result. Each function takes the raw input
// strings plus the display unit system and returns one of:
//   { status: 'empty', missing: [...] }   inputs still needed
//   { status: 'invalid' }                 an input is not a usable number
//   { status: 'warning', message }        inputs are valid but have no physical answer
//   { status: 'ok', ... }                 the result, in SI and in display units
//
// Results are derived from the current inputs every time, so a result can
// never be left over from earlier inputs.

import {
  flashoverHrr,
  heatReleaseRate,
  heskestadDiameter,
  heskestadFlameHeight,
  heskestadHeatRelease,
  pointSourceFlux,
  tSquaredHrr,
  tSquaredTime,
} from './fireMath';
import { CRITICAL_HEAT_FLUX, FLASHOVER_TIME_S, FUELS, GROWTH_RATES, WALL_MATERIALS } from './materials';
import { formatAuto, fromSI, isBlank, parseNumber, toSI, unitLabel } from './units';

// Reads numeric fields. Each field: { name, label, max }. All must be > 0.
function readNumbers(values, fields) {
  const missing = [];
  const numbers = {};
  let invalid = false;
  for (const { name, label, max } of fields) {
    if (isBlank(values[name])) {
      missing.push(label);
      continue;
    }
    const number = parseNumber(values[name]);
    if (!Number.isFinite(number) || number <= 0 || (max !== undefined && number > max)) invalid = true;
    numbers[name] = number;
  }
  if (invalid) return { status: 'invalid' };
  if (missing.length) return { status: 'empty', missing };
  return { status: 'ok', numbers };
}

export function computeHeatRelease(values, units) {
  const fuel = FUELS[values.material];
  const fields = [{ name: 'burningArea', label: 'burning area' }];
  if (fuel && !fuel.massFlux) fields.unshift({ name: 'massFlux', label: 'mass flux' });
  const read = readNumbers(values, fields);
  if (!fuel) return { status: 'empty', missing: ['material', ...(read.missing || [])] };
  if (read.status !== 'ok') return read;

  const massFlux = fuel.massFlux ?? read.numbers.massFlux;
  const hrrSI = heatReleaseRate({
    massFlux,
    area: toSI(read.numbers.burningArea, 'area', units),
    heatOfCombustion: fuel.heatOfCombustion,
  });
  return {
    status: 'ok',
    fuel,
    massFlux,
    heatOfCombustion: fuel.heatOfCombustion,
    hrrSI,
    hrr: fromSI(hrrSI, 'hrr', units),
  };
}

export const FLAME_MODES = {
  flameHeight: { label: 'Flame height', kind: 'length' },
  heatRelease: { label: 'Heat release rate', kind: 'hrr' },
  diameter: { label: 'Fire diameter', kind: 'length' },
};

export function computeFlameHeight(values, units) {
  const mode = FLAME_MODES[values.mode] ? values.mode : 'flameHeight';
  const fields = {
    flameHeight: [
      { name: 'heatRelease', label: 'heat release rate' },
      { name: 'diameter', label: 'fire diameter' },
    ],
    heatRelease: [
      { name: 'flameHeight', label: 'flame height' },
      { name: 'diameter', label: 'fire diameter' },
    ],
    diameter: [
      { name: 'heatRelease', label: 'heat release rate' },
      { name: 'flameHeight', label: 'flame height' },
    ],
  }[mode];
  const read = readNumbers(values, fields);
  if (read.status !== 'ok') return read;

  const n = read.numbers;
  const hrr = n.heatRelease !== undefined ? toSI(n.heatRelease, 'hrr', units) : undefined;
  const diameter = n.diameter !== undefined ? toSI(n.diameter, 'length', units) : undefined;
  const flameHeight = n.flameHeight !== undefined ? toSI(n.flameHeight, 'length', units) : undefined;
  const lengthUnit = unitLabel('length', units);
  const show = (meters) => `${formatAuto(fromSI(meters, 'length', units))} ${lengthUnit}`;

  let valueSI;
  if (mode === 'flameHeight') {
    valueSI = heskestadFlameHeight({ hrr, diameter });
    if (valueSI <= 0) {
      return {
        status: 'warning',
        mode,
        message:
          `Heskestad's correlation gives a flame height of ${show(valueSI)} for these inputs. ` +
          'The fire diameter is too large for this heat release rate: the fire is wide and shallow, ' +
          'so the correlation predicts no meaningful flame height. Check the inputs.',
      };
    }
  } else if (mode === 'heatRelease') {
    valueSI = heskestadHeatRelease({ flameHeight, diameter });
  } else {
    valueSI = heskestadDiameter({ hrr, flameHeight });
    if (valueSI <= 0) {
      const maxHeight = heskestadFlameHeight({ hrr, diameter: 0 });
      return {
        status: 'warning',
        mode,
        message:
          `No fire diameter can produce a ${show(flameHeight)} flame at this heat release rate. ` +
          `Heskestad's correlation tops out at about ${show(maxHeight)} for this heat release rate. ` +
          'Lower the flame height or raise the heat release rate.',
      };
    }
  }

  const { kind, label } = FLAME_MODES[mode];
  return { status: 'ok', mode, kind, label, valueSI, value: fromSI(valueSI, kind, units) };
}

export function computePointSource(values, units) {
  const read = readNumbers(values, [
    { name: 'heatRelease', label: 'heat release rate' },
    { name: 'distance', label: 'distance' },
    { name: 'radiativeFraction', label: 'radiative fraction', max: 1 },
  ]);
  if (read.status !== 'ok') return read;

  const fluxSI = pointSourceFlux({
    hrr: toSI(read.numbers.heatRelease, 'hrr', units),
    distance: toSI(read.numbers.distance, 'length', units),
    radiativeFraction: read.numbers.radiativeFraction,
  });
  const thresholds = CRITICAL_HEAT_FLUX.map((threshold) => ({
    ...threshold,
    level: fluxSI >= threshold.value ? 'exceeded' : fluxSI >= 0.8 * threshold.value ? 'near' : 'below',
  }));
  return {
    status: 'ok',
    fluxSI,
    fluxImperial: fromSI(fluxSI, 'heatFlux', 'imperial'),
    thresholds,
    highestExceeded: thresholds.find((t) => t.level === 'exceeded') || null,
  };
}

export function computeFlashover(values, units) {
  const read = readNumbers(values, [
    { name: 'roomLength', label: 'room length' },
    { name: 'roomWidth', label: 'room width' },
    { name: 'roomHeight', label: 'room height' },
    { name: 'ventWidth', label: 'opening width' },
    { name: 'ventHeight', label: 'opening height' },
  ]);
  if (read.status !== 'ok') return read;

  const wall = WALL_MATERIALS[values.wall] || WALL_MATERIALS.gypsum;
  const meters = (name) => toSI(read.numbers[name], 'length', units);
  const si = flashoverHrr({
    roomLength: meters('roomLength'),
    roomWidth: meters('roomWidth'),
    roomHeight: meters('roomHeight'),
    ventWidth: meters('ventWidth'),
    ventHeight: meters('ventHeight'),
    wall,
    time: FLASHOVER_TIME_S,
  });
  const show = (kW) => fromSI(kW, 'hrr', units);
  return {
    status: 'ok',
    wall,
    si,
    mqh: show(si.mqh),
    thomas: show(si.thomas),
    babrauskas: show(si.babrauskas),
  };
}

export function growthAlphaSI(values, units) {
  if (values.growthRate === 'custom') {
    const alpha = parseNumber(values.customAlpha);
    // The custom α is typed in display units (BTU/s³ in imperial), so it must
    // be converted to kW/s² before use.
    return Number.isFinite(alpha) && alpha > 0 ? toSI(alpha, 'alpha', units) : NaN;
  }
  return (GROWTH_RATES[values.growthRate] || GROWTH_RATES.medium).alpha;
}

export function computeTSquared(values, units) {
  const mode = values.mode === 'time' ? 'time' : 'heatRelease';
  const fields = [];
  if (values.growthRate === 'custom') fields.push({ name: 'customAlpha', label: 'custom α' });
  fields.push(mode === 'heatRelease' ? { name: 'time', label: 'time' } : { name: 'heatRelease', label: 'target heat release rate' });
  const read = readNumbers(values, fields);
  if (read.status !== 'ok') return read;

  const alphaSI = growthAlphaSI(values, units);
  let timeS;
  let hrrSI;
  if (mode === 'heatRelease') {
    timeS = read.numbers.time * (values.timeUnit === 'min' ? 60 : 1);
    hrrSI = tSquaredHrr({ alpha: alphaSI, time: timeS });
  } else {
    hrrSI = toSI(read.numbers.heatRelease, 'hrr', units);
    timeS = tSquaredTime({ alpha: alphaSI, hrr: hrrSI });
  }
  return {
    status: 'ok',
    mode,
    alphaSI,
    alpha: fromSI(alphaSI, 'alpha', units),
    timeS,
    hrrSI,
    hrr: fromSI(hrrSI, 'hrr', units),
  };
}

export function describeMissing(missing) {
  if (!missing || missing.length === 0) return '';
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]}`;
}
