import { Box, Button, Collapse, Flex, Stack, Text, useDisclosure, useToast } from '@chakra-ui/react';
import { ChevronDown, History, Trash2 } from 'lucide-react';

const formatSavedAt = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// Saved calculations for one calculator. Tapping one puts its inputs back.
export default function HistoryPanel({ entries, onLoad, onClear }) {
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  if (entries.length === 0) return null;

  const handleLoad = (entry) => {
    onLoad(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ position: 'top', duration: 2000, status: 'info', title: 'Saved calculation loaded' });
  };

  const handleClear = () => {
    if (window.confirm('Delete all saved calculations for this calculator?')) onClear();
  };

  return (
    <Box>
      <Button
        variant="outline"
        w="100%"
        onClick={onToggle}
        aria-expanded={isOpen}
        leftIcon={<History size={16} />}
        rightIcon={
          <Box as="span" display="inline-flex" transition="transform 0.2s" transform={isOpen ? 'rotate(180deg)' : undefined}>
            <ChevronDown size={18} />
          </Box>
        }
      >
        Saved calculations ({entries.length})
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Stack spacing={2} mt={2}>
          {entries.map((entry) => (
            <Box
              key={entry.id}
              as="button"
              type="button"
              onClick={() => handleLoad(entry)}
              textAlign="left"
              w="100%"
              minH="44px"
              p={3}
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.default"
              borderLeftWidth="4px"
              borderLeftColor={entry.accent || 'blue.400'}
              borderRadius="md"
              _hover={{ bg: 'bg.subtle' }}
              _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
            >
              <Flex justify="space-between" gap={3}>
                <Box minW={0}>
                  <Text fontWeight="semibold">{entry.title}</Text>
                  {entry.detail && (
                    <Text fontSize="sm" color="text.muted">
                      {entry.detail}
                    </Text>
                  )}
                </Box>
                <Text fontSize="xs" color="text.subtle" flexShrink={0} textAlign="right">
                  {formatSavedAt(entry.savedAt)}
                </Text>
              </Flex>
            </Box>
          ))}
          <Button variant="ghost" colorScheme="red" leftIcon={<Trash2 size={16} />} onClick={handleClear}>
            Delete saved calculations
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
}
