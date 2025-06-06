import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

// Radiation Zone Visual Component
const RadiationZoneVisual = ({ heatRelease, distance, radiativeFraction, units }) => {
  // Add these at the beginning
  const bgColor = Chakra.useColorModeValue('gray.50', 'gray.700');
  const boxBgColor = Chakra.useColorModeValue('white', 'gray.800');
  // Zones ordered from lowest to highest flux
  const zones = [
    { name: 'Tenability Limit', flux: 1.7, color: 'green.500' },
    { name: 'Firefighter Gear Working Limit', flux: 4.5, color: 'yellow.500' },
    { name: 'SCBA Lens Degradation', flux: 5, color: 'orange.500' },
    { name: 'Flashover Conditions', flux: 20, color: 'red.600' }
  ];

  // Convert inputs to SI for calculation
  let Q = parseFloat(heatRelease) || 0;
  let R = parseFloat(distance) || 0;
  const Xr = parseFloat(radiativeFraction) || 0.3;

  if (units === 'imperial') {
    Q = Q * 1.055056;  // Convert BTU/s to kW
    R = R * 0.3048;    // Convert ft to m
  }

  // Calculate distance for each critical flux level
  // R = sqrt((Q * Xr) / (4 * π * q"))
  const calculateRadius = (criticalFlux) => {
    if (!Q || !Xr || !criticalFlux) return 0;
    return Math.sqrt((Q * Xr) / (4 * Math.PI * criticalFlux));
  };

  // Scale factor for visualization
  const maxVisualRadius = 150;
  const maxRealRadius = Math.max(...zones.map(z => calculateRadius(z.flux)), R) || 10;
  const scale = maxVisualRadius / maxRealRadius;

  // Calculate current heat flux at specified distance
  const currentFlux = R > 0 ? (Q * Xr) / (4 * Math.PI * Math.pow(R, 2)) : 0;

  return (
    <Chakra.Box p={4} bg={bgColor} borderRadius="md">
      <Chakra.Text fontWeight="bold" mb={3}>Radiation Zone Visualization</Chakra.Text>
      
      <Chakra.Stack 
        direction={{ base: "column", md: "row" }} 
        align={{ base: "center", md: "start" }} 
        spacing={4}
      >
        <Chakra.Box 
          position="relative" 
          w={{ base: "100%", sm: "400px" }}
          maxW="400px"
          h={{ base: "300px", sm: "400px" }}
          bg={boxBgColor}
          borderRadius="md" 
          overflow="hidden"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {/* Zone circles - draw from smallest flux (largest radius) to largest flux (smallest radius) */}
          {zones.map((zone) => {
            const radius = calculateRadius(zone.flux) * scale;
            const size = `${radius * 2}px`;
            return (
              <Chakra.Box
                key={zone.name}
                position="absolute"
                w={size}
                h={size}
                maxW="90%"
                maxH="90%"
                borderRadius="full"
                borderWidth="4px"
                borderStyle="solid"
                borderColor={zone.color}
                bg={zone.flux === 20 ? 'red.100' : zone.flux === 5 ? 'orange.100' : zone.flux === 4.5 ? 'yellow.100' : zone.flux === 1.7 ? 'green.100' : 'gray.100'}
                opacity={0.8}
                transition="all 0.3s ease"
              />
            );
          })}

          {/* Fire source at center */}
          <Chakra.Box
            position="absolute"
            w={{ base: "30px", sm: "40px" }}
            h={{ base: "30px", sm: "40px" }}
            bg="red.500"
            borderRadius="full"
            boxShadow="0 0 30px rgba(255, 0, 0, 0.8)"
            zIndex={10}
          >
            <Chakra.Text 
              fontSize={{ base: "18px", sm: "24px" }} 
              position="absolute" 
              top={{ base: "-4px", sm: "-6px" }} 
              left={{ base: "6px", sm: "8px" }}
            >
              🔥
            </Chakra.Text>
          </Chakra.Box>

          {/* Person at specified distance */}
          {R > 0 && (
            <Chakra.Box
              position="absolute"
              left="50%"
              top="50%"
              transform={`translate(-50%, -50%) translateX(${Math.min(R * scale, 140)}px)`}
              zIndex={20}
            >
              <Chakra.Text fontSize={{ base: "24px", sm: "30px" }}>
                🧍
              </Chakra.Text>
              <Chakra.Box
                position="absolute"
                top={{ base: "-25px", sm: "-30px" }}
                left="50%"
                transform="translateX(-50%)"
                bg={currentFlux > 20 ? 'red.600' : currentFlux > 5 ? 'orange.500' : currentFlux > 4.5 ? 'yellow.500' : currentFlux > 1.7 ? 'green.500' : 'green.400'}
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize={{ base: "10px", sm: "xs" }}
                fontWeight="bold"
                whiteSpace="nowrap"
              >
                {currentFlux.toFixed(1)} kW/m²
              </Chakra.Box>
            </Chakra.Box>
          )}

          {/* Distance indicator */}
          <Chakra.Box 
            position="absolute" 
            bottom={{ base: 4, sm: 6 }} 
            right={{ base: 4, sm: 6 }} 
            bg={boxBgColor} 
            p={2} 
            borderRadius="md" 
            boxShadow="md"
          >
            <Chakra.Text fontSize={{ base: "10px", sm: "xs" }} color="gray.600">
              Distance: {distance} {units === 'imperial' ? 'ft' : 'm'}
            </Chakra.Text>
          </Chakra.Box>
        </Chakra.Box>
        
        {/* Zone legend - moved outside */}
        <Chakra.Box 
          bg={boxBgColor} 
          p={3} 
          borderRadius="md" 
          boxShadow="md" 
          w={{ base: "100%", md: "auto" }}
          minW={{ base: "100%", md: "200px" }}
        >
          <Chakra.VStack align="start" spacing={1}>
            <Chakra.Text fontSize={{ base: "xs", sm: "xs" }} fontWeight="bold" mb={1}>
              Heat Flux Zones:
            </Chakra.Text>
            {zones.map((zone) => {
              const radius = calculateRadius(zone.flux);
              const displayRadius = units === 'imperial' ? 
                (radius * 3.28084).toFixed(1) : 
                radius.toFixed(1);
              const unitLabel = units === 'imperial' ? 'ft' : 'm';
              
              return (
                <Chakra.HStack key={zone.name} spacing={2} align="center">
                  <Chakra.Box 
                    w="12px" 
                    h="12px" 
                    bg={zone.color} 
                    borderRadius="sm"
                    flexShrink={0}
                  />
                  <Chakra.Text fontSize={{ base: "10px", sm: "11px" }} fontWeight="medium">
                    {zone.flux} kW/m² - {zone.name}
                    {zone.flux === 5 && (
                      <Chakra.Text as="span" fontSize={{ base: "9px", sm: "10px" }} color="gray.600">
                        {' '}(lens damage)
                      </Chakra.Text>
                    )}
                  </Chakra.Text>
                </Chakra.HStack>
              );
            })}
          </Chakra.VStack>
        </Chakra.Box>
      </Chakra.Stack>
    </Chakra.Box>
  );
};

