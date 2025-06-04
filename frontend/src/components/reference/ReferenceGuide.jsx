import React from 'react';
import * as Chakra from '@chakra-ui/react';

const ReferenceGuide = () => {
  // Defining table data
  const peakHRRData = [
    { fuel: 'Trash bag, 42 L (11 gal) with mixed plastic and paper trash', weightKg: '1.1-3.4', weightLb: '2½-7½', peakHRR: '140-350' },
    { fuel: 'Cotton mattress', weightKg: '11.8-13.2', weightLb: '26-29', peakHRR: '40-970' },
    { fuel: 'Trash bag/paper trash', weightKg: '1.2-14.1', weightLb: '2.6-31', peakHRR: '120-350' },
    { fuel: 'PVC waiting room chair, metal frame', weightKg: '15.4', weightLb: '34', peakHRR: '270' },
    { fuel: 'Cotton easy chair', weightKg: '17.7-31.8', weightLb: '39-70', peakHRR: '290-370' },
    { fuel: 'Christmas tree, dry', weightKg: '20-Jun', weightLb: '13-44', peakHRR: '3000-5000' },
    { fuel: 'Polyurethane mattress', weightKg: '3.2-14.1', weightLb: '31-Jul', peakHRR: '810-2630' },
    { fuel: 'Polyurethane easy chair', weightKg: '12.2-27.7', weightLb: '27-61', peakHRR: '1350-1990' },
    { fuel: 'Polyurethane sofa', weightKg: '51.3', weightLb: '113', peakHRR: '3120' }
  ];

  const steadyStateHRRData = [
    { fuel: 'Burning cigarette', hrr: '5 W' },
    { fuel: 'Typical light bulb', hrr: '60 W' },
    { fuel: 'Burning candle', hrr: '80 W' },
    { fuel: 'Human being at normal exertion', hrr: '100 W' },
    { fuel: 'Burning wastepaper basket', hrr: '100 kW' },
    { fuel: 'Burning 1 m² pool of gasoline', hrr: '2.5 MW' },
    { fuel: 'Burning wood pallets, stacked to a height of 3 m', hrr: '7 MW' },
    { fuel: 'Burning polystyrene, 4.9 m high in 2 m² cartons', hrr: '30-40 MW' }
  ];

  const massFluxData = [
    { fuel: 'Liquefied propane', massFlux: '100-130' },
    { fuel: 'Liquefied natural gas', massFlux: '80-100' },
    { fuel: 'Benzene', massFlux: '90' },
    { fuel: 'Butane', massFlux: '80' },
    { fuel: 'Hexane', massFlux: '70-80' },
    { fuel: 'Xylene', massFlux: '70' },
    { fuel: 'JP-4', massFlux: '50-70' },
    { fuel: 'Heptane', massFlux: '65-75' },
    { fuel: 'Gasoline', massFlux: '50-60' },
    { fuel: 'Acetone', massFlux: '40' },
    { fuel: 'Methanol', massFlux: '22' },
    { fuel: 'Polystyrene (granular)', massFlux: '38' },
    { fuel: 'Polymethyl methacrylate (granular)', massFlux: '28' },
    { fuel: 'Polyethylene (granular)', massFlux: '26' },
    { fuel: 'Polypropylene (granular)', massFlux: '24' },
    { fuel: 'Rigid polyurethane foam', massFlux: '22-25' },
    { fuel: 'Flexible polyurethane foam', massFlux: '21-27' },
    { fuel: 'Polyvinyl chloride (granular)', massFlux: '16' },
    { fuel: 'Corrugated paper cartons', massFlux: '14' },
    { fuel: 'Wood crib', massFlux: '11' }
  ];

  const materialProperties = {
    gases: [
      { material: 'Methane', heatOfCombustion: '50' },
      { material: 'Ethane', heatOfCombustion: '47.5' },
      { material: 'Ethene', heatOfCombustion: '50.4' },
      { material: 'Propane', heatOfCombustion: '46.5' },
      { material: 'Carbon monoxide', heatOfCombustion: '10.1' }
    ],
    liquids: [
      { material: 'n-Butane', heatOfCombustion: '45.7' },
      { material: 'n-Hexane', heatOfCombustion: '43.8' },
      { material: 'Heptane', heatOfCombustion: '44.6' },
      { material: 'Gasoline', heatOfCombustion: '43.7' },
      { material: 'Kerosene', heatOfCombustion: '43.2' },
      { material: 'Benzene', heatOfCombustion: '40' },
      { material: 'Acetone', heatOfCombustion: '30.8' },
      { material: 'Ethanol', heatOfCombustion: '26.8' },
      { material: 'Methanol', heatOfCombustion: '19.8' }
    ],
    polymers: [
      { material: 'High-density polyethylene, HDPE', heatOfCombustion: '40' },
      { material: 'Polyethylene, PE', heatOfCombustion: '43.4' },
      { material: 'Polypropylene, PP', heatOfCombustion: '44' },
      { material: 'Polystyrene, PS', heatOfCombustion: '35.8' },
      { material: 'Nylon', heatOfCombustion: '27.9' },
      { material: 'Nylon 6', heatOfCombustion: '28.8' },
      { material: 'Polyoxymethylene, POM', heatOfCombustion: '13.4' },
      { material: 'Polymethylmethacrylate, PMMA', heatOfCombustion: '24.2' },
      { material: 'Polybutylene terephthalate, PBT', heatOfCombustion: '20.9' },
      { material: 'Acrylonitrile-butadiene-styrene, ABS', heatOfCombustion: '30' },
      { material: 'ABS-FR', heatOfCombustion: '11.7' },
      { material: 'Polyurethane, PU foam', heatOfCombustion: '18.4-26.3' },
      { material: 'Polyvinylchloride, PVC', heatOfCombustion: '9-11' },
      { material: 'Chlorinated PVC', heatOfCombustion: '5.8' }
    ],
    composites: [
      { material: 'Polyester/glass fibers (30%)', heatOfCombustion: '16' },
      { material: 'Polyvinyl ester', heatOfCombustion: '22' },
      { material: 'Epoxy', heatOfCombustion: '25' },
      { material: 'Epoxy/glass fibers (69%)', heatOfCombustion: '27.5' },
      { material: 'Douglas fir', heatOfCombustion: '14.7' },
      { material: 'Hemlock', heatOfCombustion: '13.3' },
      { material: 'Plywood', heatOfCombustion: '11.9' },
      { material: 'Plywood, FR', heatOfCombustion: '11.2' },
      { material: 'Chipboard, FR', heatOfCombustion: '9.2' }
    ]
  };

  // T-Squared Fire Growth Data
  const tSquaredGrowthRates = [
    { category: 'Slow', coefficient: '0.00293', time1MW: '600', examples: 'Densely packed wood products, mail bags' },
    { category: 'Medium', coefficient: '0.01172', time1MW: '300', examples: 'Cotton/polyester mattress, thick wood furniture' },
    { category: 'Fast', coefficient: '0.0469', time1MW: '150', examples: 'Plastic trash bags, PE/PVC bottles, PU mattress' },
    { category: 'Ultra-fast', coefficient: '0.1876', time1MW: '75', examples: 'High rack storage, thin wood (plywood), foam plastics' }
  ];

  const fireGrowthTimes = [
    { item: 'Wood pallets, stacked 1½ ft high (6-12% moisture)', growthTime: '160-320' },
    { item: 'Wood pallets, stacked 5 ft high (6-12% moisture)', growthTime: '95-190' },
    { item: 'Wood pallets, stacked 10 ft high (6-12% moisture)', growthTime: '80-120' },
    { item: 'Wood pallets, stacked 16 ft high (6-12% moisture)', growthTime: '75-120' },
    { item: 'Mail bags, filled, stored 5 ft high', growthTime: '190' },
    { item: 'Cartons, compartmented, stacked 15 ft high', growthTime: '60' },
    { item: 'Paper, vertical rolls, stacked 20 ft high', growthTime: '17-27' },
    { item: 'Cotton (also Pe, Pe/Cot Acrylic/Nylon/Pe), garments in 12-ft-high rack', growthTime: '22-43' },
    { item: '"Ordinary combustibles" rack storage, 15-30 ft high', growthTime: '40-270' },
    { item: 'Paper products, densely packed in cartons, rack storage, 20 ft high', growthTime: '470' },
    { item: 'PE letter trays, filled, stacked 5 ft high on cart', growthTime: '190' },
    { item: 'PE trash barrels in cartons, stacked 15 ft high', growthTime: '55' },
    { item: 'FRP shower stalls in cartons, stacked 15 ft high', growthTime: '85' },
    { item: 'PE bottles packed in Item 6', growthTime: '85' },
    { item: 'PE bottles in cartons, stacked 15 ft high', growthTime: '75' },
    { item: 'PE pallets, stacked 3 ft high', growthTime: '150' },
    { item: 'PE pallets, stacked 6-8 ft high', growthTime: '32-56' },
    { item: 'PU mattress, single, horizontal', growthTime: '120' },
    { item: 'PU insulation board, rigid foam, stacked 15 ft high', growthTime: '8' },
    { item: 'PS jars packed in Item 6', growthTime: '55' },
    { item: 'PS tubs nested in cartons, stacked 14 ft high', growthTime: '110' },
    { item: 'PS toy parts in cartons, stacked 15 ft high', growthTime: '120' },
    { item: 'PS insulation board, rigid foam, stacked 14 ft high', growthTime: '7' },
    { item: 'PVC bottles packed in Item 6', growthTime: '9' },
    { item: 'PP tubs packed in Item 6', growthTime: '10' },
    { item: 'PP and PE film in rolls, stacked 14 ft high', growthTime: '40' },
    { item: 'Distilled spirits in barrels, stacked 20 ft high', growthTime: '25-40' }
  ];

  return (
    <Chakra.Box p={6} maxW="6xl" mx="auto">
      <Chakra.VStack spacing={6} align="stretch">
        <Chakra.Text fontSize="sm" color="gray.600">
          Fire Dynamics Calculator equations (U.S. Nuclear Regulatory Commission, 2013) and data compiled from:
          <Chakra.UnorderedList>
          <Chakra.ListItem>U.S. Nuclear Regulatory Commission. (2013). Fire dynamics tools (FDTs): Quantitative fire hazard analysis methods for the U.S. Nuclear Regulatory Commission fire protection inspection program (NUREG-1805, Supplement 1, Volumes 1 & 2). Office of Nuclear Reactor Research. https://www.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr1805/s1/index.html.</Chakra.ListItem>
            <Chakra.ListItem>Gorbett, G., Pharr, J., & Rockwell, S. (2016). Fire dynamics (2nd ed.). Pearson.</Chakra.ListItem>
            <Chakra.ListItem>Quintiere, J. G. (2016). Principles of fire behavior (2nd ed.). CRC Press.</Chakra.ListItem>
            <Chakra.ListItem>Fire protection handbook: Vol. I–II (20th ed.). (2008). NFPA.</Chakra.ListItem>
          </Chakra.UnorderedList>
        </Chakra.Text>

        <Chakra.Tabs isFitted variant="enclosed">
          <Chakra.TabList mb="1em">
            <Chakra.Tab>Peak Heat Release Rates</Chakra.Tab>
            <Chakra.Tab>Steady State HRR</Chakra.Tab>
            <Chakra.Tab>Material Properties</Chakra.Tab>
            <Chakra.Tab>Mass Flux Values</Chakra.Tab>
            <Chakra.Tab>T-Squared Fire Growth</Chakra.Tab>
          </Chakra.TabList>

          <Chakra.TabPanels>
            {/* Peak Heat Release Rate Panel */}
            <Chakra.TabPanel>
              <Chakra.Table variant="simple">
                <Chakra.Thead>
                  <Chakra.Tr>
                    <Chakra.Th>Fuel</Chakra.Th>
                    <Chakra.Th>Weight (kg)</Chakra.Th>
                    <Chakra.Th>Weight (lb)</Chakra.Th>
                    <Chakra.Th>Peak HRR (kW)</Chakra.Th>
                  </Chakra.Tr>
                </Chakra.Thead>
                <Chakra.Tbody>
                  {peakHRRData.map((item, index) => (
                    <Chakra.Tr key={index}>
                      <Chakra.Td>{item.fuel}</Chakra.Td>
                      <Chakra.Td>{item.weightKg}</Chakra.Td>
                      <Chakra.Td>{item.weightLb}</Chakra.Td>
                      <Chakra.Td>{item.peakHRR}</Chakra.Td>
                    </Chakra.Tr>
                  ))}
                </Chakra.Tbody>
              </Chakra.Table>
            </Chakra.TabPanel>

            {/* Steady State Heat Release Rate Panel */}
            <Chakra.TabPanel>
              <Chakra.Table variant="simple">
                <Chakra.Thead>
                  <Chakra.Tr>
                    <Chakra.Th>Fuel</Chakra.Th>
                    <Chakra.Th>HRR (Q̇)</Chakra.Th>
                  </Chakra.Tr>
                </Chakra.Thead>
                <Chakra.Tbody>
                  {steadyStateHRRData.map((item, index) => (
                    <Chakra.Tr key={index}>
                      <Chakra.Td>{item.fuel}</Chakra.Td>
                      <Chakra.Td>{item.hrr}</Chakra.Td>
                    </Chakra.Tr>
                  ))}
                </Chakra.Tbody>
              </Chakra.Table>
            </Chakra.TabPanel>

            {/* Material Properties Panel */}
            <Chakra.TabPanel>
              <Chakra.Accordion allowMultiple>
                {Object.entries(materialProperties).map(([category, materials], index) => (
                  <Chakra.AccordionItem key={index}>
                    <Chakra.AccordionButton>
                      <Chakra.Box flex="1" textAlign="left">
                        <Chakra.Text fontWeight="bold" textTransform="capitalize">
                          {category}
                        </Chakra.Text>
                      </Chakra.Box>
                      <Chakra.AccordionIcon />
                    </Chakra.AccordionButton>
                    <Chakra.AccordionPanel>
                      <Chakra.Table variant="simple">
                        <Chakra.Thead>
                          <Chakra.Tr>
                            <Chakra.Th>Material</Chakra.Th>
                            <Chakra.Th>Heat of Combustion (kJ/g)</Chakra.Th>
                          </Chakra.Tr>
                        </Chakra.Thead>
                        <Chakra.Tbody>
                          {materials.map((material, mIndex) => (
                            <Chakra.Tr key={mIndex}>
                              <Chakra.Td>{material.material}</Chakra.Td>
                              <Chakra.Td>{material.heatOfCombustion}</Chakra.Td>
                            </Chakra.Tr>
                          ))}
                        </Chakra.Tbody>
                      </Chakra.Table>
                    </Chakra.AccordionPanel>
                  </Chakra.AccordionItem>
                ))}
              </Chakra.Accordion>
            </Chakra.TabPanel>

            {/* Mass Flux Values Panel */}
            <Chakra.TabPanel>
              <Chakra.Table variant="simple">
                <Chakra.Thead>
                  <Chakra.Tr>
                    <Chakra.Th>Fuel</Chakra.Th>
                    <Chakra.Th>Mass Flux (g/m²-s)</Chakra.Th>
                  </Chakra.Tr>
                </Chakra.Thead>
                <Chakra.Tbody>
                  {massFluxData.map((item, index) => (
                    <Chakra.Tr key={index}>
                      <Chakra.Td>{item.fuel}</Chakra.Td>
                      <Chakra.Td>{item.massFlux}</Chakra.Td>
                    </Chakra.Tr>
                  ))}
                </Chakra.Tbody>
              </Chakra.Table>
            </Chakra.TabPanel>

            {/* T-Squared Fire Growth Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={6} align="stretch">
                {/* Formula and explanation */}
                <Chakra.Box>
                  <Chakra.Text fontSize="lg" fontWeight="bold" mb={2}>T-Squared Fire Growth Model</Chakra.Text>
                  <Chakra.Box bg="gray.50" p={4} borderRadius="md">
                    <Chakra.Text fontSize="xl" fontFamily="mono" mb={2}>Q = αt²</Chakra.Text>
                    <Chakra.Text fontSize="sm">
                      Where: Q = heat release rate (kW), α = fire growth coefficient (kW/s²), t = time (s)
                    </Chakra.Text>
                  </Chakra.Box>
                </Chakra.Box>

                {/* Standard Growth Rates */}
                <Chakra.Box>
                  <Chakra.Text fontSize="md" fontWeight="bold" mb={2}>Standard Fire Growth Rates</Chakra.Text>
                  <Chakra.Table variant="simple" size="sm">
                    <Chakra.Thead>
                      <Chakra.Tr>
                        <Chakra.Th>Category</Chakra.Th>
                        <Chakra.Th>α (kW/s²)</Chakra.Th>
                        <Chakra.Th>Time to 1 MW (s)</Chakra.Th>
                        <Chakra.Th>Examples</Chakra.Th>
                      </Chakra.Tr>
                    </Chakra.Thead>
                    <Chakra.Tbody>
                      {tSquaredGrowthRates.map((item, index) => (
                        <Chakra.Tr key={index}>
                          <Chakra.Td fontWeight="medium">{item.category}</Chakra.Td>
                          <Chakra.Td>{item.coefficient}</Chakra.Td>
                          <Chakra.Td>{item.time1MW}</Chakra.Td>
                          <Chakra.Td fontSize="sm">{item.examples}</Chakra.Td>
                        </Chakra.Tr>
                      ))}
                    </Chakra.Tbody>
                  </Chakra.Table>
                </Chakra.Box>

                {/* Fire Growth Times */}
                <Chakra.Box>
                  <Chakra.Text fontSize="md" fontWeight="bold" mb={2}>
                    Growth Times of Continuous-Growth Fires
                  </Chakra.Text>
                  <Chakra.Text fontSize="sm" color="gray.600" mb={2}>
                    Time to reach 1 MW assuming 100% combustion efficiency
                  </Chakra.Text>
                  <Chakra.Table variant="simple" size="sm">
                    <Chakra.Thead>
                      <Chakra.Tr>
                        <Chakra.Th>Combustible Configuration</Chakra.Th>
                        <Chakra.Th>Growth Time (sec)</Chakra.Th>
                      </Chakra.Tr>
                    </Chakra.Thead>
                    <Chakra.Tbody>
                      {fireGrowthTimes.map((item, index) => (
                        <Chakra.Tr key={index}>
                          <Chakra.Td>{item.item}</Chakra.Td>
                          <Chakra.Td>{item.growthTime}</Chakra.Td>
                        </Chakra.Tr>
                      ))}
                    </Chakra.Tbody>
                  </Chakra.Table>
                  <Chakra.Text fontSize="xs" color="gray.500" mt={2}>
                    Note: Pe = polyester; Cot = cotton; PE = polyethylene; PS = polystyrene; 
                    PVC = polyvinyl chloride; PP = polypropylene; PU = polyurethane; 
                    FRP = fiberglass-reinforced polyester. For SI units: 1 ft = 0.305 m.
                  </Chakra.Text>
                  <Chakra.Text fontSize="xs" color="gray.500" mt={1}>
                    Source: NFPA Fire Protection Handbook, 2016 ed., Section 18, Chapter 4
                  </Chakra.Text>
                </Chakra.Box>
              </Chakra.VStack>
            </Chakra.TabPanel>
          </Chakra.TabPanels>
        </Chakra.Tabs>
      </Chakra.VStack>
    </Chakra.Box>
  );
};

export default ReferenceGuide;