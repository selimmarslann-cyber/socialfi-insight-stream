export const colors = {
  background: '#F5F8FF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFF3FF',
  surfaceElevated: '#FFFFFF',
  borderSubtle: 'rgba(15, 23, 42, 0.06)',
  borderStrong: 'rgba(15, 23, 42, 0.12)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#6B7280',
  accentIndigo: '#4F46E5',
  accentCyan: '#06B6D4',
  accentGradient: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
  chipGold: '#F5C76A',
  danger: '#EF4444',
  success: '#22C55E',
} as const;

export const radii = {
  card: '16px',
  chip: '999px',
  button: '999px',
  input: '12px',
} as const;

export const shadows = {
  card: '0 18px 45px rgba(15, 23, 42, 0.06)',
  subtle: '0 8px 20px rgba(15, 23, 42, 0.04)',
} as const;

export const spacing = {
  page: '24px',
  section: '20px',
  cardPadding: '16px',
  gridGap: '16px',
} as const;

export const typography = {
  h1: 'text-2xl md:text-3xl font-semibold tracking-tight',
  h2: 'text-xl md:text-2xl font-semibold tracking-tight',
  h3: 'text-lg font-semibold',
  body: 'text-sm md:text-base text-slate-600',
  label: 'text-xs font-medium uppercase tracking-wide text-slate-500',
  monospace: 'font-mono text-xs text-slate-500',
} as const;
