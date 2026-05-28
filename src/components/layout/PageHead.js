import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SplitTitle from '@/components/SplitTitle';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from './useThemeColors';

// Standard screen header: optional back link, title, subtitle, actions and a stat strip.
// stats: [{ key, icon?, label, value }]. back: { to, label }.
export default function PageHead({ title, sub, actions, stats, back }) {
  const router = useRouter();
  const colors = useThemeColors();
  return (
    <View className="gap-[12px]">
      {back ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate(back.to)}
          className="self-start flex-row items-center gap-[4px] min-h-[36px] pr-[10px] rounded-[10px] active:bg-well"
        >
          <Icon name="chevL" size={16} color={colors.muted} />
          <Text className="text-[13px] font-semibold text-muted">{back.label}</Text>
        </Pressable>
      ) : null}
      <View className="gap-[4px]">
        <SplitTitle text={title} />
        {sub ? <Text className="text-[14px] text-muted">{sub}</Text> : null}
      </View>
      {actions ? <View className="flex-row flex-wrap items-center gap-[8px]">{actions}</View> : null}
      {stats?.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[10px]">
          {stats.map((s) => (
            <View key={s.key} className="flex-row items-center gap-[10px] min-w-[120px] px-[14px] py-[10px] rounded-[15px] bg-surface border border-border">
              {s.icon ? (
                <View className="w-[32px] h-[32px] rounded-[10px] bg-well items-center justify-center">
                  <Icon name={s.icon} size={16} color={colors.muted} />
                </View>
              ) : null}
              <View>
                <Text className="text-[18px] font-bold text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
                  {s.value}
                </Text>
                <Text className="text-[12px] text-muted">{s.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
