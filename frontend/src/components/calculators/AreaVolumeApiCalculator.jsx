// frontend/src/components/calculators/AreaVolumeApiCalculator.jsx

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
  useColorModeValue, // <-- ADD THIS
} from '@chakra-ui/react';

function AreaVolumeApiCalculator() {
  // Define a background color that adapts to the theme
  // It will be 'gray.100' in light mode and 'gray.700' in dark mode
  const resultBg = useColorModeValue('gray.100', 'gray.700');

  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleCalculate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // This is the API call to your Python backend
      const response = await fetch('http://127.0.0.1:5000/api/rectangular_area_volume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
          units: 'SI', // Assuming SI units for now
        }),
      });

      const data = await response.json();
      console.log('API Response Data:', data);

      if (!response.ok) {
        // If the server responded with an error, display it
        throw new Error(data.error || 'An error occurred.');
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

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
      <VStack spacing={4} align="stretch">
        <Heading size="md">Area & Volume (API Test)</Heading>

        <FormControl isRequired>
          <FormLabel>Length (m)</FormLabel>
          <Input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g., 10"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Width (m)</FormLabel>
          <Input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="e.g., 8"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Height (m)</FormLabel>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g., 3"
          />
        </FormControl>

        <Button
          onClick={handleCalculate}
          isLoading={isLoading}
          colorScheme="blue"
          disabled={!length || !width || !height}
        >
          Calculate
        </Button>

        {result && (
      <Box mt={4} p={4} bg={resultBg} borderRadius="md"> {/* <-- APPLY THE VARIABLE HERE */}
        <Text>
              <b>Floor Area:</b> {result.floor_area.toFixed(2)} m²
            </Text>
            <Text>
               <b>Surface Area:</b> {result.total_surface_area.toFixed(2)} m²
            </Text>
            <Text>
              <b>Volume:</b> {result.volume.toFixed(2)} m³
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default AreaVolumeApiCalculator;