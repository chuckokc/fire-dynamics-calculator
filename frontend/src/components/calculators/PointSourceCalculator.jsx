import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import useCalculatorState from '../../hooks/useCalculatorState';
import useHistory from '../../hooks/useHistory';
import { computePointSource } from '../../lib/calculations';
import { pointSourceDistance } from '../../lib/fireMath';
import { COMMON_HRR, RADIATION_ZONES, RADIATIVE_FRACTIONS } from '../../lib/materials';
import { buildReport } from '../../lib/share';
import { formatNumber, fromSI, parseNumber, toSI, unitLabel } from '../../lib/units';
import CalculatorShell from '../common/CalculatorShell';
import { Definitions, Formula } from '../common/Equation';
import HistoryPanel from '../common/HistoryPanel';
import NumberField from '../common/NumberField';
import ResultCard, { ResultValue } from '../common/ResultCard';

const INITIAL_VALUES = { heatRelease: '', distance: '', radiativeFraction: '0.3' };
const FIELD_KINDS = { heatRelease: 'hrr', distance: 'length' };

const LEVEL_STYLE = {
  exceeded: { color: 'red.500', label: 'Exceeded' },
  near: { color: 'yellow.400', label: 'Within 20%' },
  below: { color: 'green.500', label: 'Below' },
};

const ABOUT = (
  <Stack spacing={3}>
    <Text>Calculates radiative heat flux at a target using the point source radiation model.</Text>
    <Formula>q″ = (Q̇ × χr) / (4π × R²)</Formula>
    <Definitions
      items={[
        ['q″', 'Radiative heat flux at the target (kW/m²)'],
        ['Q̇', 'Total heat release rate (kW or BTU/s)'],
        ['χr', 'Radiative fraction (typically 0.3)'],
        ['R', 'Distance from the fire to the target (m or ft)'],
      ]}
    />
    <Text color="text.muted">
      Heat flux is shown in kW/m² so it can be compared directly with the NFPA 921 critical values below; the
      BTU/ft²·s equivalent is shown in imperial mode.
    </Text>
  </Stack>
);

// Formats a heat flux (kW/m²) for display.
const fluxNumber = (kWm2) => formatNumber(kWm2, kWm2 >= 100 ? 0 : kWm2 >= 10 ? 1 : 2);
const flux = (kWm2) => `${fluxNumber(kWm2)} kW/m²`;
const fluxImperial = (kWm2) => `${formatNumber(fromSI(kWm2, 'heatFlux', 'imperial'), 3)} BTU/ft²·s`;

