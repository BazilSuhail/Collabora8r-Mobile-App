import { createContext, useContext, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Modal from './Modal';
import { Icon } from './Icon';
import { cn } from './cn';

// ---- Shared overlay helpers (kept for API parity with the web module) ----

// The Android back button is handled by each RN Modal's onRequestClose, so the
// escape stack is a no-op on mobile.
export function useEscapeLayer(_kind, _onEscape, _active) {}

// One popup open at a time. Dropdown and Select claim the slot; opening a
// second popup closes the first.
const activePopup = { current: null };
const popupSlot = {
  claim(id, close) {
    const prev = activePopup.current;
    if (prev && prev.id !== id) prev.close();
    activePopup.current = { id, close };
  },
  release(id) {
    if (activePopup.current && activePopup.current.id === id) activePopup.current = null;
  },
};

const PopoverContext = createContext(popupSlot);

export function PopoverProvider({ children }) {
  return <PopoverContext.Provider value={popupSlot}>{children}</PopoverContext.Provider>;
}

export function usePopoverSlot() {
  return useContext(PopoverContext);
}

// No DOM pop layer on mobile.
export function getPopLayer() {
  return null;
}

// Mount state follows open directly; the sheet animates itself.
export function useOverlayMotion(open) {
  return open;
}

let seq = 0;

// Action-sheet menu. trigger(triggerProps) renders the opener; spread
// triggerProps onto a Button or Pressable (it carries onClick and onPress).
// items: Array<{ id?, label, icon?, danger?, disabled?, href?, onSelect? } | "separator">.
export default function Dropdown({ trigger, items = [], placement: _placement = 'bottom-end', label, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const idRef = useRef(null);
  if (idRef.current == null) idRef.current = `dd-${++seq}`;
  const slot = usePopoverSlot();

  const changeOpen = (next) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) slot.claim(idRef.current, () => changeOpen(false));
    else slot.release(idRef.current);
  };

  const toggle = () => changeOpen(!open);

  const triggerProps = {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    accessibilityState: { expanded: open },
    onClick: toggle,
    onPress: toggle,
  };

  const select = (it) => {
    if (it.disabled) return;
    changeOpen(false);
    // Run after the sheet starts closing so a follow-up modal can open cleanly.
    setTimeout(() => {
      it.onSelect?.();
      if (it.href) router.push(it.href);
    }, 220);
  };

  return (
    <>
      {trigger(triggerProps)}
      <Modal open={open} onClose={() => changeOpen(false)} motion="sheet" label={label ?? 'Menu'}>
        <ScrollView style={{ flexGrow: 0 }} contentContainerClassName="p-[6px] pb-[12px]" accessibilityRole="menu">
          {label ? (
            <Text className="px-[12px] pt-[6px] pb-[8px] text-[11px] uppercase tracking-[0.8px] text-muted font-sans-bold">
              {label}
            </Text>
          ) : null}
          {items.map((it, i) => {
            if (it === 'separator') {
              return <View key={`sep-${i}`} className="h-px bg-line my-[4px] mx-[6px]" />;
            }
            const fg = it.danger ? 'text-bad' : 'text-foreground';
            return (
              <Pressable
                key={it.id ?? i}
                accessibilityRole="menuitem"
                accessibilityState={{ disabled: Boolean(it.disabled) }}
                disabled={it.disabled}
                onPress={() => select(it)}
                className={cn(
                  'flex-row items-center gap-[10px] rounded-[10px] px-[12px] py-[9px] min-h-[44px] active:bg-well',
                  it.disabled && 'opacity-[0.45]',
                )}
              >
                {it.icon ? <Icon name={it.icon} size={18} cls={fg} /> : null}
                <Text className={cn('flex-1 text-[13.5px] font-sans-semibold', fg)} numberOfLines={1}>
                  {it.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>
    </>
  );
}
