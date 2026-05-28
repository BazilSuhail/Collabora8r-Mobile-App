import { useCSSVariable } from 'uniwind';

// Light fallbacks, used only if the theme variable is not resolvable.
const FALLBACK = {
  foreground: '#1d1915',
  text: '#1d1915',
  muted: '#6b645c',
  faint: '#978f86',
  accent: '#e4572e',
  ember: '#e4572e',
  'ember-t': '#b53f19',
  'on-ember': '#fffaf5',
  'on-ink': '#fbf8f2',
  ink: '#1d1915',
  danger: '#c2401b',
  bad: '#c2401b',
  success: '#0a7a63',
  surface: '#fffdfa',
  float: '#fffdfa',
  background: '#f3efe8',
  border: '#281e1417',
  'line-2': '#281e1429',
  well: '#281e140e',
  white: '#ffffff',
  shadow: '#3c2814',
  'seg-pill': '#fffdfa',
};

// Resolves a theme token (global.css --color-<token>) to a colour string for
// props that cannot take a className (svg stroke, Switch trackColor, ...).
export function useThemeColor(token = 'foreground') {
  const v = useCSSVariable(`--color-${token}`);
  if (typeof v === 'string' && v) return v;
  return FALLBACK[token] ?? FALLBACK.foreground;
}

// Pulls the colour token out of a class string such as "text-danger w-[12px]".
const SIZE_WORDS = /^(xs|sm|base|lg|xl|\dxl|\[.*\]|left|right|center|justify|start|end)$/;
export function textTokenFrom(className) {
  if (!className) return null;
  const parts = String(className).split(/\s+/);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const m = /^text-([a-z0-9-]+)$/.exec(parts[i]);
    if (m && !SIZE_WORDS.test(m[1])) return m[1];
  }
  return null;
}

// Pulls a pixel size out of "w-[12px] h-[12px]" or "size-[16px]".
export function sizeFrom(className) {
  if (!className) return null;
  const m = /(?:^|\s)(?:size|w|h)-\[(\d+(?:\.\d+)?)px\]/.exec(String(className));
  return m ? Number(m[1]) : null;
}

export default useThemeColor;
