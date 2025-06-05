import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

const FlashoverCalculator = () => {
  // State declarations
  const [roomHeight, setRoomHeight] = useState('');
  const [roomWidth, setRoomWidth] = useState('');
  const [roomLength, setRoomLength] = useState('');
  const [openingHeight, setOpeningHeight] = useState('');
  const [openingWidth, setOpeningWidth] = useState('');
  const [surfaceMaterial, setSurfaceMaterial] = useState('gypsum');
  const [units, setUnits] = useState('imperial');
  const [results, setResults] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  // Add these new states for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Material thermal properties (k in kW/m/K, ρ in kg/m³, c in kJ/kg/K)
  const MATERIALS = {
    gypsum: {
      name: 'Gypsum Board',
      k: 0.0016,
      ρ: 790,
      c: 1.09
    },
    concrete: {
      name: 'Concrete',
      k: 0.0016,
      ρ: 2300,
      c: 0.92
    },
    brick: {
      name: 'Brick',
      k: 0.0008,
      ρ: 1600,
      c: 0.84
    }
  };

  // Unit conversion functions
  const convertLength = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 3.28084).toFixed(2); // m to ft
    }
    return (numVal * 0.3048).toFixed(2);    // ft to m
  };

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!results) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      roomHeight: roomHeight,
      roomWidth: roomWidth,
      roomLength: roomLength,
      openingHeight: openingHeight,
      openingWidth: openingWidth,
      surfaceMaterial: surfaceMaterial,
      units: units,
      results: {
        mqh: results.mqh,
        thomas: results.thomas,
        babrauskas: results.babrauskas
      }
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setRoomHeight(entry.roomHeight);
    setRoomWidth(entry.roomWidth);
    setRoomLength(entry.roomLength);
    setOpeningHeight(entry.openingHeight);
    setOpeningWidth(entry.openingWidth);
    setSurfaceMaterial(entry.surfaceMaterial);
    setUnits(entry.units);
    setShowHistory(false);
  };

  const calculateFlashover = () => {
    if (!roomHeight || !roomWidth || !roomLength || !openingHeight || !openingWidth) return;

    // Convert all dimensions to SI for calculations
    let H = parseFloat(roomHeight);
    let W = parseFloat(roomWidth);
    let L = parseFloat(roomLength);
    let hw = parseFloat(openingHeight);
    let ww = parseFloat(openingWidth);

    if (units === 'imperial') {
      // Convert feet to meters
      H = H * 0.3048;
      W = W * 0.3048;
      L = L * 0.3048;
      hw = hw * 0.3048;
      ww = ww * 0.3048;
    }

    // Calculate room characteristics
    const AT = 2 * (L * W + L * H + W * H); // Total surface area
    const AO = hw * ww;                     // Opening area
    const HO = hw;                          // Opening height

    // Get material properties
    const material = MATERIALS[surfaceMaterial];
    const hk = Math.sqrt(material.k * material.ρ * material.c);

    // Calculate using MQH correlation
    const QfoMQH = 610 * Math.sqrt(hk * AT * Math.sqrt(AO * HO));

    // Calculate using Thomas correlation
    const QfoThomas = 7.8 * AT + 378 * AO * Math.sqrt(HO);

    // Calculate using Babrauskas correlation
    const QfoBabrauskas = 750 * AO * Math.sqrt(HO);

    // Convert results if needed
    let finalResults = {
      mqh: QfoMQH,
      thomas: QfoThomas,
      babrauskas: QfoBabrauskas
    };

    if (units === 'imperial') {
      // Convert kW to BTU/s
      finalResults = {
        mqh: QfoMQH * 0.947817,
        thomas: QfoThomas * 0.947817,
        babrauskas: QfoBabrauskas * 0.947817
      };
    }

    setResults(finalResults);
  };

  const copyResults = () => {
  if (!results) return;  // Changed from 'result' to 'results'
  
  let copyText = `Fire Dynamics Calculator - Flashover Analysis\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n\n`;
  copyText += `Room Parameters:\n`;
  copyText += `- Dimensions: ${roomLength} × ${roomWidth} × ${roomHeight} ${units === 'SI' ? 'm' : 'ft'}\n`;
  copyText += `- Opening: ${openingWidth} × ${openingHeight} ${units === 'SI' ? 'm' : 'ft'}\n`;
  copyText += `- Surface Material: ${MATERIALS[surfaceMaterial].name}\n\n`;
  copyText += `Results:\n`;
  copyText += `- MQH Method: ${results.mqh.toFixed(0)} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  copyText += `- Thomas Method: ${results.thomas.toFixed(0)} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  copyText += `- Babrauskas Method: ${results.babrauskas.toFixed(0)} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  
  navigator.clipboard.writeText(copyText).then(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  });
};

  useEffect(() => {
    if (roomHeight && roomWidth && roomLength && openingHeight && openingWidth) {
      calculateFlashover();
    }
  }, [roomHeight, roomWidth, roomLength, openingHeight, openingWidth, surfaceMaterial, units]);

  return (
    <Chakra.Box p={6} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize="lg" fontWeight="bold">Flashover Correlations:</Chakra.Text>
            <Chakra.Text fontSize="xl" fontFamily="mono">
              MQH: Q̇fo = 610(hkAT√AO√HO)^(1/2)
              <br />
              Thomas: Q̇fo = 7.8AT + 378AO√HO
              <br />
              Babrauskas: Q̇fo = 750AO√HO
            </Chakra.Text>
            <Chakra.Text fontSize="sm" color="gray.600" mt={2}>
              Where:
              <br />
              Q̇fo = Heat release rate required for flashover
              <br />
              hk = √(kρc) = Thermal inertia of walls
              <br />
              AT = Total surface area of compartment
              <br />
              AO = Area of ventilation opening
              <br />
              HO = Height of ventilation opening
            </Chakra.Text>
          </Chakra.CardBody>
        </Chakra.Card>
        
        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Room Height</Chakra.FormLabel>
          <Chakra.NumberInput
            value={roomHeight}
            onChange={(vs) => setRoomHeight(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Room Width</Chakra.FormLabel>
          <Chakra.NumberInput
            value={roomWidth}
            onChange={(vs) => setRoomWidth(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Room Length</Chakra.FormLabel>
          <Chakra.NumberInput
            value={roomLength}
            onChange={(vs) => setRoomLength(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Opening Height</Chakra.FormLabel>
          <Chakra.NumberInput
            value={openingHeight}
            onChange={(vs) => setOpeningHeight(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Opening Width</Chakra.FormLabel>
          <Chakra.NumberInput
            value={openingWidth}
            onChange={(vs) => setOpeningWidth(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm' : 'ft'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl>
          <Chakra.FormLabel>Surface Material</Chakra.FormLabel>
          <Chakra.Select
            value={surfaceMaterial}
            onChange={(e) => setSurfaceMaterial(e.target.value)}
          >
            {Object.entries(MATERIALS).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </Chakra.Select>
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
                setRoomHeight(prev => convertLength(prev, units === 'SI'));
                setRoomWidth(prev => convertLength(prev, units === 'SI'));
                setRoomLength(prev => convertLength(prev, units === 'SI'));
                setOpeningHeight(prev => convertLength(prev, units === 'SI'));
                setOpeningWidth(prev => convertLength(prev, units === 'SI'));
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
                  // Get the average of the three methods for coloring
                  const avgHRR = units === 'SI' 
                    ? (entry.results.mqh + entry.results.thomas + entry.results.babrauskas) / 3
                    : ((entry.results.mqh + entry.results.thomas + entry.results.babrauskas) / 3) * 1.055056;
                  
                  const hrrColor = avgHRR > 5000 ? 'red' : 
                                  avgHRR > 2000 ? 'orange' :
                                  avgHRR > 1000 ? 'yellow' : 'green';
                  
                  return (
                    <Chakra.Box
                      key={entry.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderLeftWidth="4px"
                      borderLeftColor={`${hrrColor}.500`}
                      _hover={{ bg: 'gray.50' }}
                      cursor="pointer"
                      onClick={() => loadFromHistory(entry)}
                    >
                      <Chakra.HStack justify="space-between">
                        <Chakra.VStack align="start" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="medium">
                            Room: {entry.roomLength}×{entry.roomWidth}×{entry.roomHeight} {entry.units === 'SI' ? 'm' : 'ft'}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            {entry.timestamp}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.500">
                            Opening: {entry.openingWidth}×{entry.openingHeight} {entry.units === 'SI' ? 'm' : 'ft'}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.500">
                            {MATERIALS[entry.surfaceMaterial].name}
                          </Chakra.Text>
                        </Chakra.VStack>
                        <Chakra.VStack align="end" spacing={0}>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            MQH: {entry.results.mqh.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            Thomas: {entry.results.thomas.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" fontWeight="bold">
                            Babrauskas: {entry.results.babrauskas.toFixed(0)}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            {entry.units === 'SI' ? 'kW' : 'BTU/s'}
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
          onClick={calculateFlashover}
          isDisabled={!roomHeight || !roomWidth || !roomLength || !openingHeight || !openingWidth}
        >
          Calculate Flashover Conditions
        </Chakra.Button>

        {results && (
  <Chakra.Alert status="info">
    <Chakra.AlertIcon />
    <Chakra.Box flex="1">
      <Chakra.VStack align="start" spacing={2} width="100%">
        <Chakra.Text fontWeight="bold">Required Heat Release Rate for Flashover:</Chakra.Text>
        <Chakra.Text>
          MQH Correlation: {results.mqh.toFixed(0)} {units === 'SI' ? 'kW' : 'BTU/s'}
        </Chakra.Text>
        <Chakra.Text>
          Thomas Correlation: {results.thomas.toFixed(0)} {units === 'SI' ? 'kW' : 'BTU/s'}
        </Chakra.Text>
        <Chakra.Text>
          Babrauskas Correlation: {results.babrauskas.toFixed(0)} {units === 'SI' ? 'kW' : 'BTU/s'}
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
)}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default FlashoverCalculator;