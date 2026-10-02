import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightAddon,
  Select,
} from '@chakra-ui/react';
import { isBlank, parseNumber } from '../../lib/units';

function fieldError(value, max) {
  if (isBlank(value)) return null;
  const number = parseNumber(value);
  if (!Number.isFinite(number)) return 'Enter a number, for example 12.5';
  if (number <= 0) return 'Must be greater than 0';
  if (max !== undefined && number > max) return `Must be ${max} or less`;
  return null;
}

// A numeric input with the decimal keypad on phones and the unit shown inside
// the box. Pass unitOptions/onUnitChange to make the unit a picker.
export default function NumberField({
  label,
  value,
  onChange,
  unit,
  unitOptions,
  onUnitChange,
  helperText,
  max,
  isRequired = true,
  placeholder,
}) {
  const error = fieldError(value, max);
  return (
    <FormControl isRequired={isRequired} isInvalid={Boolean(error)}>
      <FormLabel mb={1}>{label}</FormLabel>
      <InputGroup size="lg">
        <Input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          bg="bg.surface"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {unitOptions ? (
          <InputRightAddon p={0} minW="5.5rem">
            <Select
              variant="unstyled"
              size="lg"
              h="12"
              pl={3}
              aria-label={`${label} unit`}
              value={unit}
              onChange={(event) => onUnitChange(event.target.value)}
            >
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </InputRightAddon>
        ) : (
          unit && (
            <InputRightAddon minW="3.75rem" justifyContent="center" fontSize="md" color="text.muted" px={2}>
              {unit}
            </InputRightAddon>
          )
        )}
      </InputGroup>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
