/* eslint-disable react/prop-types */
import { useId, useState } from 'react';
import * as Chakra from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';

// Wide screens start with the variables and notes showing (as before). On a
// phone they start folded away so the inputs are on the first screen. The
// breakpoint matches Chakra's "md" (48em).
const startsOpen = () =>
  typeof window === 'undefined' ||
  typeof window.matchMedia !== 'function' ||
  window.matchMedia('(min-width: 48em)').matches;

// The title and equation always show. "Variables and notes" (the "Where:" list
// and any caveats) can be folded away.
const EquationCard = ({ title, equation, children }) => {
  const [isOpen, setIsOpen] = useState(startsOpen);
  const panelId = useId();

  return (
    <Chakra.Card variant="outline">
      <Chakra.CardBody>
        <Chakra.Text fontSize={{ base: 'md', sm: 'lg' }} fontWeight="bold">{title}</Chakra.Text>
        <Chakra.Text fontSize={{ base: 'lg', sm: 'xl' }} fontFamily="mono">{equation}</Chakra.Text>
        {children && (
          <>
            <Chakra.Button
              variant="link"
              size="sm"
              colorScheme="blue"
              mt={2}
              rightIcon={
                <Chakra.Box
                  as="span"
                  display="inline-flex"
                  transform={isOpen ? 'rotate(180deg)' : 'none'}
                  transition="transform 0.2s"
                >
                  <ChevronDown size={16} />
                </Chakra.Box>
              }
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              {isOpen ? 'Hide variables and notes' : 'Show variables and notes'}
            </Chakra.Button>
            <Chakra.Collapse in={isOpen} animateOpacity id={panelId}>
              {children}
            </Chakra.Collapse>
          </>
        )}
      </Chakra.CardBody>
    </Chakra.Card>
  );
};

export default EquationCard;
