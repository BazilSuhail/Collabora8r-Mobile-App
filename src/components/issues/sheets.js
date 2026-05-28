// Mobile building blocks for the issues, goals, help and integrations screens:
// a bottom sheet, an option picker sheet (single, multi, searchable), an action menu and a confirm alert.
// They replace the web SideModal, FormModal, Select popovers, Dropdown kebabs and ConfirmDialog.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';

// Native confirm. Resolves true when the user confirms.
export function confirmAlert({ title, text, confirmLabel = 'Confirm', tone = 'default' }) {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      text || undefined,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: tone === 'danger' ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

// Confirm, then run an async action. A thrown error keeps nothing open (the alert is already gone).
export async function confirmThen(opts, action) {
  const ok = await confirmAlert(opts);
  if (!ok) return;
  try {
    await action();
  } catch {
    // The API layer or the action shows the error toast.
  }
}

export function Sheet({ open, onClose, title, subtitle, children, footer, scroll = true }) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={Boolean(open)} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable className="flex-1 bg-backdrop" onPress={onClose} accessibilityLabel="Close" />
        <View
          className="bg-surface rounded-t-[20px] border-t border-border max-h-[85%]"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="items-center pt-[8px]">
            <View className="w-[40px] h-[4px] rounded-full bg-border" />
          </View>
          <View className="flex-row items-start gap-[10px] px-[18px] pt-[10px] pb-[8px]">
            <View className="flex-1 min-w-0">
              {title ? <Text className="text-foreground text-[17px] font-bold">{title}</Text> : null}
              {subtitle ? <Text className="text-muted text-[13px] mt-[2px]">{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Icon name="close" size={20} />
            </Pressable>
          </View>
          <Body
            className={scroll ? undefined : 'flex-shrink'}
            contentContainerClassName={scroll ? 'px-[18px] pb-[12px] gap-[12px]' : undefined}
            keyboardShouldPersistTaps="handled"
          >
            {scroll ? children : <View className="px-[18px] pb-[12px] gap-[12px] flex-shrink">{children}</View>}
          </Body>
          {footer ? <View className="flex-row justify-end gap-[10px] px-[18px] pt-[8px]">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Action menu: items as in the web Dropdown ({ id, label, icon, danger, onSelect } or "separator").
export function ActionMenu({ open, onClose, title, items = [] }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View>
        {items.map((item, i) =>
          item === 'separator' ? (
            <View key={`sep-${i}`} className="h-px bg-border my-[4px]" />
          ) : (
            <Pressable
              key={item.id}
              disabled={item.disabled}
              onPress={() => {
                onClose?.();
                setTimeout(() => item.onSelect?.(), 250);
              }}
              className="flex-row items-center gap-[12px] py-[13px] active:opacity-60"
              accessibilityRole="button"
            >
              {item.icon ? <Icon name={item.icon} size={18} /> : null}
              <Text className={`text-[15px] font-semibold ${item.danger ? 'text-danger' : 'text-foreground'}`}>
                {item.label}
              </Text>
            </Pressable>
          ),
        )}
      </View>
    </Sheet>
  );
}

// A kebab button that opens an ActionMenu.
export function MoreButton({ label = 'More actions', items }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="w-[34px] h-[34px] items-center justify-center rounded-[10px] active:opacity-60"
      >
        <Icon name="more" size={18} />
      </Pressable>
      <ActionMenu open={open} onClose={() => setOpen(false)} title={label} items={items} />
    </>
  );
}

// Picker sheet. options: [{ value, label }]. multiple -> value is an array.
// loadOptions(text) -> Promise<options> turns on the search box (assignee search).
export function OptionSheet({
  open,
  onClose,
  title,
  options = [],
  value,
  onChange,
  multiple = false,
  loadOptions,
  searchable = false,
  clearLabel,
}) {
  const [text, setText] = useState('');
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(multiple ? value ?? [] : value);

  useEffect(() => {
    if (open) {
      setPicked(multiple ? value ?? [] : value);
      setText('');
    }
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !loadOptions) return undefined;
    let live = true;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await loadOptions(text.trim());
        if (live) setRemote(next ?? []);
      } catch {
        if (live) setRemote([]);
      } finally {
        if (live) setLoading(false);
      }
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [open, text, loadOptions]);

  const source = loadOptions ? remote ?? [] : options;
  const needle = text.trim().toLowerCase();
  const list = !loadOptions && needle ? source.filter((o) => String(o.label).toLowerCase().includes(needle)) : source;
  const isOn = (v) => (multiple ? (picked ?? []).includes(v) : picked === v);

  const tap = (v) => {
    if (multiple) {
      setPicked((prev) => ((prev ?? []).includes(v) ? prev.filter((x) => x !== v) : [...(prev ?? []), v]));
      return;
    }
    onClose?.();
    onChange?.(v);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      scroll={false}
      footer={
        multiple ? (
          <Pressable
            onPress={() => {
              onClose?.();
              onChange?.(picked ?? []);
            }}
            className="bg-accent rounded-ctl h-[42px] px-[16px] items-center justify-center active:opacity-80"
            accessibilityRole="button"
          >
            <Text className="text-on-accent text-[13.5px] font-bold">Done</Text>
          </Pressable>
        ) : null
      }
    >
      {loadOptions || searchable ? (
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search"
          autoCapitalize="none"
          autoCorrect={false}
          className="border border-border rounded-[12px] px-[12px] py-[10px] text-foreground bg-background"
          placeholderTextColorClassName="accent-muted"
        />
      ) : null}
      {clearLabel ? (
        <Pressable onPress={() => tap(multiple ? [] : null)} className="py-[10px] active:opacity-60">
          <Text className="text-muted font-semibold">{clearLabel}</Text>
        </Pressable>
      ) : null}
      {loading ? <ActivityIndicator className="my-[12px]" /> : null}
      <FlatList
        data={list}
        keyExtractor={(o) => String(o.value)}
        keyboardShouldPersistTaps="handled"
        style={{ maxHeight: 420 }}
        ListEmptyComponent={
          loading ? null : <Text className="text-muted text-[13.5px] py-[12px]">{loadOptions ? 'Type to search' : 'No options'}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => tap(item.value)}
            className="flex-row items-center gap-[10px] py-[12px] border-b border-border active:opacity-60"
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: isOn(item.value) }}
          >
            <Text className={`flex-1 text-[15px] ${isOn(item.value) ? 'text-accent font-bold' : 'text-foreground'}`}>
              {item.label}
            </Text>
            {isOn(item.value) ? <Icon name="check" size={18} /> : null}
          </Pressable>
        )}
      />
    </Sheet>
  );
}

