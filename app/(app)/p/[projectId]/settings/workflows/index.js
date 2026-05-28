// feat(screens/projectSettings/WorkflowsPage): list a project's workflows and create or remove drafts.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { emptyCopy } from '@/metadata/empty';
import { createWorkflow, deleteWorkflow, getWorkflow, listWorkflows } from '@/libs/api/config';
import { usePaged } from '@/utils/usePaged';
import { paths } from '@/routes/paths';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';
import { cleanStatuses } from '@/components/projectSettings/StatusList';
import { cleanTransitions } from '@/components/projectSettings/TransitionEditor';

export default function WorkflowsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const router = useRouter();
  const canManage = can('workflow.manage');

  const workflows = usePaged((p) => listWorkflows(projectId, p), {});
  const [newOpen, setNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const columns = [
    {
      key: 'name',
      label: 'Workflow',
      render: (row) => (
        <View className="gap-0.5">
          <Text className="font-semibold text-foreground">{row.name}</Text>
          {row.description ? <Text className="text-[13px] text-muted">{row.description}</Text> : null}
        </View>
      ),
    },
    {
      key: 'state',
      label: 'State',
      render: (row) => (row.status === 'live' ? <Badge tone="spruce">Live</Badge> : <Badge>Draft</Badge>),
    },
    { key: 'statuses', label: 'Statuses', render: (row) => <Text className="text-muted">{row.statuses?.length ?? 0}</Text> },
    { key: 'transitions', label: 'Transitions', render: (row) => <Text className="text-muted">{row.transitions?.length ?? 0}</Text> },
    { key: 'version', label: 'Version', render: (row) => <Text className="text-muted">{`v${row.version ?? 0}`}</Text> },
  ];

  const open = (row) => router.push(paths.workflow(projectId, row._id));

  const rowMenu = (row) => [
    { id: 'open', label: canManage && row.status === 'draft' ? 'Edit' : 'View', icon: 'pen', onSelect: () => open(row) },
    ...(canManage && row.status === 'draft'
      ? [{ id: 'delete', label: 'Delete draft', icon: 'trash', danger: true, onSelect: () => setDeleteTarget(row) }]
      : []),
  ];

  const runDelete = async () => {
    try {
      await deleteWorkflow(projectId, deleteTarget._id);
      toast.success('Draft deleted');
      workflows.reload();
    } catch (err) {
      if (err?.status === 409) toast.error(err.message);
      throw err;
    }
  };

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <PageHead
        title="Workflows"
        sub="Statuses and transitions an issue moves through"
        actions={
          canManage ? (
            <Button variant="ember" icon="plus" onPress={() => setNewOpen(true)}>
              New draft
            </Button>
          ) : null
        }
      />
      <ProjectSettingsNav active="workflows" />

      <View className="mb-4 flex-1 rounded-card border border-border bg-surface p-2">
        <DataTable
          label="Workflows"
          rowKey="_id"
          columns={columns}
          rows={workflows.items}
          status={workflows.status}
          error={workflows.error}
          onRetry={workflows.reload}
          hasMore={workflows.hasMore}
          onLoadMore={workflows.loadMore}
          loadingMore={workflows.loadingMore}
          onRowClick={open}
          rowMenu={rowMenu}
          empty={emptyCopy('workflows')}
        />
      </View>

      <FormModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New workflow draft"
        description="A draft is edited first, then published to take effect."
        submitLabel="Create draft"
        initialValues={{ name: '', copyFrom: '' }}
        onSubmit={async (v) => {
          const body = { name: v.name.trim() };
          if (v.copyFrom) {
            const source = (await getWorkflow(projectId, v.copyFrom)).data;
            body.statuses = cleanStatuses(source.statuses ?? []);
            body.transitions = cleanTransitions(source.transitions ?? []);
          }
          const created = (await createWorkflow(projectId, body)).data;
          toast.success('Draft created');
          router.push(paths.workflow(projectId, created._id));
        }}
        fields={({ values, set, errors }) => (
          <>
            <Input
              label="Name"
              value={values.name}
              onChangeText={(t) => set('name', t)}
              error={errors.name}
              hint="Use a name your team will recognize, for example Bug triage."
            />
            <Select
              label="Copy from"
              hint="Copies statuses and transitions from a workflow. Start blank to build from scratch."
              value={values.copyFrom}
              options={[
                { value: '', label: 'Start blank' },
                ...(workflows.items ?? []).map((w) => ({ value: w._id, label: `${w.name} (${w.status})` })),
              ]}
              onChange={(v) => set('copyFrom', v)}
              error={errors.copyFrom}
            />
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? 'draft'}?`}
        text="The draft and its statuses are removed. Live workflows cannot be deleted."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={runDelete}
      />
    </View>
  );
}
