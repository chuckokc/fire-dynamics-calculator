import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

// Visual Flame Height Indicator Component
const FlameHeightVisual = ({ flameHeight, units }) => {
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
      heightM: 2.4, 
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
    <Chakra.Box p={4} bg="gray.50" borderRadius="md">
      <Chakra.Text fontWeight="bold" mb={3}>Flame Height Visualization</Chakra.Text>
      
      <Chakra.Box position="relative" h="250px" bg="white" borderRadius="md" p={4}>
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
                bg="white"
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
      
      <Chakra.Text fontSize="xs" color="gray.600" mt={2} textAlign="center">
        Scale: 0 to {units === 'imperial' ? '32.8 ft' : '10 m'}
      </Chakra.Text>
    </Chakra.Box>
  );
};

const FlameHeightCalculator = () => {
  // State declarations
  const [heatRelease, setHeatRelease] = useState('');
  const [diameter, setDiameter] = useState('');
  const [flameHeight, setFlameHeight] = useState('');
  const [units, setUnits] = useState('SI');
  const [calculateMode, setCalculateMode] = useState('flameHeight'); // What to calculate
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // Add these new states for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Unit conversion functions
  const convertLength = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 3.28084).toFixed(2); // m to ft
    }
    return (numVal * 0.3048).toFixed(2);    // ft to m
  };

  const convertHeatRelease = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 0.947817).toFixed(2); // kW to BTU/s
    }
    return (numVal * 1.055056).toFixed(2);   // BTU/s to kW
  };

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!result || result.error) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      calculateMode: calculateMode,
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
    setHeatRelease(entry.heatRelease);
    setDiameter(entry.diameter);
    setFlameHeight(entry.flameHeight);
    setUnits(entry.units);
    setShowHistory(false);
  };

  // Calculation functions for each mode
  const calculate = () => {
    // Convert all inputs to SI for calculation
    let Q = parseFloat(heatRelease) || 0;
    let D = parseFloat(diameter) || 0;
    let L = parseFloat(flameHeight) || 0;

    if (units === 'imperial') {
      Q = Q * 1.055056;  // Convert BTU/s to kW
      D = D * 0.3048;    // Convert ft to m
      L = L * 0.3048;    // Convert ft to m
    }

    let calculatedValue;
    let resultType;
    let resultUnit;

    switch(calculateMode) {
      case 'flameHeight':
        // L = 0.235Q^(2/5) - 1.02D
        if (!heatRelease || !diameter) return;
        calculatedValue = (0.235 * Math.pow(Q, 0.4)) - (1.02 * D);
        resultType = 'Flame Height';
        resultUnit = units === 'SI' ? 'm' : 'ft';
        break;

      case 'heatRelease':
        // Q = ((L + 1.02D)/0.235)^(5/2)
        if (!flameHeight || !diameter) return;
        const intermediate = (L + (1.02 * D)) / 0.235;
        if (intermediate <= 0) {
          setResult({ error: 'Invalid input combination. Flame height too small for given diameter.' });
          return;
        }
        calculatedValue = Math.pow(intermediate, 2.5);
        resultType = 'Heat Release Rate';
        resultUnit = units === 'SI' ? 'kW' : 'BTU/s';
        break;

      case 'diameter':
        // D = (0.235Q^(2/5) - L)/1.02
        if (!heatRelease || !flameHeight) return;
        const numerator = (0.235 * Math.pow(Q, 0.4)) - L;
        if (numerator <= 0) {
          setResult({ error: 'Invalid input combination. Flame height too large for given heat release.' });
          return;
        }
        calculatedValue = numerator / 1.02;
        resultType = 'Fire Diameter';
        resultUnit = units === 'SI' ? 'm' : 'ft';
        break;

      default:
        return;
    }

    // Convert result back to selected units if needed
    if (units === 'imperial') {
      if (calculateMode === 'heatRelease') {
        calculatedValue = calculatedValue * 0.947817; // kW to BTU/s
      } else {
        calculatedValue = calculatedValue * 3.28084; // m to ft
      }
    }

    setResult({
      value: calculatedValue,
      type: resultType,
      unit: resultUnit
    });
  };

  const copyResults = () => {
  if (!result || result.error) return;
  
  let copyText = `Fire Dynamics Calculator - ${result.type}\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n`;
  copyText += `Method: Heskestad's Correlation (L = 0.235Q̇²/⁵ - 1.02D)\n\n`;
  copyText += `Result: ${result.value.toFixed(2)} ${result.unit}\n\n`;
  copyText += `Input Parameters:\n`;
  
  if (calculateMode !== 'heatRelease' && heatRelease) {
    copyText += `- Heat Release Rate: ${heatRelease} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  }
  if (calculateMode !== 'diameter' && diameter) {
    copyText += `- Fire Diameter: ${diameter} ${units === 'SI' ? 'm' : 'ft'}\n`;
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
  }, [heatRelease, diameter, flameHeight, units, calculateMode]);

  // Handle unit conversion
  const handleUnitConversion = () => {
    const toImperial = units === 'SI';
    setHeatRelease(prev => prev ? convertHeatRelease(prev, toImperial) : '');
    setDiameter(prev => prev ? convertLength(prev, toImperial) : '');
    setFlameHeight(prev => prev ? convertLength(prev, toImperial) : '');
    setUnits(toImperial ? 'imperial' : 'SI');
  };

  return (
    <Chakra.Box p={6} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize="lg" fontWeight="bold">Heskestad's Correlation:</Chakra.Text>
            <Chakra.Text fontSize="xl" fontFamily="mono">
              L = 0.235Q̇²/⁵ - 1.02D
            </Chakra.Text>
            <Chakra.Text fontSize="sm" color="gray.600" mt={2}>
              Where:
              <br />
              L = Flame height (m or ft)
              <br />
              Q̇ = Heat release rate (kW or BTU/s)
              <br />
              D = Fire diameter (m or ft)
            </Chakra.Text>
          </Chakra.CardBody>
        </Chakra.Card>

        {/* Mode Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Calculate:</Chakra.FormLabel>
          <Chakra.Select value={calculateMode} onChange={(e) => setCalculateMode(e.target.value)}>
            <option value="flameHeight">Flame Height (from HRR & Diameter)</option>
            <option value="heatRelease">Heat Release Rate (from Height & Diameter)</option>
            <option value="diameter">Fire Diameter (from Height & HRR)</option>
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
              <Chakra.NumberInputField />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="gray.600">
              {units === 'SI' ? 'kW' : 'BTU/s'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {calculateMode !== 'diameter' && (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Fire Diameter</Chakra.FormLabel>
            <Chakra.NumberInput
              value={diameter}
              onChange={(vs) => setDiameter(vs)}
              min={0}
            >
              <Chakra.NumberInputField />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="gray.600">
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
              <Chakra.NumberInputField />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="gray.600">
              {units === 'SI' ? 'm' : 'ft'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {/* Unit Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Units</Chakra.FormLabel>
          <Chakra.VStack align="start" spacing={2}>
            <Chakra.RadioGroup 
              value={units} 
              onChange={(newUnits) => setUnits(newUnits)}
            >
              <Chakra.HStack spacing={4}>
                <Chakra.Radio value="SI">SI (m, kW)</Chakra.Radio>
                <Chakra.Radio value="imperial">Imperial (ft, BTU/s)</Chakra.Radio>
              </Chakra.HStack>
            </Chakra.RadioGroup>
            
            <Chakra.Button 
              size="sm" 
              colorScheme="blue" 
              onClick={handleUnitConversion}
            >
              Convert Current Values to {units === 'SI' ? 'Imperial' : 'SI'} Units
            </Chakra.Button>
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
                    _hover={{ bg: 'gray.50' }}
                    cursor="pointer"
                    onClick={() => loadFromHistory(entry)}
                  >
                    <Chakra.HStack justify="space-between">
                      <Chakra.VStack align="start" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="medium">
                          {entry.result.type}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="gray.600">
                          {entry.timestamp}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="gray.500">
                          Mode: {entry.calculateMode === 'flameHeight' ? 'Height' : 
                                entry.calculateMode === 'heatRelease' ? 'HRR' : 'Diameter'}
                        </Chakra.Text>
                      </Chakra.VStack>
                      <Chakra.VStack align="end" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="bold">
                          {entry.result.value.toFixed(2)} {entry.result.unit}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="gray.600">
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
            {result.type}: {result.value > 0 ? result.value.toFixed(2) : 'N/A'} {result.unit}
          </Chakra.Text>
          <Chakra.Text fontSize="sm">
            Based on:
            {calculateMode !== 'heatRelease' && (
              <><br />Heat Release Rate: {heatRelease} {units === 'SI' ? 'kW' : 'BTU/s'}</>
            )}
            {calculateMode !== 'diameter' && (
              <><br />Fire Diameter: {diameter} {units === 'SI' ? 'm' : 'ft'}</>
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
 {/* Visual Flame Height Indicator */}
        {calculateMode === 'flameHeight' && result && !result.error && result.value > 0 && (
          <FlameHeightVisual 
            flameHeight={result.value} 
            units={units} 
          />
        )}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default FlameHeightCalculator;