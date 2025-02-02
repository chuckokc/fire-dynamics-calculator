import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';

const HeatReleaseCalculator = () => {
  // State declarations
  const [material, setMaterial] = useState('');
  const [burningArea, setBurningArea] = useState('');
  const [units, setUnits] = useState('imperial');
  const [manualMassFlux, setManualMassFlux] = useState('');
  const [result, setResult] = useState(null);

  // Update this section in your MATERIAL_PROPERTIES
const MATERIAL_PROPERTIES = {
    
    // Liquids with both heat of combustion and mass flux
    'liquefied_propane': { type: 'Liquids', name: 'Liquefied Propane', heatOfCombustion: 46.5, massFlux: 115.0 },
    'liquefied_natural_gas': { type: 'Liquids', name: 'Liquefied Natural Gas', heatOfCombustion: 50.0, massFlux: 90.0 },
    'benzene': { type: 'Liquids', name: 'Benzene', heatOfCombustion: 40.0, massFlux: 90.0 },
    'butane': { type: 'Liquids', name: 'Butane', heatOfCombustion: 45.7, massFlux: 80.0 },
    'hexane': { type: 'Liquids', name: 'Hexane', heatOfCombustion: 43.8, massFlux: 75.0 },
    'xylene': { type: 'Liquids', name: 'Xylene', heatOfCombustion: 40.0, massFlux: 70.0 },
    'jp-4': { type: 'Liquids', name: 'JP-4', heatOfCombustion: 43.2, massFlux: 60.0 },
    'heptane': { type: 'Liquids', name: 'Heptane', heatOfCombustion: 44.6, massFlux: 70.0 },
    'gasoline': { type: 'Liquids', name: 'Gasoline', heatOfCombustion: 43.7, massFlux: 55.0 },
    'acetone': { type: 'Liquids', name: 'Acetone', heatOfCombustion: 30.8, massFlux: 40.0 },
    'methanol': { type: 'Liquids', name: 'Methanol', heatOfCombustion: 19.8, massFlux: 22.0 },
    'kerosene': { type: 'Liquids', name: 'Kerosene', heatOfCombustion: 43.2 },
    'ethanol': { type: 'Liquids', name: 'Ethanol', heatOfCombustion: 26.8 },
    
    // Polymers and Solids
    'hdpe': { type: 'Polymers', name: 'High-density Polyethylene (HDPE)', heatOfCombustion: 40.0 },
    'polyethylene': { type: 'Polymers', name: 'Polyethylene', heatOfCombustion: 43.4 },
    'polypropylene': { type: 'Polymers', name: 'Polypropylene', heatOfCombustion: 44.0 },
    'polystyrene': { type: 'Polymers', name: 'Polystyrene', heatOfCombustion: 35.8 },
    'polystyrene_granular': { type: 'Polymers', name: 'Polystyrene (Granular)', heatOfCombustion: 35.8, massFlux: 38.0 },
    'pmma_granular': { type: 'Polymers', name: 'PMMA (Granular)', heatOfCombustion: 24.2, massFlux: 28.0 },
    'polyethylene_granular': { type: 'Polymers', name: 'Polyethylene (Granular)', heatOfCombustion: 43.4, massFlux: 26.0 },
    'polypropylene_granular': { type: 'Polymers', name: 'Polypropylene (Granular)', heatOfCombustion: 44.0, massFlux: 24.0 },
    'nylon': { type: 'Polymers', name: 'Nylon', heatOfCombustion: 27.9 },
    'nylon_6': { type: 'Polymers', name: 'Nylon 6', heatOfCombustion: 28.8 },
    'abs': { type: 'Polymers', name: 'ABS', heatOfCombustion: 30.0 },
    'abs_fr': { type: 'Polymers', name: 'ABS-FR', heatOfCombustion: 11.7 },
    'rigid_polyurethane_foam': { type: 'Polymers', name: 'Rigid Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 23.5 },
    'flexible_polyurethane_foam': { type: 'Polymers', name: 'Flexible Polyurethane Foam', heatOfCombustion: 22.3, massFlux: 24.0 },
    'pvc_granular': { type: 'Polymers', name: 'PVC (Granular)', heatOfCombustion: 10.0, massFlux: 16.0 },
    
    // Woods and Cellulosics
    'corrugated_paper': { type: 'Woods', name: 'Corrugated Paper', heatOfCombustion: 13.2, massFlux: 14.0 },
    'wood_crib': { type: 'Woods', name: 'Wood Crib', heatOfCombustion: 14.7, massFlux: 11.0 },
    'douglas_fir': { type: 'Woods', name: 'Douglas Fir', heatOfCombustion: 14.7 },
    'hemlock': { type: 'Woods', name: 'Hemlock', heatOfCombustion: 13.3 },
    'plywood': { type: 'Woods', name: 'Plywood', heatOfCombustion: 11.9 },
    'plywood_fr': { type: 'Woods', name: 'Plywood FR', heatOfCombustion: 11.2 }
  };

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

  // Unit conversion function
  const convertArea = (value, toImperial) => {
    if (!value) return '';
    const numVal = parseFloat(value);
    if (toImperial) {
      return (numVal * 10.7639).toFixed(2); // m² to ft²
    }
    return (numVal * 0.092903).toFixed(2);   // ft² to m²
  };

  // Calculation function
  const calculateHeatRelease = () => {
    if (!material || !burningArea) return;

    const materialProps = MATERIAL_PROPERTIES[material];
    
    // Convert area to SI for calculations
    let calculationArea = parseFloat(burningArea);
    if (units === 'imperial') {
      calculationArea = calculationArea * 0.092903; // Convert ft² to m²
    }

    // Get mass flux rate
    const massFlux = materialProps.massFlux || parseFloat(manualMassFlux);
    if (!massFlux) return;

    // Calculate heat release rate
    const massLossRate = massFlux / 1000;
    const heatReleaseRate = massLossRate * calculationArea * materialProps.heatOfCombustion * 1000;

    let finalResult = heatReleaseRate;
    if (units === 'imperial') {
      finalResult = heatReleaseRate * 0.947817;
    }

    setResult(finalResult);
  };

  useEffect(() => {
    if (material && burningArea && (MATERIAL_PROPERTIES[material]?.massFlux || manualMassFlux)) {
      calculateHeatRelease();
    }
  }, [material, burningArea, manualMassFlux, units]);
  console.log({
    selectedMaterial,
    needsMassFluxInput,
    material,
    hasMassFlux: selectedMaterial?.massFlux
  });

  return (
    <Chakra.Box p={6} maxW="2xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <Chakra.Card variant="outline">
          <Chakra.CardBody>
            <Chakra.Text fontSize="lg" fontWeight="bold">Heat Release Rate Equation:</Chakra.Text>
            <Chakra.Text fontSize="xl" fontFamily="mono">
              Q̇ = ṁ" × A × ΔHc
            </Chakra.Text>
            <Chakra.Text fontSize="sm" color="gray.600" mt={2}>
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
          </Chakra.CardBody>
        </Chakra.Card>

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
      <Chakra.NumberInputField />
    </Chakra.NumberInput>
    <Chakra.Text fontSize="sm" color="gray.600">g/m²-s</Chakra.Text>
  </Chakra.FormControl>
) : null}

        <Chakra.FormControl isRequired>
          <Chakra.FormLabel>Burning Area</Chakra.FormLabel>
          <Chakra.NumberInput
            value={burningArea}
            onChange={(vs) => setBurningArea(vs)}
            min={0}
          >
            <Chakra.NumberInputField />
          </Chakra.NumberInput>
          <Chakra.Text fontSize="sm" color="gray.600">
            {units === 'SI' ? 'm²' : 'ft²'}
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
                <Chakra.Radio value="SI">SI (m², kW)</Chakra.Radio>
                <Chakra.Radio value="imperial">Imperial (ft², BTU/s)</Chakra.Radio>
              </Chakra.HStack>
            </Chakra.RadioGroup>
            
            <Chakra.Button 
              size="sm" 
              colorScheme="blue" 
              onClick={() => {
                const newUnits = units === 'SI' ? 'imperial' : 'SI';
                setBurningArea(prev => convertArea(prev, units === 'SI'));
                setUnits(newUnits);
              }}
            >
              Convert Current Measurements to {units === 'SI' ? 'Imperial' : 'SI'} Units
            </Chakra.Button>
          </Chakra.VStack>
        </Chakra.FormControl>

        <Chakra.Button
          colorScheme="blue"
          onClick={calculateHeatRelease}
          isDisabled={!material || !burningArea || (needsMassFluxInput && !manualMassFlux)}
        >
          Calculate Heat Release Rate
        </Chakra.Button>

        {result && (
          <Chakra.Alert status="success">
            <Chakra.AlertIcon />
            <Chakra.VStack align="start" spacing={2}>
              <Chakra.Text fontWeight="bold">
                Heat Release Rate: {result.toFixed(0)} {units === 'SI' ? 'kW' : 'BTU/s'}
              </Chakra.Text>
              {material && (
                <Chakra.Text fontSize="sm">
                  Using {MATERIAL_PROPERTIES[material].name} with:
                  <br />
                  Mass Flux: {needsMassFluxInput ? manualMassFlux : MATERIAL_PROPERTIES[material].massFlux} g/m²-s
                  <br />
                  Heat of Combustion: {MATERIAL_PROPERTIES[material].heatOfCombustion} kJ/g
                </Chakra.Text>
              )}
              <Chakra.Text fontSize="sm" color="gray.600">
                Conversion: 1 kW = 0.947817 BTU/s
              </Chakra.Text>
            </Chakra.VStack>
          </Chakra.Alert>
        )}
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default HeatReleaseCalculator;