import { Box, HStack, SimpleGrid, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import useCalculatorState from '../../hooks/useCalculatorState';
import useHistory from '../../hooks/useHistory';
import { computeTSquared, growthAlphaSI } from '../../lib/calculations';
import { CUSTOM_GROWTH_COLOR, GROWTH_RATES } from '../../lib/materials';
import { buildReport } from '../../lib/share';
import { formatAlternate, formatAuto, formatDuration, formatInputValue, formatNumber, fromSI, parseNumber, unitLabel } from '../../lib/units';
import CalculatorShell from '../common/CalculatorShell';
import { Definitions, Formula } from '../common/Equation';
import HistoryPanel from '../common/HistoryPanel';
import NumberField from '../common/NumberField';
import ResultCard, { ResultValue } from '../common/ResultCard';
import SelectField from '../common/SelectField';

const INITIAL_VALUES = { mode: 'heatRelease', growthRate: 'medium', customAlpha: '', time: '', timeUnit: 's', heatRelease: '' };
const FIELD_KINDS = { customAlpha: 'alpha', heatRelease: 'hrr' };
const TIME_UNITS = [
  { value: 's', label: 'sec' },
  { value: 'min', label: 'min' },
];

const ABOUT = (
  <Stack spacing={3}>
    <Text>Calculates heat release rate over time using the t-squared fire growth model.</Text>
    <Formula>Q̇ = α t²</Formula>
    <Definitions
      items={[
        ['Q̇', 'Heat release rate (kW or BTU/s)'],
        ['α', 'Fire growth coefficient (kW/s² or BTU/s³)'],
        ['t', 'Time after established burning (s)'],
      ]}
    />
    <Box>
      <Text fontWeight="semibold" mb={1}>
        Standard growth rate coefficients
      </Text>
      <SimpleGrid columns={2} spacingX={4} spacingY={1}>
        {Object.values(GROWTH_RATES).map((rate) => (
          <Box key={rate.name} display="contents">
            <Text>{rate.name}</Text>
            <Text>{rate.alpha} kW/s²</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  </Stack>
);

function TSquaredVisual({ growthRate, alphaSI, timeS, hrrSI, units }) {
  const textColor = useColorModeValue('#1A202C', '#E2E8F0');
  const gridColor = useColorModeValue('#A0AEC0', '#4A5568');
  const hrrUnit = unitLabel('hrr', units);

  const curves = Object.entries(GROWTH_RATES).map(([key, rate]) => ({ key, name: rate.name, alpha: rate.alpha, color: rate.color }));
  if (growthRate === 'custom' && alphaSI > 0) curves.push({ key: 'custom', name: 'Custom', alpha: alphaSI, color: CUSTOM_GROWTH_COLOR });
  const selected = curves.find((curve) => curve.key === growthRate);

  const width = 360;
  const height = 280;
  const pad = { left: 56, right: 16, top: 16, bottom: 44 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const maxTime = Math.max(600, (timeS || 0) * 1.2);
  const maxHrr = Math.max(1000, (hrrSI || 0) * 1.2);
  const x = (t) => pad.left + (t / maxTime) * plotW;
  const y = (q) => pad.top + plotH - (q / maxHrr) * plotH;

  const hrrTick = (kW) => {
    if (units === 'SI') return kW >= 1000 ? `${formatNumber(kW / 1000, 1)} MW` : formatNumber(kW);
    return formatNumber(fromSI(kW, 'hrr', units));
  };

  return (
    <Box p={4} bg="bg.subtle" borderRadius="md">
      <Text fontWeight="bold" mb={3}>
        Fire growth curves
      </Text>
      <Box bg="bg.surface" borderRadius="md" p={2}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Heat release rate against time for each growth rate">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={i} opacity="0.5">
              <line x1={x((i / 5) * maxTime)} y1={pad.top} x2={x((i / 5) * maxTime)} y2={pad.top + plotH} stroke={gridColor} strokeWidth="0.5" />
              <line x1={pad.left} y1={y((i / 5) * maxHrr)} x2={pad.left + plotW} y2={y((i / 5) * maxHrr)} stroke={gridColor} strokeWidth="0.5" />
            </g>
          ))}
          {[1000, 5000]
            .filter((kW) => kW <= maxHrr)
            .map((kW) => (
              <g key={kW}>
                <line x1={pad.left} y1={y(kW)} x2={pad.left + plotW} y2={y(kW)} stroke="#805AD5" strokeDasharray="5,5" opacity="0.6" />
                <text x={pad.left + 6} y={y(kW) - 5} fontSize="12" fill="#805AD5">
                  {kW / 1000} MW
                </text>
              </g>
            ))}
          {curves.map((curve) => {
            const points = [];
            for (let step = 0; step <= 100; step += 1) {
              const t = (step / 100) * maxTime;
              const q = curve.alpha * t * t;
              if (q > maxHrr) break;
              points.push(`${x(t).toFixed(1)},${y(q).toFixed(1)}`);
            }
            if (points.length < 2) return null;
            const isSelected = curve.key === growthRate;
            return (
              <path
                key={curve.key}
                d={`M ${points.join(' L ')}`}
                stroke={curve.color}
                strokeWidth={isSelected ? 3.5 : 2}
                opacity={isSelected ? 1 : 0.35}
                fill="none"
              />
            );
          })}
          <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke={textColor} strokeWidth="1.5" />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke={textColor} strokeWidth="1.5" />
          {selected && timeS > 0 && hrrSI > 0 && (
            <circle cx={x(timeS)} cy={y(hrrSI)} r="6" fill={selected.color} stroke={textColor} strokeWidth="2" />
          )}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <text key={`t${i}`} x={x((i / 5) * maxTime)} y={pad.top + plotH + 16} textAnchor="middle" fontSize="12" fill={textColor}>
              {formatNumber((i / 5) * maxTime)}
            </text>
          ))}
          {[0, 0.5, 1].map((fraction) => (
            <text key={`q${fraction}`} x={pad.left - 6} y={y(fraction * maxHrr) + 4} textAnchor="end" fontSize="12" fill={textColor}>
              {hrrTick(fraction * maxHrr)}
            </text>
          ))}
          <text x={pad.left + plotW / 2} y={height - 6} textAnchor="middle" fontSize="13" fill={textColor}>
            Time (s)
          </text>
          <text x={14} y={pad.top + plotH / 2} textAnchor="middle" fontSize="13" fill={textColor} transform={`rotate(-90 14 ${pad.top + plotH / 2})`}>
            HRR ({units === 'SI' ? 'kW' : hrrUnit})
          </text>
        </svg>
        <HStack spacing={4} mt={2} justify="center" wrap="wrap">
          {curves.map((curve) => (
            <HStack key={curve.key} spacing={1}>
              <Box w="20px" h="3px" bg={curve.color} opacity={curve.key === growthRate ? 1 : 0.4} />
              <Text fontSize="sm" fontWeight={curve.key === growthRate ? 'bold' : 'normal'}>
                {curve.name}
              </Text>
            </HStack>
          ))}
        </HStack>
      </Box>
    </Box>
  );
}

