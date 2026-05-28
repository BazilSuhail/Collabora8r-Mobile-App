// feat(screens/projectSettings/ProjectAuditPage): let project admins review and filter the project audit log.
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import DataTable from '@/components/ui/DataTable';
import Select from '@/components/ui/Select';
import SideModal from '@/components/ui/SideModal';
import { useProject } from '@/context/ProjectContext';
import { emptyCopy } from '@/metadata/empty';
import { listProjectAudit } from '@/libs/api/projects';
import { searchUsers } from '@/libs/api/users';
import { formatDateTime } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';

const ALL = '';

function JsonBlock({ icon, title, value }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={14} className="text-muted" />
        <Text accessibilityRole="header" className="text-[13px] font-bold uppercase tracking-wider text-muted">
          {title}
        </Text>
      </View>
      <ScrollView horizontal className="rounded-2xl bg-background p-3">
        <Text selectable className="font-mono text-[12.5px] text-foreground">
          {JSON.stringify(value ?? null, null, 2)}
        </Text>
      </ScrollView>
    </View>
  );
}

export default function ProjectAuditPage() {
  const { projectId } = useProject();

  const [action, setAction] = useState(ALL);
  const [actorId, setActorId] = useState(ALL);
  const [seenActions, setSeenActions] = useState([]);
  const [detail, setDetail] = useState(null);

  const audit = usePaged((p) => listProjectAudit(projectId, p), {
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
  });

  // Keeps every action seen so far in the filter, so choosing one does not drop the others.
  useEffect(() => {
    const incoming = audit.items.map((row) => row.action).filter(Boolean);
    if (!incoming.length) return;
    setSeenActions((prev) => {
      const next = [...new Set([...prev, ...incoming])].sort();
      return next.length === prev.length ? prev : next;
    });
  }, [audit.items]);

  const actionOptions = [{ value: ALL, label: 'All actions' }, ...seenActions.map((a) => ({ value: a, label: a }))];

  const columns = [
    { key: 'at', label: 'When', render: (row) => <Text className="text-muted">{formatDateTime(row.at)}</Text> },
    {
      key: 'actor',
      label: 'Actor',
      render: (row) => (
        <View className="min-w-0 flex-row items-center gap-2">
          <Avatar name={row.actorName || 'System'} size="xs" />
          <Text className="text-foreground" numberOfLines={1}>
            {row.actorName || 'System'}
          </Text>
        </View>
      ),
    },
    { key: 'action', label: 'Action', render: (row) => <Badge>{row.action}</Badge> },
    {
      key: 'target',
      label: 'Target',
      render: (row) => (
        <View className="min-w-0">
          <Text className="text-foreground" numberOfLines={1}>
            {row.targetName || row.targetType || '-'}
          </Text>
          {row.targetType && row.targetName ? <Text className="text-[12.5px] text-muted">{row.targetType}</Text> : null}
        </View>
      ),
    },
  ];

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <PageHead title="Audit log" sub="Changes made in this project" />
      <ProjectSettingsNav active="audit" />

      <View className="mb-4 flex-1 gap-4 rounded-card border border-border bg-surface p-4" accessibilityLabel="Filters">
        <View className="gap-3">
          <Select label="Action" value={action} options={actionOptions} onChange={setAction} hint="Show one kind of change" />
          <Select
            label="Actor"
            value={actorId}
            searchable
            placeholder="Anyone"
            loadOptions={(q) =>
              searchUsers(q)
                .then((res) => [
                  { value: ALL, label: 'Anyone' },
                  ...res.data.map((u) => ({ value: u.id, label: u.displayName, description: u.email })),
                ])
                .catch(() => [{ value: ALL, label: 'Anyone' }])
            }
            hint="Show changes made by one person"
            onChange={setActorId}
          />
        </View>

        <View className="flex-1">
          <DataTable
            label="Project audit log"
            rowKey="_id"
            columns={columns}
            rows={audit.items}
            status={audit.status}
            error={audit.error}
            onRetry={audit.reload}
            hasMore={audit.hasMore}
            onLoadMore={audit.loadMore}
            loadingMore={audit.loadingMore}
            onRowClick={(row) => setDetail(row)}
            empty={emptyCopy('project-audit')}
          />
        </View>
      </View>

      <SideModal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.action ?? 'Audit entry'}
        subtitle={detail ? `${formatDateTime(detail.at)} by ${detail.actorName || 'System'}` : undefined}
      >
        <View className="gap-4">
          <JsonBlock icon="history" title="Before" value={detail?.before} />
          <JsonBlock icon="check" title="After" value={detail?.after} />
        </View>
      </SideModal>
    </View>
  );
}
