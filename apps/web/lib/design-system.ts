/**
 * LipaBit Design System
 *
 * A premium fintech token system for a Bitcoin/M-Pesa exchange platform.
 * Aesthetic references: Binance, Coinbase, Revolut, Linear, Stripe dashboard.
 *
 * Color strategy:
 *  - Bitcoin orange  : #F7931A  (canonical Bitcoin orange, warm & trustworthy)
 *  - Near-black bg   : #0B0E11  (Binance-grade depth)
 *  - Accent surfaces : #1C1F26 / #22262F
 *  - Success         : #0ECB81  (Binance green, universal fintech signal)
 *  - Danger          : #F6465D  (Binance red)
 *  - Warning         : #F0B90B  (Binance gold / amber)
 */

// ---------------------------------------------------------------------------
// Raw palette — all hex literals, single source of truth
// ---------------------------------------------------------------------------

export const palette = {
  // Bitcoin brand
  bitcoin: {
    50:  '#FFF4E6',
    100: '#FFE4BF',
    200: '#FFCA85',
    300: '#FFAD47',
    400: '#FF9A24',
    500: '#F7931A', // canonical Bitcoin orange — primary brand
    600: '#E07800',
    700: '#B85F00',
    800: '#8A4600',
    900: '#5C2E00',
    950: '#3A1A00',
  },

  // Near-black backgrounds
  neutral: {
    0:   '#000000',
    50:  '#0B0E11', // page background
    100: '#131720', // elevated bg (nav, sidebar)
    150: '#1C1F26', // card surface
    200: '#22262F', // secondary card / input bg
    250: '#2B2F36', // border / divider
    300: '#363B44', // muted border / hover surface
    350: '#434A54', // disabled element
    400: '#5A6275', // subtle text
    500: '#848E9C', // secondary text
    600: '#A8B0BD', // tertiary text
    700: '#C9CDD4', // muted primary text
    800: '#EAECEF', // primary text
    850: '#F0F2F5', // near-white
    900: '#FFFFFF',
  },

  // Semantic status
  green: {
    50:  '#E6FBF3',
    100: '#B3F5DC',
    200: '#66EBB9',
    300: '#33E0A0',
    400: '#1AD68A',
    500: '#0ECB81', // success / buy / positive
    600: '#0AAD6D',
    700: '#078A57',
    800: '#046640',
    900: '#023D26',
  },

  red: {
    50:  '#FEE9EC',
    100: '#FBBFC7',
    200: '#F88F9C',
    300: '#F56070',
    400: '#F74D5E',
    500: '#F6465D', // danger / sell / negative
    600: '#D93450',
    700: '#B52341',
    800: '#8C1530',
    900: '#600A1F',
  },

  amber: {
    50:  '#FFFAEB',
    100: '#FFF0C2',
    200: '#FFE080',
    300: '#FFD040',
    400: '#F5C518',
    500: '#F0B90B', // warning / pending
    600: '#CC9B09',
    700: '#A37B07',
    800: '#7A5C05',
    900: '#523D03',
  },

  blue: {
    50:  '#E8F4FF',
    100: '#BDD9FF',
    200: '#85BBFF',
    300: '#4D9EFF',
    400: '#2688FF',
    500: '#1677FF', // info / link
    600: '#1262D6',
    700: '#0D4DAD',
    800: '#093883',
    900: '#062459',
  },
} as const;

// ---------------------------------------------------------------------------
// Color tokens — semantic layer that maps palette to roles
// ---------------------------------------------------------------------------

