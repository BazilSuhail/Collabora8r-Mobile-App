// feat(app/(app)/ai/index): show the user's AI drafts and daily usage, and let them accept or discard each draft.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import DraftPreview from '@/components/ai/DraftPreview';
import UsageMeter from '@/components/ai/UsageMeter';
import { listDrafts, usage } from '@/libs/api/ai';
import { emptyCopy } from '@/metadata/empty';
import { relativeTime } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import { useResource } from '@/utils/useResource';

const idOf = (item) => String(item?.id ?? item?._id);

const KIND_LABEL = { issues: 'Issue', summary: 'Summary', wikiPage: 'Wiki outline' };

const STATUS = {
  ready: { label: 'Ready', tone: 'spruce' },
  pending: { label: 'Drafting', tone: 'saffron' },
  failed: { label: 'Failed', tone: 'ember' },
  accepted: { label: 'Accepted', tone: 'plain' },
  discarded: { label: 'Discarded', tone: 'plain' },
};

export default function AiDraftsPage() {
  const drafts = usePaged((params) => listDrafts(params), {});
  const usageRes = useResource(() => usage(), []);
  const [active, setActive] = useState(null);

  const unavailable = [drafts.error, usageRes.error].some((err) => err?.status === 503);
  const rows = drafts.items.map((draft) => ({ ...draft, id: idOf(draft) }));

  const columns = [
    { key: 'kind', label: 'Kind', render: (row) => KIND_LABEL[row.kind] ?? row.kind },
    {
      key: 'project',
      label: 'Project',
      render: (row) => (row.projectId ? `Project ${String(row.projectId).slice(-6)}` : 'Personal'),
    },
    {
      key: 'created',
      label: 'Created',
      render: (row) => (row.createdAt ? relativeTime(row.createdAt) : 'Unknown'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const info = STATUS[row.status] ?? { label: row.status, tone: 'plain' };
        return (
          <Badge variant="status" tone={info.tone}>
            {info.label}
          </Badge>
        );
      },
    },
  ];

  let usageCard;
  if (usageRes.status === 'loading') {
    usageCard = <Skeleton variant="cards" count={1} />;
  } else if (usageRes.status === 'error') {
    usageCard = <EmptyState tone="error" title="Usage did not load" text={usageRes.error?.message} onRetry={usageRes.reload} />;
  } else {
    usageCard = <UsageMeter usage={usageRes.data} />;
  }

  // DataTable renders a FlatList on mobile, so the usage card rides in its header to keep one scroller.
  const header = (
    <>
      <PageHead
        title="AI drafts"
        sub="Drafts you asked for, with today's usage. Accept a draft to use it, or discard it."
      />
      <View className="mb-4 p-5 rounded-card border border-border bg-surface">{usageCard}</View>
    </>
  );

  return (
    <View className="flex-1 bg-background">
      {unavailable ? (
        <ScrollView className="flex-1" contentContainerClassName="p-4">
          <PageHead
            title="AI drafts"
            sub="Drafts you asked for, with today's usage. Accept a draft to use it, or discard it."
          />
          <View className="p-4 rounded-card border border-border bg-surface">
            <EmptyState
              icon="sparkle"
              title="AI is not configured on this server"
              text="An administrator needs to turn on AI before drafts can be made."
            />
          </View>
        </ScrollView>
      ) : (
        <DataTable
          label="AI drafts"
          columns={columns}
          rows={rows}
          rowKey="id"
          status={drafts.status}
          error={drafts.error}
          onRetry={drafts.reload}
          onRefresh={drafts.reload}
          empty={{ ...emptyCopy('ai'), action: null }}
          onRowClick={(row) => setActive(row)}
          hasMore={drafts.hasMore}
          onLoadMore={drafts.loadMore}
          loadingMore={drafts.loadingMore}
          ListHeaderComponent={header}
          contentContainerClassName="p-4"
        />
      )}
      <DraftPreview
        open={Boolean(active)}
        onClose={() => setActive(null)}
        draft={active}
        onAccepted={() => {
          setActive(null);
          drafts.reload();
        }}
        onDiscarded={() => {
          setActive(null);
          drafts.reload();
        }}
      />
    </View>
  );
}
