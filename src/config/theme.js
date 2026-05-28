// Theme config for the mobile app. Ported from the client's src/styles (shell.css tokens),
// src/utils/store.js (useTheme: 'light' | 'dark' | 'system', key "hearth:theme") and index.css (@font-face).
import { Uniwind } from 'uniwind';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';

export const THEME_NAMES = ['light', 'dark', 'system'];
export const THEME_STORAGE_KEY = 'hearth:theme';
export const DEFAULT_THEME = 'light';

// Apply a theme. 'system' lets Uniwind follow the OS colour scheme (adaptive themes).
export function setTheme(name) {
  const next = THEME_NAMES.includes(name) ? name : DEFAULT_THEME;
  try {
    Uniwind.setTheme(next);
  } catch {
    // Theme engine not ready yet. The next change applies it.
  }
  return next;
}

// Current resolved theme ('light' | 'dark').
export function currentTheme() {
  return Uniwind.currentTheme === 'dark' ? 'dark' : 'light';
}

// Fonts for expo-font: `const [loaded] = useFonts(FONTS)` in app/_layout.js.
// The client ships variable WOFF2 subsets (assets/fonts, kept for reference only; RN cannot load them).
// Static TTF instances come from @expo-google-fonts. Family names below match global.css --font-* tokens.
export const FONTS = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
};

export const FONT_FAMILY = {
  body: 'Manrope_500Medium', // client --font, body 500 14px/1.45
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold', // buttons, badges
  display: 'BricolageGrotesque_600SemiBold', // client --display, headings
  displayMedium: 'BricolageGrotesque_500Medium',
  displayBold: 'BricolageGrotesque_700Bold',
};

export const RADIUS = { card: 15, ctl: 12, sheet: 24 };
export const GAP = { comfortable: 16, compact: 12 };
export const EASE = [0.2, 0.8, 0.2, 1]; // Easing.bezier(...EASE) for Reanimated
export const BRAND_GRADIENT = ['#e86640', '#c94820']; // .btn--ember gradient

// Raw colour values (same as global.css) for svg charts, icons, StatusBar, navigation themes.
export const COLORS = {
  light: {
    'background': '#f3efe8',
    'bg': '#f3efe8',
    'surface': '#fffdfa',
    'surface-2': '#f7f3ed',
    'float': '#fffdfa',
    'well': '#281e140e',
    'foreground': '#1d1915',
    'text': '#1d1915',
    'muted': '#6b645c',
    'faint': '#978f86',
    'cream': '#fbf8f2',
    'accent': '#e4572e',
    'on-accent': '#fffaf5',
    'ember': '#e4572e',
    'on-ember': '#fffaf5',
    'ember-t': '#b53f19',
    'ember-soft': '#fbe6dd',
    'iris': '#5b52d6',
    'on-iris': '#fbfaff',
    'iris-t': '#4a41c4',
    'iris-soft': '#e8e6fb',
    'spruce': '#0a8f74',
    'on-spruce': '#f5fffb',
    'spruce-t': '#0a7a63',
    'spruce-soft': '#dcf2ec',
    'saffron': '#c98a12',
    'on-saffron': '#1d1915',
    'saffron-t': '#8f600a',
    'saffron-soft': '#f8ecd2',
    'ink': '#1d1915',
    'on-ink': '#fbf8f2',
    'border': '#281e1417',
    'line': '#281e1417',
    'border-strong': '#281e1429',
    'line-2': '#281e1429',
    'danger': '#c2401b',
    'bad': '#c2401b',
    'danger-solid': '#c2401b',
    'success': '#0a7a63',
    'good': '#0a7a63',
    'warning': '#c98a12',
    'warning-t': '#8f600a',
    'side-bg': '#1b1714',
    'side-text': '#efe9e1',
    'side-muted': '#a1978d',
    'side-pill': '#2e2824',
    'side-line': '#ffffff14',
    'glow-a': '#e4572e29',
    'glow-b': '#5b52d61f',
    'backdrop': '#1d191566',
    'shadow': '#3c2814',
    'pp-lane': '#281e140e',
    'pp-lane-rim': '#281e1417',
    'pp-card': '#fffdfa',
    'av-t0': '#f7cdbb',
    'av-t1': '#d4d1f6',
    'av-t2': '#c4e7dd',
    'av-t3': '#f3dfae',
    'av-ink': '#1d1915',
    'white': '#ffffff',
  },
  dark: {
    'background': '#141210',
    'bg': '#141210',
    'surface': '#1e1b19',
    'surface-2': '#26221f',
    'float': '#2a2622',
    'well': '#ffffff0f',
    'foreground': '#f2ede6',
    'text': '#f2ede6',
    'muted': '#a9a198',
    'faint': '#81796f',
    'cream': '#fbf8f2',
    'accent': '#e15a33',
    'on-accent': '#fffaf5',
    'ember': '#e15a33',
    'on-ember': '#fffaf5',
    'ember-t': '#f39a7b',
    'ember-soft': '#e15a3329',
    'iris': '#7a72e6',
    'on-iris': '#fbfaff',
    'iris-t': '#aaa4f5',
    'iris-soft': '#7a72e62e',
    'spruce': '#1f9e82',
    'on-spruce': '#f5fffb',
    'spruce-t': '#5ccfb1',
    'spruce-soft': '#1f9e822b',
    'saffron': '#be8a2a',
    'on-saffron': '#17130f',
    'saffron-t': '#e2b866',
    'saffron-soft': '#be8a2a2e',
    'ink': '#f2ede6',
    'on-ink': '#1d1915',
    'border': '#ffffff16',
    'line': '#ffffff16',
    'border-strong': '#ffffff29',
    'line-2': '#ffffff29',
    'danger': '#f39a7b',
    'bad': '#f39a7b',
    'danger-solid': '#c2401b',
    'success': '#5ccfb1',
    'good': '#5ccfb1',
    'warning': '#be8a2a',
    'warning-t': '#e2b866',
    'side-bg': '#0f0d0c',
    'side-text': '#efe9e1',
    'side-muted': '#a1978d',
    'side-pill': '#26211d',
    'side-line': '#ffffff14',
    'glow-a': '#e15a3324',
    'glow-b': '#7a72e61f',
    'backdrop': '#00000099',
    'shadow': '#000000',
    'pp-lane': '#ffffff06',
    'pp-lane-rim': '#ffffff12',
    'pp-card': '#26221f',
    'av-t0': '#f7cdbb',
    'av-t1': '#d4d1f6',
    'av-t2': '#c4e7dd',
    'av-t3': '#f3dfae',
    'av-ink': '#1d1915',
    'white': '#ffffff',
  },
};

