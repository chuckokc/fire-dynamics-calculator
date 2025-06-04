import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

const FlameHeightCalculator = () => {
  // State declarations
  const [heatRelease, setHeatRelease] = useState('');
  const [diameter, setDiameter] = useState('');
  const [units, setUnits] = useState('imperial');
  const [result, setResult] = useState(null);

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

  // Calculation function
  const calculateFlameHeight = () => {
    if (!heatRelease || !diameter) return;

    // Convert inputs to SI for calculation
    let Q = parseFloat(heatRelease);
    let D = parseFloat(diameter);

    if (units === 'imperial') {
      Q = Q * 1.055056;  // Convert BTU/s to kW
      D = D * 0.3048;    // Convert ft to m
    }

    // Heskestad's correlation: L = 0.235Q^(2/5) - 1.02D
    const flameHeight = (0.235 * Math.pow(Q, 0.4)) - (1.02 * D);

    // Convert result if needed
    let finalResult = flameHeight;
    if (units === 'imperial') {
      finalResult = flameHeight * 3.28084; // Convert m to ft
    }

    setResult(finalResult);
  };

  useEffect(() => {
    if (heatRelease && diameter) {
      calculateFlameHeight();
    }
  }, [heatRelease, diameter, units]);

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
                setDiameter(prev => convertLength(prev, units === 'SI'));
                setUnits(newUnits);
              }}
            >
              Convert Current Measurements to {units === 'SI' ? 'Imperial' : 'SI'} Units
            </Chakra.Button>
          </Chakra.VStack>
        </Chakra.FormControl>

        <Chakra.Button
          colorScheme="blue"
          onClick={calculateFlameHeight}
          isDisabled={!heatRelease || !diameter}
        >
          Calculate Flame Height
        </Chakra.Button>

        {result && (
          <Chakra.Alert status="success">
            <Chakra.AlertIcon />
            <Chakra.VStack align="start" spacing={2}>
              <Chakra.Text fontWeight="bold">
                Flame Height: {result.toFixed(2)} {units === 'SI' ? 'm' : 'ft'}
              </Chakra.Text>
              <Chakra.Text fontSize="sm">
                Based on:
                <br />
                Heat Release Rate: {heatRelease} {units === 'SI' ? 'kW' : 'BTU/s'}
                <br />
                Fire Diameter: {diameter} {units === 'SI' ? 'm' : 'ft'}
              </Chakra.Text>
            </Chakra.VStack>
          </Chakra.Alert>
        )}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default FlameHeightCalculator;