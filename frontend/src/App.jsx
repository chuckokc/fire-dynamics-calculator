import { useState } from 'react';
import * as Chakra from '@chakra-ui/react';
import { ArrowUpFromLine, BookOpen, Flame, House, Mail, Moon, Radiation, Sun, TrendingUp } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import HeatReleaseCalculator from './components/calculators/HeatReleaseCalculator';
import FlameHeightCalculator from './components/calculators/FlameHeightCalculator';
import PointSourceCalculator from './components/calculators/PointSourceCalculator';
import FlashoverCalculator from './components/calculators/FlashoverCalculator';
import TSquaredCalculator from './components/calculators/TSquaredCalculator';
import ReferenceGuide from './components/reference/ReferenceGuide';
import Authentication from './components/Authentication';
import usePersistentState from './hooks/usePersistentState';
import UnitsProvider from './units/UnitsProvider';
import theme from './theme';

const APP_VERSION = __APP_VERSION__;
const FEEDBACK_URL = 'mailto:chuckokc@gmail.com?subject=Fire%20Dynamics%20Calculator%20Feedback';
const AUTH_KEY = 'fireCalcAuth';

const ReferencePanel = () => (
  <Chakra.Stack spacing={2}>
    <Chakra.Heading as="h2" size="md">
      Reference Data
    </Chakra.Heading>
    <Chakra.Text color="text.muted" fontSize="sm">
      Material properties, heat release rates and mass flux values for common fuels and materials.
    </Chakra.Text>
    <ReferenceGuide />
  </Chakra.Stack>
);

const SECTIONS = [
  { label: 'Heat Release Rate', short: 'HRR', icon: Flame, Component: HeatReleaseCalculator },
  { label: 'Flame Height', short: 'Flame', icon: ArrowUpFromLine, Component: FlameHeightCalculator },
  { label: 'Point Source Radiation', short: 'Radiation', icon: Radiation, Component: PointSourceCalculator },
  { label: 'Flashover', short: 'Flashover', icon: House, Component: FlashoverCalculator },
  { label: 'T-Squared Growth', short: 'Growth', icon: TrendingUp, Component: TSquaredCalculator },
  { label: 'Reference Data', short: 'Reference', icon: BookOpen, Component: ReferencePanel },
];

const validTab = (stored, fallback) =>
  Number.isInteger(stored) && stored >= 0 && stored < SECTIONS.length ? stored : fallback;

// Bottom navigation for phones; tablets and desktops use the tabs instead.
function BottomNav({ index, onSelect }) {
  return (
    <Chakra.Flex
      as="nav"
      aria-label="Calculators"
      className="fdc-bottom-nav"
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex="sticky"
      bg="bg.surface"
      borderTopWidth="1px"
      borderColor="border.default"
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.08)"
      pb="env(safe-area-inset-bottom)"
      px="env(safe-area-inset-left)"
    >
      {SECTIONS.map(({ short, label, icon: Icon }, i) => {
        const isActive = i === index;
        return (
          <Chakra.Flex
            key={label}
            as="button"
            type="button"
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(i)}
            flex="1"
            minW={0}
            h="60px"
            direction="column"
            align="center"
            justify="center"
            gap="3px"
            color={isActive ? 'accent.fg' : 'text.muted'}
            fontWeight={isActive ? 'bold' : 'medium'}
            borderTopWidth="3px"
            borderTopColor={isActive ? 'accent.fg' : 'transparent'}
            _focusVisible={{ boxShadow: 'outline', outline: 'none' }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
            <Chakra.Text fontSize="11px" lineHeight="1" noOfLines={1}>
              {short}
            </Chakra.Text>
          </Chakra.Flex>
        );
      })}
    </Chakra.Flex>
  );
}

function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <Chakra.Box position="fixed" bottom="calc(var(--fdc-nav-h) + 12px)" left={3} right={3} mx="auto" maxW="md" zIndex="toast">
      <Chakra.Alert status="info" variant="solid" borderRadius="md" boxShadow="lg" alignItems="center">
        <Chakra.AlertIcon />
        <Chakra.Box flex="1">
          <Chakra.AlertTitle>Update available</Chakra.AlertTitle>
          <Chakra.AlertDescription fontSize="sm">A new version is ready.</Chakra.AlertDescription>
        </Chakra.Box>
        <Chakra.Button variant="ghost" color="white" _hover={{ bg: 'whiteAlpha.300' }} onClick={() => setNeedRefresh(false)}>
          Later
        </Chakra.Button>
        <Chakra.Button bg="white" color="blue.700" _hover={{ bg: 'blue.50' }} ml={1} onClick={() => updateServiceWorker(true)}>
          Update
        </Chakra.Button>
      </Chakra.Alert>
    </Chakra.Box>
  );
}

