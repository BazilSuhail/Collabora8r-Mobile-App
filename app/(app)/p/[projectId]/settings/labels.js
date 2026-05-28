// feat(screens/projectSettings/LabelsPage): manage a project's labels and components.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import Dropdown from '@/components/ui/Dropdown';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/ui/Illustration';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { emptyCopy } from '@/metadata/empty';
import { listComponents, listLabels } from '@/libs/api/config';
import { cn } from '@/utils/cn';
import { useResource } from '@/utils/useResource';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';
import ConfigFormModal, { SEG_SINGULAR, configApi } from '@/components/projectSettings/ConfigFormModal';
import { SWATCH } from '@/components/projectSettings/ConfigTable';

const TABS = [
  { value: 'labels', label: 'Labels' },
  { value: 'components', label: 'Components' },
];

function LabelChip({ row, ...pressProps }) {
  const Wrapper = pressProps.onPress ? Pressable : View;
  return (
    <Wrapper
      {...pressProps}
      accessibilityRole={pressProps.onPress ? 'button' : undefined}
      className="h-[30px] flex-row items-center gap-2 rounded-full border border-border bg-background px-3"
    >
      <View accessible={false} className={cn('h-2.5 w-2.5 rounded-[3px]', SWATCH[row.color] ?? 'bg-muted')} />
      <Text className="text-[13px] font-semibold text-foreground">{row.name}</Text>
    </Wrapper>
  );
}

export default function LabelsPage() {
  const { projectId, can, members } = useProject();
  const toast = useToast();
  const [tab, setTab] = useState('labels');

  // Server rules: labels are created by reporters, components by leads; deletes need admin.
  const isLabels = tab === 'labels';
  const canCreate = isLabels ? can('label.create') : can('config.manage');
  const canEdit = can('config.manage');
  const canDelete = isLabels ? can('label.delete') : can('config.delete');

  const data = useResource(
    () => (isLabels ? listLabels(projectId, { limit: 100 }) : listComponents(projectId, { limit: 100 })),
    [projectId, tab],
  );
  const rows = data.data ?? [];

  const [editor, setEditor] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const runDelete = async () => {
    try {
      await configApi(tab).remove(projectId, deleteTarget._id);
      toast.success('Deleted');
      data.reload();
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) toast.error(err.message);
      throw err;
    }
  };

  const itemMenu = (row) => [
    ...(canEdit ? [{ id: 'edit', label: 'Edit', icon: 'pen', onSelect: () => setEditor({ row }) }] : []),
    ...(canDelete ? [{ id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setDeleteTarget(row) }] : []),
  ];

  const componentColumns = [
    { key: 'name', label: 'Component', render: (row) => <Text className="font-semibold text-foreground">{row.name}</Text> },
    {
      key: 'lead',
      label: 'Lead',
      render: (row) =>
        row.leadName ? (
          <View className="flex-row items-center gap-2">
            <Avatar name={row.leadName} size="xs" />
            <Text className="text-foreground">{row.leadName}</Text>
          </View>
        ) : (
          <Text className="text-muted">No lead</Text>
        ),
    },
    { key: 'description', label: 'Description', render: (row) => <Text className="text-muted">{row.description ?? ''}</Text> },
  ];

  const body = () => {
    if (data.status === 'loading') return <Skeleton variant="rows" count={4} cols={3} />;
    if (data.status === 'error') {
      return (
        <EmptyState
          tone="error"
          icon={isLabels ? 'labels' : 'component'}
          title="This list could not load"
          text={data.error?.message}
          onRetry={data.reload}
        />
      );
    }
    if (!isLabels) {
      return (
        <DataTable
          label="Components"
          rowKey="_id"
          columns={componentColumns}
          rows={rows}
          status={data.status}
          error={data.error}
          onRetry={data.reload}
          rowMenu={canEdit || canDelete ? itemMenu : undefined}
          empty={{ icon: 'component', title: 'No components yet', text: 'Components group issues by area of the product.' }}
        />
      );
    }
    if (rows.length === 0) {
      return (
        <View className="items-center gap-3">
          <Illustration name="empty" className="h-[140px] w-[180px]" />
          <EmptyState icon={emptyCopy('labels').icon} title={emptyCopy('labels').title} text={emptyCopy('labels').text} />
        </View>
      );
    }
    // Tapping a label opens its action sheet, the mobile stand-in for the web chip menu.
    return (
      <ScrollView>
        <View className="flex-row flex-wrap gap-2" accessibilityLabel="Labels">
          {rows.map((row) => {
            const items = itemMenu(row);
            return items.length ? (
              <Dropdown
                key={row._id}
                label={`Actions for ${row.name}`}
                items={items}
                trigger={(triggerProps) => <LabelChip row={row} {...triggerProps} />}
              />
            ) : (
              <LabelChip key={row._id} row={row} />
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <PageHead
        title="Labels"
        sub="Group issues across the project"
        actions={
          canCreate ? (
            <Button variant="ember" icon="plus" onPress={() => setEditor({ row: null })}>
              {`New ${SEG_SINGULAR[tab]}`}
            </Button>
          ) : null
        }
      />
      <ProjectSettingsNav active="labels" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-grow-0">
        <SegmentedControl as="tabs" label="Label groups" value={tab} onChange={setTab} options={TABS} />
      </ScrollView>

      <View className="mb-4 flex-1 rounded-card border border-border bg-surface p-4" accessibilityLabel={isLabels ? 'Labels' : 'Components'}>
        {body()}
      </View>

      <ConfigFormModal
        key={`${tab}-${editor?.row?._id ?? 'new'}`}
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        seg={tab}
        row={editor?.row ?? null}
        members={members}
        onSaved={() => data.reload()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? SEG_SINGULAR[tab]}?`}
        text="Issues keep their history, but this choice is removed from every issue."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={runDelete}
      />
    </View>
  );
}