export function getColors(theme = currentTheme()) {
  return COLORS[theme === 'dark' ? 'dark' : 'light'];
}

// Chart / tone palette (client .chart, .status, calendar kinds).
export const TONES = ['ember', 'iris', 'spruce', 'saffron'];

// Static assets ported from the client's public/ folder.
export const AVATAR_KEYS = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg', '11.jpg', '12.jpg'];
export const AVATAR_IMAGES = {
  '1.jpg': require('../../assets/avatars/1.jpg'),
  '2.jpg': require('../../assets/avatars/2.jpg'),
  '3.jpg': require('../../assets/avatars/3.jpg'),
  '4.jpg': require('../../assets/avatars/4.jpg'),
  '5.jpg': require('../../assets/avatars/5.jpg'),
  '6.jpg': require('../../assets/avatars/6.jpg'),
  '7.jpg': require('../../assets/avatars/7.jpg'),
  '8.jpg': require('../../assets/avatars/8.jpg'),
  '9.jpg': require('../../assets/avatars/9.jpg'),
  '10.jpg': require('../../assets/avatars/10.jpg'),
  '11.jpg': require('../../assets/avatars/11.jpg'),
  '12.jpg': require('../../assets/avatars/12.jpg'),
};

export const THEME_KEYS = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'];
export const THEME_IMAGES = {
  '1.jpg': require('../../assets/themes/1.jpg'),
  '2.jpg': require('../../assets/themes/2.jpg'),
  '3.jpg': require('../../assets/themes/3.jpg'),
  '4.jpg': require('../../assets/themes/4.jpg'),
  '5.jpg': require('../../assets/themes/5.jpg'),
  '6.jpg': require('../../assets/themes/6.jpg'),
  '7.jpg': require('../../assets/themes/7.jpg'),
};

export const BRAND_MARK = require('../../assets/images/collabor8r.webp');

// Illustration SVG files (light/dark pairs) in assets/illustrations/<name>-<theme>.svg.
// Rendering SVG files needs react-native-svg-transformer in metro, or expo-image (supports SVG): <Image source={ILLUSTRATIONS.empty.light} />.
export const ILLUSTRATION_NAMES = ['auth', 'automation', 'empty', 'forms', 'integrations', 'security', 'settings', 'team', 'wiki'];
export const ILLUSTRATIONS = {
  auth: { light: require('../../assets/illustrations/auth-light.svg'), dark: require('../../assets/illustrations/auth-dark.svg') },
  automation: { light: require('../../assets/illustrations/automation-light.svg'), dark: require('../../assets/illustrations/automation-dark.svg') },
  empty: { light: require('../../assets/illustrations/empty-light.svg'), dark: require('../../assets/illustrations/empty-dark.svg') },
  forms: { light: require('../../assets/illustrations/forms-light.svg'), dark: require('../../assets/illustrations/forms-dark.svg') },
  integrations: { light: require('../../assets/illustrations/integrations-light.svg'), dark: require('../../assets/illustrations/integrations-dark.svg') },
  security: { light: require('../../assets/illustrations/security-light.svg'), dark: require('../../assets/illustrations/security-dark.svg') },
  settings: { light: require('../../assets/illustrations/settings-light.svg'), dark: require('../../assets/illustrations/settings-dark.svg') },
  team: { light: require('../../assets/illustrations/team-light.svg'), dark: require('../../assets/illustrations/team-dark.svg') },
  wiki: { light: require('../../assets/illustrations/wiki-light.svg'), dark: require('../../assets/illustrations/wiki-dark.svg') },
};
