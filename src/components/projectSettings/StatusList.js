// feat(screens/projectSettings/components/StatusList): edit a workflow's statuses, their categories and their order.
import { Text, View } from 'react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export const CATEGORY_OPTIONS = [
  { value: 'todo', label: 'To do', tone: 'plain' },
  { value: 'inprogress', label: 'In progress', tone: 'iris' },
  { value: 'done', label: 'Done', tone: 'spruce' },
];

// Client ids for new statuses and transitions. The server accepts any 24 hex id, so references stay valid before save.
// Hermes has no crypto.getRandomValues without a polyfill, so Math.random is used. Ids only need to be unique locally.
export const newId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

// Request shape for statuses. sortOrder follows the list order.
export const cleanStatuses = (statuses) =>
  statuses.map((s, index) => ({
    id: s.id,
    name: String(s.name ?? '').trim(),
    category: s.category,
    sortOrder: index,
    color: s.color ?? '',
    icon: s.icon ?? '',
    description: s.description ?? '',
  }));

export default function StatusList({ statuses, onChange, readOnly = false, errors = {} }) {
  const update = (index, patch) => onChange(statuses.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= statuses.length) return;
    const next = [...statuses];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(statuses.filter((_, i) => i !== index));
  const add = () => onChange([...statuses, { id: newId(), name: '', category: 'todo' }]);

  return (
    <View className="gap-3">
      {statuses.length === 0 ? (
        <Text className="rounded-2xl border border-dashed border-border p-3.5 text-center text-sm text-muted">
          No statuses yet. Add at least one To do and one Done status.
        </Text>
      ) : null}
      {statuses.map((s, index) => (
        <View key={s.id} className="gap-1.5 rounded-xl border border-border p-3">
          <Input
            label="Status name"
            hideLabel
            value={s.name}
            disabled={readOnly}
            editable={!readOnly}
            placeholder="Status name"
            onChangeText={(text) => update(index, { name: text })}
          />
          <View className="flex-row items-center gap-2">
            <View className="min-w-0 flex-1">
              <Select
                label={`Category for ${s.name || 'status'}`}
                hideLabel
                value={s.category}
                options={CATEGORY_OPTIONS}
                disabled={readOnly}
                onChange={(value) => update(index, { category: value })}
              />
            </View>
            {readOnly ? null : (
              <View className="flex-row items-center gap-1">
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="up"
                  accessibilityLabel={`Move ${s.name || 'status'} up`}
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="down"
                  accessibilityLabel={`Move ${s.name || 'status'} down`}
                  disabled={index === statuses.length - 1}
                  onPress={() => move(index, 1)}
                />
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  accessibilityLabel={`Remove ${s.name || 'status'}`}
                  onPress={() => remove(index)}
                />
              </View>
            )}
          </View>
          {errors[index] ? (
            <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
              {errors[index]}
            </Text>
          ) : null}
        </View>
      ))}
      {readOnly ? null : (
        <View className="items-start gap-1">
          <Button variant="soft" size="sm" icon="plus" onPress={add}>
            Add status
          </Button>
          <Text className="text-xs text-muted">Each status needs a name and a category.</Text>
        </View>
      )}
    </View>
  );
}