export default function TSquaredCalculator() {
  const { values, units, setValue, setValues, reset, load } = useCalculatorState('tSquared', INITIAL_VALUES, FIELD_KINDS);
  const history = useHistory('tSquared');
  const result = computeTSquared(values, units);
  const mode = values.mode === 'time' ? 'time' : 'heatRelease';
  const hrrUnit = unitLabel('hrr', units);
  const alphaUnit = unitLabel('alpha', units);
  const rateName = values.growthRate === 'custom' ? 'Custom' : (GROWTH_RATES[values.growthRate] || GROWTH_RATES.medium).name;

  const changeTimeUnit = (timeUnit) => {
    if (timeUnit === values.timeUnit) return;
    const time = parseNumber(values.time);
    const converted = Number.isFinite(time) ? formatInputValue(timeUnit === 'min' ? time / 60 : time * 60) : values.time;
    setValues({ timeUnit, time: converted });
  };

  let report;
  let save;
  if (result.status === 'ok') {
    const alphaText = `α = ${formatNumber(result.alpha, 5)} ${alphaUnit}`;
    const hrrText = `${formatAuto(result.hrr)} ${hrrUnit}`;
    const timeText = `${formatNumber(result.timeS)} s (${formatDuration(result.timeS)})`;
    const headline = mode === 'heatRelease' ? `Heat release rate: ${hrrText} at ${timeText}` : `Time to ${hrrText}: ${timeText}`;
    report = buildReport({
      title: 'T-Squared Growth',
      method: 'Q̇ = α t²',
      results: [headline],
      inputs: [
        `Growth rate: ${rateName} (${alphaText})`,
        mode === 'heatRelease' ? `Time: ${values.time} ${values.timeUnit === 'min' ? 'min' : 's'}` : `Target heat release rate: ${values.heatRelease} ${hrrUnit}`,
      ],
    });
    save = () =>
      history.add({
        units,
        values,
        title: mode === 'heatRelease' ? `${hrrText} at ${formatDuration(result.timeS)}` : `${formatDuration(result.timeS)} to ${hrrText}`,
        detail: `${rateName} growth · ${alphaText}`,
        accent: values.growthRate === 'custom' ? CUSTOM_GROWTH_COLOR : GROWTH_RATES[values.growthRate]?.color,
      });
  }

  const alphaSI = growthAlphaSI(values, units);

  return (
    <CalculatorShell
      title="T-Squared Growth"
      about={ABOUT}
      onClear={reset}
      result={
        <ResultCard
          title={mode === 'heatRelease' ? 'Heat release rate' : 'Time to reach heat release rate'}
          result={result}
          report={report}
          reportTitle="T-Squared Growth"
          onSave={save}
        >
          {result.status === 'ok' &&
            (mode === 'heatRelease' ? (
              <ResultValue
                value={formatAuto(result.hrr)}
                unit={hrrUnit}
                secondary={`= ${formatAlternate(result.hrrSI, 'hrr', units)} at ${formatDuration(result.timeS)} · ${rateName}`}
              />
            ) : (
              <ResultValue
                value={formatNumber(result.timeS)}
                unit="s"
                secondary={`= ${formatDuration(result.timeS)} · ${rateName}`}
              />
            ))}
        </ResultCard>
      }
      extras={
        <>
          <TSquaredVisual
            growthRate={values.growthRate}
            alphaSI={alphaSI}
            timeS={result.status === 'ok' ? result.timeS : 0}
            hrrSI={result.status === 'ok' ? result.hrrSI : 0}
            units={units}
          />
          <HistoryPanel entries={history.entries} onLoad={load} onClear={history.clear} />
        </>
      }
    >
      <SelectField label="Calculate" value={mode} onChange={(next) => setValue('mode', next)}>
        <option value="heatRelease">Heat release rate at a time</option>
        <option value="time">Time to reach an HRR</option>
      </SelectField>

      <SelectField label="Fire growth rate" value={values.growthRate} onChange={(next) => setValue('growthRate', next)}>
        {Object.entries(GROWTH_RATES).map(([key, rate]) => (
          <option key={key} value={key}>
            {rate.name} ({formatNumber(fromSI(rate.alpha, 'alpha', units), 5)} {alphaUnit})
          </option>
        ))}
        <option value="custom">Custom α</option>
      </SelectField>

      {values.growthRate === 'custom' && (
        <NumberField
          label="Custom α (fire growth coefficient)"
          unit={alphaUnit}
          value={values.customAlpha}
          onChange={(value) => setValue('customAlpha', value)}
        />
      )}

      {mode === 'heatRelease' ? (
        <NumberField
          label="Time"
          unit={values.timeUnit === 'min' ? 'min' : 's'}
          unitOptions={TIME_UNITS}
          onUnitChange={changeTimeUnit}
          value={values.time}
          onChange={(value) => setValue('time', value)}
        />
      ) : (
        <NumberField
          label="Target heat release rate"
          unit={hrrUnit}
          value={values.heatRelease}
          onChange={(value) => setValue('heatRelease', value)}
        />
      )}
    </CalculatorShell>
  );
}
