import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import useCalculatorState from '../../hooks/useCalculatorState';
import useHistory from '../../hooks/useHistory';
import { computeFlashover } from '../../lib/calculations';
import { FLASHOVER_TIME_S, WALL_MATERIALS } from '../../lib/materials';
import { buildReport } from '../../lib/share';
import { formatAlternate, formatAuto, unitLabel } from '../../lib/units';
import CalculatorShell from '../common/CalculatorShell';
import { Definitions, Formula } from '../common/Equation';
import HistoryPanel from '../common/HistoryPanel';
import NumberField from '../common/NumberField';
import ResultCard from '../common/ResultCard';
import SelectField from '../common/SelectField';

const INITIAL_VALUES = { roomLength: '', roomWidth: '', roomHeight: '', ventWidth: '', ventHeight: '', wall: 'gypsum' };
const FIELD_KINDS = { roomLength: 'length', roomWidth: 'length', roomHeight: 'length', ventWidth: 'length', ventHeight: 'length' };

const METHODS = [
  { key: 'mqh', label: 'MQH' },
  { key: 'thomas', label: 'Thomas' },
  { key: 'babrauskas', label: 'Babrauskas' },
];

const ABOUT = (
  <Stack spacing={3}>
    <Text>Estimates the minimum heat release rate required for flashover using the MQH, Thomas and Babrauskas correlations.</Text>
    <Box>
      <Formula>MQH: Q̇fo = 610 (hk AT AO √HO)^½</Formula>
      <Formula>Thomas: Q̇fo = 7.8 AT + 378 AO √HO</Formula>
      <Formula>Babrauskas: Q̇fo = 750 AO √HO</Formula>
    </Box>
    <Definitions
      items={[
        ['Q̇fo', 'Heat release rate required for flashover (kW)'],
        ['hk', '√(kρc / t) = wall heat transfer coefficient (kW/m²·K)'],
        ['kρc', 'Wall thermal inertia (from the material selected)'],
        ['AT', 'Total surface area of the compartment, 2(LW + LH + WH)'],
        ['AO', 'Area of the ventilation opening'],
        ['HO', 'Height of the ventilation opening'],
      ]}
    />
    <Text color="text.muted" fontStyle="italic">
      Note: hk assumes t = {FLASHOVER_TIME_S} s after ignition (NUREG-1805 transient regime, typical pre-flashover
      time). Results may differ for very short or very long fire durations.
    </Text>
  </Stack>
);

const accentFor = (si) => {
  const average = (si.mqh + si.thomas + si.babrauskas) / 3;
  if (average > 5000) return 'red.500';
  if (average > 2000) return 'orange.400';
  if (average > 1000) return 'yellow.400';
  return 'green.500';
};

export default function FlashoverCalculator() {
  const { values, units, setValue, reset, load } = useCalculatorState('flashover', INITIAL_VALUES, FIELD_KINDS);
  const history = useHistory('flashover');
  const result = computeFlashover(values, units);
  const lengthUnit = unitLabel('length', units);
  const hrrUnit = unitLabel('hrr', units);

  const field = (name, label) => (
    <NumberField label={label} unit={lengthUnit} value={values[name]} onChange={(value) => setValue(name, value)} />
  );

  let report;
  let save;
  if (result.status === 'ok') {
    const room = `${values.roomLength} × ${values.roomWidth} × ${values.roomHeight} ${lengthUnit}`;
    const opening = `${values.ventWidth} × ${values.ventHeight} ${lengthUnit}`;
    report = buildReport({
      title: 'Flashover Analysis',
      method: 'MQH, Thomas and Babrauskas correlations',
      results: METHODS.map(
        ({ key, label }) => `${label}: ${formatAuto(result[key])} ${hrrUnit} (${formatAlternate(result.si[key], 'hrr', units)})`,
      ),
      inputs: [`Room (L × W × H): ${room}`, `Opening (W × H): ${opening}`, `Wall material: ${result.wall.name}`],
      notes: [`h_k assumes t = ${FLASHOVER_TIME_S} s after ignition.`],
    });
    save = () =>
      history.add({
        units,
        values,
        title: METHODS.map(({ key, label }) => `${label} ${formatAuto(result[key])}`).join(' · ') + ` ${hrrUnit}`,
        detail: `Room ${room} · opening ${opening} · ${result.wall.name}`,
        accent: accentFor(result.si),
      });
  }

  return (
    <CalculatorShell
      title="Flashover"
      about={ABOUT}
      onClear={reset}
      result={
        <ResultCard title="Heat release rate for flashover" result={result} report={report} reportTitle="Flashover Analysis" onSave={save}>
          {result.status === 'ok' && (
            <Stack spacing={1}>
              {METHODS.map(({ key, label }) => (
                <Flex key={key} justify="space-between" align="baseline" gap={3}>
                  <Text color="text.muted">{label}</Text>
                  <Text fontSize="xl" fontWeight="bold" textAlign="right">
                    {formatAuto(result[key])}{' '}
                    <Text as="span" fontSize="md" fontWeight="semibold">
                      {hrrUnit}
                    </Text>
                  </Text>
                </Flex>
              ))}
            </Stack>
          )}
        </ResultCard>
      }
      extras={<HistoryPanel entries={history.entries} onLoad={load} onClear={history.clear} />}
    >
      <Text fontWeight="semibold">Room</Text>
      <SimpleGrid columns={2} spacing={3}>
        {field('roomLength', 'Length')}
        {field('roomWidth', 'Width')}
        {field('roomHeight', 'Height')}
      </SimpleGrid>

      <Text fontWeight="semibold">Ventilation opening (door or window)</Text>
      <SimpleGrid columns={2} spacing={3}>
        {field('ventWidth', 'Width')}
        {field('ventHeight', 'Height')}
      </SimpleGrid>

      <SelectField label="Wall and ceiling material" value={values.wall} onChange={(wall) => setValue('wall', wall)}>
        {Object.entries(WALL_MATERIALS).map(([key, material]) => (
          <option key={key} value={key}>
            {material.name}
          </option>
        ))}
      </SelectField>
    </CalculatorShell>
  );
}
