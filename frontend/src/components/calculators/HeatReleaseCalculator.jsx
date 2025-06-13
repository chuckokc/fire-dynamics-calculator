// frontend/src/components/calculators/HeatReleaseCalculator.jsx

import React, { useState, useEffect } from 'react';
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
  Card,
  CardBody,
  Spinner
} from '@chakra-ui/react';

const HeatReleaseCalculator = () => {
  // --- NEW: State to hold the materials fetched from the API ---
  const [materials, setMaterials] = useState({});
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  const [material, setMaterial] = useState('');
  const [burningArea, setBurningArea] = useState('');
  const [units, setUnits] = useState('SI');
  const [manualMassFlux, setManualMassFlux] = useState('');
  
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // --- NEW: useEffect hook to fetch materials when the component loads ---
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/materials');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch materials.');
        }
        setMaterials(data);
      } catch (error) {
        toast({
          title: 'Failed to Load Materials',
          description: error.message,
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []); // The empty array [] means this effect runs only once

  const selectedMaterial = material ? materials[material] : null;
  const needsMassFluxInput = selectedMaterial && !selectedMaterial.mass_flux;

  const convertArea = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (isNaN(numVal)) return '';
    const factor = toImperial ? 10.7639 : 0.092903;
    return (numVal * factor).toFixed(2);
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit === units) return;
    setResult(null);
    setBurningArea(prev => convertArea(prev, newUnit === 'imperial'));
    setUnits(newUnit);
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/flashover`;

      // Send the data to our Python backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material, burningArea, units, manualMassFlux }),
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
    <Box p={6} maxW="2xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Card variant="outline">
          <CardBody>
            <Text fontSize="lg" fontWeight="bold">Heat Release Rate Equation:</Text>
            <Text fontSize="xl" fontFamily="mono">Q̇ = ṁ" × A × ΔHc</Text>
          </CardBody>
        </Card>

        <FormControl isRequired>
          <FormLabel>Material</FormLabel>
          {isLoadingMaterials ? (
            <Spinner />
          ) : (
            <Select placeholder="Select material" value={material} onChange={(e) => { setMaterial(e.target.value); setResult(null); setManualMassFlux(''); }}>
              {/* --- UPDATED: Dropdown is now built dynamically --- */}
              {Object.values(materials).map((mat) => (
                <option key={mat.key} value={mat.key}>
                  {mat.name} {!mat.mass_flux ? '(Requires mass flux input)' : ''}
                </option>
              ))}
            </Select>
          )}
        </FormControl>

        {needsMassFluxInput && (
          <FormControl isRequired>
            <FormLabel>Mass Flux Rate (g/m²-s)</FormLabel>
            <Input type="number" value={manualMassFlux} onChange={(e) => setManualMassFlux(e.target.value)} />
          </FormControl>
        )}

        <FormControl isRequired>
          <FormLabel>Burning Area ({units === 'SI' ? 'm²' : 'ft²'})</FormLabel>
          <Input type="number" value={burningArea} onChange={(e) => setBurningArea(e.target.value)} />
        </FormControl>

        <FormControl>
          <FormLabel>Units</FormLabel>
          <RadioGroup onChange={handleUnitChange} value={units}>
            <HStack spacing={4}>
              <Radio value="SI">SI (m², kW)</Radio>
              <Radio value="imperial">Imperial (ft², BTU/s)</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        <Button onClick={handleCalculate} isLoading={isLoading} colorScheme="blue" isDisabled={!material || !burningArea || (needsMassFluxInput && !manualMassFlux)}>
          Calculate Heat Release Rate
        </Button>

        {result !== null && (
          <Alert status="success">
            <AlertIcon />
            <Box flex="1">
              <Text fontWeight="bold">
                Heat Release Rate: {result.toFixed(0)} {units === 'SI' ? 'kW' : 'BTU/s'}
              </Text>
            </Box>
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default HeatReleaseCalculator;