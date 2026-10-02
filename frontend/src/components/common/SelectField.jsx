import { FormControl, FormHelperText, FormLabel, Select } from '@chakra-ui/react';

export default function SelectField({ label, value, onChange, helperText, placeholder, isRequired = false, children }) {
  return (
    <FormControl isRequired={isRequired}>
      <FormLabel mb={1}>{label}</FormLabel>
      <Select
        size="lg"
        bg="bg.surface"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
