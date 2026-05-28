// feat(app/(app)/settings/appearance): switch theme and density, remembered on this device.
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme, useDensity } from '@/utils/store';
import { THEME_OPTIONS, DENSITY_OPTIONS } from '@/metadata/settings';
import PageHead from '@/components/layout/PageHead';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Icon } from '@/components/ui/Icon';

const CARD = 'bg-surface border border-border rounded-card p-6 gap-4';

export default function AppearancePage() {
  const { pref, setPref } = useTheme();
  const { density, setDensity } = useDensity();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4 pb-10">
      <PageHead title="Appearance" sub="Theme and density. These choices stay on this device." />

      <View className={CARD}>
        <View>
          <Text className="text-[17px] font-display tracking-[-0.17px] text-foreground">Theme</Text>
          <Text className="text-muted text-[13.5px]">Light, dark, or follow your system setting.</Text>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel="Theme" className="flex-row flex-wrap gap-3">
          {THEME_OPTIONS.map((opt) => {
            const on = pref === opt.id;
            return (
              <Pressable
                key={opt.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPref(opt.id)}
                className={`flex-1 min-w-[96px] items-start gap-3 rounded-card border p-4 active:opacity-70 ${
                  on ? 'border-ember bg-ember-soft' : 'border-line-2 bg-surface'
                }`}
              >
                <View className="w-[40px] h-[40px] rounded-ctl bg-well items-center justify-center">
                  <Icon name={opt.icon} />
                </View>
                <Text className="font-bold text-foreground">{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className={CARD}>
        <View>
          <Text className="text-[17px] font-display tracking-[-0.17px] text-foreground">Density</Text>
          <Text className="text-muted text-[13.5px]">Compact fits more rows on screen. Comfortable is the default.</Text>
        </View>
        <SegmentedControl
          label="Density"
          value={density}
          onChange={setDensity}
          options={DENSITY_OPTIONS.map((d) => ({ value: d.id, label: d.label }))}
        />
      </View>
    </ScrollView>
  );
}
