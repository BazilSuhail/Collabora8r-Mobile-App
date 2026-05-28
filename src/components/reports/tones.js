import { useUniwind } from "uniwind";

// Chart series colours (same values as the web shell.css tokens). SVG strokes and
// animated widths need real colours, so charts read them from here instead of className.
const LIGHT = {
  ember: "#e4572e",
  iris: "#5b52d6",
  spruce: "#0a8f74",
  saffron: "#c98a12",
  ink: "#1d1915",
  muted: "#978f86",
  faint: "#978f86",
  text: "#1d1915",
  textMuted: "#6b645c",
  surface: "#ffffff",
  well: "rgba(40,30,20,0.055)",
  line: "rgba(40,30,20,0.09)",
};

const DARK = {
  ember: "#e15a33",
  iris: "#7a72e6",
  spruce: "#1f9e82",
  saffron: "#be8a2a",
  ink: "#f2ede6",
  muted: "#81796f",
  faint: "#81796f",
  text: "#f2ede6",
  textMuted: "#a9a198",
  surface: "#1d1915",
  well: "rgba(255,255,255,0.06)",
  line: "rgba(255,255,255,0.09)",
};

export function useChartColors() {
  const { theme } = useUniwind();
  return theme === "dark" ? DARK : LIGHT;
}

export const toneColor = (colors, tone) => colors[tone] ?? colors.ember;
