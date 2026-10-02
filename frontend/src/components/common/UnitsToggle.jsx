import { Button, ButtonGroup } from '@chakra-ui/react';
import { useUnits } from '../../units/UnitsContext';

const OPTIONS = [
  { value: 'imperial', label: 'Imperial' },
  { value: 'SI', label: 'SI' },
];

// Switches the unit system for every calculator and converts the numbers
// already entered.
export default function UnitsToggle() {
  const { units, setUnits } = useUnits();
  return (
    <ButtonGroup isAttached size="md" role="group" aria-label="Unit system">
      {OPTIONS.map((option) => {
        const isActive = units === option.value;
        return (
          <Button
            key={option.value}
            onClick={() => setUnits(option.value)}
            aria-pressed={isActive}
            variant={isActive ? 'solid' : 'outline'}
            colorScheme={isActive ? 'blue' : 'gray'}
            minW="4.5rem"
            px={3}
          >
            {option.label}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
