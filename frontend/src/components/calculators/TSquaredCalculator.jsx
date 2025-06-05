import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

// T-Squared Growth Curve Visual Component
const TSquaredVisual = ({ time, heatRelease, growthRate, calculateMode, units, customAlpha }) => {
  // Add these at the beginning of the component
  const bgColor = Chakra.useColorModeValue('gray.50', 'gray.700');
  const boxBgColor = Chakra.useColorModeValue('white', 'gray.800');
  const textColor = Chakra.useColorModeValue('black', 'white');
  const gridColor = Chakra.useColorModeValue('gray', 'gray.600');
  
  // Growth coefficients with actual color values for SVG
  const coefficients = {
    slow: { alpha: 0.00293, color: '#48BB78' },      // green
    medium: { alpha: 0.01172, color: '#ECC94B' },    // yellow  
    fast: { alpha: 0.0469, color: '#ED8936' },       // orange
    ultrafast: { alpha: 0.1876, color: '#E53E3E' }   // red
  };

  // Add custom coefficient if provided
  if (growthRate === 'custom' && customAlpha) {
    let alphaValue = parseFloat(customAlpha) || 0;
    // Convert to SI if needed
    if (units === 'imperial' && alphaValue > 0) {
      alphaValue = alphaValue * 1.055056; // BTU/s³ to kW/s²
    }
    coefficients.custom = { 
      alpha: alphaValue, 
      color: '#805AD5'  // purple
    };
  }

  // Convert values to SI for calculations
  let currentTime = parseFloat(time) || 0;
  let currentHRR = parseFloat(heatRelease) || 0;
  
  if (units === 'imperial' && currentHRR > 0) {
    currentHRR = currentHRR * 1.055056; // Convert BTU/s to kW
  }

  // Calculate the current point based on mode
  const currentCoeff = coefficients[growthRate];
  if (calculateMode === 'time' && currentHRR > 0 && currentCoeff) {
    currentTime = Math.sqrt(currentHRR / currentCoeff.alpha);
  } else if (calculateMode === 'heatRelease' && currentTime > 0 && currentCoeff) {
    currentHRR = currentCoeff.alpha * currentTime * currentTime;
  }

  // Set graph dimensions - RESPONSIVE
  const graphWidth = 400;
  const graphHeight = 300;
  const padding = 50; // Increased for y-axis labels
  const plotWidth = graphWidth - 2 * padding;
  const plotHeight = graphHeight - 2 * padding;

  // Determine scale based on current values
  let maxTime = Math.max(600, currentTime * 1.2); // At least 10 minutes, or 20% more than current
  let maxHRR = Math.max(1000, currentHRR * 1.2); // At least 1MW, or 20% more than current

  // Reference lines for common HRR values
  const referenceLines = [
    { value: 1000, label: '1 MW', color: '#805AD5' },    // purple
    { value: 5000, label: '5 MW', color: '#6B46C1' }     // darker purple
  ].filter(ref => ref.value <= maxHRR);

  return (
    <Chakra.Box p={4} bg={bgColor} borderRadius="md">
      <Chakra.Text fontWeight="bold" mb={3}>Fire Growth Curves</Chakra.Text>
      
      <Chakra.Box 
        bg={boxBgColor} 
        borderRadius="md" 
        p={{ base: 2, sm: 4 }}
      >
        <Chakra.Box
          w="100%"
          overflowX="auto"
          sx={{
            '&::-webkit-scrollbar': {
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              bg: 'gray.100',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: 'gray.400',
              borderRadius: '3px',
            },
          }}
        >
          <svg 
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            style={{ 
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              minWidth: '300px'
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <g opacity="0.2">
              {/* Update the stroke color for grid lines */}
              {[0, 1, 2, 3, 4, 5].map(i => {
                const x = padding + (i / 5) * plotWidth;
                return (
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={padding + plotHeight}
                    stroke={gridColor}  // Changed from "gray"
                    strokeWidth="1"
                  />
                );
              })}
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4, 5].map(i => {
                const y = padding + (i / 5) * plotHeight;
                return (
                  <line
                    key={`h-${i}`}
                    x1={padding}
                    y1={y}
                    x2={padding + plotWidth}
                    y2={y}
                    stroke={gridColor}
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* Reference lines */}
            {referenceLines.map(ref => {
              const y = padding + plotHeight - (ref.value / maxHRR) * plotHeight;
              return (
                <g key={ref.label}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={padding + plotWidth}
                    y2={y}
                    stroke={ref.color}
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                  <text
                    x={padding + 5}
                    y={y - 5}
                    fontSize="10"
                    fill={ref.color}
                  >
                    {ref.label}
                  </text>
                </g>
              );
            })}

            {/* Growth curves */}
            {Object.entries(coefficients)
              .filter(([rate, config]) => rate !== 'custom' || growthRate === 'custom')
              .map(([rate, config]) => {
                const points = [];
                const timeStep = maxTime / 100;
                
                for (let t = 0; t <= maxTime; t += timeStep) {
                  const hrr = config.alpha * t * t;
                  if (hrr <= maxHRR) {
                    const x = padding + (t / maxTime) * plotWidth;
                    const y = padding + plotHeight - (hrr / maxHRR) * plotHeight;
                    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
                  }
                }
                
                if (points.length === 0) return null;
                
                const pathData = `M ${points.join(' L ')}`;
                const isSelected = rate === growthRate;
                
                return (
                  <path
                    key={rate}
                    d={pathData}
                    stroke={config.color}  // NOT stroke={config}
                    strokeWidth={isSelected ? "3" : "2"}
                    fill="none"
                    opacity={isSelected ? 1 : 0.4}
                  />
                );
              })}

            {/* Axes */}
            <line
              x1={padding}
              y1={padding + plotHeight}
              x2={padding + plotWidth}
              y2={padding + plotHeight}
              stroke={textColor}  // Changed from "black"
              strokeWidth="2"
            />
            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={padding + plotHeight}
              stroke={textColor}  // Changed from "black"
              strokeWidth="2"
            />

            {/* Current point */}
            {currentTime > 0 && currentHRR > 0 && currentCoeff && (
              <circle
                cx={padding + (currentTime / maxTime) * plotWidth}
                cy={padding + plotHeight - (currentHRR / maxHRR) * plotHeight}
                r="6"
                fill={currentCoeff.color}  // NOT fill={config.color}
                stroke="black"
                strokeWidth="2"
              />
            )}

            {/* Axis labels */}
            <text x={graphWidth / 2} y={graphHeight - 5} textAnchor="middle" fontSize="12" fill={textColor}>
              Time (seconds)
            </text>
            <text
              x={15}
              y={graphHeight / 2}
              textAnchor="middle"
              fontSize="12"
              fill={textColor}
              transform={`rotate(-90 15 ${graphHeight / 2})`}
            >
              HRR (kW)
            </text>

            {/* Time axis values */}
            {[0, 1, 2, 3, 4, 5].map(i => {
              const x = padding + (i / 5) * plotWidth;
              const timeVal = (i / 5) * maxTime;
              return (
                <text
                  key={`t-${i}`}
                  x={x}
                  y={padding + plotHeight + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill={textColor}
                >
                  {timeVal.toFixed(0)}
                </text>
              );
            })}

            {/* HRR axis values */}
            {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
              const y = padding + plotHeight - fraction * plotHeight;
              const hrrVal = fraction * maxHRR;
              return (
                <text
                  key={`hrr-${i}`}
                  x={padding - 5}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill={textColor}
                >
                  {hrrVal >= 1000 ? `${(hrrVal / 1000).toFixed(1)}MW` : `${hrrVal.toFixed(0)}`}
                </text>
              );
            })}
          </svg>
        </Chakra.Box>

        {/* Legend */}
        <Chakra.HStack 
          spacing={{ base: 2, sm: 4 }} 
          mt={4} 
          justify="center"
          flexWrap="wrap"
        >
          {Object.entries(coefficients)
            .filter(([rate, config]) => rate !== 'custom' || growthRate === 'custom')
            .map(([rate, config]) => (
              <Chakra.HStack key={rate} spacing={1}>
                <Chakra.Box
                  w="20px"
                  h="3px"
                  bg={config.color}
                  opacity={rate === growthRate ? 1 : 0.4}
                />
                <Chakra.Text
                  fontSize={{ base: "xs", sm: "xs" }}
                  fontWeight={rate === growthRate ? "bold" : "normal"}
                  textTransform="capitalize"
                >
                  {rate}
                </Chakra.Text>
              </Chakra.HStack>
            ))}
        </Chakra.HStack>

        {/* Current values display */}
        {currentTime > 0 && currentHRR > 0 && (
          <Chakra.Box 
            mt={3} 
            p={2} 
            bg={Chakra.useColorModeValue('gray.50', 'gray.700')} 
            borderRadius="md"
          >
            <Chakra.Text fontSize={{ base: "xs", sm: "sm" }} textAlign="center">
              Current Point: {currentTime.toFixed(0)}s → {currentHRR.toFixed(0)} kW
              {units === 'imperial' && ` (${(currentHRR * 0.947817).toFixed(0)} BTU/s)`}
            </Chakra.Text>
          </Chakra.Box>
        )}
      </Chakra.Box>
    </Chakra.Box>
  );
};

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
  // Add these new states for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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

  // Function to save calculation to history
  const saveToHistory = () => {
    if (!result || result.error) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      time: time,
      heatRelease: heatRelease,
      growthRate: growthRate,
      customAlpha: customAlpha,
      units: units,
      calculateMode: calculateMode,
      result: {
        value: result.value,
        type: result.type,
        unit: result.unit,
        alpha: result.alpha
      }
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setTime(entry.time);
    setHeatRelease(entry.heatRelease);
    setGrowthRate(entry.growthRate);
    setCustomAlpha(entry.customAlpha);
    setUnits(entry.units);
    setCalculateMode(entry.calculateMode);
    setShowHistory(false);
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
    <Chakra.Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={{ base: 4, sm: 6 }} align="stretch">
        {/* Formula Card */}
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold">T-Squared Fire Growth Model:</Chakra.Text>
            <Chakra.Text fontSize={{ base: "lg", sm: "xl" }} fontFamily="mono">
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
        <Chakra.Card variant="outline" bg={Chakra.useColorModeValue('gray.50', 'gray.700')}>
          <Chakra.CardBody>
            <Chakra.Text fontSize={{ base: "sm", sm: "md" }} fontWeight="bold" mb={2}>Standard Growth Rate Coefficients:</Chakra.Text>
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
                  // Color based on growth rate
                  const growthColors = {
                    slow: 'green',
                    medium: 'yellow',
                    fast: 'orange',
                    ultrafast: 'red',
                    custom: 'purple'
                  };
                  const growthColor = growthColors[entry.growthRate] || 'gray';
                  
                  return (
                    <Chakra.Box
                      key={entry.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderLeftWidth="4px"
                      borderLeftColor={`${growthColor}.500`}
                      _hover={{ bg: Chakra.useColorModeValue('gray.50', 'gray.700') }}
                      cursor="pointer"
                      onClick={() => loadFromHistory(entry)}
                    >
                      <Chakra.HStack justify="space-between">
                        <Chakra.VStack align="start" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="medium">
                            {entry.result.type}: {entry.result.value.toFixed(2)} {entry.result.unit}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            {entry.timestamp}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.500">
                            Mode: {entry.calculateMode === 'heatRelease' ? 'HRR from time' : 'Time to HRR'}
                          </Chakra.Text>
                        </Chakra.VStack>
                        <Chakra.VStack align="end" spacing={0}>
                          <Chakra.Text fontSize="sm" fontWeight="bold" textTransform="capitalize">
                            {entry.growthRate}
                          </Chakra.Text>
                          <Chakra.Text fontSize="xs" color="gray.600">
                            α = {entry.result.alpha.toFixed(5)} kW/s²
                          </Chakra.Text>
                          {entry.calculateMode === 'time' && entry.result.value && (
                            <Chakra.Text fontSize="xs" color="gray.500">
                              {(entry.result.value / 60).toFixed(1)} min
                            </Chakra.Text>
                          )}
                        </Chakra.VStack>
                      </Chakra.HStack>
                    </Chakra.Box>
                  );
                })}
              </Chakra.VStack>
            </Chakra.CardBody>
          </Chakra.Card>
        )}

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
          )
        )}

        {/* T-Squared Growth Curves Visual */}
        <TSquaredVisual 
          time={time}
          heatRelease={heatRelease}
          growthRate={growthRate}
          calculateMode={calculateMode}
          units={units}
          customAlpha={customAlpha}
        />
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default TSquaredCalculator;