import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

const TSquaredCalculator = () => {
  // State declarations
  const [time, setTime] = useState('');
  const [heatRelease, setHeatRelease] = useState('');
  const [growthRate, setGrowthRate] = useState('medium');
  const [customAlpha, setCustomAlpha] = useState('');
  const [units, setUnits] = useState('SI');
  const [calculateMode, setCalculateMode] = useState('heatRelease'); // 'heatRelease' or 'time'
  const [result, setResult] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fire growth coefficients (α) in kW/s²
  const growthCoefficients = {
    slow: 0.00293,
    medium: 0.01172,
    fast: 0.0469,
    ultrafast: 0.1876,
    custom: null
  };

  // Get the current alpha value
  const getAlpha = () => {
    if (growthRate === 'custom') {
      return parseFloat(customAlpha) || 0;
    }
    return growthCoefficients[growthRate];
  };

  // Unit conversion functions
  const convertTime = (value, toImperial) => {
    // Time is the same in both systems (seconds)
    return value;
  };

  const convertHeatRelease = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 0.947817).toFixed(2); // kW to BTU/s
    }
    return (numVal * 1.055056).toFixed(2);   // BTU/s to kW
  };

  const convertAlpha = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 0.947817).toFixed(6); // kW/s² to BTU/s³
    }
    return (numVal * 1.055056).toFixed(6);   // BTU/s³ to kW/s²
  };

  // Calculation function
  const calculate = () => {
    const alpha = getAlpha();
    if (!alpha) return;

    let calculatedValue;
    let resultType;
    let resultUnit;

    if (calculateMode === 'heatRelease') {
      // Calculate Q = αt²
      if (!time) return;
      const t = parseFloat(time);
      calculatedValue = alpha * t * t;
      
      // Convert to display units if needed
      if (units === 'imperial') {
        calculatedValue = calculatedValue * 0.947817; // kW to BTU/s
      }
      
      resultType = 'Heat Release Rate';
      resultUnit = units === 'SI' ? 'kW' : 'BTU/s';
    } else {
      // Calculate t = √(Q/α)
      if (!heatRelease) return;
      let Q = parseFloat(heatRelease);
      
      // Convert to SI if needed
      if (units === 'imperial') {
        Q = Q * 1.055056; // BTU/s to kW
      }
      
      if (Q < 0 || alpha <= 0) {
        setResult({ error: 'Invalid input values' });
        return;
      }
      
      calculatedValue = Math.sqrt(Q / alpha);
      resultType = 'Time';
      resultUnit = 'seconds';
    }

    setResult({
      value: calculatedValue,
      type: resultType,
      unit: resultUnit,
      alpha: alpha
    });
  };

  const copyResults = () => {
  if (!result || result.error) return;
  
  let copyText = `Fire Dynamics Calculator - T-Squared Growth\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n`;
  copyText += `Method: Q = αt²\n\n`;
  copyText += `Result: ${result.value.toFixed(2)} ${result.unit}`;
  
  if (calculateMode === 'time' && result.value) {
    copyText += ` (${(result.value / 60).toFixed(2)} minutes)`;
  }
  copyText += `\n\n`;
  
  copyText += `Input Parameters:\n`;
  copyText += `- Growth Rate: ${growthRate} (α = ${result.alpha} kW/s²)\n`;
  
  if (calculateMode === 'heatRelease') {
    copyText += `- Time: ${time} seconds\n`;
  } else {
    copyText += `- Target HRR: ${heatRelease} ${units === 'SI' ? 'kW' : 'BTU/s'}\n`;
  }
  
  navigator.clipboard.writeText(copyText).then(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  });
};

  // Automatically calculate when inputs change
  useEffect(() => {
    calculate();
  }, [time, heatRelease, growthRate, customAlpha, units, calculateMode]);

  // Handle unit conversion
  const handleUnitConversion = () => {
    const toImperial = units === 'SI';
    setHeatRelease(prev => prev ? convertHeatRelease(prev, toImperial) : '');
    if (growthRate === 'custom') {
      setCustomAlpha(prev => prev ? convertAlpha(prev, toImperial) : '');
    }
    setUnits(toImperial ? 'imperial' : 'SI');
  };

  return (
    <Chakra.Box p={6} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        {/* Formula Card */}
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize="lg" fontWeight="bold">T-Squared Fire Growth Model:</Chakra.Text>
            <Chakra.Text fontSize="xl" fontFamily="mono">
              Q = αt²
            </Chakra.Text>
            <Chakra.Text fontSize="sm" color="gray.600" mt={2}>
              Where:
              <br />
              Q = Heat release rate (kW or BTU/s)
              <br />
              α = Fire growth coefficient (kW/s² or BTU/s³)
              <br />
              t = Time (seconds)
            </Chakra.Text>
          </Chakra.CardBody>
        </Chakra.Card>

        {/* Growth Rate Coefficients Reference */}
        <Chakra.Card variant="outline" bg="gray.50">
          <Chakra.CardBody>
            <Chakra.Text fontSize="md" fontWeight="bold" mb={2}>Standard Growth Rate Coefficients:</Chakra.Text>
            <Chakra.SimpleGrid columns={2} spacing={2} fontSize="sm">
              <Chakra.Text>Slow:</Chakra.Text>
              <Chakra.Text>0.00293 kW/s²</Chakra.Text>
              <Chakra.Text>Medium:</Chakra.Text>
              <Chakra.Text>0.01172 kW/s²</Chakra.Text>
              <Chakra.Text>Fast:</Chakra.Text>
              <Chakra.Text>0.0469 kW/s²</Chakra.Text>
              <Chakra.Text>Ultra-fast:</Chakra.Text>
              <Chakra.Text>0.1876 kW/s²</Chakra.Text>
            </Chakra.SimpleGrid>
          </Chakra.CardBody>
        </Chakra.Card>

        {/* Mode Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Calculate:</Chakra.FormLabel>
          <Chakra.Select value={calculateMode} onChange={(e) => setCalculateMode(e.target.value)}>
            <option value="heatRelease">Heat Release Rate (from time)</option>
            <option value="time">Time (to reach specific HRR)</option>
          </Chakra.Select>
        </Chakra.FormControl>

        <Chakra.Divider />

        {/* Fire Growth Rate Selection */}
        <Chakra.FormControl>
          <Chakra.FormLabel>Fire Growth Rate:</Chakra.FormLabel>
          <Chakra.Select value={growthRate} onChange={(e) => setGrowthRate(e.target.value)}>
            <option value="slow">Slow</option>
            <option value="medium">Medium</option>
            <option value="fast">Fast</option>
            <option value="ultrafast">Ultra-fast</option>
            <option value="custom">Custom</option>
          </Chakra.Select>
        </Chakra.FormControl>

        {/* Custom Alpha Input */}
        {growthRate === 'custom' && (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Custom α (Fire Growth Coefficient)</Chakra.FormLabel>
            <Chakra.NumberInput
              value={customAlpha}
              onChange={(vs) => setCustomAlpha(vs)}
              min={0}
              step={0.001}
            >
              <Chakra.NumberInputField />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="gray.600">
              {units === 'SI' ? 'kW/s²' : 'BTU/s³'}
            </Chakra.Text>
          </Chakra.FormControl>
        )}

        {/* Input Fields */}
        {calculateMode === 'heatRelease' ? (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Time</Chakra.FormLabel>
            <Chakra.NumberInput
              value={time}
              onChange={(vs) => setTime(vs)}
              min={0}
            >
              <Chakra.NumberInputField />
            </Chakra.NumberInput>
            <Chakra.Text fontSize="sm" color="gray.600">seconds</Chakra.Text>
          </Chakra.FormControl>
        ) : (
          <Chakra.FormControl isRequired>
            <Chakra.FormLabel>Target Heat Release Rate</Chakra.FormLabel>
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

        {/* Unit Selection */}
<Chakra.FormControl>
  <Chakra.FormLabel>Units</Chakra.FormLabel>
  <Chakra.VStack align="start" spacing={2}>
    <Chakra.RadioGroup 
      value={units} 
      onChange={(newUnits) => setUnits(newUnits)}
    >
      <Chakra.HStack spacing={4}>
        <Chakra.Radio value="SI">SI (kW)</Chakra.Radio>
        <Chakra.Radio value="imperial">Imperial (BTU/s)</Chakra.Radio>
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

{/* Results */}
{result && (
  result.error ? (
    <Chakra.Alert status="error">
      <Chakra.AlertIcon />
      <Chakra.Text>{result.error}</Chakra.Text>
    </Chakra.Alert>
  ) : result.value !== undefined && (
    <Chakra.Alert status="success">
      <Chakra.AlertIcon />
      <Chakra.Box flex="1">
        <Chakra.VStack align="start" spacing={2}>
          <Chakra.Text fontWeight="bold">
            {result.type}: {result.value.toFixed(2)} {result.unit}
          </Chakra.Text>
          <Chakra.Text fontSize="sm">
            {calculateMode === 'heatRelease' ? (
              <>
                At t = {time} seconds
                <br />
                Growth rate: {growthRate} (α = {result.alpha} kW/s²)
              </>
            ) : (
              <>
                To reach Q = {heatRelease} {units === 'SI' ? 'kW' : 'BTU/s'}
                <br />
                Growth rate: {growthRate} (α = {result.alpha} kW/s²)
              </>
            )}
          </Chakra.Text>
          {calculateMode === 'time' && (
            <Chakra.Text fontSize="sm" color="gray.600">
              = {(result.value / 60).toFixed(2)} minutes
            </Chakra.Text>
          )}
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
  )
)}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default TSquaredCalculator;