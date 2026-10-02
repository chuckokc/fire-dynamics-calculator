import { Stack, Text } from '@chakra-ui/react';
import useCalculatorState from '../../hooks/useCalculatorState';
import useHistory from '../../hooks/useHistory';
import { computeHeatRelease } from '../../lib/calculations';
import { FUEL_GROUPS, FUELS } from '../../lib/materials';
import { buildReport } from '../../lib/share';
import { formatAlternate, formatAuto, unitLabel } from '../../lib/units';
import CalculatorShell from '../common/CalculatorShell';
import { Definitions, Formula } from '../common/Equation';
import HistoryPanel from '../common/HistoryPanel';
import NumberField from '../common/NumberField';
import ResultCard, { ResultValue } from '../common/ResultCard';
import SelectField from '../common/SelectField';

const INITIAL_VALUES = { material: '', burningArea: '', massFlux: '' };
const FIELD_KINDS = { burningArea: 'area' };

const ABOUT = (
  <Stack spacing={3}>
    <Text>Calculates heat release rate using the heat release rate equation.</Text>
    <Formula>Q̇ = ṁ″ × A × ΔHc</Formula>
    <Definitions
      items={[
        ['Q̇', 'Heat release rate (kW or BTU/s)'],
        ['ṁ″', 'Mass loss rate per unit area (g/m²·s)'],
        ['A', 'Burning area (m² or ft²)'],
        ['ΔHc', 'Heat of combustion (kJ/g)'],
      ]}
    />
  </Stack>
);

export default function HeatReleaseCalculator() {
  const { values, units, setValue, setValues, reset, load } = useCalculatorState(
    'heatRelease',
    INITIAL_VALUES,
    FIELD_KINDS,
  );
  const history = useHistory('heatRelease');
  const result = computeHeatRelease(values, units);

  const fuel = FUELS[values.material];
  const needsMassFlux = Boolean(fuel && !fuel.massFlux);
  const hrrUnit = unitLabel('hrr', units);
  const areaUnit = unitLabel('area', units);

  let fuelHelp;
  if (fuel && fuel.massFlux) fuelHelp = `ṁ″ ${fuel.massFlux} g/m²·s · ΔHc ${fuel.heatOfCombustion} kJ/g`;
  else if (fuel) fuelHelp = `ΔHc ${fuel.heatOfCombustion} kJ/g. No published mass flux; enter one below.`;

  let report;
  let save;
  if (result.status === 'ok') {
    const hrrText = `${formatAuto(result.hrr)} ${hrrUnit}`;
    report = buildReport({
      title: 'Heat Release Rate',
      method: 'Q̇ = ṁ″ × A × ΔHc',
      results: [`Heat release rate: ${hrrText} (${formatAlternate(result.hrrSI, 'hrr', units)})`],
      inputs: [
        `Material: ${fuel.name}`,
        `Burning area: ${values.burningArea} ${areaUnit}`,
        `Mass flux: ${result.massFlux} g/m²·s${needsMassFlux ? ' (entered)' : ''}`,
        `Heat of combustion: ${result.heatOfCombustion} kJ/g`,
      ],
    });
    save = () =>
      history.add({
        units,
        values,
        title: hrrText,
        detail: `${fuel.name} · ${values.burningArea} ${areaUnit}`,
      });
  }

  return (
    <CalculatorShell
      title="Heat Release Rate"
      about={ABOUT}
      onClear={reset}
      result={
        <ResultCard title="Heat release rate" result={result} report={report} onSave={save}>
          {result.status === 'ok' && (
            <>
              <ResultValue
                value={formatAuto(result.hrr)}
                unit={hrrUnit}
                secondary={`= ${formatAlternate(result.hrrSI, 'hrr', units)}`}
              />
              <Text fontSize="sm" color="text.muted">
                {fuel.name}: ṁ″ {result.massFlux} g/m²·s × ΔHc {result.heatOfCombustion} kJ/g
              </Text>
            </>
          )}
        </ResultCard>
      }
      extras={<HistoryPanel entries={history.entries} onLoad={load} onClear={history.clear} />}
    >
      <SelectField
        label="Material"
        isRequired
        placeholder="Select material"
        value={values.material}
        onChange={(material) => setValues({ material, massFlux: '' })}
        helperText={fuelHelp}
      >
        {Object.entries(FUEL_GROUPS).map(([type, fuels]) => (
          <optgroup key={type} label={type}>
            {fuels.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
                {item.massFlux ? '' : ' (enter mass flux)'}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>

      {needsMassFlux && (
        <NumberField
          label="Mass flux"
          unit="g/m²·s"
          value={values.massFlux}
          onChange={(value) => setValue('massFlux', value)}
          helperText="Typical values are under Reference → Mass Flux Values."
        />
      )}

      <NumberField
        label="Burning area"
        unit={areaUnit}
        value={values.burningArea}
        onChange={(value) => setValue('burningArea', value)}
      />
    </CalculatorShell>
  );
}
