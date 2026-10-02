import { Box, Stack, Text } from '@chakra-ui/react';
import useCalculatorState from '../../hooks/useCalculatorState';
import useHistory from '../../hooks/useHistory';
import { computeFlameHeight, FLAME_MODES } from '../../lib/calculations';
import { buildReport } from '../../lib/share';
import { formatAlternate, formatAuto, formatNumber, fromSI, unitLabel } from '../../lib/units';
import CalculatorShell from '../common/CalculatorShell';
import { Definitions, Formula } from '../common/Equation';
import HistoryPanel from '../common/HistoryPanel';
import NumberField from '../common/NumberField';
import ResultCard, { ResultValue } from '../common/ResultCard';
import SelectField from '../common/SelectField';

const INITIAL_VALUES = { mode: 'flameHeight', heatRelease: '', diameter: '', flameHeight: '' };
const FIELD_KINDS = { heatRelease: 'hrr', diameter: 'length', flameHeight: 'length' };

const ABOUT = (
  <Stack spacing={3}>
    <Text>Calculates flame height using Heskestad&apos;s correlation, or solves it for heat release rate or fire diameter.</Text>
    <Formula>L = 0.235 Q̇^(2/5) − 1.02 D</Formula>
    <Definitions
      items={[
        ['L', 'Flame height (m or ft)'],
        ['Q̇', 'Heat release rate (kW or BTU/s)'],
        ['D', 'Fire diameter (m or ft)'],
      ]}
    />
    <Text color="text.muted">The correlation is evaluated in SI units; imperial inputs are converted first.</Text>
  </Stack>
);

// Reference heights (m) drawn behind the flame.
const REFERENCES = [
  { name: 'Person', heightM: 1.8, color: 'blue.500', side: 'left', below: true, line: '2px solid' },
  { name: 'Door', heightM: 2.1, color: 'green.500', side: 'right', below: false, line: '2px dashed' },
  { name: 'Ceiling', heightM: 2.4, color: 'orange.500', side: 'left', below: false, line: '2px dotted' },
  { name: '2-story', heightM: 6.0, color: 'red.500', side: 'right', below: false, line: '1px dashed' },
];

function FlameHeightVisual({ heightM, units }) {
  const unit = unitLabel('length', units);
  const scaleMax = Math.max(10, heightM * 1.15);
  const flamePercent = Math.min((heightM / scaleMax) * 100, 100);
  return (
    <Box p={4} bg="bg.subtle" borderRadius="md">
      <Text fontWeight="bold" mb={3}>
        Flame height compared with familiar heights
      </Text>
      <Box position="relative" h="260px" bg="bg.surface" borderRadius="md" overflow="hidden">
        {REFERENCES.filter((ref) => ref.heightM <= scaleMax).map((ref) => (
          <Box
            key={ref.name}
            position="absolute"
            bottom={`${(ref.heightM / scaleMax) * 100}%`}
            left={0}
            right={0}
            borderTop={ref.line}
            borderColor={ref.color}
            opacity={0.85}
          >
            <Text
              position="absolute"
              {...(ref.side === 'left' ? { left: 2 } : { right: 2 })}
              top={ref.below ? '2px' : '-22px'}
              fontSize="xs"
              fontWeight="bold"
              color={ref.color}
              bg="bg.surface"
              px={1}
              borderRadius="sm"
              borderWidth="1px"
              borderColor={ref.color}
            >
              {ref.name} · {formatNumber(fromSI(ref.heightM, 'length', units), 1)} {unit}
            </Text>
          </Box>
        ))}
        <Box
          position="absolute"
          bottom={0}
          left="50%"
          transform="translateX(-50%)"
          w="50px"
          h={`${flamePercent}%`}
          bgGradient="linear(to-t, orange.500, orange.400, red.400)"
          borderTopRadius="50%"
          transition="height 0.3s ease"
          boxShadow="0 0 25px rgba(251, 211, 141, 0.6)"
        />
        <Box position="absolute" bottom={`${Math.min(flamePercent + 3, 88)}%`} left="50%" transform="translateX(-50%)">
          <Box bg="red.600" color="white" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="bold" boxShadow="md" whiteSpace="nowrap">
            {formatNumber(fromSI(heightM, 'length', units), 1)} {unit}
          </Box>
        </Box>
        <Box position="absolute" bottom={0} left={0} right={0} h="2px" bg="gray.500" />
      </Box>
      <Text fontSize="xs" color="text.muted" mt={2} textAlign="center">
        Scale: 0 to {formatNumber(fromSI(scaleMax, 'length', units), 1)} {unit}
      </Text>
    </Box>
  );
}

