import React, { useState, useEffect } from 'react';
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
  useColorModeValue  // Add this import
} from '@chakra-ui/react';
import { Eye, EyeOff, Mail } from 'lucide-react';

const Authentication = ({ onAuthenticated }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('fireCalcAuth');
    if (isAuthenticated === 'granted') {
      onAuthenticated(true);
    }
  }, [onAuthenticated]);

  const verifyAccess = () => {
    if (accessCode.toUpperCase() === 'QUINTIERE') {
      localStorage.setItem('fireCalcAuth', 'granted');
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      verifyAccess();
    }
  };

  const handleFeedbackClick = () => {
    window.location.href = 'mailto:chuckokc@gmail.com?subject=Fire Dynamics Calculator Feedback';
  };

  return (
    <Container maxW="lg" py={10} minH="100vh" bg={bgColor}>
      <Box 
        w="full" 
        maxW="md" 
        p={8} 
        mt={20} 
        bg={cardBgColor}  // Changed from "white"
        borderRadius="lg" 
        boxShadow="lg"
        textAlign="center"
      >
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">
            Fire Dynamics Calculator
          </Heading>
          
          <Text fontSize="md" color="gray.600">
            Professional fire investigation tools based on NUREG-1805 methodology
          </Text>

          <InputGroup size="lg">
            <Input
              type={showCode ? 'text' : 'password'}
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyPress={handleKeyPress}
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
            colorScheme="blue"
            size="lg"
            width="full"
            onClick={verifyAccess}
          >
            Access Calculator
          </Button>

          <Divider my={2} />

          <VStack spacing={2}>
            <Text fontSize="sm" color="gray.500">
              With dedication from Chuck ❤️ Christine Carpenter
            </Text>
            
            <HStack spacing={2} justify="center">
              <Mail size={16} />
              <Link 
                fontSize="sm" 
                color="blue.500" 
                onClick={handleFeedbackClick}
                cursor="pointer"
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