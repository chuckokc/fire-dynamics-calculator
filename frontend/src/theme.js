import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: true, // This will respect the user's system preference
};

// Secondary text (descriptions, "Where:" lists, units, small notes).
// A fixed gray.600 is fine on a light page but only 2.2:1 on the dark page,
// so this token swaps to a lighter gray in dark mode (WCAG wants 4.5:1).
// Use color="fd.muted" instead of color="fd.muted" / "gray.600".
export const MUTED_TEXT = { light: 'gray.600', dark: 'gray.300' };

const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      fd: {
        muted: { default: MUTED_TEXT.light, _dark: MUTED_TEXT.dark },
      },
    },
  },
});

export default theme;