// A form row that shows the current value and opens an OptionSheet (the mobile Select).
export function SelectField({
  label,
  hint,
  placeholder = 'Choose',
  value,
  options = [],
  onChange,
  multiple = false,
  loadOptions,
  disabled = false,
  valueLabel,
  clearLabel,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const shown =
    valueLabel ??
    (multiple
      ? (value ?? []).map((v) => options.find((o) => o.value === v)?.label ?? v).join(', ')
      : options.find((o) => o.value === value)?.label);
  return (
    <View className={compact ? undefined : 'gap-[4px]'}>
      {label && !compact ? <Text className="text-muted text-[12.5px] font-semibold">{label}</Text> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={`flex-row items-center gap-[8px] border border-border rounded-[12px] bg-surface ${
          compact ? 'px-[12px] py-[7px]' : 'px-[12px] py-[11px]'
        } ${disabled ? 'opacity-50' : 'active:opacity-70'}`}
      >
        <Text numberOfLines={1} className={`flex-1 text-[14px] ${shown ? 'text-foreground' : 'text-muted'}`}>
          {shown || placeholder}
        </Text>
        <Icon name="chevD" size={14} />
      </Pressable>
      {hint && !compact ? <Text className="text-muted text-[12px]">{hint}</Text> : null}
      <OptionSheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        options={options}
        value={value}
        multiple={multiple}
        loadOptions={loadOptions}
        searchable={options.length > 8}
        clearLabel={clearLabel}
        onChange={onChange}
      />
    </View>
  );
}

// Labelled text field (the mobile Input).
export function TextField({ label, hint, error, className, inputClassName, ...rest }) {
  return (
    <View className={`gap-[4px] ${className ?? ''}`}>
      {label ? <Text className="text-muted text-[12.5px] font-semibold">{label}</Text> : null}
      <TextInput
        className={`border ${error ? 'border-danger' : 'border-border'} rounded-[12px] px-[12px] py-[10px] text-[15px] text-foreground bg-surface ${
          rest.editable === false ? 'opacity-50' : ''
        } ${inputClassName ?? ''}`}
        placeholderTextColorClassName="accent-muted"
        accessibilityLabel={label}
        {...rest}
      />
      {error ? <Text className="text-danger text-[12px]">{error}</Text> : null}
      {!error && hint ? <Text className="text-muted text-[12px]">{hint}</Text> : null}
    </View>
  );
}

// Simple pill chip, pressed state shown with the accent.
export function Chip({ pressed, onPress, children, count, icon }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(pressed) }}
      className={`flex-row items-center gap-[6px] rounded-full border px-[12px] py-[7px] ${
        pressed ? 'bg-accent border-accent' : 'bg-surface border-border'
      } active:opacity-70`}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      <Text className={`text-[13px] font-semibold ${pressed ? 'text-on-accent' : 'text-foreground'}`}>{children}</Text>
      {count != null ? (
        <Text className={`text-[12px] ${pressed ? 'text-on-accent' : 'text-muted'}`}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

// Primary and secondary sheet buttons used in form footers.
export function SheetButton({ label, onPress, variant = 'ghost', loading = false, disabled = false }) {
  const tone =
    variant === 'ember'
      ? 'bg-accent border border-accent'
      : variant === 'danger'
        ? 'bg-danger-solid border border-danger-solid'
        : 'bg-surface border border-line-2';
  const textTone = variant === 'ember' || variant === 'danger' ? 'text-on-accent' : 'text-foreground';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      className={`flex-row items-center justify-center gap-[8px] rounded-ctl h-[42px] px-[16px] ${tone} ${
        disabled || loading ? 'opacity-45' : 'active:opacity-80'
      }`}
    >
      {loading ? <ActivityIndicator size="small" colorClassName={variant === 'ember' || variant === 'danger' ? 'accent-on-accent' : 'accent-foreground'} /> : null}
      <Text className={`font-bold text-[13.5px] ${textTone}`}>{label}</Text>
    </Pressable>
  );
}
