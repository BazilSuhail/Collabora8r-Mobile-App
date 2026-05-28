// feat(screens/integrations/WebhooksPage): manage a project's webhooks, send test pings and redeliver failed deliveries.
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Switch, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import SecretRevealModal from '@/components/shared/SecretRevealModal';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteWebhook, listWebhooks, testWebhook, updateWebhook } from '@/libs/api/automation';
import { emptyCopy } from '@/metadata/empty';
import { relativeTime } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import { MoreButton, confirmThen } from '@/components/issues/sheets';
import DeliveriesDrawer from '@/components/integrations/DeliveriesDrawer';
import IntegrationsTabs from '@/components/integrations/IntegrationsTabs';
import WebhookFormModal from '@/components/integrations/WebhookFormModal';

const idOf = (row) => String(row?.id ?? row?._id ?? '');
const withId = (row) => ({ ...row, id: idOf(row) });

// The signing secret is returned once on create and never listed again.
const withoutSecret = (hook) => {
  const { secret: _secret, ...listed } = hook;
  return listed;
};

function LastDelivery({ hook }) {
  if (hook.lastStatus == null) return <Badge tone="plain">No deliveries</Badge>;
  const code = Number(hook.lastStatus);
  const ok = code >= 200 && code < 300;
  return (
    <View className="flex-row flex-wrap items-center gap-[8px]">
      <Badge tone={ok ? 'spruce' : 'ember'} variant="status" label={`Last response ${hook.lastStatus}`}>
        {String(hook.lastStatus)}
      </Badge>
      {hook.lastDeliveredAt ? <Text className="text-muted text-[12.5px]">{relativeTime(hook.lastDeliveredAt)}</Text> : null}
    </View>
  );
}

export default function WebhooksPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canManage = can('webhook.manage');

  const hooksQ = usePaged((q) => listWebhooks(projectId, q), {});
  const hooks = hooksQ.items.map(withId);

  const [form, setForm] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const setActive = (id, active) => hooksQ.setItems((prev) => prev.map((h) => (idOf(h) === id ? { ...h, active } : h)));

  const applyActive = async (id, active) => {
    setActive(id, active);
    await updateWebhook(projectId, id, { active });
  };

  const onToggle = async (hook) => {
    const before = Boolean(hook.active);
    const next = !before;
    setPendingId(hook.id);
    try {
      await applyActive(hook.id, next);
      toast.success(next ? 'Webhook turned on' : 'Webhook turned off', {
        undo: async () => {
          try {
            await applyActive(hook.id, before);
          } catch {
            setActive(hook.id, next);
          }
        },
      });
    } catch {
      setActive(hook.id, before);
    } finally {
      setPendingId(null);
    }
  };

  const onPing = async (hook) => {
    try {
      const res = await testWebhook(projectId, hook.id);
      const code = res.data?.responseCode;
      if ((code != null && code >= 400) || res.data?.error) toast.warning('Ping sent, but the endpoint did not accept it.');
      else toast.success('Ping sent');
    } catch {
      // The API layer shows the error toast.
    }
  };

  const askDelete = (hook) =>
    confirmThen(
      {
        title: 'Delete this webhook?',
        text: `"${hook.name}" stops receiving events and its deliveries are removed.`,
        confirmLabel: 'Delete',
        tone: 'danger',
      },
      async () => {
        await deleteWebhook(projectId, hook.id);
        hooksQ.setItems((prev) => prev.filter((h) => idOf(h) !== hook.id));
        toast.success('Webhook deleted');
      },
    );

  const onCreated = (hook) => {
    hooksQ.setItems((prev) => [withId(withoutSecret(hook)), ...prev]);
    if (hook.secret) setRevealed({ name: hook.name, value: hook.secret });
  };

  const onSaved = (hook) => {
    hooksQ.setItems((prev) => prev.map((h) => (idOf(h) === idOf(hook) ? { ...h, ...withoutSecret(hook) } : h)));
  };

  const rowMenu = (row) => [
    { id: 'edit', label: 'Edit webhook', icon: 'edit', onSelect: () => setForm({ webhook: row }) },
    { id: 'ping', label: 'Send ping', icon: 'send', onSelect: () => onPing(row) },
    { id: 'deliveries', label: 'Deliveries', icon: 'history', onSelect: () => setDeliveriesFor(row) },
    'separator',
    { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => askDelete(row) },
  ];

  const openNew = () => setForm({ webhook: null });
  const newButton = canManage ? (
    <Button variant="ember" icon="plus" size="sm" onClick={openNew} onPress={openNew}>
      New webhook
    </Button>
  ) : null;

  let empty = null;
  if (hooksQ.status === 'loading') empty = <Skeleton variant="cards" count={3} />;
  else if (hooksQ.status === 'error') empty = <EmptyState tone="error" title={hooksQ.error?.message ?? 'Could not load webhooks'} onRetry={hooksQ.reload} />;
  else empty = <EmptyState {...emptyCopy('webhooks')} action={newButton ?? undefined} />;

  const header = (
    <View className="gap-[14px] mb-[12px]">
      <PageHead
        title="Webhooks"
        sub="Send project events to other systems. Each request is signed with the webhook's secret."
        actions={newButton}
      />
      <IntegrationsTabs pid={projectId} active="webhooks" />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={hooksQ.status === 'success' ? hooks : []}
        keyExtractor={(h) => h.id}
        contentContainerClassName="p-[16px] pb-[40px]"
        ItemSeparatorComponent={() => <View className="h-[12px]" />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={<RefreshControl refreshing={false} onRefresh={hooksQ.reload} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hooksQ.hasMore && !hooksQ.loadingMore) hooksQ.loadMore();
        }}
        ListFooterComponent={hooksQ.loadingMore ? <ActivityIndicator className="mt-[16px]" /> : null}
        renderItem={({ item: row }) => (
          <View className="bg-surface border border-border rounded-[16px] p-[14px] gap-[10px]">
            <View className="flex-row items-start gap-[10px]">
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="font-semibold text-foreground text-[15px]">
                  {row.name}
                </Text>
                <Text numberOfLines={2} className="text-muted text-[12.5px] mt-[2px]">
                  {row.url}
                </Text>
              </View>
              <Switch
                value={Boolean(row.active)}
                disabled={!canManage || pendingId === row.id}
                onValueChange={() => onToggle(row)}
                accessibilityLabel={`Active for ${row.name}`}
              />
              {canManage ? <MoreButton label={`Actions for ${row.name}`} items={rowMenu(row)} /> : null}
            </View>
            <View className="flex-row flex-wrap items-center gap-[8px]">
              <Badge tone="plain">{`${row.events?.length ?? 0} events`}</Badge>
              <LastDelivery hook={row} />
            </View>
          </View>
        )}
      />

      {form ? (
        <WebhookFormModal
          key={form.webhook ? idOf(form.webhook) : 'new'}
          open
          onClose={() => setForm(null)}
          pid={projectId}
          webhook={form.webhook}
          onSaved={onSaved}
          onCreated={onCreated}
        />
      ) : null}

      <SecretRevealModal
        open={Boolean(revealed)}
        onClose={() => setRevealed(null)}
        title="Signing secret"
        description={revealed ? `Copy the secret for ${revealed.name} now. It is shown once and cannot be read again.` : ''}
        label="Signing secret"
        value={revealed?.value ?? ''}
      />

      {deliveriesFor ? (
        <DeliveriesDrawer
          key={deliveriesFor.id}
          open
          onClose={() => setDeliveriesFor(null)}
          pid={projectId}
          webhook={deliveriesFor}
        />
      ) : null}
    </View>
  );
}
