import { useUniwind } from 'uniwind';
import { getColors } from '@/config/theme';

// Raw colour values for the active theme. For props that cannot take a className
// (Icon color, placeholderTextColor, RefreshControl tint, svg strokes).
export function useThemeColors() {
  const { theme } = useUniwind();
  return getColors(theme);
}

export default useThemeColors;
