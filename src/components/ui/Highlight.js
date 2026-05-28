import { Text } from 'react-native';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Returns nested Text nodes, so render it inside a parent <Text>.
export default function Highlight({ text = '', query = '' }) {
  const q = String(query ?? '').trim();
  const value = String(text ?? '');
  if (!q) return value;
  const parts = value.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} className="bg-saffron-soft text-foreground font-sans-bold">
        {part}
      </Text>
    ) : (
      part
    ),
  );
}
