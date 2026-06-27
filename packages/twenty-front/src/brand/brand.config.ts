/* oxlint-disable twenty/no-hardcoded-colors */
export const BRAND = {
  mode: 'kommo-faithful' as const,
  primary: '#7C3AED',
  accent: '#D4AF37',
} satisfies {
  mode: 'kommo-faithful' | 'voka';
  primary: string;
  accent: string;
};
