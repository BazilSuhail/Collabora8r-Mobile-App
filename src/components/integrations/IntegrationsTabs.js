// feat(screens/integrations/components/IntegrationsTabs): switch between the integrations catalog and the webhooks list.
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const OPTIONS = [
  { value: 'integrations', label: 'Integrations' },
  { value: 'webhooks', label: 'Webhooks' },
];

export default function IntegrationsTabs({ pid, active }) {
  const router = useRouter();
  const base = `/p/${encodeURIComponent(String(pid))}/integrations`;

  const go = (value) => {
    if (value === active) return;
    router.replace(value === 'webhooks' ? `${base}/webhooks` : base);
  };

  return (
    <View className="flex-row bg-surface border border-border rounded-[12px] p-[3px]" accessibilityRole="tablist">
      {OPTIONS.map((o) => {
        const on = o.value === active;
        return (
          <Pressable
            key={o.value}
            onPress={() => go(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            className={`flex-1 items-center rounded-[9px] py-[8px] ${on ? 'bg-accent' : ''}`}
          >
            <Text className={`text-[13.5px] font-semibold ${on ? 'text-on-accent' : 'text-foreground'}`}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
