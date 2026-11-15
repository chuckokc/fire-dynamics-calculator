import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';
import EquationCard from '../EquationCard';
import ResultCard from '../ResultCard';
import { MATERIALS, flashoverHRR, compareFire } from '../../calculations/flashover.js';
import { DEFAULT_UNITS, FEET, convertInput, unitLabel } from '../../calculations/units.js';
import { fmt } from '../../calculations/work.js';
import ShowWork from '../ShowWork';
import UnitToggle from '../UnitToggle';
import { useIncomingHRR } from '../HrrTransfer';

const FlashoverCalculator = () => {
  // State declarations
  const [roomHeight, setRoomHeight] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [roomLength, setRoomLength] = useState('');
  const [openingHeight, setOpeningHeight] = useState('');
  const [openingWidth, setOpeningWidth] = useState('');
  const [surfaceMaterial, setSurfaceMaterial] = useState('gypsum');
  const [compareHRR, setCompareHRR] = useState(''); // optional fire to compare
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [results, setResults] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // Add these new states for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Materials, h_k (t = 600 s) and the flashover equations are in
  // src/calculations/flashover.js, where tests check them against NUREG.

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!results) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      roomHeight: roomHeight,
      roomWidth: roomWidth,
      roomLength: roomLength,
      openingHeight: openingHeight,
      openingWidth: openingWidth,
      surfaceMaterial: surfaceMaterial,
      units: units,
      results: {
        mqh: results.mqh,
        thomas: results.thomas,
        babrauskas: results.babrauskas
      }
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setRoomHeight(entry.roomHeight);
    setRoomWidth(entry.roomWidth);
    setRoomLength(entry.roomLength);
    setOpeningHeight(entry.openingHeight);
    setOpeningWidth(entry.openingWidth);
    setSurfaceMaterial(entry.surfaceMaterial);
    setUnits(entry.units);
    setShowHistory(false);
  };

  const calculateFlashover = () => {
    const r = flashoverHRR({
      H: parseFloat(roomHeight),
      W: parseFloat(roomWidth),
      L: parseFloat(roomLength),
      hv: parseFloat(openingHeight),
      wv: parseFloat(openingWidth),
      material: surfaceMaterial,
      units
    });
    // The three estimates are always kW, whatever the length unit
    setResults(r ? { mqh: r.kW.mqh, thomas: r.kW.thomas, babrauskas: r.kW.babrauskas, kW: r.kW, steps: r.steps } : null);
  };

  // HRR sent from another calculator: compare that fire with this room
  useIncomingHRR('flashover', (kW) => {
    setCompareHRR(kW.toFixed(2));
  });

  // Switching units converts what's already entered
  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;
    const toFeet = newUnits === FEET;
    setRoomHeight(prev => convertInput(prev, 'length', toFeet));
    setRoomWidth(prev => convertInput(prev, 'length', toFeet));
    setRoomLength(prev => convertInput(prev, 'length', toFeet));
    setOpeningHeight(prev => convertInput(prev, 'length', toFeet));
    setOpeningWidth(prev => convertInput(prev, 'length', toFeet));
    setUnits(newUnits);
  };

  const copyResults = () => {
  if (!results) return;  // Changed from 'result' to 'results'
  
  let copyText = `Fire Dynamics Calculator - Flashover Analysis\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n\n`;
  copyText += `Room Parameters:\n`;
  copyText += `- Dimensions: ${roomLength} × ${roomWidth} × ${roomHeight} ${unitLabel('length', units)}\n`;
  copyText += `- Opening: ${openingWidth} × ${openingHeight} ${unitLabel('length', units)}\n`;
  copyText += `- Surface Material: ${MATERIALS[surfaceMaterial].name}\n\n`;
  copyText += `Results:\n`;
  copyText += `- MQH Method: ${results.mqh.toFixed(0)} kW\n`;
  copyText += `- Thomas Method: ${results.thomas.toFixed(0)} kW\n`;
  copyText += `- Babrauskas Method: ${results.babrauskas.toFixed(0)} kW\n`;
  
  navigator.clipboard.writeText(copyText).then(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  });
};

  useEffect(() => {
    if (roomHeight && roomWidth && roomLength && openingHeight && openingWidth) {
      calculateFlashover();
    } else {
      // Live result: nothing is shown until all five sizes are entered.
      setResults(null);
    }
  }, [roomHeight, roomWidth, roomLength, openingHeight, openingWidth, surfaceMaterial, units]);

  // One length input with its unit under it. Used for the room and opening sizes.
  const dimensionField = (label, value, setValue) => (
    <Chakra.FormControl isRequired>
      <Chakra.FormLabel>{label}</Chakra.FormLabel>
      <Chakra.NumberInput value={value} onChange={(vs) => setValue(vs)} min={0}>
        <Chakra.NumberInputField inputMode="decimal" />
      </Chakra.NumberInput>
      <Chakra.Text fontSize="sm" color="fd.muted">
        {unitLabel('length', units)}
      </Chakra.Text>
    </Chakra.FormControl>
  );

  return (
    <Chakra.Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <EquationCard
          title="Flashover Correlations:"
          equation={(
            <>
              MQH: Q̇fo = 610(hkATAO√HO)^(1/2)
              <br />
              Thomas: Q̇fo = 7.8AT + 378AO√HO
              <br />
              Babrauskas: Q̇fo = 750AO√HO
            </>
          )}
        >
          <Chakra.Text fontSize="sm" color="fd.muted" mt={2}>
            Where:
            <br />
            Q̇fo = Heat release rate required for flashover
            <br />
            hk = √(kρc/t) = Wall heat transfer coefficient (kW/m²·K)
            <br />
            kρc = Wall thermal inertia (from material selection)
            <br />
            AT = Total area of walls, ceiling and floor, minus the opening
            <br />
            AO = Area of ventilation opening
            <br />
            HO = Height of ventilation opening
          </Chakra.Text>
          <Chakra.Text fontSize="sm" color="fd.muted" mt={3} fontStyle="italic">
            Note: h_k assumes t = 600 s after ignition, a typical time to flashover. This simplification is used here so no wall thickness is needed; it is not the NUREG-1805 method. The NUREG spreadsheet uses h_k = k/δ (walls heated all the way through), which usually gives a lower MQH value.
          </Chakra.Text>
        </EquationCard>
        
        <Chakra.Box>
          <Chakra.Heading as="h3" size="xs" textTransform="uppercase" letterSpacing="wider" color="fd.muted" mb={3}>
            Room dimensions
          </Chakra.Heading>
          <Chakra.SimpleGrid columns={{ base: 2, sm: 3 }} spacing={4}>
            {dimensionField('Room Height', roomHeight, setRoomHeight)}
            {dimensionField('Room Width', roomWidth, setRoomWidth)}
            {dimensionField('Room Length', roomLength, setRoomLength)}
          </Chakra.SimpleGrid>
        </Chakra.Box>

        <Chakra.Box>
          <Chakra.Heading as="h3" size="xs" textTransform="uppercase" letterSpacing="wider" color="fd.muted" mb={3}>
            Ventilation opening
          </Chakra.Heading>
          <Chakra.SimpleGrid columns={{ base: 2, sm: 3 }} spacing={4}>
            {dimensionField('Opening Height', openingHeight, setOpeningHeight)}
            {dimensionField('Opening Width', openingWidth, setOpeningWidth)}
          </Chakra.SimpleGrid>
        </Chakra.Box>

        <Chakra.FormControl>
          <Chakra.FormLabel>Surface Material</Chakra.FormLabel>
          <Chakra.Select
            value={surfaceMaterial}
            onChange={(e) => setSurfaceMaterial(e.target.value)}
          >
            {Object.entries(MATERIALS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Chakra.Select>
        </Chakra.FormControl>

        <UnitToggle value={units} onChange={handleUnitsChange} />

        <Chakra.FormControl>
          <Chakra.FormLabel>Compare a Fire (optional)</Chakra.FormLabel>
          <Chakra.NumberInput value={compareHRR} onChange={(vs) => setCompareHRR(vs)} min={0}>
            <Chakra.NumberInputField inputMode="decimal" />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="fd.muted">
            kW, the heat release rate of a fire in this room. Shows whether it reaches each flashover estimate.
          </Chakra.Text>
        </Chakra.FormControl>

        {/* Add history toggle button */}
        {calculationHistory.length > 0 && (
          <Chakra.Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide' : 'Show'} History ({calculationHistory.length})
          </Chakra.Button>
        )}

        {/* History display */}
        {showHistory && calculationHistory.length > 0 && (
          <Chakra.Card variant="outline">
            <Chakra.CardBody>
              <Chakra.HStack justify="space-between" mb={3}>
                <Chakra.Text fontWeight="bold">Calculation History</Chakra.Text>
                <Chakra.Button
                  size="sm"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => {
                    setCalculationHistory([]);
                    setShowHistory(false);
                  }}
                >
                  Clear All
                </Chakra.Button>
              </Chakra.HStack>
              <Chakra.VStack align="stretch" spacing={2}>
                {calculationHistory.map((entry) => {
                  // Get the average of the three methods for coloring
                  const avgHRR = (entry.results.mqh + entry.results.thomas + entry.results.babrauskas) / 3;
                  
                  const hrrColor = avgHRR > 5000 ? 'red' : 
                                  avgHRR > 2000 ? 'orange' :
                                  avgHRR > 1000 ? 'yellow' : 'green';
                  
                  return (
                    <Chakra.Box
                      key={entry.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderLeftWidth="4px"
                      borderLeftColor={`${hrrColor}.500`}
                      _hover={{ bg: Chakra.useColorModeValue('gray.50', 'gray.700') }}
                      cursor="pointer"
                      onClick={() => loadFromHistory(entry)}
                    >
                      <Chakra.HStack justify="space-between">
                        <Chakra.VStack align="start" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="medium">
                            Room: {entry.roomLength}×{entry.roomWidth}×{entry.roomHeight} {unitLabel('length', entry.units)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="fd.muted">
                            {entry.timestamp}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="fd.muted">
                            Opening: {entry.openingWidth}×{entry.openingHeight} {unitLabel('length', entry.units)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="fd.muted">
                            {MATERIALS[entry.surfaceMaterial].name}
                          </Chakra.Text>
                        </Chakra.VStack>
                        <Chakra.VStack align="end" spacing={0}>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            MQH: {entry.results.mqh.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            Thomas: {entry.results.thomas.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            Babrauskas: {entry.results.babrauskas.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="fd.muted">
                            kW
                          </Chakra.Text>
                        </Chakra.VStack>
                      </Chakra.HStack>
                    </Chakra.Box>
                  );
                })}
              </Chakra.VStack>
            </Chakra.CardBody>
          </Chakra.Card>
        )}

        {results && (
          <ResultCard
            accent="blue.400"
            title="Required Heat Release Rate for Flashover"
            stats={[
              { label: 'MQH', value: results.mqh.toFixed(0), unit: 'kW' },
              { label: 'Thomas', value: results.thomas.toFixed(0), unit: 'kW' },
              { label: 'Babrauskas', value: results.babrauskas.toFixed(0), unit: 'kW' },
            ]}
            onCopy={copyResults}
            copySuccess={copySuccess}
            onSave={saveToHistory}
          />
        )}
        {results && parseFloat(compareHRR) > 0 && (() => {
          const fireKW = parseFloat(compareHRR);
          const cmp = compareFire(fireKW, results.kW);
          const names = { mqh: 'MQH', babrauskas: 'Babrauskas', thomas: 'Thomas' };
          const reached = Object.keys(names).filter((k) => cmp[k]).map((k) => names[k]);
          const fire = `${fmt(fireKW)} kW`;
          const status = cmp.count === 3 ? 'error' : cmp.count > 0 ? 'warning' : 'success';
          const message = cmp.count === 3
            ? 'It reaches all three flashover estimates, so flashover of this room is likely.'
            : cmp.count === 0
              ? 'It is below all three flashover estimates, so this fire alone is unlikely to flash over this room.'
              : `It reaches the ${reached.join(' and ')} estimate${reached.length > 1 ? 's' : ''} but not the others. The methods disagree, so treat flashover as possible.`;
          return (
            <Chakra.Alert status={status} alignItems="flex-start">
              <Chakra.AlertIcon />
              <Chakra.Box>
                <Chakra.AlertTitle>A {fire} fire in this room</Chakra.AlertTitle>
                <Chakra.AlertDescription fontSize="sm">{message}</Chakra.AlertDescription>
              </Chakra.Box>
            </Chakra.Alert>
          );
        })()}
        {results && <ShowWork steps={results.steps} />}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default FlashoverCalculator;