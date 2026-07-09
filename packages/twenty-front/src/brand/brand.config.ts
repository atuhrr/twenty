/* oxlint-disable twenty/no-hardcoded-colors */
export const BRAND = {
  mode: 'kommo-faithful' as const,
  primary: '#071689',
  accent: '#D4AF37',
} satisfies {
  mode: 'kommo-faithful' | 'voka';
  primary: string;
  accent: string;
};
