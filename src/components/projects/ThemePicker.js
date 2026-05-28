import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { THEME_IMAGES, THEME_KEYS } from '@/config/theme';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from '@/components/layout/useThemeColors';

// Banner picker for a project. value is a THEME_KEYS entry or null (no theme).
// A value outside THEME_KEYS is shown as "No theme".
function ThemeThumb({ themeKey, index, selected, disabled, onPick }) {
  const colors = useThemeColors();
  const [broken, setBroken] = useState(false);
  const src = THEME_IMAGES[themeKey];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Theme ${index + 1}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => onPick(themeKey)}
      className={`rounded-[14px] p-[2px] border-2 ${selected ? 'border-accent' : 'border-transparent'} ${disabled ? 'opacity-60' : ''}`}
    >
      {broken || !src ? (
        <View className="w-full items-center justify-center rounded-[12px] border border-border bg-surface-2" style={{ aspectRatio: 4 }}>
          <Icon name="project" size={18} color={colors.muted} />
        </View>
      ) : (
        <Image
          source={src}
          onError={() => setBroken(true)}
          resizeMode="cover"
          className="w-full rounded-[12px] border border-border"
          style={{ aspectRatio: 4, width: '100%' }}
        />
      )}
      {selected ? (
        <View className="absolute right-[10px] top-[10px] w-[26px] h-[26px] rounded-full bg-accent items-center justify-center">
          <Icon name="check" size={16} color={colors['on-accent']} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function ThemePicker({ value, onChange, disabled = false }) {
  const current = THEME_KEYS.includes(value) ? value : null;

  return (
    <View accessibilityLabel="Theme" className="gap-[8px]">
      <View className="gap-[4px]">
        <Text className="text-[14px] font-semibold text-foreground">Theme</Text>
        <Text className="text-[12.5px] text-muted">Shown as the banner on the project overview.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: current === null, disabled }}
        disabled={disabled}
        onPress={() => onChange(null)}
        className={`self-start rounded-[10px] border px-[12px] py-[8px] ${current === null ? 'border-accent' : 'border-border-strong'} ${disabled ? 'opacity-60' : ''}`}
      >
        <Text className={`text-[13px] font-semibold ${current === null ? 'text-foreground' : 'text-muted'}`}>No theme</Text>
      </Pressable>

      <View className="gap-[10px]">
        {THEME_KEYS.map((key, index) => (
          <ThemeThumb key={key} themeKey={key} index={index} selected={current === key} disabled={disabled} onPick={onChange} />
        ))}
      </View>
    </View>
  );
}
