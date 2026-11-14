/* eslint-disable react/prop-types */
import * as Chakra from '@chakra-ui/react';

// "Show the work": a collapsible list of calculation steps, each with the
// equation, the numbers substituted, and the answer. Steps come from the
// functions in src/calculations/.
const ShowWork = ({ steps, title = 'Show the work' }) => {
  const boxBg = Chakra.useColorModeValue('gray.50', 'gray.700');
  const borderColor = Chakra.useColorModeValue('gray.200', 'gray.600');
  if (!steps || steps.length === 0) return null;

  return (
    <Chakra.Accordion allowToggle>
      <Chakra.AccordionItem border="1px solid" borderColor={borderColor} borderRadius="md">
        <Chakra.AccordionButton>
          <Chakra.Box flex="1" textAlign="left" fontWeight="semibold">{title}</Chakra.Box>
          <Chakra.AccordionIcon />
        </Chakra.AccordionButton>
        <Chakra.AccordionPanel pb={4}>
          <Chakra.OrderedList spacing={3} ml={5}>
            {steps.map((s, i) => (
              <Chakra.ListItem key={i}>
                <Chakra.Text fontWeight="medium" fontSize="sm" mb={1}>{s.label}</Chakra.Text>
                <Chakra.Box
                  fontFamily="mono"
                  fontSize="sm"
                  bg={boxBg}
                  p={2}
                  borderRadius="md"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  <Chakra.Text>{s.formula}</Chakra.Text>
                  <Chakra.Text>= {s.values}</Chakra.Text>
                  <Chakra.Text fontWeight="bold">= {s.result}</Chakra.Text>
                </Chakra.Box>
              </Chakra.ListItem>
            ))}
          </Chakra.OrderedList>
          <Chakra.Text fontSize="xs" color="gray.500" mt={3}>
            The equations are worked in SI units (kW, m). Imperial inputs are converted first and the answer converted back.
            Numbers are rounded for display; the calculator uses full precision.
          </Chakra.Text>
        </Chakra.AccordionPanel>
      </Chakra.AccordionItem>
    </Chakra.Accordion>
  );
};

export default ShowWork;
