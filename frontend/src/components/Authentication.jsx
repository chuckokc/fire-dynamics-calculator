import { useState } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  Heading,
  Container,
  InputGroup,
  InputRightElement,
  IconButton,
  Link,
  HStack,
  Divider,
} from '@chakra-ui/react';
import { Eye, EyeOff, Mail } from 'lucide-react';

const Authentication = ({ onAuthenticated }) => {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const toast = useToast();

  const verifyAccess = () => {
    if (accessCode.trim().toUpperCase() === 'QUINTIERE') {
      try {
        localStorage.setItem('fireCalcAuth', 'granted');
      } catch {
        // Storage unavailable: access lasts for this session only.
      }
      onAuthenticated(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome to the Fire Dynamics Calculator',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Access Denied',
        description: 'Please enter a valid access code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyAccess();
  };

  return (
    <Container maxW="lg" py={{ base: 6, md: 10 }} minH="100vh">
      <Box 
        w="full" 
        maxW="md" 
        p={{ base: 6, md: 8 }}
        mt={{ base: 4, md: 20 }}
        bg="bg.surface"
        borderRadius="lg" 
        boxShadow="lg"
        textAlign="center"
      >
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">
            Fire Dynamics Calculator
          </Heading>
          
          <Text fontSize="md" color="text.muted">
            Professional fire investigation tools based on NUREG-1805 methodology
          </Text>

          <VStack as="form" spacing={6} w="full" onSubmit={handleSubmit}>
          <InputGroup size="lg">
            <Input
              type={showCode ? 'text' : 'password'}
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-label="Access code"
            />
            <InputRightElement>
              <IconButton
                variant="ghost"
                icon={showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                onClick={() => setShowCode(!showCode)}
                aria-label={showCode ? 'Hide access code' : 'Show access code'}
              />
            </InputRightElement>
          </InputGroup>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            width="full"
          >
            Access Calculator
          </Button>
          </VStack>

          <Divider my={2} />

          <VStack spacing={2}>
            <Text fontSize="sm" color="text.subtle">
              With dedication from Chuck ❤️ Christine Carpenter
            </Text>
            
            <HStack spacing={2} justify="center">
              <Mail size={16} />
              <Link
                fontSize="sm"
                color="accent.fg"
                href="mailto:chuckokc@gmail.com?subject=Fire%20Dynamics%20Calculator%20Feedback"
              >
                Provide Feedback
              </Link>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    </Container>
  );
};

export default Authentication;