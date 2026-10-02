import { Box, Stack, Text } from '@chakra-ui/react';

// An equation shown in the collapsible "Equation" panel.
export function Formula({ children }) {
  return (
    <Text fontFamily="mono" fontSize={{ base: 'md', sm: 'lg' }} fontWeight="semibold" sx={{ overflowWrap: 'anywhere' }}>
      {children}
    </Text>
  );
}

// The "Where:" list of symbols under an equation.
export function Definitions({ items }) {
  return (
    <Box>
      <Text color="text.muted">Where:</Text>
      <Stack spacing={0.5} mt={1}>
        {items.map(([symbol, meaning]) => (
          <Text key={symbol} color="text.muted">
            <Text as="span" fontWeight="semibold" color="chakra-body-text">
              {symbol}
            </Text>{' '}
            = {meaning}
          </Text>
        ))}
      </Stack>
    </Box>
  );
}
