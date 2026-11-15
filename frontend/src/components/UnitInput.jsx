/* eslint-disable react/prop-types */
import { useId } from 'react';
import * as Chakra from '@chakra-ui/react';

// A number box with its unit inside it, at the right edge, so a value is never
// separated from its unit. An optional hint goes under the box. Everything else
// (value, onChange, min, max, step, size) goes straight to Chakra's NumberInput.
// The unit is also read out with the field for screen readers.
const UnitInput = ({ unit, hint, size, ...numberInputProps }) => {
  const unitId = useId();
  // Room for the unit so typed digits never run underneath it
  const room = !unit ? undefined : unit.length <= 3 ? '3rem' : unit.length <= 5 ? '4.25rem' : '5.25rem';
  return (
    <>
      <Chakra.Box position="relative">
        <Chakra.NumberInput size={size} {...numberInputProps}>
          <Chakra.NumberInputField inputMode="decimal" pr={room} aria-describedby={unit ? unitId : undefined} />
        </Chakra.NumberInput>
        {unit && (
          <Chakra.Text
            id={unitId}
            position="absolute"
            right={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            pointerEvents="none"
            color="fd.muted"
            fontSize={size === 'sm' ? 'xs' : 'sm'}
            whiteSpace="nowrap"
          >
            {unit}
          </Chakra.Text>
        )}
      </Chakra.Box>
      {hint && (
        <Chakra.Text fontSize={size === 'sm' ? 'xs' : 'sm'} color="fd.muted" mt={1}>
          {hint}
        </Chakra.Text>
      )}
    </>
  );
};

export default UnitInput;
