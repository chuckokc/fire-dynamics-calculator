import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';
import EquationCard from '../EquationCard';
import { FIRE_LOCATIONS, solveFlameHeight } from '../../calculations/flameHeight.js';
import { DEFAULT_UNITS, convertInput, toSI, fromSI } from '../../calculations/units.js';
import { fmt } from '../../calculations/work.js';
import ShowWork from '../ShowWork';
import { SendHRRMenu, useIncomingHRR } from '../HrrTransfer';

// Visual Flame Height Indicator Component
// eslint-disable-next-line react/prop-types
const FlameHeightVisual = ({ flameHeight, units, ceilingM }) => {
  // Add this at the beginning of the component
  const bgColor = Chakra.useColorModeValue('gray.50', 'gray.700');
  const boxBgColor = Chakra.useColorModeValue('white', 'gray.800');
  // Reference heights in meters with styling
  const references = [
    { 
      name: 'Person', 
      heightM: 1.8, 
      color: 'blue.600', 
      labelSide: 'left',
      labelBelow: true,
      lineStyle: '2px solid'
    },
    { 
      name: 'Door', 
      heightM: 2.1, 
      color: 'green.600', 
      labelSide: 'right',
      labelBelow: false,
      lineStyle: '2px dashed'
    },
    { 
      name: 'Ceiling', 
      heightM: ceilingM > 0 ? Math.min(ceilingM, 10) : 2.4, 
      color: 'orange.600', 
      labelSide: 'left',
      labelBelow: false,
      lineStyle: '2px dotted'
    },
    { 
      name: '2-Story', 
      heightM: 6.0, 
      color: 'red.600', 
      labelSide: 'right',
      labelBelow: false,
      lineStyle: '1px dashed'
    }
  ];

  // Convert flame height to meters for comparison
  const flameHeightM = units === 'imperial' ? flameHeight * 0.3048 : flameHeight;
  
  // Maximum height for scaling (meters)
  const maxHeight = 10;
  
  // Calculate percentage heights
  const flamePercent = Math.min((flameHeightM / maxHeight) * 100, 100);
  
   return (
    <Chakra.Box p={4} bg={bgColor} borderRadius="md">
      <Chakra.Text fontWeight="bold" mb={3}>Flame Height Visualization</Chakra.Text>
      
      <Chakra.Box position="relative" h="250px" bg={boxBgColor} borderRadius="md" p={4}>
        {/* Reference lines */}
        {references.map((ref, index) => {
          const refPercent = (ref.heightM / maxHeight) * 100;
          const heightValue = units === 'imperial' ? 
            (ref.heightM * 3.28084).toFixed(1) : 
            ref.heightM.toFixed(1);
          const unitLabel = units === 'imperial' ? 'ft' : 'm';
          
          // Parse line style
          const [lineWidth, lineType] = ref.lineStyle.split(' ');
          
          return (
            <Chakra.Box
              key={ref.name}
              position="absolute"
              bottom={`${refPercent}%`}
              left={0}
              right={0}
              borderTop={ref.lineStyle}
              borderColor={ref.color}
              opacity={0.8}
            >
              <Chakra.Text
                position="absolute"
                {...(ref.labelSide === 'left' ? { left: 2 } : { right: 2 })}
                {...(ref.labelBelow ? { top: '2px' } : { top: '-20px' })}
                fontSize="12px"
                color={ref.color}
                fontWeight="bold"
                bg={boxBgColor}
                px={1}
                borderRadius="sm"
                border="1px solid"
                borderColor={ref.color}
              >
                {ref.name} • {heightValue}{unitLabel}
              </Chakra.Text>
            </Chakra.Box>
          );
        })}
        
        {/* Flame bar */}
        <Chakra.Box
          position="absolute"
          bottom={0}
          left="50%"
          transform="translateX(-50%)"
          w="50px"
          h={`${flamePercent}%`}
          bgGradient="linear(to-t, orange.500, orange.400, red.400)"
          borderRadius="md md 50% 50% / md md 40% 40%"
          transition="height 0.3s ease"
          boxShadow="0 0 25px rgba(251, 211, 141, 0.6)"
        />
        
        {/* Current height label */}
        {flameHeight > 0 && (
          <Chakra.Box
            position="absolute"
            bottom={`${Math.min(flamePercent + 3, 90)}%`}
            left="50%"
            transform="translateX(-50%)"
          >
            <Chakra.Box
              bg="red.600"
              color="white"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
              boxShadow="md"
            >
              {flameHeight.toFixed(1)} {units === 'imperial' ? 'ft' : 'm'}
            </Chakra.Box>
          </Chakra.Box>
        )}
        
        {/* Ground line */}
        <Chakra.Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="2px"
          bg="gray.600"
        />
      </Chakra.Box>
      
      <Chakra.Text fontSize="xs" color="fd.muted" mt={2} textAlign="center">
        Scale: 0 to {units === 'imperial' ? '32.8 ft' : '10 m'}
      </Chakra.Text>
    </Chakra.Box>
  );
};

