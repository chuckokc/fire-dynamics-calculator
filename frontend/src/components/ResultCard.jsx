/* eslint-disable react/prop-types */
import * as Chakra from '@chakra-ui/react';
import { Check, Copy, Save } from 'lucide-react';
import { RESULT_BUTTON } from '../resultButtons';

// The result of a calculation, shown the same way in every calculator:
//  - the answer is big, with its label above and its unit beside it
//  - supporting detail sits below in smaller text
//  - Copy, Save and any extra action (such as "Use this HRR in…") share one row,
//    all in one outline style so the solid blue Calculate button stays the one
//    obvious primary action.
//
// stats: [{ label, value, unit, note }]. One entry is the headline answer; several
// (Flashover's three correlations) are shown side by side.
const ResultCard = ({ title, stats, details, onCopy, copySuccess, onSave, actions, accent = 'green.400' }) => {
  const several = stats.length > 1;

  return (
    <Chakra.Card variant="outline" width="100%" borderLeftWidth="4px" borderLeftColor={accent} role="status">
      <Chakra.CardBody>
        {title && <Chakra.Text fontWeight="bold" mb={3}>{title}</Chakra.Text>}

        <Chakra.SimpleGrid columns={{ base: 1, sm: stats.length }} spacing={4}>
          {stats.map(({ label, value, unit, note }) => (
            <Chakra.Box key={label}>
              <Chakra.Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider" color="fd.muted">
                {label}
              </Chakra.Text>
              <Chakra.Text
                fontSize={several ? { base: '2xl', sm: '3xl' } : { base: '3xl', sm: '4xl' }}
                fontWeight="bold"
                lineHeight="1.15"
              >
                {value}
                {unit && (
                  <Chakra.Text as="span" fontSize={several ? 'md' : 'lg'} fontWeight="medium" ml={2}>
                    {unit}
                  </Chakra.Text>
                )}
              </Chakra.Text>
              {note && <Chakra.Text fontSize="sm" color="fd.muted">{note}</Chakra.Text>}
            </Chakra.Box>
          ))}
        </Chakra.SimpleGrid>

        {details && <Chakra.Box mt={4} fontSize="sm">{details}</Chakra.Box>}

        {/* One row on wide screens; full-width, touch-sized buttons stacked on a phone. */}
        <Chakra.Flex mt={4} gap={2} wrap="wrap" direction={{ base: 'column', sm: 'row' }}>
          <Chakra.Button
            {...RESULT_BUTTON}
            colorScheme={copySuccess ? 'green' : RESULT_BUTTON.colorScheme}
            leftIcon={copySuccess ? <Check size={14} /> : <Copy size={14} />}
            onClick={onCopy}
          >
            {copySuccess ? 'Copied!' : 'Copy Results'}
          </Chakra.Button>
          <Chakra.Button
            {...RESULT_BUTTON}
            leftIcon={<Save size={14} />}
            onClick={onSave}
          >
            Save to History
          </Chakra.Button>
          {actions}
        </Chakra.Flex>
      </Chakra.CardBody>
    </Chakra.Card>
  );
};

export default ResultCard;