function CriticalValues({ thresholds, units }) {
  return (
    <Box p={4} bg="bg.surface" borderWidth="1px" borderColor="border.default" borderRadius="md">
      <Text fontWeight="bold">Critical value analysis</Text>
      <HStack spacing={4} mt={1} mb={3} wrap="wrap">
        {Object.values(LEVEL_STYLE).map((level) => (
          <HStack key={level.label} spacing={1}>
            <Box w="10px" h="10px" borderRadius="full" bg={level.color} />
            <Text fontSize="xs" color="text.muted">
              {level.label}
            </Text>
          </HStack>
        ))}
      </HStack>
      <Stack spacing={2}>
        {thresholds.map((threshold) => {
          const level = LEVEL_STYLE[threshold.level];
          return (
            <Flex key={`${threshold.value}-${threshold.description}`} align="start" gap={2}>
              <Box w="10px" h="10px" mt="6px" borderRadius="full" bg={level.color} flexShrink={0} aria-hidden />
              <Box>
                <Text fontSize="sm" fontWeight={threshold.level === 'exceeded' ? 'bold' : 'normal'}>
                  {flux(threshold.value)}: {threshold.description}
                  <Text as="span" srOnly>
                    {' '}
                    ({level.label})
                  </Text>
                </Text>
                {units === 'imperial' && (
                  <Text fontSize="xs" color="text.subtle">
                    {fluxImperial(threshold.value)}
                  </Text>
                )}
              </Box>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
}

function RadiationZoneVisual({ hrrKW, distanceM, radiativeFraction, fluxSI, units }) {
  const lengthUnit = unitLabel('length', units);
  const radii = RADIATION_ZONES.map((zone) =>
    pointSourceDistance({ hrr: hrrKW, radiativeFraction, heatFlux: zone.flux }),
  );
  const maxVisualRadius = 140;
  const scale = maxVisualRadius / (Math.max(...radii, distanceM) || 1);
  const personOffset = Math.min(distanceM * scale, maxVisualRadius);
  return (
    <Box p={4} bg="bg.subtle" borderRadius="md">
      <Text fontWeight="bold" mb={3}>
        Radiation zones
      </Text>
      <Box
        position="relative"
        mx="auto"
        w="100%"
        maxW="320px"
        h="320px"
        bg="bg.surface"
        borderRadius="md"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {RADIATION_ZONES.map((zone, index) => {
          const size = `${radii[index] * scale * 2}px`;
          return (
            <Box
              key={zone.name}
              position="absolute"
              w={size}
              h={size}
              borderRadius="full"
              borderWidth="4px"
              borderColor={zone.color}
              bg={zone.fill}
              opacity={0.8}
              transition="all 0.3s ease"
            />
          );
        })}
        <Box position="absolute" w="32px" h="32px" bg="red.500" borderRadius="full" boxShadow="0 0 30px rgba(255, 0, 0, 0.8)" zIndex={1}>
          <Text fontSize="20px" textAlign="center" lineHeight="32px">
            🔥
          </Text>
        </Box>
        <Box
          position="absolute"
          left="50%"
          top="50%"
          transform={`translate(-50%, -50%) translateX(${personOffset}px)`}
          zIndex={2}
        >
          <Text fontSize="26px">🧍</Text>
          <Box
            position="absolute"
            top="-26px"
            left="50%"
            transform="translateX(-50%)"
            bg="gray.800"
            color="white"
            px={2}
            py={0.5}
            borderRadius="md"
            fontSize="xs"
            fontWeight="bold"
            whiteSpace="nowrap"
          >
            {flux(fluxSI)}
          </Box>
        </Box>
      </Box>
      <Stack spacing={1} mt={3}>
        {RADIATION_ZONES.map((zone, index) => (
          <HStack key={zone.name} spacing={2}>
            <Box w="12px" h="12px" bg={zone.color} borderRadius="sm" flexShrink={0} />
            <Text fontSize="sm">
              {zone.flux} kW/m²: {zone.name}, out to {formatNumber(fromSI(radii[index], 'length', units), 1)} {lengthUnit}
            </Text>
          </HStack>
        ))}
      </Stack>
    </Box>
  );
}

function QuickReference() {
  return (
    <Accordion allowToggle>
      {[
        ['Radiative fractions', RADIATIVE_FRACTIONS],
        ['Typical heat release rates', COMMON_HRR],
      ].map(([title, data]) => (
        <AccordionItem key={title}>
          <AccordionButton minH="44px">
            <Box flex="1" textAlign="left" fontWeight="semibold">
              {title}
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <Stack spacing={1}>
              {Object.entries(data).map(([item, value]) => (
                <Flex key={item} justify="space-between" gap={3} fontSize="sm">
                  <Text>{item}</Text>
                  <Text fontWeight="semibold">{value}</Text>
                </Flex>
              ))}
            </Stack>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function PointSourceCalculator() {
  const { values, units, setValue, reset, load } = useCalculatorState('pointSource', INITIAL_VALUES, FIELD_KINDS);
  const history = useHistory('pointSource');
  const result = computePointSource(values, units);
  const hrrUnit = unitLabel('hrr', units);
  const lengthUnit = unitLabel('length', units);

  let report;
  let save;
  let statusText;
  let accent;
  if (result.status === 'ok') {
    const top = result.highestExceeded;
    statusText = top ? `At or above ${flux(top.value)}: ${top.description}` : 'Below all listed critical values';
    accent = top ? (top.value >= 20 ? 'red.500' : top.value >= 4.5 ? 'orange.400' : 'yellow.400') : 'green.500';
    const fluxText = units === 'imperial' ? `${flux(result.fluxSI)} (${fluxImperial(result.fluxSI)})` : flux(result.fluxSI);
    const inputs = [
      `Heat release rate: ${values.heatRelease} ${hrrUnit}`,
      `Distance: ${values.distance} ${lengthUnit}`,
      `Radiative fraction: ${values.radiativeFraction}`,
    ];
    report = buildReport({
      title: 'Point Source Radiation',
      method: 'q″ = χr Q̇ / (4π R²)',
      results: [`Radiative heat flux: ${fluxText}`, statusText],
      inputs,
    });
    save = () =>
      history.add({
        units,
        values,
        title: flux(result.fluxSI),
        detail: `${values.heatRelease} ${hrrUnit} at ${values.distance} ${lengthUnit} · χr ${values.radiativeFraction}`,
        accent,
      });
  }

  return (
    <CalculatorShell
      title="Point Source Radiation"
      about={ABOUT}
      onClear={reset}
      result={
        <ResultCard title="Radiative heat flux" result={result} report={report} onSave={save}>
          {result.status === 'ok' && (
            <>
              <ResultValue
                value={fluxNumber(result.fluxSI)}
                unit="kW/m²"
                secondary={units === 'imperial' ? `= ${fluxImperial(result.fluxSI)}` : undefined}
              />
              <HStack spacing={2} align="start">
                <Badge
                  flexShrink={0}
                  mt="2px"
                  colorScheme={result.highestExceeded ? (result.highestExceeded.value >= 4.5 ? 'red' : 'yellow') : 'green'}
                >
                  {result.highestExceeded ? 'Exceeds' : 'Below'}
                </Badge>
                <Text fontSize="sm">{statusText}</Text>
              </HStack>
            </>
          )}
        </ResultCard>
      }
      extras={
        <>
          {result.status === 'ok' && (
            <>
              <CriticalValues thresholds={result.thresholds} units={units} />
              <RadiationZoneVisual
                hrrKW={toSI(parseNumber(values.heatRelease), 'hrr', units)}
                distanceM={toSI(parseNumber(values.distance), 'length', units)}
                radiativeFraction={parseNumber(values.radiativeFraction)}
                fluxSI={result.fluxSI}
                units={units}
              />
            </>
          )}
          <HistoryPanel entries={history.entries} onLoad={load} onClear={history.clear} />
          <QuickReference />
        </>
      }
    >
      <NumberField
        label="Heat release rate"
        unit={hrrUnit}
        value={values.heatRelease}
        onChange={(value) => setValue('heatRelease', value)}
      />
      <NumberField
        label="Distance to target"
        unit={lengthUnit}
        value={values.distance}
        onChange={(value) => setValue('distance', value)}
      />
      <NumberField
        label="Radiative fraction (χr)"
        max={1}
        value={values.radiativeFraction}
        onChange={(value) => setValue('radiativeFraction', value)}
        helperText="Between 0 and 1. Typical value 0.3 (30% of the energy is radiated)."
      />
    </CalculatorShell>
  );
}
