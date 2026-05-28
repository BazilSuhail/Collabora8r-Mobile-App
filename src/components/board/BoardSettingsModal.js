// feat(screens/board/components/BoardSettingsModal): edit a board's name, its columns, the statuses each column holds and its quick options.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import Select from '@/components/ui/Select';
import SideModal from '@/components/ui/SideModal';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';
import { updateBoard } from '@/libs/api/boards';

const MAX_COLUMNS = 15;

const toDraft = (board) => ({
  name: board?.name ?? '',
  showSubtasks: Boolean(board?.showSubtasks),
  showDoneColumn: board?.showDoneColumn !== false,
  columns: (board?.columns ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    statusIds: (c.statusIds ?? []).map(String),
    wipLimit: c.wipLimit ?? null,
  })),
});

// Saved from the board's own settings. Boards have no version field, so the save sends none.
export default function BoardSettingsModal({ open, onClose, projectId, board, statuses, onSaved }) {
  const toast = useToast();
  const [draft, setDraft] = useState(() => toDraft(board));
  const [saving, setSaving] = useState(false);

  // The draft is taken when the modal opens and then kept, so a background refresh never overwrites edits.
  useEffect(() => {
    if (open) setDraft(toDraft(board));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const statusOptions = statuses.map((s) => ({ value: String(s.id), label: s.name }));

  const patchColumn = (index, changes) =>
    setDraft((d) => ({ ...d, columns: d.columns.map((c, i) => (i === index ? { ...c, ...changes } : c)) }));

  const moveColumn = (index, delta) =>
    setDraft((d) => {
      const target = index + delta;
      if (target < 0 || target >= d.columns.length) return d;
      const columns = [...d.columns];
      [columns[index], columns[target]] = [columns[target], columns[index]];
      return { ...d, columns };
    });

  const removeColumn = (index) => setDraft((d) => ({ ...d, columns: d.columns.filter((_, i) => i !== index) }));

  const addColumn = () =>
    setDraft((d) => ({
      ...d,
      columns: [...d.columns, { id: undefined, name: `Column ${d.columns.length + 1}`, statusIds: [], wipLimit: null }],
    }));

  const save = async () => {
    if (!draft.name.trim() || draft.columns.length === 0) return;
    setSaving(true);
    try {
      await updateBoard(projectId, String(board.id), {
        name: draft.name.trim(),
        showSubtasks: draft.showSubtasks,
        showDoneColumn: draft.showDoneColumn,
        columns: draft.columns.map((c, i) => ({
          ...(c.id ? { id: String(c.id) } : {}),
          name: c.name.trim() || `Column ${i + 1}`,
          statusIds: c.statusIds,
          wipLimit: c.wipLimit ? Number(c.wipLimit) : null,
          sortOrder: i,
        })),
      });
      toast.success('Board saved');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.errors?.[0]?.message ?? err.message ?? 'Could not save the board');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Board settings"
      subtitle="Columns hold statuses. An issue in a status appears in the column that holds it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="ember"
            loading={saving}
            disabled={saving || !draft.name.trim() || draft.columns.length === 0}
            onClick={save}
          >
            Save board
          </Button>
        </>
      }
    >
      <View className="gap-4">
        <Input
          label="Board name"
          hint="Up to 100 characters."
          value={draft.name}
          maxLength={100}
          required
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
        />

        <View className="gap-2.5">
          <View className="flex-row items-center gap-2">
            <Icon name="kanban" size={16} />
            <Text className="text-sm font-bold text-foreground">Columns</Text>
          </View>
          {draft.columns.map((col, index) => (
            <View key={col.id ?? `new-${index}`} className="gap-2.5 rounded-card border border-border bg-surface p-3">
              <View className="flex-row items-end gap-2">
                <View className="flex-1 min-w-0">
                  <Input
                    label={`Column ${index + 1} name`}
                    hint="Blank names are saved as Column N."
                    value={col.name}
                    maxLength={60}
                    onChangeText={(name) => patchColumn(index, { name })}
                  />
                </View>
                <View className="w-[110px]">
                  <Input
                    label="WIP limit"
                    keyboardType="number-pad"
                    hint="Empty for none."
                    value={col.wipLimit == null ? '' : String(col.wipLimit)}
                    onChangeText={(v) => patchColumn(index, { wipLimit: v === '' ? null : Number(v.replace(/[^0-9]/g, '')) })}
                  />
                </View>
              </View>
              <Select
                multiple
                label={`Statuses in ${col.name || `column ${index + 1}`}`}
                placeholder="No statuses"
                hint={statusOptions.length ? 'An issue in one of these statuses appears in this column.' : 'This project has no statuses yet.'}
                value={col.statusIds}
                options={statusOptions}
                onChange={(statusIds) => patchColumn(index, { statusIds })}
              />
              <View className="flex-row justify-end gap-1.5">
                <Button variant="ghost" size="sm" iconOnly icon="up" aria-label={`Move column ${index + 1} up`} disabled={index === 0} onClick={() => moveColumn(index, -1)} />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon="down"
                  aria-label={`Move column ${index + 1} down`}
                  disabled={index === draft.columns.length - 1}
                  onClick={() => moveColumn(index, 1)}
                />
                <Button
                  variant="danger"
                  size="sm"
                  iconOnly
                  icon="trash"
                  aria-label={`Remove column ${index + 1}`}
                  disabled={draft.columns.length <= 1}
                  onClick={() => removeColumn(index)}
                />
              </View>
            </View>
          ))}
          <View className="flex-row">
            <Button variant="soft" size="sm" icon="plus" disabled={draft.columns.length >= MAX_COLUMNS} onClick={addColumn}>
              Add column
            </Button>
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Icon name="settings" size={16} />
            <Text className="text-sm font-bold text-foreground">Quick options</Text>
          </View>
          <Switch
            label="Show subtasks as cards"
            checked={draft.showSubtasks}
            onChange={(showSubtasks) => setDraft((d) => ({ ...d, showSubtasks }))}
          />
          <Switch
            label="Show the done column"
            checked={draft.showDoneColumn}
            onChange={(showDoneColumn) => setDraft((d) => ({ ...d, showDoneColumn }))}
          />
        </View>
      </View>
    </SideModal>
  );
}
