import { Alert, AlertIcon, Box, Button, Collapse, Flex, Heading, Stack, useDisclosure } from '@chakra-ui/react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import UnitsToggle from './UnitsToggle';

// Common layout for a calculator: title, units, a collapsible equation panel,
// the inputs with a result card that stays pinned to the bottom of the screen
// while the inputs are scrolled, then any extra content.
export default function CalculatorShell({ title, about, warning, onClear, result, extras, children }) {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Box maxW="2xl" mx="auto" w="100%">
      <Stack spacing={4}>
        <Flex align="center" justify="space-between" gap={2}>
          <Heading as="h2" size="md">
            {title}
          </Heading>
          {onClear && (
            <Button variant="ghost" leftIcon={<RotateCcw size={16} />} onClick={onClear} flexShrink={0}>
              Clear
            </Button>
          )}
        </Flex>

        <Flex align="center" justify="space-between" gap={2} wrap="wrap">
          <UnitsToggle />
          {about && (
            <Button
              variant="ghost"
              px={2}
              iconSpacing={1}
              onClick={onToggle}
              aria-expanded={isOpen}
              rightIcon={
                <Box as="span" display="inline-flex" transition="transform 0.2s" transform={isOpen ? 'rotate(180deg)' : undefined}>
                  <ChevronDown size={18} />
                </Box>
              }
            >
              Equation
            </Button>
          )}
        </Flex>

        {about && (
          <Collapse in={isOpen} animateOpacity>
            <Box borderWidth="1px" borderColor="border.default" borderRadius="md" p={4} bg="bg.surface" fontSize="sm">
              {about}
            </Box>
          </Collapse>
        )}

        {warning && (
          <Alert status="warning" variant="left-accent" borderRadius="md" fontSize="sm">
            <AlertIcon />
            {warning}
          </Alert>
        )}

        {/* The result is sticky only inside this box, next to the inputs. */}
        <Box>
          <Stack spacing={4}>{children}</Stack>
          {result}
        </Box>

        {extras}
      </Stack>
    </Box>
  );
}
