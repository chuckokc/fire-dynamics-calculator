/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import * as Chakra from '@chakra-ui/react';
import { MessageSquare, Sun, Moon } from 'lucide-react';
import HeatReleaseCalculator from './components/calculators/HeatReleaseCalculator';
import FlameHeightCalculator from './components/calculators/FlameHeightCalculator';
import PointSourceCalculator from './components/calculators/PointSourceCalculator';
import FlashoverCalculator from './components/calculators/FlashoverCalculator';
import ReferenceGuide from './components/reference/ReferenceGuide';
import TSquaredCalculator from './components/calculators/TSquaredCalculator';
import { HrrTransferProvider } from './components/HrrTransfer';
import FeedbackModal from './components/FeedbackModal';
import ScrollableTabList from './components/ScrollableTabList';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ColorModeScript } from '@chakra-ui/react';
import theme from './theme';
import { checkAccess } from './accessCheck';

const APP_VERSION = '1.9.0';

// One column for every calculator, so the heading, description, warning and form
// line up and the width does not change when you switch tabs. px matches the
// padding inside each calculator.
const CalculatorPanel = ({ title, description, warning, children }) => (
  <Chakra.Box maxW="2xl" mx="auto" w="100%">
    <Chakra.VStack spacing={4} align="stretch" px={{ base: 4, sm: 6 }}>
      <Chakra.Heading size="md">{title}</Chakra.Heading>
      <Chakra.Text color="fd.muted" fontSize="sm">{description}</Chakra.Text>
      {warning && (
        <Chakra.Alert status="warning" variant="left-accent" alignItems="flex-start">
          <Chakra.AlertIcon />
          <Chakra.Box>
            <Chakra.AlertTitle>{warning.title}</Chakra.AlertTitle>
            <Chakra.AlertDescription fontSize="sm">{warning.text}</Chakra.AlertDescription>
          </Chakra.Box>
        </Chakra.Alert>
      )}
    </Chakra.VStack>
    <Chakra.Box py={4}>{children}</Chakra.Box>
  </Chakra.Box>
);

