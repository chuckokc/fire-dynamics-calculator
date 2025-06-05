import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

const PointSourceCalculator = () => {
  // State declarations
  const [heatRelease, setHeatRelease] = useState('');
  const [distance, setDistance] = useState('');
  const [radiativeFraction, setRadiativeFraction] = useState('0.3');
  const [units, setUnits] = useState('imperial');
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Critical heat flux values (in kW/m²)
  const CRITICAL_HEAT_FLUX = {
    'wood_piloted': { value: 12.5, description: 'Piloted ignition of wood' },
    'wood_auto': { value: 28, description: 'Auto-ignition of wood' },
    'plastic_piloted': { value: 10, description: 'Piloted ignition of plastics' },
    'plastic_auto': { value: 22, description: 'Auto-ignition of plastics' },
    'human_pain': { value: 2.5, description: 'Pain threshold for exposed skin (within 5s)' },
    'human_limit': { value: 1.7, description: 'Tenability limit for humans' },
    'firefighter_gear': { value: 4.5, description: 'Operational limit for firefighters in gear' }
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
    if (result >= compareValue * 1.1) return 'red';
    if (result >= compareValue) return 'yellow';
    return 'green';
  };

  return (
    <Chakra.Box p={6} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize="lg" fontWeight="bold">Point Source Radiation Model:</Chakra.Text>
            <Chakra.Text fontSize="xl" fontFamily="mono">
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
      <Chakra.Button
        size="sm"
        colorScheme={copySuccess ? "green" : "blue"}
        onClick={copyResults}
        ml={4}
      >
        {copySuccess ? "Copied!" : "Copy Results"}
      </Chakra.Button>
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
                        <Chakra.Text>
                          {description}: {compareValue.toFixed(1)} {units === 'SI' ? 'kW/m²' : 'BTU/ft²/s'}
                        </Chakra.Text>
                      </Chakra.HStack>
                    );
                  })}
                </Chakra.VStack>
              </Chakra.CardBody>
            </Chakra.Card>
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
                  <Chakra.Tab>Radiative Fractions</Chakra.Tab>
                  <Chakra.Tab>Common Heat Release Rates</Chakra.Tab>
                </Chakra.TabList>
                <Chakra.TabPanels>
                  <Chakra.TabPanel>
                    <Chakra.VStack align="start" spacing={2}>
                      {Object.entries(REFERENCE_DATA.radiativeFractions).map(([material, range]) => (
                        <Chakra.Text key={material}>
                          {material}: {range}
                        </Chakra.Text>
                      ))}
                    </Chakra.VStack>
                  </Chakra.TabPanel>
                  <Chakra.TabPanel>
                    <Chakra.VStack align="start" spacing={2}>
                      {Object.entries(REFERENCE_DATA.commonHeatRelease).map(([item, value]) => (
                        <Chakra.Text key={item}>
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