export const colorTokens = {
  dark: {
    // Backgrounds
    bgBase:          palette.neutral[50],   // #0B0E11 — root page bg
    bgElevated:      palette.neutral[100],  // #131720 — nav / sidebar
    bgCard:          palette.neutral[150],  // #1C1F26 — primary card
    bgCardSecondary: palette.neutral[200],  // #22262F — nested card / input
    bgHover:         palette.neutral[300],  // #363B44 — hover state surface
    bgOverlay:       'rgba(11,14,17,0.72)', // modal backdrop

    // Borders
    borderSubtle:    palette.neutral[250],  // #2B2F36 — default divider
    borderStrong:    palette.neutral[300],  // #363B44 — prominent border
    borderFocus:     palette.bitcoin[500],  // #F7931A — focus ring

    // Text
    textPrimary:     palette.neutral[800],  // #EAECEF
    textSecondary:   palette.neutral[500],  // #848E9C
    textMuted:       palette.neutral[400],  // #5A6275
    textInverse:     palette.neutral[50],   // #0B0E11 — on light surfaces
    textOnBrand:     palette.neutral[50],   // on bitcoin-orange buttons

    // Brand / primary action
    brandPrimary:    palette.bitcoin[500],  // #F7931A
    brandHover:      palette.bitcoin[400],  // #FF9A24
    brandActive:     palette.bitcoin[600],  // #E07800
    brandSubtle:     'rgba(247,147,26,0.12)',
    brandGlow:       'rgba(247,147,26,0.30)',

    // Semantic
    success:         palette.green[500],    // #0ECB81
    successSubtle:   'rgba(14,203,129,0.12)',
    successText:     palette.green[300],    // lighter on dark

    danger:          palette.red[500],      // #F6465D
    dangerSubtle:    'rgba(246,70,93,0.12)',
    dangerText:      palette.red[300],

    warning:         palette.amber[500],    // #F0B90B
    warningSubtle:   'rgba(240,185,11,0.12)',
    warningText:     palette.amber[300],

    info:            palette.blue[500],     // #1677FF
    infoSubtle:      'rgba(22,119,255,0.12)',
    infoText:        palette.blue[300],

    // Chart / price
    priceUp:         palette.green[500],    // #0ECB81
    priceDown:       palette.red[500],      // #F6465D
    priceNeutral:    palette.neutral[500],  // #848E9C
  },

  light: {
    // Backgrounds
    bgBase:          '#FFFFFF',
    bgElevated:      '#F7F8FA',
    bgCard:          '#FFFFFF',
    bgCardSecondary: '#F0F2F5',
    bgHover:         '#E8EAED',
    bgOverlay:       'rgba(255,255,255,0.72)',

    // Borders
    borderSubtle:    '#E4E7EC',
    borderStrong:    '#CBD2DA',
    borderFocus:     palette.bitcoin[500],

    // Text
    textPrimary:     '#0B0E11',
    textSecondary:   '#5A6275',
    textMuted:       '#848E9C',
    textInverse:     palette.neutral[800],
    textOnBrand:     '#FFFFFF',

    // Brand / primary action
    brandPrimary:    palette.bitcoin[500],
    brandHover:      palette.bitcoin[600],
    brandActive:     palette.bitcoin[700],
    brandSubtle:     'rgba(247,147,26,0.10)',
    brandGlow:       'rgba(247,147,26,0.25)',

    // Semantic
    success:         palette.green[600],
    successSubtle:   'rgba(10,173,109,0.10)',
    successText:     palette.green[700],

    danger:          palette.red[600],
    dangerSubtle:    'rgba(217,52,80,0.10)',
    dangerText:      palette.red[700],

    warning:         palette.amber[600],
    warningSubtle:   'rgba(204,155,9,0.10)',
    warningText:     palette.amber[700],

    info:            palette.blue[600],
    infoSubtle:      'rgba(18,98,214,0.10)',
    infoText:        palette.blue[700],

    priceUp:         palette.green[600],
    priceDown:       palette.red[600],
    priceNeutral:    palette.neutral[500],
  },
} as const;

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: {
    sans:  "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
    mono:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
    display: "'Inter', 'SF Pro Display', system-ui, sans-serif",
  },

  fontSize: {
    '2xs':  '0.625rem',  // 10px — badge labels, micro text
    xs:     '0.75rem',   // 12px — captions, footnotes
    sm:     '0.875rem',  // 14px — secondary body, input labels
    base:   '1rem',      // 16px — primary body
    md:     '1.0625rem', // 17px — slightly bumped body
    lg:     '1.125rem',  // 18px — subheading
    xl:     '1.25rem',   // 20px — card titles
    '2xl':  '1.5rem',    // 24px — section heading
    '3xl':  '1.875rem',  // 30px — page heading
    '4xl':  '2.25rem',   // 36px — hero heading
    '5xl':  '3rem',      // 48px — display / landing
    '6xl':  '3.75rem',   // 60px — super-display
    '7xl':  '4.5rem',    // 72px — billboard
  },

  fontWeight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },

  lineHeight: {
    none:    '1',
    tight:   '1.2',
    snug:    '1.35',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },

  letterSpacing: {
    tighter: '-0.04em',
    tight:   '-0.02em',
    normal:  '0em',
    wide:    '0.02em',
    wider:   '0.05em',
    widest:  '0.1em',
    caps:    '0.08em',
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing scale  (4px base grid)
// ---------------------------------------------------------------------------

export const spacing = {
  0:    '0px',
  px:   '1px',
  0.5:  '2px',
  1:    '4px',
  1.5:  '6px',
  2:    '8px',
  2.5:  '10px',
  3:    '12px',
  3.5:  '14px',
  4:    '16px',
  5:    '20px',
  6:    '24px',
  7:    '28px',
  8:    '32px',
  9:    '36px',
  10:   '40px',
  11:   '44px',
  12:   '48px',
  14:   '56px',
  16:   '64px',
  18:   '72px',
  20:   '80px',
  24:   '96px',
  28:   '112px',
  32:   '128px',
  36:   '144px',
  40:   '160px',
  48:   '192px',
  56:   '224px',
  64:   '256px',
  72:   '288px',
  80:   '320px',
  96:   '384px',
} as const;

// ---------------------------------------------------------------------------
// Border radius tokens
// ---------------------------------------------------------------------------

export const borderRadius = {
  none:   '0px',
  xs:     '2px',
  sm:     '4px',
  md:     '6px',
  DEFAULT:'8px',
  lg:     '10px',
  xl:     '12px',
  '2xl':  '16px',
  '3xl':  '20px',
  '4xl':  '24px',
  pill:   '9999px',
  circle: '50%',

  // Component-specific aliases
  button:  '8px',
  card:    '12px',
  input:   '8px',
  badge:   '9999px',
  modal:   '16px',
  tooltip: '6px',
  chip:    '9999px',
} as const;

// ---------------------------------------------------------------------------
// Shadow tokens
// ---------------------------------------------------------------------------

export const shadows = {
  // Elevation shadows (dark theme, subtle)
  none:   'none',
  xs:     '0 1px 2px rgba(0,0,0,0.40)',
  sm:     '0 2px 4px rgba(0,0,0,0.45)',
  md:     '0 4px 12px rgba(0,0,0,0.50)',
  lg:     '0 8px 24px rgba(0,0,0,0.55)',
  xl:     '0 16px 40px rgba(0,0,0,0.60)',
  '2xl':  '0 24px 64px rgba(0,0,0,0.65)',

  // Card inset border (gives subtle depth without stroke)
  cardInset: 'inset 0 1px 0 rgba(255,255,255,0.05)',

  // Brand glow effects
  glowBitcoinSm:  '0 0 12px rgba(247,147,26,0.40)',
  glowBitcoinMd:  '0 0 24px rgba(247,147,26,0.35), 0 0 48px rgba(247,147,26,0.15)',
  glowBitcoinLg:  '0 0 40px rgba(247,147,26,0.40), 0 0 80px rgba(247,147,26,0.20)',
  glowBitcoinBtn: '0 4px 20px rgba(247,147,26,0.45)',

  // Status glow
  glowSuccess: '0 0 20px rgba(14,203,129,0.35)',
  glowDanger:  '0 0 20px rgba(246,70,93,0.35)',
  glowWarning: '0 0 20px rgba(240,185,11,0.35)',
  glowInfo:    '0 0 20px rgba(22,119,255,0.35)',

  // Focus ring (accessibility)
  focusRing:       '0 0 0 3px rgba(247,147,26,0.50)',
  focusRingDanger: '0 0 0 3px rgba(246,70,93,0.50)',

  // Combined card shadow (elevation + inner border)
  card: '0 4px 12px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)',
  cardHover: '0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)',
} as const;

// ---------------------------------------------------------------------------
// Gradient definitions
// ---------------------------------------------------------------------------

export const gradients = {
  // Bitcoin orange brand gradients
  bitcoinLinear:   'linear-gradient(135deg, #F7931A 0%, #FFB84D 100%)',
  bitcoinRadial:   'radial-gradient(ellipse at center, #F7931A 0%, #E07800 100%)',
  bitcoinShimmer:  'linear-gradient(90deg, #E07800 0%, #F7931A 25%, #FFB84D 50%, #F7931A 75%, #E07800 100%)',
  bitcoinSubtle:   'linear-gradient(135deg, rgba(247,147,26,0.15) 0%, rgba(247,147,26,0.05) 100%)',
  bitcoinButton:   'linear-gradient(135deg, #FF9A24 0%, #F7931A 50%, #E07800 100%)',
  bitcoinButtonHover: 'linear-gradient(135deg, #FFAD47 0%, #FF9A24 50%, #F7931A 100%)',

  // Dark card & surface gradients
  cardDark:        'linear-gradient(145deg, #1C1F26 0%, #181B22 100%)',
  cardDarkHover:   'linear-gradient(145deg, #22262F 0%, #1C1F26 100%)',
  surfaceGlass:    'linear-gradient(145deg, rgba(28,31,38,0.90) 0%, rgba(22,26,31,0.80) 100%)',
  navBar:          'linear-gradient(180deg, #131720 0%, rgba(19,23,32,0.96) 100%)',
  pageHeader:      'linear-gradient(180deg, #0B0E11 0%, rgba(11,14,17,0) 100%)',

  // Hero / landing gradients
  heroBackground:  'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(247,147,26,0.18) 0%, rgba(11,14,17,0) 70%)',
  heroAccent:      'conic-gradient(from 180deg at 50% 50%, #0B0E11 0deg, rgba(247,147,26,0.10) 120deg, #0B0E11 240deg)',

  // Status gradients
  successGradient: 'linear-gradient(135deg, #0ECB81 0%, #0AAD6D 100%)',
  dangerGradient:  'linear-gradient(135deg, #F6465D 0%, #D93450 100%)',
  warningGradient: 'linear-gradient(135deg, #F0B90B 0%, #CC9B09 100%)',

  // Chart / price gradients (area fill under line)
  chartUp:         'linear-gradient(180deg, rgba(14,203,129,0.25) 0%, rgba(14,203,129,0) 100%)',
  chartDown:       'linear-gradient(180deg, rgba(246,70,93,0.25) 0%, rgba(246,70,93,0) 100%)',

  // Shimmer / skeleton loader
  skeleton:        'linear-gradient(90deg, #1C1F26 25%, #22262F 50%, #1C1F26 75%)',
  skeletonLight:   'linear-gradient(90deg, #F0F2F5 25%, #E4E7EC 50%, #F0F2F5 75%)',
} as const;

// ---------------------------------------------------------------------------
// Animation duration & easing tokens
// ---------------------------------------------------------------------------

export const animation = {
  duration: {
    instant:  '50ms',
    fast:     '100ms',
    normal:   '200ms',
    moderate: '300ms',
    slow:     '400ms',
    sluggish: '600ms',
    lazy:     '1000ms',
    shimmer:  '1800ms',
    pulse:    '2000ms',
    spin:     '1000ms',
  },

  easing: {
    linear:      'linear',
    easeIn:      'cubic-bezier(0.4, 0, 1, 1)',
    easeOut:     'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut:   'cubic-bezier(0.4, 0, 0.2, 1)',
    // Spring-like — for interactive UI elements
    spring:      'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // Snappy exit
    snappy:      'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    // Emphasised entry
    emphasis:    'cubic-bezier(0.2, 0, 0, 1)',
  },

  keyframes: {
    // Shimmer left-to-right (skeleton loaders)
    shimmer: {
      from: { backgroundPosition: '-200% 0' },
      to:   { backgroundPosition: '200% 0'  },
    },
    // Gentle price blink on update
    priceBlink: {
      '0%,100%': { opacity: '1' },
      '50%':     { opacity: '0.55' },
    },
    // Soft pulse glow (live price indicator dot)
    glowPulse: {
      '0%,100%': { boxShadow: '0 0 4px rgba(247,147,26,0.6)' },
      '50%':     { boxShadow: '0 0 16px rgba(247,147,26,1), 0 0 32px rgba(247,147,26,0.5)' },
    },
    // Fade-in + slide up (modals, sheets)
    fadeSlideUp: {
      from: { opacity: '0', transform: 'translateY(8px)' },
      to:   { opacity: '1', transform: 'translateY(0)'  },
    },
    // Scale pop (success confirmations)
    scalePop: {
      '0%':   { transform: 'scale(0.92)', opacity: '0' },
      '70%':  { transform: 'scale(1.04)' },
      '100%': { transform: 'scale(1)',    opacity: '1' },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Z-index scale
// ---------------------------------------------------------------------------

export const zIndex = {
  hide:       -1,
  base:        0,
  raised:      10,
  dropdown:    100,
  sticky:      200,
  overlay:     300,
  modal:       400,
  popover:     500,
  toast:       600,
  tooltip:     700,
  spotlight:   800,
} as const;

// ---------------------------------------------------------------------------
// Breakpoints  (mobile-first)
// ---------------------------------------------------------------------------

export const breakpoints = {
  xs:  '375px',
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  '2xl': '1440px',
  '3xl': '1920px',
} as const;

// ---------------------------------------------------------------------------
// Component-level tokens  (opinionated defaults per component type)
// ---------------------------------------------------------------------------

export const componentTokens = {
  button: {
    heightSm:    spacing[7],   // 28px
    heightMd:    spacing[10],  // 40px
    heightLg:    spacing[12],  // 48px
    paddingX:    spacing[4],   // 16px
    paddingXLg:  spacing[6],   // 24px
    radius:      borderRadius.button,
    fontWeight:  typography.fontWeight.semibold,
    transition:  `background-color ${animation.duration.normal} ${animation.easing.easeOut},
                  box-shadow ${animation.duration.normal} ${animation.easing.easeOut},
                  transform ${animation.duration.fast} ${animation.easing.spring}`,
  },

  input: {
    height:      spacing[12],  // 48px
    heightSm:    spacing[9],   // 36px
    paddingX:    spacing[4],   // 16px
    radius:      borderRadius.input,
    borderWidth: '1px',
    fontSizeBase: typography.fontSize.base,
  },

  card: {
    padding:     spacing[6],   // 24px
    paddingSm:   spacing[4],   // 16px
    paddingLg:   spacing[8],   // 32px
    radius:      borderRadius.card,
    borderWidth: '1px',
  },

  badge: {
    paddingX:    spacing[2.5],   // 10px
    paddingY:    spacing[0.5],   // 2px
    radius:      borderRadius.badge,
    fontWeight:  typography.fontWeight.medium,
    fontSize:    typography.fontSize.xs,
  },

  modal: {
    radius:      borderRadius.modal,
    padding:     spacing[8],    // 32px
    maxWidthSm:  '400px',
    maxWidthMd:  '560px',
    maxWidthLg:  '720px',
  },

  avatar: {
    sizes: {
      xs:  '24px',
      sm:  '32px',
      md:  '40px',
      lg:  '56px',
      xl:  '80px',
      '2xl': '120px',
    },
  },

  sidebar: {
    width:         '240px',
    widthCollapsed: '64px',
  },

  navbar: {
    height: '64px',
  },
} as const;

// ---------------------------------------------------------------------------
// Complete design system export (all tokens in one object)
// ---------------------------------------------------------------------------

export const ds = {
  palette,
  color:     colorTokens,
  typography,
  spacing,
  radius:    borderRadius,
  shadow:    shadows,
  gradient:  gradients,
  animation,
  z:         zIndex,
  breakpoint: breakpoints,
  component: componentTokens,
} as const;

export type DesignSystem = typeof ds;
export type ColorTheme   = 'dark' | 'light';

export default ds;
