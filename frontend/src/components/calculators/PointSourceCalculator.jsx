// frontend/src/components/calculators/PointSourceCalculator.jsx

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
  RadioGroup,
  Radio,
  HStack,
  Alert,
  AlertIcon,
  Stack,
  Card,
  CardBody,
  CardHeader,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';


const RadiationZoneVisual = ({ heatRelease, distance, radiativeFraction, units }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const boxBgColor = useColorModeValue('white', 'gray.800');
  const zones = [
    { name: 'Tenability Limit', flux: 1.7, color: 'green.500' },
    { name: 'Firefighter Gear Working Limit', flux: 4.5, color: 'yellow.500' },
    { name: 'SCBA Lens Degradation', flux: 5, color: 'orange.500' },
    { name: 'Flashover Conditions', flux: 20, color: 'red.600' }
  ];
  let Q = parseFloat(heatRelease) || 0;
  let R = parseFloat(distance) || 0;
  const Xr = parseFloat(radiativeFraction) || 0.3;
  if (units === 'imperial') {
    Q = Q * 1.055056;
    R = R * 0.3048;
  }
  const calculateRadius = (criticalFlux) => {
    if (!Q || !Xr || !criticalFlux) return 0;
    return Math.sqrt((Q * Xr) / (4 * Math.PI * criticalFlux));
  };
  const maxVisualRadius = 150;
  const maxRealRadius = Math.max(...zones.map(z => calculateRadius(z.flux)), R) || 10;
  const scale = maxVisualRadius / maxRealRadius;
  const currentFlux = R > 0 ? (Q * Xr) / (4 * Math.PI * Math.pow(R, 2)) : 0;
  return (
    <Box p={4} bg={bgColor} borderRadius="md">
      <Text fontWeight="bold" mb={3}>Radiation Zone Visualization</Text>
      <Stack direction={{ base: "column", md: "row" }} align={{ base: "center", md: "start" }} spacing={4}>
        <Box position="relative" w={{ base: "100%", sm: "400px" }} maxW="400px" h={{ base: "300px", sm: "400px" }} bg={boxBgColor} borderRadius="md" overflow="hidden" display="flex" alignItems="center" justifyContent="center">
          {zones.map((zone) => {
            const radius = calculateRadius(zone.flux) * scale;
            const size = `${radius * 2}px`;
            return (
              <Box key={zone.name} position="absolute" w={size} h={size} maxW="90%" maxH="90%" borderRadius="full" borderWidth="4px" borderStyle="solid" borderColor={zone.color} bg={zone.flux === 20 ? 'red.100' : zone.flux === 5 ? 'orange.100' : zone.flux === 4.5 ? 'yellow.100' : zone.flux === 1.7 ? 'green.100' : 'gray.100'} opacity={0.8} transition="all 0.3s ease" />
            );
          })}
          <Box position="absolute" w={{ base: "30px", sm: "40px" }} h={{ base: "30px", sm: "40px" }} bg="red.500" borderRadius="full" boxShadow="0 0 30px rgba(255, 0, 0, 0.8)" zIndex={10}>
            <Text fontSize={{ base: "18px", sm: "24px" }} position="absolute" top={{ base: "-4px", sm: "-6px" }} left={{ base: "6px", sm: "8px" }}>🔥</Text>
          </Box>
          {R > 0 && (
            <Box position="absolute" left="50%" top="50%" transform={`translate(-50%, -50%) translateX(${Math.min(R * scale, 140)}px)`} zIndex={20}>
              <Text fontSize={{ base: "24px", sm: "30px" }}>🧍</Text>
              <Box position="absolute" top={{ base: "-25px", sm: "-30px" }} left="50%" transform="translateX(-50%)" bg={currentFlux > 20 ? 'red.600' : currentFlux > 5 ? 'orange.500' : currentFlux > 4.5 ? 'yellow.500' : currentFlux > 1.7 ? 'green.500' : 'green.400'} color="white" px={2} py={1} borderRadius="md" fontSize={{ base: "10px", sm: "xs" }} fontWeight="bold" whiteSpace="nowrap">
                {currentFlux.toFixed(1)} kW/m²
              </Box>
            </Box>
          )}
          <Box position="absolute" bottom={{ base: 4, sm: 6 }} right={{ base: 4, sm: 6 }} bg={boxBgColor} p={2} borderRadius="md" boxShadow="md">
            <Text fontSize={{ base: "10px", sm: "xs" }} color="gray.600">Distance: {distance} {units === 'imperial' ? 'ft' : 'm'}</Text>
          </Box>
        </Box>
        <Box bg={boxBgColor} p={3} borderRadius="md" boxShadow="md" w={{ base: "100%", md: "auto" }} minW={{ base: "100%", md: "200px" }}>
          <VStack align="start" spacing={1}>
            <Text fontSize={{ base: "xs", sm: "xs" }} fontWeight="bold" mb={1}>Heat Flux Zones:</Text>
            {zones.map((zone) => {
              const radius = calculateRadius(zone.flux);
              const displayRadius = units === 'imperial' ? (radius * 3.28084).toFixed(1) : radius.toFixed(1);
              const unitLabel = units === 'imperial' ? 'ft' : 'm';
              return (
                <HStack key={zone.name} spacing={2} align="center">
                  <Box w="12px" h="12px" bg={zone.color} borderRadius="sm" flexShrink={0} />
                  <Text fontSize={{ base: "10px", sm: "11px" }} fontWeight="medium">{zone.flux} kW/m² - {zone.name}
                    {zone.flux === 5 && (<Text as="span" fontSize={{ base: "9px", sm: "10px" }} color="gray.600">{' '}(lens damage)</Text>)}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      </Stack>
    </Box>
  );
};


const PointSourceCalculator = () => {
  const [heatRelease, setHeatRelease] = useState('1000');
  const [distance, setDistance] = useState('5');
  const [radiativeFraction, setRadiativeFraction] = useState('0.3');
  const [units, setUnits] = useState('SI');
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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

  const convertLength = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    return (numVal * (toImperial ? 3.28084 : 0.3048)).toFixed(2);
  };

  const convertHeatRelease = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    return (numVal * (toImperial ? 0.947817 : 1.055056)).toFixed(2);
  };

  const convertHeatFlux = (value, toImperial) => {
    if (value === null || value === undefined) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    return numVal * (toImperial ? 0.08811 : 11.349);
  };
  
  const handleUnitChange = (newUnit) => {
    if (newUnit === units) return;
    const toImperial = newUnit === 'imperial';
    setResult(null);

    setHeatRelease(prev => convertHeatRelease(prev, toImperial));
    setDistance(prev => convertLength(prev, toImperial));

    setUnits(newUnit);
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/point_source_radiation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heatRelease, distance, radiativeFraction, units }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred.');
      }
      setResult(data.value);
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

  return (
    <Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <VStack spacing={{ base: 4, sm: 6 }} align="stretch">
        <Card variant="outline">
          <CardBody>
            <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold">Point Source Radiation Model:</Text>
            <Text fontSize={{ base: "lg", sm: "xl" }} fontFamily="mono">q" = (Q̇ × χᵣ) / (4π × R²)</Text>
          </CardBody>
        </Card>

        <FormControl isRequired>
          <FormLabel>Heat Release Rate ({units === 'SI' ? 'kW' : 'BTU/s'})</FormLabel>
          <Input type="number" value={heatRelease} onChange={(e) => setHeatRelease(e.target.value)} />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Distance to Target ({units === 'SI' ? 'm' : 'ft'})</FormLabel>
          <Input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} />
        </FormControl>

        <FormControl>
          <FormLabel>Radiative Fraction</FormLabel>
          <Input type="number" value={radiativeFraction} onChange={(e) => setRadiativeFraction(e.target.value)} step={0.1} />
        </FormControl>

        <FormControl>
          <FormLabel>Units</FormLabel>
            <RadioGroup onChange={handleUnitChange} value={units}>
              <HStack spacing={4}>
                <Radio value="SI">SI (m, kW)</Radio>
                <Radio value="imperial">Imperial (ft, BTU/s)</Radio>
              </HStack>
            </RadioGroup>
        </FormControl>

        <Button onClick={handleCalculate} isLoading={isLoading} colorScheme="blue" isDisabled={!heatRelease || !distance || !radiativeFraction}>
          Calculate Heat Flux
        </Button>

        {result !== null && (
          <VStack spacing={4} width="100%">
            <Alert status="success">
              <AlertIcon />
              <Box flex="1">
                <Text fontWeight="bold">
                  Radiative Heat Flux: {result.toFixed(2)} {units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                </Text>
              </Box>
            </Alert>
            <Card width="100%">
              <CardHeader><Heading size="sm">Critical Value Analysis</Heading></CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  {Object.entries(CRITICAL_HEAT_FLUX).map(([key, { value, description }]) => {
                    const compareValue = units === 'imperial' ? convertHeatFlux(value, true) : value;
                    return (
                      <HStack key={key} spacing={2}>
                        <Text fontSize={{ base: "sm", sm: "md" }}>
                          {description}: {compareValue.toFixed(1)} {units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                        </Text>
                      </HStack>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>
            <RadiationZoneVisual heatRelease={heatRelease} distance={distance} radiativeFraction={radiativeFraction} units={units} />
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default PointSourceCalculator;