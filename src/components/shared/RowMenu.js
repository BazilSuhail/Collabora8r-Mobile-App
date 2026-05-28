import { useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useThemeColors } from '@/components/layout/useThemeColors';
import ActionSheet from './ActionSheet';

// Overflow "more" button that opens an ActionSheet. Renders nothing without items.
export default function RowMenu({ items = [], label = 'Actions' }) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const list = items.filter(Boolean);
  if (!list.length) return null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        className="w-[40px] h-[40px] items-center justify-center rounded-[10px] active:bg-well"
      >
        <Icon name="more" size={18} color={colors.muted} />
      </Pressable>
      <ActionSheet open={open} onClose={() => setOpen(false)} title={label} items={list} />
    </>
  );
}
