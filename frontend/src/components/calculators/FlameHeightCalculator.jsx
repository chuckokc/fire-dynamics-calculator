import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  useToast,
  VStack,
  Select,
  RadioGroup,
  Radio,
  HStack,
  Alert,
  AlertIcon,
  useColorModeValue,
  Card,         // <-- ADD THIS
  CardBody      // <-- AND THIS
} from '@chakra-ui/react';

const FlameHeightVisual = ({ flameHeight, units }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const boxBgColor = useColorModeValue('white', 'gray.800');
  const references = [
    { name: 'Person', heightM: 1.8, color: 'blue.600', labelSide: 'left', labelBelow: true, lineStyle: '2px solid' },
    { name: 'Door', heightM: 2.1, color: 'green.600', labelSide: 'right', labelBelow: false, lineStyle: '2px dashed' },
    { name: 'Ceiling', heightM: 2.4, color: 'orange.600', labelSide: 'left', labelBelow: false, lineStyle: '2px dotted' },
    { name: '2-Story', heightM: 6.0, color: 'red.600', labelSide: 'right', labelBelow: false, lineStyle: '1px dashed' }
  ];
  const flameHeightM = units === 'imperial' ? flameHeight * 0.3048 : flameHeight;
  const maxHeight = 10;
  const flamePercent = Math.min((flameHeightM / maxHeight) * 100, 100);
   return (
    <Box p={4} bg={bgColor} borderRadius="md">
      <Text fontWeight="bold" mb={3}>Flame Height Visualization</Text>
      <Box position="relative" h="250px" bg={boxBgColor} borderRadius="md" p={4}>
        {references.map((ref) => {
          const refPercent = (ref.heightM / maxHeight) * 100;
          const heightValue = units === 'imperial' ? (ref.heightM * 3.28084).toFixed(1) : ref.heightM.toFixed(1);
          const unitLabel = units === 'imperial' ? 'ft' : 'm';
          return (
            <Box key={ref.name} position="absolute" bottom={`${refPercent}%`} left={0} right={0} borderTop={ref.lineStyle} borderColor={ref.color} opacity={0.8}>
              <Text position="absolute" {...(ref.labelSide === 'left' ? { left: 2 } : { right: 2 })} {...(ref.labelBelow ? { top: '2px' } : { top: '-20px' })} fontSize="12px" color={ref.color} fontWeight="bold" bg={boxBgColor} px={1} borderRadius="sm" border="1px solid" borderColor={ref.color}>
                {ref.name} • {heightValue}{unitLabel}
              </Text>
            </Box>
          );
        })}
        <Box position="absolute" bottom={0} left="50%" transform="translateX(-50%)" w="50px" h={`${flamePercent}%`} bgGradient="linear(to-t, orange.500, orange.400, red.400)" borderRadius="md md 50% 50% / md md 40% 40%" transition="height 0.3s ease" boxShadow="0 0 25px rgba(251, 211, 141, 0.6)" />
        {flameHeight > 0 && (
          <Box position="absolute" bottom={`${Math.min(flamePercent + 3, 90)}%`} left="50%" transform="translateX(-50%)">
            <Box bg="red.600" color="white" px={3} py={1} borderRadius="full" fontSize="sm" fontWeight="bold" boxShadow="md">
              {parseFloat(flameHeight).toFixed(1)} {units === 'imperial' ? 'ft' : 'm'}
            </Box>
          </Box>
        )}
        <Box position="absolute" bottom={0} left={0} right={0} h="2px" bg="gray.600" />
      </Box>
      <Text fontSize="xs" color="gray.600" mt={2} textAlign="center">Scale: 0 to {units === 'imperial' ? '32.8 ft' : '10 m'}</Text>
    </Box>
  );
};


