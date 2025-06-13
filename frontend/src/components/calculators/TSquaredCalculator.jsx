// frontend/src/components/calculators/TSquaredCalculator.jsx

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
  Card,
  CardBody,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';


const TSquaredVisual = ({ time, heatRelease, growthRate, calculateMode, units, customAlpha }) => {
    const bgColor = useColorModeValue('gray.50', 'gray.700');
    const boxBgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('black', 'white');
    const gridColor = useColorModeValue('gray.200', 'gray.600');
    const coefficients = {
        slow: { alpha: 0.00293, color: '#48BB78' },
        medium: { alpha: 0.01172, color: '#ECC94B' },
        fast: { alpha: 0.0469, color: '#ED8936' },
        ultrafast: { alpha: 0.1876, color: '#E53E3E' }
    };

    if (growthRate === 'custom' && customAlpha) {
        let alphaValue = parseFloat(customAlpha) || 0;
        if (units === 'imperial' && alphaValue > 0) {
            alphaValue = alphaValue * 1.055056;
        }
        coefficients.custom = { alpha: alphaValue, color: '#805AD5' };
    }

    let currentTime = parseFloat(time) || 0;
    let currentHRR = parseFloat(heatRelease) || 0;
    if (units === 'imperial' && currentHRR > 0) {
        currentHRR = currentHRR * 1.055056;
    }

    const currentCoeff = coefficients[growthRate];
    if (calculateMode === 'time' && currentHRR > 0 && currentCoeff) {
        currentTime = Math.sqrt(currentHRR / currentCoeff.alpha);
    } else if (calculateMode === 'heatRelease' && currentTime > 0 && currentCoeff) {
        currentHRR = currentCoeff.alpha * currentTime * currentTime;
    }

    const graphWidth = 400;
    const graphHeight = 300;
    const padding = 50;
    const plotWidth = graphWidth - 2 * padding;
    const plotHeight = graphHeight - 2 * padding;
    let maxTime = Math.max(600, currentTime * 1.2);
    let maxHRR = Math.max(1000, currentHRR * 1.2);

    return (
        <Box p={4} bg={bgColor} borderRadius="md">
            <Text fontWeight="bold" mb={3}>Fire Growth Curves</Text>
            <Box bg={boxBgColor} borderRadius="md" p={{ base: 2, sm: 4 }}>
                <Box w="100%" overflowX="auto">
                    <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} style={{ width: '100%', maxWidth: '400px', height: 'auto', display: 'block', margin: '0 auto', minWidth: '300px' }} preserveAspectRatio="xMidYMid meet">
                        <g opacity="0.2">
                            {[0, 1, 2, 3, 4, 5].map(i => <line key={`v-${i}`} x1={padding + (i / 5) * plotWidth} y1={padding} x2={padding + (i / 5) * plotWidth} y2={padding + plotHeight} stroke={gridColor} strokeWidth="1" />)}
                            {[0, 1, 2, 3, 4, 5].map(i => <line key={`h-${i}`} x1={padding} y1={padding + (i / 5) * plotHeight} x2={padding + plotWidth} y2={padding + (i / 5) * plotHeight} stroke={gridColor} strokeWidth="1" />)}
                        </g>
                        {Object.entries(coefficients).filter(([rate]) => rate !== 'custom' || growthRate === 'custom').map(([rate, config]) => {
                            const points = [];
                            for (let t = 0; t <= maxTime; t += maxTime / 100) {
                                const hrr = config.alpha * t * t;
                                if (hrr <= maxHRR) {
                                    points.push(`${(padding + (t / maxTime) * plotWidth).toFixed(1)},${(padding + plotHeight - (hrr / maxHRR) * plotHeight).toFixed(1)}`);
                                }
                            }
                            if (points.length === 0) return null;
                            const pathData = `M ${points.join(' L ')}`;
                            return (<path key={rate} d={pathData} stroke={config.color} strokeWidth={rate === growthRate ? "3" : "2"} fill="none" opacity={rate === growthRate ? 1 : 0.4} />);
                        })}
                        <line x1={padding} y1={padding + plotHeight} x2={padding + plotWidth} y2={padding + plotHeight} stroke={textColor} strokeWidth="2" />
                        <line x1={padding} y1={padding} x2={padding} y2={padding + plotHeight} stroke={textColor} strokeWidth="2" />
                        {currentTime > 0 && currentHRR > 0 && currentCoeff && (<circle cx={padding + (currentTime / maxTime) * plotWidth} cy={padding + plotHeight - (currentHRR / maxHRR) * plotHeight} r="6" fill={currentCoeff.color} stroke="black" strokeWidth="2" />)}
                        <text x={graphWidth / 2} y={graphHeight - 5} textAnchor="middle" fontSize="12" fill={textColor}>Time (seconds)</text>
                        <text x={15} y={graphHeight / 2} textAnchor="middle" fontSize="12" fill={textColor} transform={`rotate(-90 15 ${graphHeight / 2})`}>HRR (kW)</text>
                        {[0, 1, 2, 3, 4, 5].map(i => <text key={`t-${i}`} x={padding + (i / 5) * plotWidth} y={padding + plotHeight + 15} textAnchor="middle" fontSize="10" fill={textColor}>{(i / 5 * maxTime).toFixed(0)}</text>)}
                        {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => <text key={`hrr-${i}`} x={padding - 5} y={padding + plotHeight - fraction * plotHeight + 4} textAnchor="end" fontSize="10" fill={textColor}>{((fraction * maxHRR) >= 1000 ? `${(fraction * maxHRR / 1000).toFixed(1)}MW` : (fraction * maxHRR).toFixed(0))}</text>)}
                    </svg>
                </Box>
                <HStack spacing={{ base: 2, sm: 4 }} mt={4} justify="center" flexWrap="wrap">
                    {Object.entries(coefficients).filter(([rate]) => rate !== 'custom' || growthRate === 'custom').map(([rate, config]) => (<HStack key={rate} spacing={1}><Box w="20px" h="3px" bg={config.color} opacity={rate === growthRate ? 1 : 0.4} /><Text fontSize={{ base: "xs", sm: "xs" }} fontWeight={rate === growthRate ? "bold" : "normal"} textTransform="capitalize">{rate}</Text></HStack>))}
                </HStack>
            </Box>
        </Box>
    );
};


