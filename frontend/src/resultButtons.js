// Props shared by every action button in a result card (Copy, Save, and the
// "Use this HRR in…" menu), so they always look and size alike: outline blue
// (the solid blue Calculate button stays the one primary action), touch-sized and
// full width on a phone, compact and in one row on wider screens.
export const RESULT_BUTTON = {
  size: { base: 'md', sm: 'sm' },
  width: { base: '100%', sm: 'auto' },
  variant: 'outline',
  colorScheme: 'blue',
};