const FlameHeightCalculator = () => {
  const [heatRelease, setHeatRelease] = useState('');
  const [diameter, setDiameter] = useState('');
  const [flameHeight, setFlameHeight] = useState('');
  const [units, setUnits] = useState('SI');
  const [calculateMode, setCalculateMode] = useState('flameHeight');

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const convertLength = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    const factor = toImperial ? 3.28084 : 0.3048;
    return (numVal * factor).toFixed(2);
  };

  const convertHeatRelease = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    const factor = toImperial ? 0.947817 : 1.055056;
    return (numVal * factor).toFixed(2);
  };

  const handleUnitChange = (newUnit) => {
    setResult(null); // <-- ADD THIS LINE to clear the old result
    if (newUnit === units) return;

    const toImperial = newUnit === 'imperial';

    setHeatRelease(prev => convertHeatRelease(prev, toImperial));
    setDiameter(prev => convertLength(prev, toImperial));
    setFlameHeight(prev => convertLength(prev, toImperial));

    setUnits(newUnit);
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setResult(null);

    const payload = {
      calculateMode,
      units,
      heatRelease,
      diameter,
      flameHeight,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/api/flame_height', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during calculation.');
      }
      setResult(data);
    } catch (error) {
      toast({
        title: 'Calculation Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  let displayResult = null;
  let displayUnit = '';
  let resultType = '';

  if (result) {
    displayResult = result.value;
    if (calculateMode === 'flameHeight') {
        resultType = 'Flame Height';
        displayUnit = units === 'SI' ? 'm' : 'ft';
    } else if (calculateMode === 'heatRelease') {
        resultType = 'Heat Release Rate';
        displayUnit = units === 'SI' ? 'kW' : 'BTU/s';
    } else if (calculateMode === 'diameter') {
        resultType = 'Fire Diameter';
        displayUnit = units === 'SI' ? 'm' : 'ft';
    }
  }

  // --- NEW: Logic to determine which flame height to visualize ---
  let flameHeightForVisual = null;
  if (calculateMode === 'flameHeight' && displayResult) {
    // If we just calculated flame height, visualize the result
    flameHeightForVisual = displayResult;
  } else if (calculateMode !== 'flameHeight' && flameHeight) {
    // Otherwise, if flame height is an input, visualize the input value
    flameHeightForVisual = flameHeight;
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Flame Height Calculator</Heading>
        <Text fontSize="sm">Calculates flame height, heat release, or fire diameter using Heskestad's Correlation.</Text>

        {/* --- ADD THIS ENTIRE CARD --- */}
        <Card variant="outline">
            <CardBody>
                <Text fontSize="md" fontWeight="bold">Heskestad's Correlation:</Text>
                <Text fontSize="lg" fontFamily="mono" mt={2}>
                    L = 0.235Q̇²/⁵ - 1.02D
                </Text>
            </CardBody>
        </Card>
        
        <FormControl>
          <FormLabel>Calculate:</FormLabel>
          <Select value={calculateMode} onChange={(e) => { setResult(null); setCalculateMode(e.target.value); }}>
            <option value="flameHeight">Flame Height</option>
            <option value="heatRelease">Heat Release Rate</option>
            <option value="diameter">Fire Diameter</option>
          </Select>
        </FormControl>

        {calculateMode !== 'heatRelease' && (
          <FormControl isRequired>
            <FormLabel>Heat Release Rate ({units === 'SI' ? 'kW' : 'BTU/s'})</FormLabel>
            <Input type="number" value={heatRelease} onChange={(e) => setHeatRelease(e.target.value)} />
          </FormControl>
        )}
        {calculateMode !== 'diameter' && (
          <FormControl isRequired>
            <FormLabel>Fire Diameter ({units === 'SI' ? 'm' : 'ft'})</FormLabel>
            <Input type="number" value={diameter} onChange={(e) => setDiameter(e.target.value)} />
          </FormControl>
        )}
        {calculateMode !== 'flameHeight' && (
          <FormControl isRequired>
            <FormLabel>Flame Height ({units === 'SI' ? 'm' : 'ft'})</FormLabel>
            <Input type="number" value={flameHeight} onChange={(e) => setFlameHeight(e.target.value)} />
          </FormControl>
        )}

        <FormControl>
          <FormLabel>Units</FormLabel>
          <RadioGroup onChange={handleUnitChange} value={units}>
            <HStack spacing="24px">
              <Radio value="SI">SI (m, kW)</Radio>
              <Radio value="imperial">Imperial (ft, BTU/s)</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        <Button onClick={handleCalculate} isLoading={isLoading} colorScheme="blue">
          Calculate
        </Button>

        {displayResult !== null && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Text><b>{resultType}:</b> {parseFloat(displayResult).toFixed(2)} {displayUnit}</Text>
          </Alert>
        )}

        {/* --- UPDATED: Use the new variable to decide when to show the visual --- */}
        {flameHeightForVisual > 0 && (
          <FlameHeightVisual 
            flameHeight={flameHeightForVisual}
            units={units}
          />
        )}
      </VStack>
    </Box>
  );
};

export default FlameHeightCalculator;