// MainApp component contains all calculator functionality and the main interface
const MainApp = () => {
  // Theme colors that adapt to light/dark mode
  const { colorMode, toggleColorMode } = Chakra.useColorMode();
  const bgColor = Chakra.useColorModeValue('gray.50', 'gray.800');
  const borderColor = Chakra.useColorModeValue('gray.200', 'gray.600');
  // Controlled so a calculator can send its HRR to another tab.
  // keepMounted: a calculator keeps its inputs and results when you switch tabs.
  const [tabIndex, setTabIndex] = useState(0);

  // Add PWA update handling
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Feedback is sent through a form (see FeedbackModal), not an email link, so it
  // works without an email app and the owner's address is never shown.
  const feedback = Chakra.useDisclosure();

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

      <Chakra.Container maxW="container.xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 4 }}>
        {/* Header section with title, description, and feedback button */}
        <Chakra.VStack spacing={2} align="stretch" mb={{ base: 4, md: 8 }}>
          <Chakra.Flex
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={3}
            width="100%"
          >
            <Chakra.VStack align="stretch" spacing={1}>
              <Chakra.Heading size={{ base: 'md', md: 'lg' }}>Fire Dynamics Calculator</Chakra.Heading>
              <Chakra.Text color="fd.muted" fontSize={{ base: 'sm', md: 'md' }}>
                Professional fire investigation tools based on NUREG-1805 methodology
              </Chakra.Text>
            </Chakra.VStack>

            <Chakra.HStack spacing={2} flexShrink={0}>
              <Chakra.Text fontSize="xs" color="fd.muted">v{APP_VERSION}</Chakra.Text>
              <Chakra.IconButton
                icon={colorMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
                aria-label="Toggle dark mode"
              />
              <Chakra.Button
                leftIcon={<MessageSquare size={16} />}
                variant="ghost"
                size="sm"
                onClick={feedback.onOpen}
                colorScheme="blue"
              >
                Provide Feedback
              </Chakra.Button>
            </Chakra.HStack>
          </Chakra.Flex>
        </Chakra.VStack>

        {/* Main calculator interface with tabs */}
        <HrrTransferProvider onNavigate={setTabIndex}>
        <Chakra.Tabs variant="enclosed" borderColor={borderColor} isLazy lazyBehavior="keepMounted" index={tabIndex} onChange={setTabIndex}>
          <ScrollableTabList>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">Heat Release Rate</Chakra.Tab>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">Flame Height</Chakra.Tab>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">Point Source Radiation</Chakra.Tab>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">Flashover</Chakra.Tab>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">T-Squared Growth</Chakra.Tab>
            <Chakra.Tab flexShrink={0} whiteSpace="nowrap">Reference Data</Chakra.Tab>
          </ScrollableTabList>

          <Chakra.TabPanels>
            {/* Heat Release Rate Calculator Panel */}
            <Chakra.TabPanel px={{ base: 0, sm: 4 }}>
              <CalculatorPanel
                title="Heat Release Rate Calculator"
                description="Calculates heat release rate using the Heat Release Rate Equation."
              >
                <HeatReleaseCalculator />
              </CalculatorPanel>
            </Chakra.TabPanel>

            {/* Flame Height Calculator Panel */}
            <Chakra.TabPanel px={{ base: 0, sm: 4 }}>
              <CalculatorPanel
                title="Flame Height Calculator"
                description="Calculates flame height for a fire in the middle of a room (Heskestad), against a wall, or in a corner (NUREG-1805). Use for a single fuel item or package."
                warning={{
                  title: 'Not valid after flashover',
                  text: 'Do not use in a room that has been through flashover or full involvement.',
                }}
              >
                <FlameHeightCalculator />
              </CalculatorPanel>
            </Chakra.TabPanel>

            {/* Point Source Radiation Calculator Panel */}
            <Chakra.TabPanel px={{ base: 0, sm: 4 }}>
              <CalculatorPanel
                title="Point Source Radiation Calculator"
                description="Calculates radiative heat flux using the Point Source Radiation Model."
              >
                <PointSourceCalculator />
              </CalculatorPanel>
            </Chakra.TabPanel>

            {/* Flashover Calculator Panel */}
            <Chakra.TabPanel px={{ base: 0, sm: 4 }}>
              <CalculatorPanel
                title="Flashover Calculator"
                description="Estimate minimum heat release rate required for flashover using MQH, Babrauskas, and Thomas correlations."
              >
                <FlashoverCalculator />
              </CalculatorPanel>
            </Chakra.TabPanel>

            {/* T-Squared Growth Calculator Panel */}
            <Chakra.TabPanel px={{ base: 0, sm: 4 }}>
              <CalculatorPanel
                title="T-Squared Fire Growth Calculator"
                description="Calculate heat release rate over time using the t-squared fire growth model with standard growth rate coefficients (slow, medium, fast, ultra-fast)."
              >
                <TSquaredCalculator />
              </CalculatorPanel>
            </Chakra.TabPanel>

            {/* Reference Data Panel */}
            <Chakra.TabPanel>
              <Chakra.VStack spacing={4} align="stretch">
                <Chakra.Heading size="md">Reference Data</Chakra.Heading>
                <Chakra.Text color="fd.muted" fontSize="sm">
                  Material properties, heat release rates, and mass flux values for common fuels and materials.
                </Chakra.Text>
                <ReferenceGuide />
              </Chakra.VStack>
            </Chakra.TabPanel>
          </Chakra.TabPanels>
        </Chakra.Tabs>
        </HrrTransferProvider>
      </Chakra.Container>
      <FeedbackModal isOpen={feedback.isOpen} onClose={feedback.onClose} appVersion={APP_VERSION} />
    </Chakra.Box>
  );
};

// The access code is checked on the server (netlify/edge-functions), so by the
// time this app loads the person has already entered it. Each time the app opens
// we confirm the session is still good; if the code was changed or the session
// ended, the person is sent back to the access page.
function App() {
  useEffect(() => {
    checkAccess();
  }, []);

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Chakra.ChakraProvider theme={theme}>
        <MainApp />
      </Chakra.ChakraProvider>
    </>
  );
}

export default App;