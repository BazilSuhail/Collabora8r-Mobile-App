import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from '@/components/layout/useThemeColors';

// Bottom action sheet. Replaces the client's Dropdown menus on mobile.
// items: { id, label, icon, description, onSelect, disabled, danger, selected, href } or the string "separator".
export default function ActionSheet({ open, onClose, title, items = [], footer }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const pick = (item) => {
    if (item.disabled) return;
    onClose?.();
    if (item.onSelect) item.onSelect();
    else if (item.href) router.push(item.href);
  };

  return (
    <Modal visible={Boolean(open)} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable className="flex-1 bg-backdrop" onPress={onClose} accessibilityLabel="Close menu" />
      <View
        className="bg-float rounded-t-[24px] border border-border px-[12px] pt-[10px]"
        style={{ paddingBottom: Math.max(insets.bottom, 12), maxHeight: '80%' }}
      >
        <View className="self-center w-[40px] h-[5px] rounded-full bg-border-strong mb-[8px]" />
        {title ? <Text className="px-[8px] pb-[8px] text-[13px] font-semibold text-muted uppercase tracking-[0.08em]">{title}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false}>
          {items.filter(Boolean).map((item, index) =>
            item === 'separator' ? (
              <View key={`sep-${index}`} className="h-px bg-border my-[6px]" />
            ) : (
              <Pressable
                key={item.id ?? index}
                onPress={() => pick(item)}
                disabled={item.disabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(item.disabled), selected: Boolean(item.selected) }}
                className={`flex-row items-center gap-[12px] min-h-[48px] px-[10px] rounded-[12px] active:bg-well ${item.disabled ? 'opacity-50' : ''}`}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={18} color={item.danger ? colors.danger : colors.muted} />
                ) : null}
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className={`text-[15px] font-semibold ${item.danger ? 'text-danger' : 'text-foreground'}`}>
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text numberOfLines={2} className="text-[12.5px] text-muted">
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                {item.selected ? <Icon name="check" size={18} color={colors.accent} /> : null}
              </Pressable>
            ),
          )}
        </ScrollView>
        {footer}
      </View>
    </Modal>
  );
}
