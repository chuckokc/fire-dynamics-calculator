import { Box, Button, HStack, Stack, Text, useToast } from '@chakra-ui/react';
import { Bookmark, Copy, Share2, TriangleAlert } from 'lucide-react';
import { describeMissing } from '../../lib/calculations';
import { canShare, copyText, shareText } from '../../lib/share';

const ACCENTS = { ok: 'blue.500', warning: 'orange.400', invalid: 'red.400', empty: 'border.default' };

// A large result value with its unit.
export function ResultValue({ label, value, unit, secondary, size = '2xl' }) {
  return (
    <Box minW={0}>
      {label && (
        <Text fontSize="sm" color="text.muted" noOfLines={1}>
          {label}
        </Text>
      )}
      <Text fontSize={size} fontWeight="bold" lineHeight="short">
        {value}{' '}
        <Text as="span" fontSize="md" fontWeight="semibold">
          {unit}
        </Text>
      </Text>
      {secondary && (
        <Text fontSize="sm" color="text.muted">
          {secondary}
        </Text>
      )}
    </Box>
  );
}

// Shows the live result. Once there is something to show it stays pinned to
// the bottom of the screen (above the bottom navigation on phones) while the
// inputs above it are scrolled.
export default function ResultCard({ title, result, report, reportTitle, onSave, children }) {
  const toast = useToast();
  const notify = (options) => toast({ position: 'top', duration: 2000, isClosable: true, ...options });

  const handleShare = async () => {
    try {
      await shareText(`Fire Dynamics Calculator – ${reportTitle || title}`, report);
    } catch {
      notify({ status: 'error', title: 'Could not open sharing' });
    }
  };

  const handleCopy = async () => {
    const copied = await copyText(report);
    notify(copied ? { status: 'success', title: 'Result copied' } : { status: 'error', title: 'Could not copy' });
  };

  const handleSave = () => {
    onSave();
    notify({ status: 'success', title: 'Saved to this calculator’s history' });
  };

  let body;
  if (result.status === 'empty') {
    const prompt =
      result.missing.length > 2
        ? 'Fill in the inputs above to see the result.'
        : `Enter the ${describeMissing(result.missing)} to see the result.`;
    body = <Text color="text.muted">{prompt}</Text>;
  } else if (result.status === 'invalid') {
    body = (
      <Text color="red.500" _dark={{ color: 'red.300' }}>
        Check the highlighted input.
      </Text>
    );
  } else if (result.status === 'warning') {
    body = (
      <HStack align="start" spacing={2}>
        <Box color="orange.400" pt="2px" flexShrink={0}>
          <TriangleAlert size={18} />
        </Box>
        <Text fontSize="sm">{result.message}</Text>
      </HStack>
    );
  } else {
    body = children;
  }

  const showActions = result.status === 'ok' && (report || onSave);

  return (
    <Box
      as="section"
      aria-label={title}
      aria-live="polite"
      position={result.status === 'empty' ? 'static' : 'sticky'}
      bottom="calc(var(--fdc-nav-h) + 8px)"
      zIndex={2}
      mt={5}
      p={3}
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.default"
      borderLeftWidth="4px"
      borderLeftColor={ACCENTS[result.status]}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Stack spacing={2}>
        <Text fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" color="text.muted">
          {title}
        </Text>
        {body}
        {showActions && (
          <HStack spacing={2} pt={1}>
            {report && canShare() && (
              <Button flex={1} variant="outline" colorScheme="blue" leftIcon={<Share2 size={16} />} onClick={handleShare}>
                Share
              </Button>
            )}
            {report && (
              <Button flex={1} variant="outline" leftIcon={<Copy size={16} />} onClick={handleCopy}>
                Copy
              </Button>
            )}
            {onSave && (
              <Button flex={1} variant="outline" leftIcon={<Bookmark size={16} />} onClick={handleSave}>
                Save
              </Button>
            )}
          </HStack>
        )}
      </Stack>
    </Box>
  );
}
