import { createElement } from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { GLYPH_DATA } from './glyphs';
import { sizeFrom, textTokenFrom, useThemeColor } from './useThemeColor';

const TAGS = {
  path: Path,
  circle: Circle,
  ellipse: Ellipse,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  rect: Rect,
  g: G,
};

const LOGO = require('../../../assets/images/collabor8r.webp');

export function BrandMark({ size = 24, style, className, ...props }) {
  return (
    <Image
      source={LOGO}
      accessible={false}
      className={className}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      {...props}
    />
  );
}

// Names callers use that map onto an existing glyph (same Lucide icon as the client).
const ALIASES = {
  chevD: 'down', // LuChevronDown
  chevDown: 'down',
  chevU: 'up',
  sort: 'upDown', // LuArrowUpDown
  flow: 'workflow', // LuWorkflow
  hash: 'points', // LuHash
};

// Shown for an unknown name so nothing silently disappears (a small circle).
const FALLBACK = [{ t: 'circle', a: { cx: '12', cy: '12', r: '4' } }];

function resolve(name) {
  if (typeof name !== 'string') return null;
  const key = Object.prototype.hasOwnProperty.call(GLYPH_DATA, name) ? name : ALIASES[name];
  return key ? GLYPH_DATA[key] : null;
}

// Read-only key list, so data mappers (utils/issueVisuals.js) can check a
// server icon string against the one icon source without importing glyphs.
export const GLYPH_NAMES = Object.freeze([...Object.keys(GLYPH_DATA), ...Object.keys(ALIASES)]);

export function hasGlyph(name) {
  return resolve(name) != null;
}

function renderNode(node, key) {
  const Comp = TAGS[node.t];
  if (!Comp) return null;
  const children = node.c ? node.c.map((c, i) => renderNode(c, i)) : undefined;
  return createElement(Comp, { key, ...node.a }, children);
}

// Same API as the client Icon (name, cls, label) plus RN-style size, color, strokeWidth.
// A text-<token> or w-[Npx] class in cls/className picks the colour and size.
export function Icon({ name, size, color, strokeWidth = 2, cls = '', className, label, style, ...rest }) {
  const classes = [cls, className].filter(Boolean).join(' ');
  const token = textTokenFrom(classes) ?? 'foreground';
  const themed = useThemeColor(token);
  let data = resolve(name);
  if (!data) {
    if (!name) return null;
    if (__DEV__) console.warn(`Icon: unknown glyph name "${name}"`);
    data = FALLBACK;
  }
  const px = size ?? sizeFrom(classes) ?? 16;
  if (data === 'logo') return <BrandMark size={px} style={style} {...rest} />;
  const stroke = color ?? themed;
  return (
    <Svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      color={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
      {...rest}
    >
      {data.map((n, i) => renderNode(n, i))}
    </Svg>
  );
}

export default Icon;