export default function FlameHeightCalculator() {
  const { values, units, setValue, reset, load } = useCalculatorState('flameHeight', INITIAL_VALUES, FIELD_KINDS);
  const history = useHistory('flameHeight');
  const result = computeFlameHeight(values, units);
  const mode = FLAME_MODES[values.mode] ? values.mode : 'flameHeight';

  const hrrUnit = unitLabel('hrr', units);
  const lengthUnit = unitLabel('length', units);
  const inputLines = [
    mode !== 'heatRelease' && `Heat release rate: ${values.heatRelease} ${hrrUnit}`,
    mode !== 'diameter' && `Fire diameter: ${values.diameter} ${lengthUnit}`,
    mode !== 'flameHeight' && `Flame height: ${values.flameHeight} ${lengthUnit}`,
  ].filter(Boolean);

  let report;
  let save;
  let resultUnit;
  if (result.status === 'ok') {
    resultUnit = unitLabel(result.kind, units);
    const valueText = `${formatAuto(result.value)} ${resultUnit}`;
    report = buildReport({
      title: result.label,
      method: "Heskestad's correlation (L = 0.235 Q̇^(2/5) − 1.02 D)",
      results: [`${result.label}: ${valueText} (${formatAlternate(result.valueSI, result.kind, units)})`],
      inputs: inputLines,
    });
    save = () =>
      history.add({ units, values, title: `${result.label}: ${valueText}`, detail: inputLines.map((line) => line.split(': ')[1]).join(' · ') });
  }

  return (
    <CalculatorShell
      title="Flame Height"
      about={ABOUT}
      warning="Use for a single fuel item or package. Do not use in a room that has gone to flashover or full involvement."
      onClear={reset}
      result={
        <ResultCard
          title={FLAME_MODES[mode].label}
          result={result}
          report={report}
          onSave={save}
        >
          {result.status === 'ok' && (
            <ResultValue
              value={formatAuto(result.value)}
              unit={resultUnit}
              secondary={`= ${formatAlternate(result.valueSI, result.kind, units)}`}
            />
          )}
        </ResultCard>
      }
      extras={
        <>
          {result.status === 'ok' && mode === 'flameHeight' && <FlameHeightVisual heightM={result.valueSI} units={units} />}
          <HistoryPanel entries={history.entries} onLoad={load} onClear={history.clear} />
        </>
      }
    >
      <SelectField label="Calculate" value={mode} onChange={(next) => setValue('mode', next)}>
        <option value="flameHeight">Flame height</option>
        <option value="heatRelease">Heat release rate</option>
        <option value="diameter">Fire diameter</option>
      </SelectField>

      {mode !== 'heatRelease' && (
        <NumberField
          label="Heat release rate"
          unit={hrrUnit}
          value={values.heatRelease}
          onChange={(value) => setValue('heatRelease', value)}
        />
      )}
      {mode !== 'diameter' && (
        <NumberField
          label="Fire diameter"
          unit={lengthUnit}
          value={values.diameter}
          onChange={(value) => setValue('diameter', value)}
        />
      )}
      {mode !== 'flameHeight' && (
        <NumberField
          label="Flame height"
          unit={lengthUnit}
          value={values.flameHeight}
          onChange={(value) => setValue('flameHeight', value)}
        />
      )}
    </CalculatorShell>
  );
}
