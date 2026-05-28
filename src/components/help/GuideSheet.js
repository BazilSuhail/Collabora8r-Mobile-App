// feat(components/help/GuideSheet): show one product guide as a bottom sheet with its numbered steps.
import { Text, View } from 'react-native';
import { Sheet } from '@/components/issues/sheets';

export default function GuideSheet({ guide, open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title={guide?.title ?? 'Guide'} subtitle={guide?.summary}>
      {guide ? (
        <View className="gap-[12px]">
          {guide.steps.map((step, i) => (
            <View key={step} className="flex-row gap-[10px]">
              <Text className="text-muted font-bold text-[14.5px] w-[22px] text-right">{i + 1}.</Text>
              <Text className="flex-1 text-foreground text-[14.5px] leading-[22px]">{step}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}
