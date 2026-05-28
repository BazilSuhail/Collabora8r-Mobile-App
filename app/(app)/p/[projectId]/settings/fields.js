// feat(screens/projectSettings/FieldsPage): configure a project's issue types, priorities, resolutions and custom fields.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { emptyCopy } from '@/metadata/empty';
import { listConfig, updateConfig } from '@/libs/api/config';
import { useResource } from '@/utils/useResource';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';
import ConfigTable from '@/components/projectSettings/ConfigTable';
import ConfigFormModal, { SEG_SINGULAR, configApi } from '@/components/projectSettings/ConfigFormModal';

const SEGMENTS = [
  { value: 'issue-types', label: 'Issue types' },
  { value: 'priorities', label: 'Priorities' },
  { value: 'resolutions', label: 'Resolutions' },
  { value: 'custom-fields', label: 'Custom fields' },
];

export default function FieldsPage() {
  const { projectId, can, members } = useProject();
  const toast = useToast();
  const canEdit = can('config.manage');
  const canDelete = can('config.delete');

  const [seg, setSeg] = useState('issue-types');
  const config = useResource(() => listConfig(projectId, seg, { limit: 100 }), [projectId, seg]);
  const rows = config.data ?? [];

  // editor: null when closed, otherwise { row } where row is null for create.
  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Swaps a row with its neighbour, then rewrites the order of every row that moved.
  const move = async (row, dir) => {
    const key = seg === 'priorities' ? 'rank' : 'sortOrder';
    const base = seg === 'priorities' ? 1 : 0;
    const sorted = [...rows].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
    const index = sorted.findIndex((r) => r._id === row._id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    const writes = next
      .map((r, i) => ({ r, value: i + base }))
      .filter(({ r, value }) => r[key] !== value)
      .map(({ r, value }) => updateConfig(projectId, seg, r._id, { [key]: value }));
    try {
      await Promise.all(writes);
      config.reload();
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) toast.error(err.message);
    }
  };

  const runDelete = async () => {
    try {
      await configApi(seg).remove(projectId, deleteTarget._id);
      toast.success('Deleted');
      config.reload();
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) toast.error(err.message);
      throw err;
    }
  };

  const singular = SEG_SINGULAR[seg];

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <PageHead
        title="Fields"
        sub="Issue types, priorities, resolutions and custom fields"
        actions={
          canEdit ? (
            <Button variant="ember" icon="plus" onPress={() => setEditor({ row: null })}>
              {`New ${singular}`}
            </Button>
          ) : null
        }
      />
      <ProjectSettingsNav active="fields" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-grow-0">
        <SegmentedControl as="tabs" label="Field groups" value={seg} onChange={setSeg} options={SEGMENTS} />
      </ScrollView>

      <View className="flex-1 rounded-card border border-border bg-surface p-2">
        <ConfigTable
          seg={seg}
          rows={rows}
          status={config.status}
          error={config.error}
          onRetry={config.reload}
          empty={emptyCopy('fields')}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(row) => setEditor({ row })}
          onDelete={(row) => setDeleteTarget(row)}
          onMove={move}
        />
      </View>

      <ConfigFormModal
        key={`${seg}-${editor?.row?._id ?? 'new'}-${editor ? 'open' : 'closed'}`}
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        seg={seg}
        row={editor?.row ?? null}
        members={members}
        onSaved={() => config.reload()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? singular}?`}
        text="Issues that use it keep their data, but the choice is removed from the list."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={runDelete}
      />
    </View>
  );
}