// MainApp contains the calculators and navigation.
const MainApp = () => {
  const { colorMode, toggleColorMode } = Chakra.useColorMode();
  const [tab, setTab] = usePersistentState('fdc.activeTab', 0, validTab);

  const selectFromNav = (index) => {
    setTab(index);
    window.scrollTo({ top: 0 });
  };

  return (
    <Chakra.Box minH="100vh" bg="bg.page" pb="var(--fdc-nav-h)">
      <UpdatePrompt />

      <Chakra.Container
        maxW="container.xl"
        pl={{ base: 'max(1rem, env(safe-area-inset-left))', md: 6 }}
        pr={{ base: 'max(1rem, env(safe-area-inset-right))', md: 6 }}
      >
        <Chakra.Flex as="header" align="center" justify="space-between" gap={2} pt={{ base: 3, md: 8 }} pb={{ base: 2, md: 6 }}>
          <Chakra.Box minW={0}>
            <Chakra.Heading as="h1" size={{ base: 'md', md: 'lg' }}>
              Fire Dynamics Calculator
            </Chakra.Heading>
            <Chakra.Text display={{ base: 'none', md: 'block' }} color="text.muted">
              Professional fire investigation tools based on NUREG-1805 methodology
            </Chakra.Text>
          </Chakra.Box>
          <Chakra.HStack spacing={1} flexShrink={0}>
            <Chakra.IconButton
              icon={colorMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              variant="ghost"
              onClick={toggleColorMode}
              aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            />
            <Chakra.IconButton
              as="a"
              href={FEEDBACK_URL}
              icon={<Mail size={20} />}
              variant="ghost"
              aria-label="Provide feedback"
              display={{ base: 'inline-flex', md: 'none' }}
            />
            <Chakra.Button
              as="a"
              href={FEEDBACK_URL}
              leftIcon={<Mail size={16} />}
              variant="ghost"
              colorScheme="blue"
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Provide Feedback
            </Chakra.Button>
          </Chakra.HStack>
        </Chakra.Flex>

        <Chakra.Tabs variant="enclosed" borderColor="border.default" index={tab} onChange={setTab} isLazy lazyBehavior="keepMounted">
          <Chakra.TabList
            display={{ base: 'none', md: 'flex' }}
            overflowX="auto"
            overflowY="hidden"
            sx={{ scrollbarWidth: 'thin', '&::-webkit-scrollbar': { height: '4px' } }}
          >
            {SECTIONS.map(({ label }) => (
              <Chakra.Tab key={label} flexShrink={0} whiteSpace="nowrap" minH="44px">
                {label}
              </Chakra.Tab>
            ))}
          </Chakra.TabList>

          <Chakra.TabPanels>
            {SECTIONS.map(({ label, Component }) => (
              <Chakra.TabPanel key={label} px={{ base: 0, md: 4 }} pt={{ base: 2, md: 6 }} pb={4}>
                <Component />
              </Chakra.TabPanel>
            ))}
          </Chakra.TabPanels>
        </Chakra.Tabs>

        <Chakra.Text as="footer" textAlign="center" fontSize="xs" color="text.subtle" py={6}>
          Fire Dynamics Calculator v{APP_VERSION} · Based on NUREG-1805 ·{' '}
          <Chakra.Link href={FEEDBACK_URL} color="accent.fg" display="inline-flex" alignItems="center" minH="44px">
            Feedback
          </Chakra.Link>
        </Chakra.Text>
      </Chakra.Container>

      <BottomNav index={tab} onSelect={selectFromNav} />
    </Chakra.Box>
  );
};

const readAuth = () => {
  try {
    return window.localStorage.getItem(AUTH_KEY) === 'granted';
  } catch {
    return false;
  }
};

// Main App component that handles authentication and renders either the auth screen or main app
function App() {
  // Read the stored access synchronously so returning users never see the login screen flash.
  const [isAuthenticated, setIsAuthenticated] = useState(readAuth);

  return (
    <>
      <Chakra.ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Chakra.ChakraProvider theme={theme} toastOptions={{ defaultOptions: { position: 'top' } }}>
        {isAuthenticated ? (
          <UnitsProvider>
            <MainApp />
          </UnitsProvider>
        ) : (
          <Authentication onAuthenticated={setIsAuthenticated} />
        )}
      </Chakra.ChakraProvider>
    </>
  );
}

export default App;
