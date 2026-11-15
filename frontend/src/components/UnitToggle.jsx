/* eslint-disable react/prop-types */
import * as Chakra from '@chakra-ui/react';
import { METRIC, FEET } from '../calculations/units.js';

// The one unit choice in the app: are lengths (or areas) entered and shown in
// meters or in feet? Heat release rate, heat flux and the growth coefficient
// are always kW-based, so there is nothing else to switch.
const LABELS = {
  length: { [METRIC]: 'Meters (m)', [FEET]: 'Feet (ft)' },
  area: { [METRIC]: 'Square meters (m²)', [FEET]: 'Square feet (ft²)' }
};

const UnitToggle = ({ value, onChange, quantity = 'length' }) => (
  <Chakra.FormControl>
    <Chakra.FormLabel>Units</Chakra.FormLabel>
    <Chakra.VStack align="start" spacing={2}>
      <Chakra.RadioGroup value={value} onChange={onChange}>
        <Chakra.HStack spacing={4} wrap="wrap">
          <Chakra.Radio value={METRIC}>{LABELS[quantity][METRIC]}</Chakra.Radio>
          <Chakra.Radio value={FEET}>{LABELS[quantity][FEET]}</Chakra.Radio>
        </Chakra.HStack>
      </Chakra.RadioGroup>
      <Chakra.Text fontSize="xs" color="fd.muted">
        Heat release rate stays in kW. Switching converts the values already entered.
      </Chakra.Text>
    </Chakra.VStack>
  </Chakra.FormControl>
);

export default UnitToggle;
