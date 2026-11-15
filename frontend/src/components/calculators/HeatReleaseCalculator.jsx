import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';
import EquationCard from '../EquationCard';
import ResultCard from '../ResultCard';
import { MATERIAL_PROPERTIES, heatReleaseRate, labMassFlux } from '../../calculations/hrr.js';
import ShowWork from '../ShowWork';
import { SendHRRMenu } from '../HrrTransfer';
import { DEFAULT_UNITS, convertInput } from '../../calculations/units.js';

const HeatReleaseCalculator = () => {
  // State declarations
  const [material, setMaterial] = useState('');
  const [burningArea, setBurningArea] = useState('');
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [manualMassFlux, setManualMassFlux] = useState('');
  const [result, setResult] = useState(null);
  const [resultKW, setResultKW] = useState(null);
  const [resultSteps, setResultSteps] = useState(null);
  // Lab helper: work out mass flux from a burn
  const [showLab, setShowLab] = useState(false);
  const [labStart, setLabStart] = useState('');
  const [labEnd, setLabEnd] = useState('');
  const [labTime, setLabTime] = useState('');
  const [labArea, setLabArea] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  // Add this new state for calculation history
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Material table (Quintiere, 2016) and the HRR equation are in
  // src/calculations/hrr.js, where tests check them.

  // Group materials by type
  const groupedMaterials = Object.entries(MATERIAL_PROPERTIES).reduce((acc, [key, value]) => {
    if (!acc[value.type]) {
      acc[value.type] = [];
    }
    acc[value.type].push({ key, ...value });
    return acc;
  }, {});

  const selectedMaterial = material ? MATERIAL_PROPERTIES[material] : null;
const needsMassFluxInput = selectedMaterial && !selectedMaterial.massFlux;


  // Function to save calculation to history
  const saveToHistory = () => {
    if (!result || !material || !burningArea) return;
    
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      material: material,
      materialName: MATERIAL_PROPERTIES[material]?.name,
      burningArea: burningArea,
      units: units,
      massFlux: needsMassFluxInput ? manualMassFlux : MATERIAL_PROPERTIES[material]?.massFlux,
      result: result,
      heatOfCombustion: MATERIAL_PROPERTIES[material]?.heatOfCombustion
    };
    
    // Keep only last 10 calculations
    setCalculationHistory(prev => [newEntry, ...prev].slice(0, 10));
  };

  // Function to load calculation from history
  const loadFromHistory = (entry) => {
    setMaterial(entry.material);
    setBurningArea(entry.burningArea);
    setUnits(entry.units);
    if (entry.massFlux && !MATERIAL_PROPERTIES[entry.material]?.massFlux) {
      setManualMassFlux(entry.massFlux.toString());
    }
    setShowHistory(false);
  };

  // The result is live: it follows the inputs, so it is cleared whenever they are
  // incomplete or give no answer, and never left showing numbers for a different form.
  const clearResult = () => {
    setResult(null);
    setResultKW(null);
    setResultSteps(null);
  };

  // Calculation function
  const calculateHeatRelease = () => {
    if (!material || !burningArea) return clearResult();
    const materialProps = MATERIAL_PROPERTIES[material];
    const r = heatReleaseRate({
      massFlux: materialProps.massFlux || parseFloat(manualMassFlux),
      heatOfCombustion: materialProps.heatOfCombustion,
      area: parseFloat(burningArea),
      units
    });
    if (!r) return clearResult();
    setResult(r.value);
    setResultKW(r.kW);
    setResultSteps(r.steps);
  };

  const lab = labMassFlux({
    initialMass: parseFloat(labStart),
    finalMass: parseFloat(labEnd),
    time: parseFloat(labTime),
    area: parseFloat(labArea),
    units
  });

  const labField = (label, value, setValue, unit) => (
    <Chakra.FormControl>
      <Chakra.FormLabel fontSize="sm">{label}</Chakra.FormLabel>
      <Chakra.NumberInput size="sm" value={value} onChange={(vs) => setValue(vs)} min={0}>
        <Chakra.NumberInputField inputMode="decimal" />
      </Chakra.NumberInput>
      <Chakra.Text fontSize="xs" color="fd.muted">{unit}</Chakra.Text>
    </Chakra.FormControl>
  );

  // Switching units converts what's already entered (mass flux is always g/m²-s)
  const handleUnitsChange = (newUnits) => {
    if (newUnits === units) return;
    setBurningArea(prev => convertInput(prev, 'area', newUnits === 'imperial'));
    setLabArea(prev => convertInput(prev, 'area', newUnits === 'imperial', 4));
    setUnits(newUnits);
  };

  const copyResults = () => {
  if (!result) return;
  
  const materialName = MATERIAL_PROPERTIES[material]?.name || 'Unknown';
  
  let copyText = `Fire Dynamics Calculator - Heat Release Rate\n`;
  copyText += `Date: ${new Date().toLocaleString()}\n`;
  copyText += `Method: Q̇ = ṁ" × A × ΔHc\n\n`;
  copyText += `Result: ${result.toFixed(2)} ${units === 'SI' ? 'kW' : `BTU/s (${resultKW.toFixed(2)} kW)`}\n\n`;
  copyText += `Input Parameters:\n`;
  copyText += `- Material: ${materialName}\n`;
  copyText += `- Burning Area: ${burningArea} ${units === 'SI' ? 'm²' : 'ft²'}\n`;
  
  if (needsMassFluxInput && manualMassFlux) {
    copyText += `- Mass Flux: ${manualMassFlux} g/m²-s\n`;
  } else if (MATERIAL_PROPERTIES[material]?.massFlux) {
    copyText += `- Mass Flux: ${MATERIAL_PROPERTIES[material].massFlux} g/m²-s\n`;
  }
  copyText += `- Heat of Combustion: ${MATERIAL_PROPERTIES[material].heatOfCombustion} kJ/g\n`;
  
  navigator.clipboard.writeText(copyText).then(() => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  });
};

  useEffect(() => {
    if (material && burningArea && (MATERIAL_PROPERTIES[material]?.massFlux || manualMassFlux)) {
      calculateHeatRelease();
    } else {
      clearResult();
    }
  }, [material, burningArea, manualMassFlux, units]);
  
  return (
    <Chakra.Box p={{ base: 4, sm: 6 }} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <EquationCard
          title="Heat Release Rate Equation:"
          equation={<>Q̇ = ṁ" × A × ΔHc</>}
        >
          <Chakra.Text fontSize="sm" color="fd.muted" mt={2}>
            Where:
            <br />
            Q̇ = Heat release rate (kW or BTU/s)
            <br />
            ṁ" = Mass loss rate per unit area (g/m²-s)
            <br />
            A = Burning area (m² or ft²)
            <br />
            ΔHc = Heat of combustion (kJ/g)
          </Chakra.Text>
          <Chakra.Text fontSize="sm" color="fd.muted" mt={3} fontStyle="italic">
            Note: Built-in mass flux values (Quintiere, 2016) are typical for well-developed, free-burning fires. Smaller pools and spills (roughly 2 m / 6 ft across or less) burn more slowly, so this simple equation can overestimate their heat release rate. NUREG-1805 adds a small-pool correction, (1 − e^−kβD), that this calculator leaves out.
          </Chakra.Text>
        </EquationCard>

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Material</Chakra.FormLabel>
          <Chakra.Select
            placeholder="Select material"
            value={material}
            onChange={(e) => {
              setMaterial(e.target.value);
              setResult(null);
              setManualMassFlux('');
            }}

          >
            {Object.entries(groupedMaterials).map(([type, materials]) => (
              <optgroup key={type} label={type}>
                {materials.map((mat) => (
                  <option key={mat.key} value={mat.key}>
                    {mat.name} {!mat.massFlux ? '(Requires mass flux input)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </Chakra.Select>
        </Chakra.FormControl>

        {needsMassFluxInput ? (
  <Chakra.FormControl isRequired>
    <Chakra.FormLabel>Mass Flux Rate</Chakra.FormLabel>
    <Chakra.NumberInput
      value={manualMassFlux}
      onChange={(vs) => setManualMassFlux(vs)}
      min={0}
    >
      <Chakra.NumberInputField inputMode="decimal" />
    </Chakra.NumberInput>
    <Chakra.Text fontSize="sm" color="fd.muted">g/m²-s</Chakra.Text>
  </Chakra.FormControl>
) : null}

        {needsMassFluxInput && (
          <Chakra.Box borderWidth="1px" borderRadius="md" p={3}>
            <Chakra.Button size="sm" variant="link" colorScheme="blue" onClick={() => setShowLab(!showLab)}>
              {showLab ? 'Hide lab helper' : 'Calculate mass flux from a lab burn'}
            </Chakra.Button>
            {showLab && (
              <Chakra.VStack align="stretch" spacing={3} mt={3}>
                <Chakra.Text fontSize="sm" color="fd.muted">
                  Weigh the sample before and after burning, time the burn, and measure the burning surface.
                </Chakra.Text>
                <Chakra.SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {labField('Starting mass', labStart, setLabStart, 'g')}
                  {labField('Ending mass', labEnd, setLabEnd, 'g')}
                  {labField('Burn time', labTime, setLabTime, 'seconds')}
                  {labField('Sample burning area', labArea, setLabArea, units === 'SI' ? 'm²' : 'ft²')}
                </Chakra.SimpleGrid>
                {lab?.error && (
                  <Chakra.Alert status="warning" size="sm"><Chakra.AlertIcon />{lab.error}</Chakra.Alert>
                )}
                {lab?.massFlux > 0 && (
                  <>
                    <Chakra.HStack justify="space-between" flexWrap="wrap" gap={2}>
                      <Chakra.Text fontWeight="bold">ṁ″ = {lab.massFlux.toFixed(2)} g/m²-s</Chakra.Text>
                      <Chakra.Button size="sm" colorScheme="blue" onClick={() => setManualMassFlux(lab.massFlux.toFixed(2))}>
                        Use this mass flux
                      </Chakra.Button>
                    </Chakra.HStack>
                    <ShowWork steps={lab.steps} title="Show the work (lab)" />
                  </>
                )}
              </Chakra.VStack>
            )}
          </Chakra.Box>
        )}

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Burning Area</Chakra.FormLabel>
          <Chakra.NumberInput
            value={burningArea}
            onChange={(vs) => setBurningArea(vs)}
            min={0}
          >
            <Chakra.NumberInputField inputMode="decimal" />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="fd.muted">
            {units === 'SI' ? 'm²' : 'ft²'}
          </Chakra.Text>
        </Chakra.FormControl>

        <Chakra.FormControl>
          <Chakra.FormLabel>Units</Chakra.FormLabel>
          <Chakra.VStack align="start" spacing={2}>
            <Chakra.RadioGroup 
              value={units} 
              onChange={handleUnitsChange}
            >
              <Chakra.HStack spacing={4}>
                <Chakra.Radio value="SI">SI (m², kW)</Chakra.Radio>
                <Chakra.Radio value="imperial">Imperial (ft², BTU/s)</Chakra.Radio>
              </Chakra.HStack>
            </Chakra.RadioGroup>
            
            <Chakra.Text fontSize="xs" color="fd.muted">
              Switching units converts the values already entered.
            </Chakra.Text>
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
                {calculationHistory.map((entry) => (
                  <Chakra.Box
                    key={entry.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    _hover={{ bg: Chakra.useColorModeValue('gray.50', 'gray.700') }}
                    cursor="pointer"
                    onClick={() => loadFromHistory(entry)}
                  >
                    <Chakra.HStack justify="space-between">
                      <Chakra.VStack align="start" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="medium">
                          {entry.materialName}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="fd.muted">
                          {entry.timestamp}
                        </Chakra.Text>
                      </Chakra.VStack>
                      <Chakra.VStack align="end" spacing={0}>
                        <Chakra.Text fontSize="sm" fontWeight="bold">
                          {entry.result.toFixed(0)} {entry.units === 'SI' ? 'kW' : 'BTU/s'}
                        </Chakra.Text>
                        <Chakra.Text fontSize="xs" color="fd.muted">
                          {entry.burningArea} {entry.units === 'SI' ? 'm²' : 'ft²'}
                        </Chakra.Text>
                      </Chakra.VStack>
                    </Chakra.HStack>
                  </Chakra.Box>
                ))}
              </Chakra.VStack>
            </Chakra.CardBody>
          </Chakra.Card>
        )}

        

        {result && (
          <ResultCard
            stats={[{
              label: 'Heat Release Rate',
              value: result.toFixed(0),
              unit: units === 'SI' ? 'kW' : 'BTU/s',
              note: units === 'SI' ? null : `(${resultKW.toFixed(0)} kW)`,
            }]}
            details={(
              <>
                {material && (
                  <Chakra.Text>
                    Using {MATERIAL_PROPERTIES[material].name} with:
                    <br />
                    Mass Flux: {needsMassFluxInput ? manualMassFlux : MATERIAL_PROPERTIES[material].massFlux} g/m²-s
                    <br />
                    Heat of Combustion: {MATERIAL_PROPERTIES[material].heatOfCombustion} kJ/g
                  </Chakra.Text>
                )}
                <Chakra.Text color="fd.muted" mt={2}>
                  Conversion: 1 kW = 0.947817 BTU/s
                </Chakra.Text>
              </>
            )}
            onCopy={copyResults}
            copySuccess={copySuccess}
            onSave={saveToHistory}
            actions={<SendHRRMenu kW={resultKW} from="Heat Release Rate" />}
          />
        )}
        {result && <ShowWork steps={resultSteps} />}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default HeatReleaseCalculator;