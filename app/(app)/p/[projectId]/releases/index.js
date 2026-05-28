// feat(screens/releases/ReleasesPage): plan project releases, track their progress and ship them.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import Illustration from '@/components/ui/Illustration';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteRelease, listReleases, shipRelease } from '@/libs/api/boards';
import { formatDate } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import ReleaseFormModal from '@/components/releases/ReleaseFormModal';

const idOf = (item) => item?.id ?? item?._id ?? null;
const isShipped = (release) => release.status === 'shipped' || Boolean(release.shippedAt);

// Issue progress for one release, from the counts the server returns with it.
function Progress({ counts }) {
  const total = counts?.items ?? 0;
  const done = counts?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <View className="gap-1 min-w-[120px]">
      <View className="h-2 rounded-full bg-well overflow-hidden">
        <View className="h-full bg-spruce rounded-full" style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-muted text-[12px] font-semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {total ? `${done} of ${total} done` : 'No issues linked'}
      </Text>
    </View>
  );
}

export default function ReleasesPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const manage = can('release.manage');
  const releases = usePaged((params) => listReleases(projectId, params));
  const [editing, setEditing] = useState(null); // null | "new" | release
  const [shipping, setShipping] = useState(null);
  const [removing, setRemoving] = useState(null);

  const rows = releases.items.map((r) => ({ ...r, id: idOf(r) }));

  const columns = [
    {
      key: 'name',
      label: 'Release',
      render: (r) => (
        <Text className="font-bold text-foreground" numberOfLines={1}>
          {r.name}
        </Text>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <Badge variant="status" tone={isShipped(r) ? 'spruce' : 'plain'} icon={isShipped(r) ? 'shipped' : 'clock'}>
          {isShipped(r) ? 'Shipped' : 'Unreleased'}
        </Badge>
      ),
    },
    {
      key: 'startDate',
      label: 'Start',
      render: (r) =>
        r.startDate ? (
          <Text className="text-foreground">{formatDate(r.startDate)}</Text>
        ) : (
          <Text className="text-muted">Not set</Text>
        ),
    },
    {
      key: 'releaseDate',
      label: 'Release date',
      render: (r) =>
        r.releaseDate ? (
          <Text className="text-foreground">{formatDate(r.releaseDate)}</Text>
        ) : (
          <Text className="text-muted">Not set</Text>
        ),
    },
    { key: 'progress', label: 'Progress', render: (r) => <Progress counts={r.counts} /> },
  ];

  const menu = (row) =>
    manage
      ? [
          { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setEditing(row) },
          ...(isShipped(row) ? [] : [{ id: 'ship', label: 'Ship', icon: 'shipped', onSelect: () => setShipping(row) }]),
          'separator',
          { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setRemoving(row) },
        ]
      : [];

  const ship = async () => {
    try {
      await shipRelease(projectId, idOf(shipping));
      toast.success('Release shipped');
      releases.reload();
    } catch {
      // The API client reports failures.
    }
    setShipping(null);
  };

  const remove = async () => {
    try {
      await deleteRelease(projectId, idOf(removing));
      toast.success('Release deleted');
      releases.reload();
    } catch {
      // The API client reports failures.
    }
    setRemoving(null);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 pb-12">
        <PageHead
          title="Releases"
          sub="Plan releases, follow their progress and ship them."
          actions={
            manage ? (
              <Button variant="ember" icon="plus" onPress={() => setEditing('new')}>
                New release
              </Button>
            ) : null
          }
        />

        {releases.status === 'success' && rows.length === 0 ? (
          <View className="items-center">
            <Illustration name="empty" alt="" className="w-[160px]" />
          </View>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          rowKey="id"
          status={releases.status}
          error={releases.error}
          onRetry={releases.reload}
          empty={{
            icon: 'release',
            title: 'No releases yet',
            text: 'Plan a release, link issues to it and ship it.',
            action: manage ? (
              <Button variant="soft" size="sm" icon="plus" onPress={() => setEditing('new')}>
                New release
              </Button>
            ) : null,
          }}
          onRowClick={manage ? (row) => setEditing(row) : undefined}
          rowMenu={manage ? menu : undefined}
          hasMore={releases.hasMore}
          onLoadMore={releases.loadMore}
          loadingMore={releases.loadingMore}
        />
      </ScrollView>

      {editing ? (
        <ReleaseFormModal
          open
          onClose={() => setEditing(null)}
          projectId={projectId}
          release={editing === 'new' ? null : editing}
          onSaved={() => releases.reload()}
        />
      ) : null}

      {shipping ? (
        <ConfirmDialog
          open
          onClose={() => setShipping(null)}
          title="Ship this release?"
          text={`${shipping.name} is marked as shipped. Its issues are not changed.`}
          confirmLabel="Ship"
          tone="default"
          onConfirm={ship}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          open
          onClose={() => setRemoving(null)}
          title="Delete this release?"
          text={`${removing.name} is removed. Its issues stay in the project.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={remove}
        />
      ) : null}
    </View>
  );
}
