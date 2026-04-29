export const colors = {
  bg: '#08090D',
  bgAlt: '#0D0B1A',
  card: '#141820',
  cardAlt: '#1C2030',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.4)',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#4C1D95',
  sky: '#0EA5E9',
  skyLight: '#38BDF8',
  orange: '#FB923C',
  orangeDark: '#EA580C',
  amber: '#FBBF24',
  good: '#4ADE80',
  okay: '#FBBF24',
  bad: '#F87171',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',
};

export const radii = { sm: 10, md: 14, lg: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const shadows = {
  primaryGlow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const type = {
  display: { fontWeight: '900' as const, letterSpacing: -1.2 },
  h1: { fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontWeight: '800' as const, letterSpacing: -0.4 },
  body: { fontWeight: '600' as const },
  eyebrow: { fontWeight: '700' as const, letterSpacing: 1, textTransform: 'uppercase' as const, fontSize: 11 },
};
