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
  useColorModeValue,
  Alert,
  AlertIcon
} from '@chakra-ui/react';

const FlashoverCalculator = () => {
  // State for all the form inputs
  const [roomHeight, setRoomHeight] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [roomLength, setRoomLength] = useState('');
  const [openingHeight, setOpeningHeight] = useState('');
  const [openingWidth, setOpeningWidth] = useState('');
  const [surfaceMaterial, setSurfaceMaterial] = useState('gypsum_board');
  const [units, setUnits] = useState('SI');

  // State for results and loading status
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const resultBg = useColorModeValue('gray.100', 'gray.700');

  // --- NEW: Helper function for converting length values ---
  const convertLength = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    
    if (toImperial) {
      // Meters to Feet
      return (numVal * 3.28084).toFixed(2);
    } else {
      // Feet to Meters
      return (numVal * 0.3048).toFixed(2);
    }
  };

  // --- NEW: Function to handle changing the unit system ---
  const handleUnitChange = (newUnit) => {
    if (newUnit === units) return; // No change needed

    const toImperial = newUnit === 'imperial';

    // Convert all existing dimension values
    setRoomHeight(prev => convertLength(prev, toImperial));
    setRoomWidth(prev => convertLength(prev, toImperial));
    setRoomLength(prev => convertLength(prev, toImperial));
    setOpeningHeight(prev => convertLength(prev, toImperial));
    setOpeningWidth(prev => convertLength(prev, toImperial));

    // Finally, set the new unit
    setUnits(newUnit);
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/flashover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomHeight,
          roomWidth,
          roomLength,
          openingHeight,
          openingWidth,
          surfaceMaterial,
          units,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred during calculation.');
      }
      setResults(data);

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

  const hasAllInputs = roomHeight && roomWidth && roomLength && openingHeight && openingWidth;

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Flashover Calculator</Heading>
        <Text fontSize="sm">
          Estimate minimum heat release rate for flashover using MQH, Thomas, and Babrauskas correlations.
        </Text>

        <FormControl isRequired><FormLabel>Room Height</FormLabel><Input type="number" value={roomHeight} onChange={(e) => setRoomHeight(e.target.value)} /></FormControl>
        <FormControl isRequired><FormLabel>Room Width</FormLabel><Input type="number" value={roomWidth} onChange={(e) => setRoomWidth(e.target.value)} /></FormControl>
        <FormControl isRequired><FormLabel>Room Length</FormLabel><Input type="number" value={roomLength} onChange={(e) => setRoomLength(e.target.value)}/></FormControl>
        <FormControl isRequired><FormLabel>Opening Height</FormLabel><Input type="number" value={openingHeight} onChange={(e) => setOpeningHeight(e.target.value)} /></FormControl>
        <FormControl isRequired><FormLabel>Opening Width</FormLabel><Input type="number" value={openingWidth} onChange={(e) => setOpeningWidth(e.target.value)} /></FormControl>
        
        <FormControl><FormLabel>Surface Material</FormLabel>
          <Select value={surfaceMaterial} onChange={(e) => setSurfaceMaterial(e.target.value)}>
            <option value="gypsum_board">Gypsum Board</option>
            <option value="concrete">Concrete</option>
            <option value="brick">Brick</option>
          </Select>
        </FormControl>

        {/* --- UPDATED: Connect the RadioGroup to our new handler --- */}
        <FormControl><FormLabel>Units</FormLabel>
          <RadioGroup onChange={handleUnitChange} value={units}>
            <HStack spacing="24px">
              <Radio value="SI">SI (m, kW)</Radio>
              <Radio value="imperial">Imperial (ft, BTU/s)</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        <Button onClick={handleCalculate} isLoading={isLoading} colorScheme="blue" isDisabled={!hasAllInputs}>
          Calculate
        </Button>

        {results && (
          <Alert status="info" borderRadius="md" variant="subtle">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Required HRR for Flashover ({units === 'SI' ? 'kW' : 'BTU/s'}):</Text>
              <Text><b>MQH Method:</b> {results.mqh.toFixed(0)}</Text>
              <Text><b>Thomas Method:</b> {results.thomas.toFixed(0)}</Text>
              <Text><b>Babrauskas Method:</b> {results.babrauskas.toFixed(0)}</Text>
            </Box>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default FlashoverCalculator;