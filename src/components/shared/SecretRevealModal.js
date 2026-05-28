import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from '@/components/layout/useThemeColors';

// Shows a secret once (invite token, API token, webhook secret). The back button and the scrim do
// nothing, so the user must press Done after copying.
export default function SecretRevealModal({ open, onClose, title, description, value, label = 'Secret', doneLabel = 'Done' }) {
  const colors = useThemeColors();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(value ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal visible={Boolean(open)} transparent animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <View className="flex-1 bg-backdrop items-center justify-center px-[16px]">
        <View className="w-full max-w-[480px] rounded-[20px] bg-float border border-border p-[20px] gap-[14px]">
          <View className="gap-[4px]">
            {title ? <Text className="text-[18px] font-bold text-foreground">{title}</Text> : null}
            {description ? <Text className="text-[14px] text-muted">{description}</Text> : null}
          </View>
          <View className="gap-[8px]">
            <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
            <View className="flex-row items-center gap-[10px] rounded-[12px] border border-border-strong bg-surface px-[14px] py-[10px]">
              <Icon name="key" size={16} color={colors.muted} />
              <Text selectable className="flex-1 min-w-0 font-mono text-[13.5px] text-foreground">
                {value}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-end gap-[10px]">
            <Pressable
              onPress={copy}
              accessibilityRole="button"
              className="flex-row items-center gap-[6px] min-h-[44px] px-[14px] rounded-[12px] border border-border active:bg-well"
            >
              <Icon name={copied ? 'check' : 'copy'} size={16} color={colors.foreground} />
              <Text className="text-[14px] font-semibold text-foreground">{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
            <Pressable
              onPress={() => onClose?.()}
              accessibilityRole="button"
              className="min-h-[44px] px-[18px] rounded-[12px] bg-accent items-center justify-center active:opacity-80"
            >
              <Text className="text-[14px] font-bold text-on-accent">{doneLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
