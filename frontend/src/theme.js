import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: true, // This will respect the user's system preference
};

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: { bg: 'bg.page' },
    },
  },
  // Colors that adapt to light/dark mode. Use these instead of fixed grays so
  // secondary text stays readable on the dark background.
  semanticTokens: {
    colors: {
      'bg.page': { default: 'gray.50', _dark: 'gray.900' },
      'bg.surface': { default: 'white', _dark: 'gray.800' },
      'bg.subtle': { default: 'gray.50', _dark: 'gray.700' },
      'border.default': { default: 'gray.200', _dark: 'gray.600' },
      'text.muted': { default: 'gray.600', _dark: 'gray.300' },
      'text.subtle': { default: 'gray.500', _dark: 'gray.400' },
      'accent.fg': { default: 'blue.600', _dark: 'blue.300' },
    },
  },
  components: {
    // 44px minimum touch targets for the default button size.
    Button: { sizes: { md: { h: '2.75rem', minW: '2.75rem' } } },
  },
});

export default theme;
