// feat(screens/serviceDesk/DeskSettingsPage): manage service desk customers, request types and SLA policies.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import {
  deleteCustomer,
  deleteRequestType,
  deleteSlaPolicy,
  listCustomers,
  listRequestTypes,
  listSlaPolicies,
} from '@/libs/api/servicedesk';
import { paths } from '@/routes/paths';
import { formatDuration } from '@/utils/format';
import { useResource } from '@/utils/useResource';
import DeskEntityModal from '@/components/serviceDesk/DeskEntityModal';

const idOf = (row) => String(row?.id ?? row?._id ?? '');
const withId = (row) => ({ ...row, id: idOf(row) });

const TABS = [
  { value: 'customers', label: 'Customers' },
  { value: 'request-types', label: 'Request types' },
  { value: 'sla-policies', label: 'SLA policies' },
];

const ENTITY_LABEL = { customers: 'customer', 'request-types': 'request type', 'sla-policies': 'SLA policy' };
const DELETE = { customers: deleteCustomer, 'request-types': deleteRequestType, 'sla-policies': deleteSlaPolicy };

const EMPTY = {
  customers: { icon: 'customer', title: 'No customers yet', text: 'Customers are the people who raise requests.' },
  'request-types': { icon: 'ticket', title: 'No request types', text: 'Request types group the requests customers can raise.' },
  'sla-policies': { icon: 'sla', title: 'No SLA policies', text: 'Policies set the response and resolution targets.' },
};

const minutesText = (m) => (m == null ? 'None' : formatDuration(m * 60));

function NameCell({ name, sub }) {
  return (
    <View className="min-w-0">
      <Text className="font-semibold text-foreground" numberOfLines={1}>
        {name}
      </Text>
      {sub ? (
        <Text className="text-muted text-[12.5px]" numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export default function DeskSettingsPage() {
  const { projectId, can, types, priorities, members } = useProject();
  const toast = useToast();

  const [tab, setTab] = useState('customers');
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const customersQ = useResource(() => listCustomers(projectId, { limit: 100 }), [projectId]);
  const typesQ = useResource(() => listRequestTypes(projectId, { limit: 100 }), [projectId]);
  const policiesQ = useResource(() => listSlaPolicies(projectId, { limit: 100 }), [projectId]);

  const lists = { customers: customersQ, 'request-types': typesQ, 'sla-policies': policiesQ };
  const current = lists[tab];

  // Customers need developer. Request types and SLA policies need lead.
  const canEdit = tab === 'customers' ? can('issue.edit') : can('config.manage');

  const policies = (policiesQ.data ?? []).map(withId);
  const typeNames = Object.fromEntries((types ?? []).map((t) => [idOf(t), t.name]));
  const policyNames = Object.fromEntries(policies.map((p) => [p.id, p.name]));

  const upsert = (entity, rec) => {
    const next = withId(rec);
    lists[entity].setData((prev) => {
      const list = prev ?? [];
      return list.some((r) => idOf(r) === next.id)
        ? list.map((r) => (idOf(r) === next.id ? { ...r, ...next } : r))
        : [...list, next];
    });
  };

  const confirmDelete = async () => {
    const { entity, record } = pendingDelete;
    await DELETE[entity](projectId, idOf(record));
    lists[entity].setData((prev) => (prev ?? []).filter((r) => idOf(r) !== idOf(record)));
    toast.success('Deleted');
  };

  const rowMenu = (row) => [
    { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setEditor({ entity: tab, record: row }) },
    'separator',
    { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setPendingDelete({ entity: tab, record: row }) },
  ];

  const columnsFor = {
    customers: [
      { key: 'name', label: 'Customer', render: (row) => <NameCell name={row.name} sub={row.email} /> },
      { key: 'company', label: 'Company', render: (row) => <Text className="text-muted">{row.company || '—'}</Text> },
      {
        key: 'requestCount',
        label: 'Requests',
        align: 'right',
        render: (row) => (
          <Text className="text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
            {row.requestCount ?? 0}
          </Text>
        ),
      },
    ],
    'request-types': [
      { key: 'name', label: 'Request type', render: (row) => <NameCell name={row.name} sub={row.description} /> },
      {
        key: 'issueType',
        label: 'Issue type',
        render: (row) => <Text className="text-muted">{typeNames[String(row.issueTypeId)] ?? '—'}</Text>,
      },
      {
        key: 'sla',
        label: 'SLA',
        render: (row) => <Text className="text-muted">{policyNames[String(row.slaPolicyId)] ?? 'None'}</Text>,
      },
      {
        key: 'approval',
        label: 'Approval',
        render: (row) =>
          row.approvalRequired ? <Badge tone="iris">Required</Badge> : <Badge tone="plain">Not required</Badge>,
      },
      {
        key: 'active',
        label: 'Status',
        render: (row) =>
          row.isActive === false ? <Badge tone="plain">Inactive</Badge> : <Badge tone="spruce">Active</Badge>,
      },
    ],
    'sla-policies': [
      { key: 'name', label: 'Policy', render: (row) => <NameCell name={row.name} sub={row.description} /> },
      {
        key: 'targets',
        label: 'Targets',
        render: (row) => (
          <Text className="text-muted">
            First response {minutesText(row.targets?.firstResponseMinutes)}, resolution{' '}
            {minutesText(row.targets?.resolutionMinutes)}
          </Text>
        ),
      },
      {
        key: 'default',
        label: 'Default',
        render: (row) => (row.isDefault ? <Badge tone="saffron">Default</Badge> : <Text className="text-muted">—</Text>),
      },
    ],
  };

  const rows =
    tab === 'customers'
      ? (customersQ.data ?? []).map(withId)
      : tab === 'request-types'
        ? (typesQ.data ?? []).map(withId)
        : policies;

  const openNew = () => setEditor({ entity: tab, record: null });

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 pb-12">
        <PageHead
          title="Desk settings"
          sub="Customers, request types and SLA policies used by the service desk."
          back={{ to: paths.desk(projectId), label: 'Service desk' }}
          actions={
            canEdit ? (
              <Button variant="ember" icon="plus" onPress={openNew}>
                New {ENTITY_LABEL[tab]}
              </Button>
            ) : null
          }
        />

        <View className="mb-3">
          <SegmentedControl as="tabs" label="Desk settings sections" value={tab} onChange={setTab} options={TABS} />
        </View>

        <DataTable
          label={TABS.find((t) => t.value === tab)?.label}
          columns={columnsFor[tab]}
          rows={rows}
          rowKey="id"
          status={current.status}
          error={current.error}
          onRetry={current.reload}
          empty={{
            ...EMPTY[tab],
            action: canEdit ? (
              <Button variant="ember" icon="plus" onPress={openNew}>
                New {ENTITY_LABEL[tab]}
              </Button>
            ) : undefined,
          }}
          onRowClick={canEdit ? (row) => setEditor({ entity: tab, record: row }) : undefined}
          rowMenu={canEdit ? rowMenu : undefined}
        />
      </ScrollView>

      {editor ? (
        <DeskEntityModal
          key={`${editor.entity}-${editor.record ? idOf(editor.record) : 'new'}`}
          open
          onClose={() => setEditor(null)}
          pid={projectId}
          entity={editor.entity}
          record={editor.record}
          lookups={{ types, priorities, members, policies }}
          onSaved={(rec) => upsert(editor.entity, rec)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete ? `Delete this ${ENTITY_LABEL[pendingDelete.entity]}?` : 'Delete?'}
        text={pendingDelete ? `"${pendingDelete.record.name}" will be removed. Existing requests keep their history.` : ''}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}
