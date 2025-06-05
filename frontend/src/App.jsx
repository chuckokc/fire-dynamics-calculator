import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';
import { Mail, Sun, Moon } from 'lucide-react';
import HeatReleaseCalculator from './components/calculators/HeatReleaseCalculator';
import FlameHeightCalculator from './components/calculators/FlameHeightCalculator';
import PointSourceCalculator from './components/calculators/PointSourceCalculator';
import FlashoverCalculator from './components/calculators/FlashoverCalculator';
import ReferenceGuide from './components/reference/ReferenceGuide';
import Authentication from './components/Authentication';
import TSquaredCalculator from './components/calculators/TSquaredCalculator';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ColorModeScript } from '@chakra-ui/react';
import theme from './theme';

const APP_VERSION = '1.2.3';

// MainApp component contains all calculator functionality and the main interface
const MainApp = () => {
  // Theme colors that adapt to light/dark mode
  const { colorMode, toggleColorMode } = Chakra.useColorMode();
  const bgColor = Chakra.useColorModeValue('gray.50', 'gray.800');
  const borderColor = Chakra.useColorModeValue('gray.200', 'gray.600');

  // Add PWA update handling
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

    // Handler for feedback button clicks - opens email client
  const handleFeedbackClick = () => {
    window.location.href = 'mailto:chuckokc@gmail.com?subject=Fire Dynamics Calculator Feedback';
  };

  return (
    <Chakra.Box minH="100vh" bg={bgColor}>
      {/* PWA Update Prompt */}
      {needRefresh && (
        <Chakra.Box position="fixed" bottom={4} right={4} zIndex={9999}>
          <Chakra.Alert status="info" variant="solid" borderRadius="md" boxShadow="lg">
            <Chakra.AlertIcon />
            <Chakra.Box flex="1">
              <Chakra.AlertTitle>Update available!</Chakra.AlertTitle>
              <Chakra.AlertDescription>
                A new version of Fire Dynamics Calculator is ready.
              </Chakra.AlertDescription>
            </Chakra.Box>
            <Chakra.Button
              colorScheme="blue"
              size="sm"
              ml={3}
              onClick={() => updateServiceWorker(true)}
            >
              Update
            </Chakra.Button>
          </Chakra.Alert>
        </Chakra.Box>
      )}

      <Chakra.Container maxW="container.xl" py={8}>
        {/* Header section with title, description, and feedback button */}
        <Chakra.VStack spacing={2} align="stretch" mb={8}>
          <Chakra.Flex justify="space-between" align="center" width="100%">
            <Chakra.VStack align="stretch" spacing={1}>
              <Chakra.Heading>Fire Dynamics Calculator</Chakra.Heading>
              <Chakra.Text color="gray.600">
                Professional fire investigation tools based on NUREG-1805 methodology
              </Chakra.Text>
            </Chakra.VStack>
            
            <Chakra.HStack spacing={2}>
              <Chakra.Text fontSize="xs" color="gray.500">v{APP_VERSION}</Chakra.Text>
              <Chakra.IconButton
                icon={colorMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
                aria-label="Toggle dark mode"
              />
              <Chakra.Button
                leftIcon={<Mail size={16} />}
                variant="ghost"
                size="sm"
                onClick={handleFeedbackClick}
                colorScheme="blue"
              >
                Provide Feedback
              </Chakra.Button>
            </Chakra.HStack>
          </Chakra.Flex>
        </Chakra.VStack>

        {/* Main calculator interface with tabs */}
        <Chakra.Tabs variant="enclosed" borderColor={borderColor} isLazy>
          <Chakra.TabList>
            <Chakra.Tab>Heat Release Rate</Chakra.Tab>
            <Chakra.Tab>Flame Height</Chakra.Tab>
            <Chakra.Tab>Point Source Radiation</Chakra.Tab>
            <Chakra.Tab>Flashover</Chakra.Tab>
            <Chakra.Tab>T-Squared Growth</Chakra.Tab>
            <Chakra.Tab>Reference Data</Chakra.Tab>
          </Chakra.TabList>

          <Chakra.TabPanels>
            {/* Heat Release Rate Calculator Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Heat Release Rate Calculator</Chakra.Heading>
                <Chakra.Text color="gray.600" fontSize="sm">
                  Calculates heat release rate using the Heat Release Rate Equation.
                                  </Chakra.Text>
                <Chakra.Center py={4}>
                  <HeatReleaseCalculator />
                </Chakra.Center>
              </Chakra.VStack>
            </Chakra.TabPanel>

            {/* Flame Height Calculator Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Flame Height Calculator</Chakra.Heading>
                <Chakra.Text color="gray.600" fontSize="sm">
                  Calculates flame height using Heskestad's Correlation. Use for a single fuel item or package.
                  DO NOT USE IN A ROOM THAT HAS BEEN THROUGH FLASHOVER OR FULL INVOLVEMENT!
                                  </Chakra.Text>
                <Chakra.Center py={4}>
                  <FlameHeightCalculator />
                </Chakra.Center>
              </Chakra.VStack>
            </Chakra.TabPanel>

            {/* Point Source Radiation Calculator Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Point Source Radiation Calculator</Chakra.Heading>
                <Chakra.Text color="gray.600" fontSize="sm">
                  Calculates radiative heat flux using the Point Source Radiation Model.
                                  </Chakra.Text>
                <Chakra.Center py={4}>
                  <PointSourceCalculator />
                </Chakra.Center>
              </Chakra.VStack>
            </Chakra.TabPanel>

            {/* Flashover Calculator Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Flashover Calculator</Chakra.Heading>
                <Chakra.Text color="gray.600" fontSize="sm">
                  Estimate minimum heat release rate required for flashover using MQH, 
                  Babrauskas, and Thomas correlations.
                </Chakra.Text>
                <Chakra.Center py={4}>
                  <FlashoverCalculator />
                </Chakra.Center>
              </Chakra.VStack>
            </Chakra.TabPanel>

            {/* T-Squared Growth Calculator Panel */}
<Chakra.TabPanel>
  <Chakra.VStack spacing={4} align="stretch">
    <Chakra.Heading size="md">T-Squared Fire Growth Calculator</Chakra.Heading>
    <Chakra.Text color="gray.600" fontSize="sm">
      Calculate heat release rate over time using the t-squared fire growth model 
      with standard growth rate coefficients (slow, medium, fast, ultra-fast).
    </Chakra.Text>
    <Chakra.Center py={4}>
      <TSquaredCalculator />
    </Chakra.Center>
  </Chakra.VStack>
</Chakra.TabPanel>

            {/* Reference Data Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Reference Data</Chakra.Heading>
                <Chakra.Text color="gray.600" fontSize="sm">
                  Material properties, heat release rates, and mass flux values for common fuels and materials.
                </Chakra.Text>
                <ReferenceGuide />
              </Chakra.VStack>
            </Chakra.TabPanel>
          </Chakra.TabPanels>
        </Chakra.Tabs>
      </Chakra.Container>
    </Chakra.Box>
  );
};

// Main App component that handles authentication and renders either the auth screen or main app
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('fireCalcAuth');
    if (authStatus === 'granted') {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Chakra.ChakraProvider theme={theme}>
        {!isAuthenticated ? (
          <Authentication onAuthenticated={setIsAuthenticated} />
        ) : (
          <MainApp />
        )}
      </Chakra.ChakraProvider>
    </>
  );
}

export default App;