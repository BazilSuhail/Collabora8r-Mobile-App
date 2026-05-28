// feat(screens/issues/components/SavedFiltersPanel): list, apply, save and delete the project's saved issue filters.
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { createSavedFilter, deleteSavedFilter, listSavedFilters } from '@/libs/api/issues';
import { useResource } from '@/utils/useResource';
import { Sheet, SheetButton, TextField, confirmThen } from '@/components/issues/sheets';

const withId = (f) => ({ ...f, id: String(f.id ?? f._id) });

// query is the saved-filter grammar built by the page ("field = value" joined by AND).
export default function SavedFiltersPanel({ open, onClose, query, activeId, onApply, onDeleted }) {
  const { projectId, can } = useProject();
  const toast = useToast();
  const list = useResource(
    async () => {
      const res = await listSavedFilters(projectId, { limit: 100 });
      return { data: (res.data ?? []).map(withId), meta: res.meta };
    },
    [projectId, open],
  );
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [saving, setSaving] = useState(false);

  const askDelete = (f) =>
    confirmThen(
      {
        title: `Delete ${f.name}?`,
        text: 'The saved filter is removed for everyone it is shared with.',
        confirmLabel: 'Delete',
        tone: 'danger',
      },
      async () => {
        try {
          await deleteSavedFilter(projectId, f.id);
          toast.success('Filter deleted');
          if (activeId === f.id) onDeleted?.();
          list.reload();
        } catch (err) {
          toast.error(err.message ?? 'Could not delete the filter');
        }
      },
    );

  const saveFilter = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter a name.');
      return;
    }
    setSaving(true);
    try {
      await createSavedFilter(projectId, { name: trimmed, query });
      toast.success('Filter saved');
      setNaming(false);
      setName('');
      setNameError(null);
      list.reload();
    } catch (err) {
      setNameError(err?.errors?.[0]?.message ?? err?.message ?? 'Could not save the filter');
    } finally {
      setSaving(false);
    }
  };

  const items = list.data ?? [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={naming ? 'Save filter' : 'Saved filters'}
      subtitle={naming ? 'The current filters are saved under this name.' : 'Apply a saved view, or save the current filters.'}
      footer={
        naming ? (
          <>
            <SheetButton label="Cancel" onPress={() => setNaming(false)} />
            <SheetButton variant="ember" label="Save filter" loading={saving} onPress={saveFilter} />
          </>
        ) : null
      }
    >
      {naming ? (
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          error={nameError}
          hint="Up to 100 characters."
          maxLength={100}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={saveFilter}
        />
      ) : (
        <>
          {can('filter.create') ? (
            <View className="gap-[6px]">
              <SheetButton label="Save current filters" disabled={!query} onPress={() => setNaming(true)} />
              <Text className="text-muted text-[12.5px]">
                {query ? 'Saves the filters now applied to the issues list.' : 'Apply a filter on the issues list first, then save it here.'}
              </Text>
            </View>
          ) : null}

          {list.status === 'loading' ? <ActivityIndicator className="my-[12px]" /> : null}

          {list.status === 'error' ? (
            <EmptyState tone="error" title="Could not load saved filters" onRetry={list.reload} />
          ) : null}

          {list.status === 'success' && items.length === 0 ? (
            <EmptyState icon="savedFilter" title="No saved filters" text="Save the filters you use often to return to them in one tap." />
          ) : null}

          {list.status === 'success' && items.length > 0 ? (
            <View className="gap-[6px]" accessibilityLabel="Saved filters">
              {items.map((f) => {
                const on = activeId === f.id;
                return (
                  <View key={f.id} className="flex-row items-center gap-[6px]">
                    <Pressable
                      onPress={() => onApply(f)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      className={`flex-1 min-w-0 rounded-[10px] py-[11px] px-[12px] ${on ? 'bg-accent' : 'bg-background'} active:opacity-70`}
                    >
                      <Text numberOfLines={1} className={`text-[14px] font-semibold ${on ? 'text-on-accent' : 'text-foreground'}`}>
                        {f.name}
                      </Text>
                    </Pressable>
                    {can('filter.create') ? (
                      <Pressable
                        onPress={() => askDelete(f)}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${f.name}`}
                        className="w-[36px] h-[36px] items-center justify-center"
                      >
                        <Icon name="trash" size={17} />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      )}
    </Sheet>
  );
}
