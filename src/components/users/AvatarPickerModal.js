import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import Spinner from '@/components/ui/Spinner';
import { useThemeColors } from '@/components/layout/useThemeColors';
import { AVATAR_IMAGES, AVATAR_KEYS } from '@/config/theme';
import { updateMe } from '@/libs/api/users';
import { useMutation } from '@/utils/useMutation';

const saveAvatar = (body) => updateMe(body).then(() => true);

// Picks one of the preset avatars and saves it as avatarKey. onSaved receives the new key (or null).
export default function AvatarPickerModal({ open, onClose, currentKey, onSaved }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const initial = currentKey ?? null;
  const [selected, setSelected] = useState(initial);
  const [broken, setBroken] = useState(() => new Set());
  const save = useMutation(saveAvatar, {
    success: 'Avatar updated',
    error: (err) => err?.message || 'Could not update your avatar.',
  });

  useEffect(() => {
    if (!open) return;
    setSelected(initial);
    setBroken(new Set());
  }, [open, initial]);

  const dirty = selected !== initial;
  const markBroken = (key) => setBroken((prev) => new Set(prev).add(key));

  const onSave = async () => {
    if (!dirty || save.pending) return;
    const ok = await save.run({ avatarKey: selected ?? null });
    if (!ok) return;
    onSaved?.(selected ?? null);
    onClose?.();
  };

  return (
    <Modal visible={Boolean(open)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-float" style={{ paddingBottom: insets.bottom }}>
        <View className="flex-row items-start gap-[12px] px-[20px] pt-[20px] pb-[12px] border-b border-border">
          <View className="flex-1 gap-[4px]">
            <Text className="text-[18px] font-bold text-foreground">Choose your avatar</Text>
            <Text className="text-[13.5px] text-muted">Pick a preset. It appears next to your name and in lists.</Text>
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} className="w-[40px] h-[40px] items-center justify-center">
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="p-[20px] gap-[16px]">
          <View accessibilityLabel="Preset avatars" className="flex-row flex-wrap gap-[14px] justify-center">
            {AVATAR_KEYS.map((key, index) => {
              const isSelected = selected === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`Avatar ${index + 1}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(key)}
                  className={`w-[72px] h-[72px] rounded-full items-center justify-center border-2 ${isSelected ? 'border-accent' : 'border-transparent'}`}
                >
                  <View className="w-[64px] h-[64px] rounded-full overflow-hidden bg-well items-center justify-center">
                    {broken.has(key) || !AVATAR_IMAGES[key] ? (
                      <Icon name="user" size={22} color={colors.muted} />
                    ) : (
                      <Image source={AVATAR_IMAGES[key]} onError={() => markBroken(key)} style={{ width: 64, height: 64 }} resizeMode="cover" />
                    )}
                  </View>
                  {isSelected ? (
                    <View className="absolute right-[0px] bottom-[0px] w-[22px] h-[22px] rounded-full bg-accent items-center justify-center">
                      <Icon name="check" size={13} color={colors['on-accent']} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => setSelected(null)}
            disabled={selected === null}
            accessibilityRole="button"
            className={`self-start min-h-[40px] px-[14px] rounded-[12px] border border-border items-center justify-center ${selected === null ? 'opacity-50' : ''}`}
          >
            <Text className="text-[13.5px] font-semibold text-foreground">Remove</Text>
          </Pressable>
        </ScrollView>

        <View className="flex-row gap-[10px] px-[20px] pt-[12px] border-t border-border">
          <Pressable onPress={() => onClose?.()} accessibilityRole="button" className="flex-1 min-h-[46px] rounded-[12px] border border-border items-center justify-center active:bg-well">
            <Text className="text-[14px] font-semibold text-foreground">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={!dirty || save.pending}
            accessibilityRole="button"
            accessibilityState={{ disabled: !dirty || save.pending, busy: save.pending }}
            className={`flex-1 flex-row gap-[8px] min-h-[46px] rounded-[12px] bg-accent items-center justify-center ${!dirty || save.pending ? 'opacity-50' : ''}`}
          >
            {save.pending ? <Spinner size="sm" /> : null}
            <Text className="text-[14px] font-bold text-on-accent">Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