const PointSourceCalculator = () => {
  // State declarations
  const [heatRelease, setHeatRelease] = useState('');
  const [distance, setDistance] = useState('');
  const [radiativeFraction, setRadiativeFraction] = useState('0.3');
  const [units, setUnits] = useState('imperial');
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // Add these new states for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Critical heat flux values from NFPA 921 (2024 ed.) Table 5.5.4.2 + SCBA research
  const CRITICAL_HEAT_FLUX = {
    'postflashover': { value: 170, description: 'Maximum in postflashover compartment' },
    'protective_clothing': { value: 80, description: 'Heat flux for protective clothing TPP test' },
    'fiberboard_ignition': { value: 52, description: 'Fiberboard ignites (5 seconds)' },
    'flashover_floor': { value: 20, description: 'Residential floor at flashover' },
    'pain_2s': { value: 20, description: 'Pain (2s exposure), blisters (4s)' },
    'pain_3s': { value: 15, description: 'Pain (3s exposure), blisters (6s)' },
    'wood_piloted': { value: 12.5, description: 'Wood ignites with pilot' },
    'scba_failure': { value: 10, description: 'SCBA facepiece lens failure (holes)' },
    'pain_5s': { value: 10, description: 'Pain (5s exposure), blisters (10s)' },
    'scba_degradation': { value: 5, description: 'SCBA facepiece lens degradation onset' },
    'pain_13s': { value: 5, description: 'Pain (13s exposure), blisters (29s)' },
    'firefighter_gear': { value: 4.5, description: 'Operational limit for firefighters in gear' },
    'firefighting': { value: 2.5, description: 'Common firefighting exposure' },
    'pain_33s': { value: 2.5, description: 'Pain (33s exposure), blisters (79s)' },
    'tenability': { value: 1.7, description: 'Tenability limit for humans' },
    'solar': { value: 1.0, description: 'Normal solar radiation (clear day)' }
  };

  // Reference data
  const REFERENCE_DATA = {
    radiativeFractions: {
      'Propane': '0.28-0.30',
      'Methanol': '0.19-0.22',
      'Gasoline': '0.30-0.35',
      'Wood': '0.25-0.35',
      'Plastics': '0.30-0.40'
    },
    commonHeatRelease: {
      'Wastepaper basket': '4-8 kW',
      'Office chair': '100-400 kW',
      'Sofa': '1500-3000 kW',
      'Christmas tree': '3000-5000 kW',
      'Car (peak)': '4000-5000 kW'
    }
  };

  // Unit conversion functions
  const convertDistance = (value, toImperial) => {
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

  const convertHeatFlux = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return numVal * 0.088055; // kW/m² to BTU/ft²/s
    }
    return numVal * 11.356; // BTU/ft²/s to kW/m²
  };

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!result) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      heatRelease: heatRelease,
      distance: distance,
      radiativeFraction: radiativeFraction,
      units: units,
      result: result,
      // Store actual flux value in SI for comparison
      fluxKW: units === 'imperial' ? convertHeatFlux(result, false) : result
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setHeatRelease(entry.heatRelease);
    setDistance(entry.distance);
    setRadiativeFraction(entry.radiativeFraction);
    setUnits(entry.units);
    setShowHistory(false);
  };

  // Calculation function
  const calculateHeatFlux = () => {
    if (!heatRelease || !distance || !radiativeFraction) return;

    // Convert inputs to SI for calculation
    let Q = parseFloat(heatRelease);
    let R = parseFloat(distance);
    const Xr = parseFloat(radiativeFraction);

    if (units === 'imperial') {
      Q = Q * 1.055056;  // Convert BTU/s to kW
      R = R * 0.3048;    // Convert ft to m
    }

    // Calculate radiative heat flux
    // q" = (Q * Xr) / (4 * π * R²)
    const heatFlux = (Q * Xr) / (4 * Math.PI * Math.pow(R, 2));

    // Convert result if needed
    let finalResult = heatFlux;
    if (units === 'imperial') {
      finalResult = convertHeatFlux(heatFlux, true);
    }

    setResult(finalResult);
  };

  const copyResults = () => {
    if (!result) return;
    
    let copyText = `Fire Dynamics Calculator - Point Source Radiation\n`;
    copyText += `Date: ${new Date().toLocaleString()}\n`;
    copyText += `Method: q" = χᵣQ̇/(4πR²)\n\n`;
    copyText += `Result:\n`;
    copyText += `- Radiative Heat Flux: ${result.toFixed(2)} ${units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}\n\n`;
    copyText += `Input Parameters:\n`;
    copyText += `- Heat Release Rate: ${heatRelease} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
    copyText += `- Distance: ${distance} ${units === 'SI' ? 'm' : 'ft'}\n`;
    copyText += `- Radiative Fraction: ${radiativeFraction} (${(parseFloat(radiativeFraction) * 100).toFixed(0)}%)\n`;
    
    navigator.clipboard.writeText(copyText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  useEffect(() => {
    if (heatRelease && distance && radiativeFraction) {
      calculateHeatFlux();
    }
  }, [heatRelease, distance, radiativeFraction, units]);

  const getHeatFluxStatus = (criticalValue) => {
    if (!result) return 'gray';
    const compareValue = units === 'SI' ? criticalValue : convertHeatFlux(criticalValue, true);
    if (result >= compareValue) return 'red';
    if (result >= compareValue * 0.8) return 'yellow';
    return 'green';
  };

  return (
    <Chakra.Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={{ base: 4, sm: 6 }} align="stretch">
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold">Point Source Radiation Model:</Chakra.Text>
            <Chakra.Text fontSize={{ base: "lg", sm: "xl" }} fontFamily="mono">
              q" = (Q̇ × χᵣ) / (4π × R²)
            </Chakra.Text>
            <Chakra.Text fontSize="sm" color="gray.600" mt={2}>
              Where:
              <br />
              q" = Radiative heat flux at target (kW/m² or BTU/ft²/s)
              <br />
              Q̇ = Total heat release rate (kW or BTU/s)
              <br />
              χᵣ = Radiative fraction (typical value 0.3)
              <br />
              R = Distance from fire to target (m or ft)
              <br />
              π = Pi (approximately 3.14159)
            </Chakra.Text>
          </Chakra.CardBody>
        </Chakra.Card>

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

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Distance to Target</Chakra.FormLabel>
          <Chakra.NumberInput
            value={distance}
            onChange={(vs) => setDistance(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl>
          <Chakra.FormLabel>Radiative Fraction</Chakra.FormLabel>
          <Chakra.NumberInput
            value={radiativeFraction}
            onChange={(vs) => setRadiativeFraction(vs)}
            min={0}
            max={1}
            step={0.1}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            Typical value: 0.3 (30% of total energy)
          </Chakra.Text>
        </Chakra.FormControl>

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
              onClick={() => {
                const newUnits = units === 'SI' ? 'imperial' : 'SI';
                setHeatRelease(prev => convertHeatRelease(prev, units === 'SI'));
                setDistance(prev => convertDistance(prev, units === 'SI'));
                setUnits(newUnits);
              }}
            >
              Convert Current Measurements to {units === 'SI' ? 'Imperial' : 'SI'} Units
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
                {calculationHistory.map((entry) => {
                  // Determine status based on flux value
                  const fluxStatus = entry.fluxKW >= 20 ? 'red' : 
                                   entry.fluxKW >= 5 ? 'orange' :
                                   entry.fluxKW >= 4.5 ? 'yellow' :
                                   entry.fluxKW >= 1.7 ? 'green' : 'gray';
                  
                  return (
                    <Chakra.Box
                      key={entry.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderLeftWidth="4px"
                      borderLeftColor={`${fluxStatus}.500`}
                      _hover={{ bg: Chakra.useColorModeValue('gray.50', 'gray.700') }}
                      cursor="pointer"
                      onClick={() => loadFromHistory(entry)}
                    >
                      <Chakra.HStack justify="space-between">
                        <Chakra.VStack align="start" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="medium">
                            {entry.result.toFixed(2)} {entry.units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            {entry.timestamp}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.500">
                            @ {entry.distance} {entry.units === 'SI' ? 'm' : 'ft'}
                          </Chakra.Text>
                        </Chakra.VStack>
                        <Chakra.VStack align="end" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="bold">
                            {entry.heatRelease} {entry.units === 'SI' ? 'kW' : 'BTU/s'}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            χᵣ = {entry.radiativeFraction}
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

        <Chakra.Button
          colorScheme="blue"
          onClick={calculateHeatFlux}
          isDisabled={!heatRelease || !distance || !radiativeFraction}
        >
          Calculate Heat Flux
        </Chakra.Button>

        {result && (
          <Chakra.VStack spacing={4} width="100%">
            <Chakra.Alert status="success">
              <Chakra.AlertIcon />
              <Chakra.Box flex="1">
                <Chakra.VStack align="start" spacing={2}>
                  <Chakra.Text fontWeight="bold">
                    Radiative Heat Flux: {result.toFixed(2)} {units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                  </Chakra.Text>
                  <Chakra.Text fontSize="sm">
                    Based on:
                    <br />
                    Heat Release Rate: {heatRelease} {units === 'SI' ? 'kW' : 'BTU/s'}
                    <br />
                    Distance: {distance} {units === 'SI' ? 'm' : 'ft'}
                    <br />
                    Radiative Fraction: {radiativeFraction} ({(parseFloat(radiativeFraction) * 100).toFixed(0)}%)
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

            <Chakra.Card width="100%">
              <Chakra.CardHeader>
                <Chakra.Heading size="sm">Critical Value Analysis</Chakra.Heading>
              </Chakra.CardHeader>
              <Chakra.CardBody>
                <Chakra.VStack align="start" spacing={2}>
                  {Object.entries(CRITICAL_HEAT_FLUX).map(([key, { value, description }]) => {
                    const compareValue = units === 'SI' ? value : convertHeatFlux(value, true);
                    return (
                      <Chakra.HStack key={key} spacing={2}>
                        <Chakra.Box
                          w="4px"
                          h="100%"
                          bg={getHeatFluxStatus(value)}
                          borderRadius="full"
                        />
                        <Chakra.Text fontSize={{ base: "sm", sm: "md" }}>
                          {description}: {compareValue.toFixed(1)} {units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                        </Chakra.Text>
                      </Chakra.HStack>
                    );
                  })}
                </Chakra.VStack>
              </Chakra.CardBody>
            </Chakra.Card>

            {/* Radiation Zone Visual */}
            <RadiationZoneVisual 
              heatRelease={heatRelease}
              distance={distance}
              radiativeFraction={radiativeFraction}
              units={units}
            />
          </Chakra.VStack>
        )}

        <Chakra.Accordion allowToggle>
          <Chakra.AccordionItem>
            <Chakra.AccordionButton>
              <Chakra.Box flex="1" textAlign="left">
                <Chakra.Text fontWeight="bold">Quick Reference Guide</Chakra.Text>
              </Chakra.Box>
              <Chakra.AccordionIcon />
            </Chakra.AccordionButton>
            <Chakra.AccordionPanel>
              <Chakra.Tabs>
                <Chakra.TabList>
                  <Chakra.Tab fontSize={{ base: "sm", sm: "md" }}>Radiative Fractions</Chakra.Tab>
                  <Chakra.Tab fontSize={{ base: "sm", sm: "md" }}>Common Heat Release Rates</Chakra.Tab>
                </Chakra.TabList>
                <Chakra.TabPanels>
                  <Chakra.TabPanel>
                    <Chakra.VStack align="start" spacing={2}>
                      {Object.entries(REFERENCE_DATA.radiativeFractions).map(([material, range]) => (
                        <Chakra.Text key={material} fontSize={{ base: "sm", sm: "md" }}>
                          {material}: {range}
                        </Chakra.Text>
                      ))}
                    </Chakra.VStack>
                  </Chakra.TabPanel>
                  <Chakra.TabPanel>
                    <Chakra.VStack align="start" spacing={2}>
                      {Object.entries(REFERENCE_DATA.commonHeatRelease).map(([item, value]) => (
                        <Chakra.Text key={item} fontSize={{ base: "sm", sm: "md" }}>
                          {item}: {value}
                        </Chakra.Text>
                      ))}
                    </Chakra.VStack>
                  </Chakra.TabPanel>
                </Chakra.TabPanels>
              </Chakra.Tabs>
            </Chakra.AccordionPanel>
          </Chakra.AccordionItem>
        </Chakra.Accordion>
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default PointSourceCalculator;