import { Text } from 'react-native';

// The client animated each character with GSAP. Mobile renders a plain title with the same props.
export const SPLIT = { from: {}, to: {} };

// Kept for API parity. There is no DOM to animate.
export function revealChars() {
  return null;
}

export default function SplitTitle({ text, as, className = 'text-[26px] font-bold text-foreground tracking-[-0.02em]', delay, ...rest }) {
  return (
    <Text accessibilityRole="header" className={className} {...rest}>
      {text}
    </Text>
  );
}
