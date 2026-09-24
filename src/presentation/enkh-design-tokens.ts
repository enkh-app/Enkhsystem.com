export const enkhTokens = Object.freeze({
  color: {
    canvas: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceSoft: '#EAF2FA',
    border: '#DFEAF7',
    borderMuted: '#EDF1F6',
    ink: '#0B1F33',
    text: '#243B53',
    muted: '#627D98',
    quiet: '#829AB1',
    primary: '#2F6FE4',
    primaryStrong: '#0B57D0',
    positive: '#147D4A',
    warning: '#744139',
  },
  radius: { small: 12, control: 14, card: 20, composer: 22 },
  space: { xs: 6, sm: 10, md: 14, lg: 18, xl: 22, xxl: 32 },
  type: { body: 16, small: 13, title: 29, weightStrong: 800, weightHeavy: 900 },
  layout: { mobilePadding: 18, desktopMaxWidth: 1060, touchTarget: 44 },
});

export type EnkhDesignTokens = typeof enkhTokens;
