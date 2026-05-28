import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Button from './Button';
import Spinner from './Spinner';
import Modal from './Modal';
import { Icon } from './Icon';
import { usePopoverSlot } from './Dropdown';
import { cn } from './cn';
import { useThemeColor } from './useThemeColor';

const TONE_DOT = {
  ember: 'bg-ember',
  iris: 'bg-iris',
  spruce: 'bg-spruce',
  saffron: 'bg-saffron',
  plain: 'bg-faint',
};
const SEARCH_DELAY = 200;

function flatten(groups) {
  return groups.flatMap((g) => g.options);
}

let seq = 0;

// Field (or filter button) that opens a bottom sheet of options.
// Same props as the client: single/multiple, searchable, groups, async loadOptions.
export default function Select({
  value,
  onChange,
  options,
  groups,
  label,
  hideLabel = false,
  placeholder = 'Select',
  name: _name,
  disabled = false,
  error,
  hint,
  size = 'md',
  variant = 'field',
  searchable = false,
  multiple = false,
  loadOptions,
  required = false,
  className,
  ...rest
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [asyncOptions, setAsyncOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const seen = useRef({});
  const loadRef = useRef(loadOptions);
  const idRef = useRef(null);
  if (idRef.current == null) idRef.current = `sel-${++seq}`;
  const slot = usePopoverSlot();
  const muted = useThemeColor('muted');
  const faint = useThemeColor('faint');

  loadRef.current = loadOptions;

  const sourceGroups = loadOptions
    ? [{ label: null, options: asyncOptions }]
    : groups ?? [{ label: null, options: options ?? [] }];
  sourceGroups.forEach((g) =>
    g.options.forEach((o) => {
      seen.current[o.value] = o;
    }),
  );

  const q = query.trim().toLowerCase();
  const visibleGroups = sourceGroups
    .map((g) => ({
      label: g.label,
      options:
        searchable && !loadOptions && q ? g.options.filter((o) => String(o.label).toLowerCase().includes(q)) : g.options,
    }))
    .filter((g) => g.options.length > 0);
  const flat = flatten(visibleGroups);

  const vals = multiple ? (Array.isArray(value) ? value : []) : null;
  const isSelected = (v) => (multiple ? vals.includes(v) : value === v);
  const chosen = multiple
    ? vals.map((v) => seen.current[v] ?? { value: v, label: String(v) })
    : [seen.current[value]].filter(Boolean);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setOpen(true);
    slot.claim(idRef.current, () => setOpen(false));
  };

  const closeList = () => {
    setOpen(false);
    slot.release(idRef.current);
  };

  const pick = (opt) => {
    if (!opt || opt.disabled) return;
    if (multiple) {
      const next = isSelected(opt.value) ? vals.filter((v) => v !== opt.value) : [...vals, opt.value];
      onChange?.(next);
      return;
    }
    onChange?.(opt.value);
    closeList();
  };

  useEffect(() => {
    if (!open || !loadRef.current) return undefined;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      Promise.resolve(loadRef.current(query.trim()))
        .then((opts) => {
          if (alive) setAsyncOptions(opts ?? []);
        })
        .catch(() => {
          if (alive) setAsyncOptions([]);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, SEARCH_DELAY);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  const hasError = Boolean(error);
  const sm = size === 'sm';

  const trigger =
    variant === 'button' ? (
      <Button variant="ghost" size={sm ? 'sm' : 'md'} icon="filter" onClick={openList} disabled={disabled}>
        {chosen.length ? chosen.map((c) => c.label).join(', ') : label}
      </Button>
    ) : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        accessibilityValue={{ text: chosen.map((c) => c.label).join(', ') || placeholder }}
        accessibilityState={{ disabled, expanded: open }}
        accessibilityHint={typeof hint === 'string' ? hint : undefined}
        disabled={disabled}
        onPress={openList}
        className={cn(
          'flex-row items-center w-full min-w-0 pr-[34px] pl-[14px] rounded-ctl border bg-surface',
          sm ? 'min-h-[36px] py-[4px]' : 'min-h-[42px] py-[6px]',
          hasError ? 'border-bad' : open ? 'border-ember' : 'border-line-2',
          disabled && 'opacity-[0.45]',
          multiple && 'flex-wrap gap-[6px]',
        )}
      >
        {multiple && chosen.length ? (
          chosen.map((c) => (
            <View
              key={String(c.value)}
              className="flex-row items-center h-[26px] px-[8px] gap-[4px] rounded-full border border-line bg-surface"
            >
              <Text className="text-[12.5px] font-sans-bold text-foreground">{c.label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.label}`}
                hitSlop={8}
                onPress={() => onChange?.(vals.filter((v) => v !== c.value))}
              >
                <Icon name="close" size={13} color={muted} />
              </Pressable>
            </View>
          ))
        ) : chosen.length ? (
          <Text numberOfLines={1} className={cn('flex-1 font-sans-semibold text-foreground', sm ? 'text-[13px]' : 'text-[14px]')}>
            {chosen[0].label}
          </Text>
        ) : (
          <Text numberOfLines={1} className={cn('flex-1 font-sans-semibold text-faint', sm ? 'text-[13px]' : 'text-[14px]')}>
            {placeholder}
          </Text>
        )}
        <View className="absolute right-[12px] top-0 bottom-0 justify-center">
          <Icon name="down" size={15} color={muted} style={open ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </View>
      </Pressable>
    );

  return (
    <View className={cn('gap-[6px] min-w-0', className)} {...rest}>
      {label && !hideLabel && variant !== 'button' ? (
        <Text className="text-muted text-[12.5px] font-sans-bold">
          {label}
          {required ? ' *' : ''}
        </Text>
      ) : null}
      {trigger}
      {hint && !hasError ? (
        typeof hint === 'string' ? <Text className="text-muted text-[12px] font-sans">{hint}</Text> : hint
      ) : null}
      {hasError ? (
        <Text accessibilityLiveRegion="polite" className="text-bad text-[13px] font-sans-semibold">
          {error}
        </Text>
      ) : null}

      <Modal open={open} onClose={closeList} motion="sheet" label={label ?? placeholder}>
        <View className="flex-row items-center justify-between px-[16px] pt-[8px] pb-[8px]">
          <Text className="font-display text-[18px] text-foreground flex-1" numberOfLines={1}>
            {label ?? placeholder}
          </Text>
          {multiple ? (
            <Button variant="soft" size="sm" onClick={closeList}>
              Done
            </Button>
          ) : null}
        </View>
        {searchable || loadOptions ? (
          <View className="mx-[12px] mb-[6px] flex-row items-center gap-[8px] px-[12px] h-[40px] rounded-ctl border border-line-2 bg-surface">
            <Icon name="search" size={16} color={muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={faint}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              accessibilityLabel={label ?? placeholder}
              className="flex-1 h-full text-foreground text-[14px] font-sans"
            />
          </View>
        ) : null}
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          contentContainerClassName="px-[8px] pb-[12px] gap-[2px]"
          keyboardShouldPersistTaps="handled"
        >
          {visibleGroups.map((g, gi) => (
            <View key={g.label ?? gi}>
              {g.label ? (
                <Text className="text-[11px] uppercase tracking-[0.8px] text-muted px-[12px] pt-[8px] pb-[4px] font-sans-bold">
                  {g.label}
                </Text>
              ) : null}
              {g.options.map((o) => {
                const selected = isSelected(o.value);
                return (
                  <Pressable
                    key={String(o.value)}
                    accessibilityRole={multiple ? 'checkbox' : 'radio'}
                    accessibilityState={{ selected, checked: selected, disabled: Boolean(o.disabled) }}
                    disabled={o.disabled}
                    onPress={() => pick(o)}
                    className={cn(
                      'flex-row items-center gap-[10px] rounded-[10px] px-[12px] min-h-[46px] py-[8px] active:bg-well',
                      selected && 'bg-well',
                      o.disabled && 'opacity-[0.45]',
                    )}
                  >
                    {o.tone ? <View className={cn('w-[8px] h-[8px] rounded-[3px] shrink-0', TONE_DOT[o.tone] ?? 'bg-faint')} /> : null}
                    {!o.tone && o.icon ? <Icon name={o.icon} size={17} /> : null}
                    <View className="flex-1 min-w-0">
                      <Text
                        numberOfLines={1}
                        className={cn('text-[14.5px] text-foreground', selected ? 'font-sans-bold' : 'font-sans-semibold')}
                      >
                        {o.label}
                      </Text>
                      {o.description ? <Text className="text-[12px] text-muted font-sans">{o.description}</Text> : null}
                    </View>
                    {selected ? <Icon name="check" size={17} cls="text-ember-t" /> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
          {loading ? (
            <View className="items-center py-[8px]">
              <Spinner size="sm" />
            </View>
          ) : null}
          {!loading && flat.length === 0 ? (
            <Text className="text-center text-muted py-[18px] font-sans">No matches</Text>
          ) : null}
        </ScrollView>
      </Modal>
    </View>
  );
}