const FlameHeightCalculator = () => {
  // State declarations
  const [heatRelease, setHeatRelease] = useState('');
  const [diameter, setDiameter] = useState(''); // fire diameter (middle) or length along wall (wall)
  const [flameHeight, setFlameHeight] = useState('');
  const [fireLocation, setFireLocation] = useState('center');
  const [ceilingHeight, setCeilingHeight] = useState(''); // optional
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [calculateMode, setCalculateMode] = useState('flameHeight'); // What to calculate
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const location = FIRE_LOCATIONS[fireLocation];

  // HRR sent from another calculator: solve for flame height with it
  useIncomingHRR('flameHeight', (kW) => {
    setCalculateMode('flameHeight');
    setHeatRelease(fromSI(kW, 'hrr', units).toFixed(2));
  });

  // Corner flame height doesn't depend on fire size, so there is nothing
  // to solve for in "size" mode; fall back to flame height.
  const handleLocationChange = (newLocation) => {
    setFireLocation(newLocation);
    if (!FIRE_LOCATIONS[newLocation].usesSize && calculateMode === 'diameter') {
      setCalculateMode('flameHeight');
    }
  };

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!result || result.error) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      calculateMode: calculateMode,
      fireLocation: fireLocation,
      heatRelease: heatRelease,
      diameter: diameter,
      flameHeight: flameHeight,
      units: units,
      result: {
        value: result.value,
        type: result.type,
        unit: result.unit
      }
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setCalculateMode(entry.calculateMode);
    setFireLocation(entry.fireLocation || 'center');
    setHeatRelease(entry.heatRelease);
    setDiameter(entry.diameter);
    setFlameHeight(entry.flameHeight);
    setUnits(entry.units);
    setShowHistory(false);
  };

  // Calculation: equations are in src/calculations/flameHeight.js (tested)
  const calculate = () => {
    setResult(solveFlameHeight({
      mode: calculateMode,
      location: fireLocation,
      Q: parseFloat(heatRelease),
      D: parseFloat(diameter),
      L: parseFloat(flameHeight),
      units
    }));
  };

  const copyResults = () => {
  if (!result || result.error) return;
  
  let copyText = `Fire Dynamics Calculator - ${result.type}\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n`;
  copyText += `Fire Location: ${location.label}\n`;
  copyText += `Method: ${location.method} (${location.equation})\n\n`;
  copyText += `Result: ${result.value.toFixed(2)} ${result.unit}`;
  if (units === 'imperial' && result.kW !== undefined) {
    copyText += ` (${result.kW.toFixed(2)} kW)`;
  }
  copyText += `\n\n`;
  copyText += `Input Parameters:\n`;

  if (calculateMode !== 'heatRelease' && heatRelease) {
    copyText += `- Heat Release Rate: ${heatRelease} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  }
  if (location.usesSize && calculateMode !== 'diameter' && diameter) {
    copyText += `- ${location.sizeName}: ${diameter} ${units === 'SI' ? 'm' : 'ft'}\n`;
  }
  if (calculateMode !== 'flameHeight' && flameHeight) {
    copyText += `- Flame Height: ${flameHeight} ${units === 'SI' ? 'm' : 'ft'}\n`;
  }
  
  navigator.clipboard.writeText(copyText).then(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  });
};

  // Automatically calculate when inputs change
  useEffect(() => {
    calculate();
  }, [heatRelease, diameter, flameHeight, units, calculateMode, fireLocation]);

  // Switching units converts what's already entered
  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;
    const toImperial = newUnits === 'imperial';
    setHeatRelease(prev => convertInput(prev, 'hrr', toImperial));
    setDiameter(prev => convertInput(prev, 'length', toImperial));
    setFlameHeight(prev => convertInput(prev, 'length', toImperial));
    setCeilingHeight(prev => convertInput(prev, 'length', toImperial));
    setUnits(newUnits);
  };

  return (
    <Chakra.Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <EquationCard
          title={`${location.method}:`}
          equation={location.equation}
        >
          <Chakra.Text fontSize="sm" color="fd.muted" mt={2}>
            Where:
            <br />
            L = Flame height (m or ft)
            <br />
            Q̇ = Heat release rate (kW or BTU/s)
            {location.usesSize && (
              <>
                <br />
                {location.sizeSymbol} = {location.sizeDescription} (m or ft)
              </>
            )}
          </Chakra.Text>
          {!location.usesSize && (
            <Chakra.Text fontSize="sm" color="fd.muted" mt={2}>
              This correlation depends only on the heat release rate, so no fire size is entered.
            </Chakra.Text>
          )}
          {location.nfpaNote && (
            <Chakra.Text fontSize="sm" color="fd.muted" mt={3} fontStyle="italic">
              {location.nfpaNote}
            </Chakra.Text>
          )}
        </EquationCard>

        {/* Fire Location */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Fire Location:</Chakra.FormLabel>
          <Chakra.Select value={fireLocation} onChange={(e) => handleLocationChange(e.target.value)}>
            {Object.entries(FIRE_LOCATIONS).map(([key, loc]) => (
              <option key={key} value={key}>{loc.label}</option>
            ))}
          </Chakra.Select>
        </Chakra.FormControl>

        {/* Mode Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Calculate:</Chakra.FormLabel>
          <Chakra.Select value={calculateMode} onChange={(e) => setCalculateMode(e.target.value)}>
            <option value="flameHeight">
              Flame Height (from HRR{location.usesSize ? ` & ${location.sizeName}` : ''})
            </option>
            <option value="heatRelease">
              Heat Release Rate (from Height{location.usesSize ? ` & ${location.sizeName}` : ''})
            </option>
            {location.usesSize && (
              <option value="diameter">{location.sizeName} (from Height & HRR)</option>
            )}
          </Chakra.Select>
        </Chakra.FormControl>

        <Chakra.Divider />

        {/* Input Fields - Show/hide based on calculation mode */}
        {calculateMode !== 'heatRelease' && (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Heat Release Rate</Chakra.FormLabel>
            <Chakra.NumberInput
              value={heatRelease}
              onChange={(vs) => setHeatRelease(vs)}
              min={0}
            >
              <Chakra.NumberInputField inputMode="decimal" />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="fd.muted">
              {units === 'SI' ? 'kW' : 'BTU/s'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {location.usesSize && calculateMode !== 'diameter' && (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>{location.sizeName}</Chakra.FormLabel>
            <Chakra.NumberInput
              value={diameter}
              onChange={(vs) => setDiameter(vs)}
              min={0}
            >
              <Chakra.NumberInputField inputMode="decimal" />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="fd.muted">
              {units === 'SI' ? 'm' : 'ft'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {calculateMode !== 'flameHeight' && (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Flame Height</Chakra.FormLabel>
            <Chakra.NumberInput
              value={flameHeight}
              onChange={(vs) => setFlameHeight(vs)}
              min={0}
            >
              <Chakra.NumberInputField inputMode="decimal" />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="fd.muted">
              {units === 'SI' ? 'm' : 'ft'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {calculateMode === 'flameHeight' && (
          <Chakra.FormControl>
            <Chakra.FormLabel>Ceiling Height Above the Fire (optional)</Chakra.FormLabel>
            <Chakra.NumberInput
              value={ceilingHeight}
              onChange={(vs) => setCeilingHeight(vs)}
              min={0}
            >
              <Chakra.NumberInputField inputMode="decimal" />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="fd.muted">
              {units === 'SI' ? 'm' : 'ft'}, from the base of the fire to the ceiling. Checks whether the flames reach it.
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {/* Unit Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Units</Chakra.FormLabel>
          <Chakra.VStack align="start" spacing={2}>
            <Chakra.RadioGroup 
              value={units} 
              onChange={handleUnitsChange}
            >
              <Chakra.HStack spacing={4}>
                <Chakra.Radio value="SI">SI (m, kW)</Chakra.Radio>
                <Chakra.Radio value="imperial">Imperial (ft, BTU/s)</Chakra.Radio>
              </Chakra.HStack>
            </Chakra.RadioGroup>
            
            <Chakra.Text fontSize="xs" color="fd.muted">
              Switching units converts the values already entered.
            </Chakra.Text>
          </Chakra.VStack>
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
                {calculationHistory.map((entry) => (
                  <Chakra.Box
                    key={entry.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    _hover={{ bg: Chakra.useColorModeValue('gray.50', 'gray.700') }}
                    cursor="pointer"
                    onClick={() => loadFromHistory(entry)}
                  >
                    <Chakra.HStack justify="space-between">
                      <Chakra.VStack align="start" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="medium">
                          {entry.result.type}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="fd.muted">
                          {entry.timestamp}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="fd.muted">
                          {FIRE_LOCATIONS[entry.fireLocation || 'center'].label} • Mode: {entry.calculateMode === 'flameHeight' ? 'Height' :
                                entry.calculateMode === 'heatRelease' ? 'HRR' : 'Size'}
                        </Chakra.Text>
                      </Chakra.VStack>
                      <Chakra.VStack align="end" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="bold">
                          {entry.result.value.toFixed(2)} {entry.result.unit}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="fd.muted">
                          {entry.units === 'SI' ? 'SI Units' : 'Imperial'}
                        </Chakra.Text>
                      </Chakra.VStack>
                    </Chakra.HStack>
                  </Chakra.Box>
                ))}
              </Chakra.VStack>
            </Chakra.CardBody>
          </Chakra.Card>
        )}

        {/* Results */}
{result && (
  result.error ? (
    <Chakra.Alert status="error">
      <Chakra.AlertIcon />
      <Chakra.Text>{result.error}</Chakra.Text>
    </Chakra.Alert>
  ) : result.value && (
    <Chakra.Alert status="success">
      <Chakra.AlertIcon />
      <Chakra.Box flex="1">
        <Chakra.VStack align="start" spacing={2}>
          <Chakra.Text fontWeight="bold">
            {result.type}: {result.value > 0 ? result.value.toFixed(2) : 'N/A'} {result.unit}{units === 'imperial' && result.kW > 0 ? ` (${result.kW.toFixed(0)} kW)` : ''}
          </Chakra.Text>
          <Chakra.Text fontSize="sm">
            Based on:
            <br />Fire Location: {location.label}
            {calculateMode !== 'heatRelease' && (
              <><br />Heat Release Rate: {heatRelease} {units === 'SI' ? 'kW' : 'BTU/s'}</>
            )}
            {location.usesSize && calculateMode !== 'diameter' && (
              <><br />{location.sizeName}: {diameter} {units === 'SI' ? 'm' : 'ft'}</>
            )}
            {calculateMode !== 'flameHeight' && (
              <><br />Flame Height: {flameHeight} {units === 'SI' ? 'm' : 'ft'}</>
            )}
          </Chakra.Text>
        </Chakra.VStack>
      </Chakra.Box>
      <Chakra.VStack>
        <Chakra.Button
          size="sm"
          colorScheme={copySuccess ? "green" : "blue"}
          onClick={copyResults}
        >
          {copySuccess ? "Copied!" : "Copy Results"}
        </Chakra.Button>
        <Chakra.Button
          size="sm"
          colorScheme="purple"
          onClick={saveToHistory}
        >
          Save to History
        </Chakra.Button>
      </Chakra.VStack>
    </Chakra.Alert>
  )
)}
        {/* Ceiling check (NFPA 921 5.6.4.7) */}
        {(() => {
          const ceilingM = toSI(parseFloat(ceilingHeight), 'length', units);
          if (calculateMode !== 'flameHeight' || !result || result.error || !(result.flameHeightM > 0) || !(ceilingM > 0)) return null;
          const unit = units === 'SI' ? 'm' : 'ft';
          const gap = fromSI(Math.abs(ceilingM - result.flameHeightM), 'length', units);
          return result.flameHeightM >= ceilingM ? (
            <Chakra.Alert status="warning" alignItems="flex-start">
              <Chakra.AlertIcon />
              <Chakra.Box>
                <Chakra.AlertTitle>Flames reach the ceiling</Chakra.AlertTitle>
                <Chakra.AlertDescription fontSize="sm">
                  The free flame height is {fmt(gap, 3)} {unit} taller than the ceiling. NFPA 921 (2024) 5.6.4.7: flames taller than
                  the ceiling spread out along it, and the total flame length (ceiling height plus the extension along the
                  ceiling) is generally longer than the free flame height. Look for ceiling damage that extends out from above the fire.
                </Chakra.AlertDescription>
              </Chakra.Box>
            </Chakra.Alert>
          ) : (
            <Chakra.Alert status="info">
              <Chakra.AlertIcon />
              <Chakra.Text fontSize="sm">The flame tip is {fmt(gap, 3)} {unit} below the ceiling.</Chakra.Text>
            </Chakra.Alert>
          );
        })()}
        {calculateMode === 'heatRelease' && result && !result.error && (
        <Chakra.Flex justify="flex-end">
          <SendHRRMenu kW={result.kW} from="Flame Height" exclude="flameHeight" />
        </Chakra.Flex>
        )}
        {result && !result.error && <ShowWork steps={result.steps} />}
 {/* Visual Flame Height Indicator */}
        {calculateMode === 'flameHeight' && result && !result.error && result.value > 0 && (
          <FlameHeightVisual 
            flameHeight={result.value} 
            units={units} 
            ceilingM={toSI(parseFloat(ceilingHeight), 'length', units)}
          />
        )}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default FlameHeightCalculator;