const TSquaredCalculator = () => {
    const [time, setTime] = useState('180');
    const [heatRelease, setHeatRelease] = useState('');
    const [growthRate, setGrowthRate] = useState('medium');
    const [customAlpha, setCustomAlpha] = useState('');
    const [units, setUnits] = useState('SI');
    const [calculateMode, setCalculateMode] = useState('heatRelease');

    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const convertHeatRelease = (value, toImperial) => {
        if (!value) return '';
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return '';
        return (numVal * (toImperial ? 0.947817 : 1.055056)).toFixed(2);
    };

    const convertAlpha = (value, toImperial) => {
        if (!value) return '';
        const numVal = parseFloat(value);
        if (isNaN(numVal)) return '';
        const factor = 0.947817; // Same as HRR
        return (numVal * (toImperial ? factor : 1 / factor)).toFixed(6);
    };
    
    const handleUnitChange = (newUnit) => {
        if (newUnit === units) return;
        const toImperial = newUnit === 'imperial';
        setResult(null);

        setHeatRelease(prev => convertHeatRelease(prev, toImperial));
        if (growthRate === 'custom') {
            setCustomAlpha(prev => convertAlpha(prev, toImperial));
        }

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
                body: JSON.stringify({ calculateMode, units, growthRate, customAlpha, time, heatRelease }),
            });
            const data = await response.json();
            if (!response.ok) {
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

    let displayResult = null;
    let displayUnit = '';
    let resultType = '';

    if (result) {
        displayResult = result.value;
        if (calculateMode === 'heatRelease') {
            resultType = 'Heat Release Rate';
            displayUnit = units === 'SI' ? 'kW' : 'BTU/s';
        } else if (calculateMode === 'time') {
            resultType = 'Time to HRR';
            displayUnit = 's';
        }
    }

    return (
        <Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
            <VStack spacing={{ base: 4, sm: 6 }} align="stretch">
                <Card variant="outline">
                    <CardBody><Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold">T-Squared Fire Growth Model:</Text><Text fontSize={{ base: "lg", sm: "xl" }} fontFamily="mono">Q = αt²</Text></CardBody>
                </Card>

                <FormControl>
                    <FormLabel>Calculate:</FormLabel>
                    <Select value={calculateMode} onChange={(e) => { setResult(null); setCalculateMode(e.target.value);}}>
                        <option value="heatRelease">Heat Release Rate (from time)</option>
                        <option value="time">Time (to reach specific HRR)</option>
                    </Select>
                </FormControl>

                <FormControl>
                    <FormLabel>Fire Growth Rate:</FormLabel>
                    <Select value={growthRate} onChange={(e) => setGrowthRate(e.target.value)}>
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                        <option value="ultrafast">Ultra-fast</option>
                        <option value="custom">Custom</option>
                    </Select>
                </FormControl>

                {growthRate === 'custom' && (
                    <FormControl isRequired>
                        <FormLabel>Custom α ({units === 'SI' ? 'kW/s²' : 'BTU/s³'})</FormLabel>
                        <Input type="number" value={customAlpha} onChange={(e) => setCustomAlpha(e.target.value)} />
                    </FormControl>
                )}

                {calculateMode === 'heatRelease' ? (
                    <FormControl isRequired>
                        <FormLabel>Time (seconds)</FormLabel>
                        <Input type="number" value={time} onChange={(e) => setTime(e.target.value)} />
                    </FormControl>
                ) : (
                    <FormControl isRequired>
                        <FormLabel>Target HRR ({units === 'SI' ? 'kW' : 'BTU/s'})</FormLabel>
                        <Input type="number" value={heatRelease} onChange={(e) => setHeatRelease(e.target.value)} />
                    </FormControl>
                )}

                <FormControl>
                    <FormLabel>Units</FormLabel>
                    <RadioGroup onChange={handleUnitChange} value={units}>
                        <HStack spacing={4}><Radio value="SI">SI (kW)</Radio><Radio value="imperial">Imperial (BTU/s)</Radio></HStack>
                    </RadioGroup>
                </FormControl>

                <Button onClick={handleCalculate} isLoading={isLoading} colorScheme="blue">Calculate</Button>

                {displayResult !== null && (
                    <Alert status="success" borderRadius="md">
                        <AlertIcon />
                        <Text><b>{resultType}:</b> {parseFloat(displayResult).toFixed(2)} {displayUnit}</Text>
                    </Alert>
                )}

                <TSquaredVisual time={time} heatRelease={heatRelease} growthRate={growthRate} calculateMode={calculateMode} units={units} customAlpha={customAlpha} />
            </VStack>
        </Box>
    );
};

export default TSquaredCalculator;