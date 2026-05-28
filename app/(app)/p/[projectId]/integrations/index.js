// feat(screens/integrations/IntegrationsPage): connect, configure and disconnect a project's code, chat and import integrations.
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, TextInput, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { connectIntegration, deleteIntegration, disconnectIntegration, listIntegrations } from '@/libs/api/automation';
import { useResource } from '@/utils/useResource';
import { Chip, confirmThen } from '@/components/issues/sheets';
import IntegrationCard, { CATEGORIES, PROVIDER_BY_KEY, PROVIDERS } from '@/components/integrations/IntegrationCard';
import IntegrationFormModal from '@/components/integrations/IntegrationFormModal';
import IntegrationsTabs from '@/components/integrations/IntegrationsTabs';

const idOf = (row) => String(row?.id ?? row?._id ?? '');
const norm = (row) => ({ ...row, id: idOf(row) });

const CATEGORY_CHIPS = ['all', ...CATEGORIES];

export default function IntegrationsPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canManage = can('integration.manage');

  const integrationsQ = useResource(() => listIntegrations(projectId, { limit: 100 }), [projectId]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [busyKey, setBusyKey] = useState(null);
  const [formFor, setFormFor] = useState(null);

  // Each saved integration gets a card. Providers without one get a Connect card.
  const records = (integrationsQ.data ?? []).map(norm);
  const entries = [
    ...records.map((rec) => ({
      key: `${rec.provider}-${rec.id}`,
      provider: rec.provider,
      item: PROVIDER_BY_KEY[rec.provider] ?? { key: rec.provider, name: rec.provider, desc: '', cat: 'Code', icon: 'plug' },
      integration: rec,
    })),
    ...PROVIDERS.filter((p) => !records.some((r) => r.provider === p.key)).map((p) => ({
      key: `${p.key}-new`,
      provider: p.key,
      item: p,
      integration: null,
    })),
  ];

  const needle = query.trim().toLowerCase();
  const matches = (e) =>
    !needle || `${e.item.name} ${e.item.desc} ${e.item.cat} ${e.integration?.displayName ?? ''}`.toLowerCase().includes(needle);
  const counts = Object.fromEntries(
    CATEGORY_CHIPS.map((c) => [c, entries.filter((e) => matches(e) && (c === 'all' || e.item.cat === c)).length]),
  );
  const visible = entries.filter((e) => matches(e) && (cat === 'all' || e.item.cat === cat));

  const upsert = (rec) => {
    if (!rec) return;
    const next = norm(rec);
    integrationsQ.setData((prev) => {
      const list = prev ?? [];
      return list.some((r) => idOf(r) === next.id)
        ? list.map((r) => (idOf(r) === next.id ? { ...r, ...next } : r))
        : [...list, next];
    });
  };

  const onPrimary = async (entry) => {
    if (!entry.integration || entry.integration.status === 'connected') {
      setFormFor({ provider: entry.provider, integration: entry.integration });
      return;
    }
    setBusyKey(entry.key);
    try {
      const res = await connectIntegration(projectId, entry.integration.id);
      upsert(res.data ?? { ...entry.integration, status: 'connected' });
      toast.success(`Connected ${entry.item.name}`);
    } catch {
      // The API layer shows the error toast.
    } finally {
      setBusyKey(null);
    }
  };

  const askDisconnect = (record, name) =>
    confirmThen(
      { title: `Disconnect ${name}?`, text: 'Syncing stops until you connect it again.', confirmLabel: 'Disconnect' },
      async () => {
        const res = await disconnectIntegration(projectId, record.id);
        upsert(res.data ?? { ...record, status: 'disconnected' });
        toast.success('Disconnected');
      },
    );

  const askDelete = (record, name) =>
    confirmThen(
      {
        title: `Delete ${name}?`,
        text: 'Its linked items will be removed. This cannot be undone.',
        confirmLabel: 'Delete',
        tone: 'danger',
      },
      async () => {
        await deleteIntegration(projectId, record.id);
        integrationsQ.setData((prev) => (prev ?? []).filter((r) => idOf(r) !== record.id));
        toast.success('Integration deleted');
      },
    );

  const menuFor = (entry) => {
    const rec = entry.integration;
    if (!rec) return null;
    const name = entry.item.name;
    return [
      { id: 'configure', label: 'Configure', icon: 'gear', onSelect: () => setFormFor({ provider: entry.provider, integration: rec }) },
      rec.status === 'connected'
        ? { id: 'disconnect', label: 'Disconnect', icon: 'unlink', onSelect: () => askDisconnect(rec, name) }
        : null,
      'separator',
      { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => askDelete(rec, name) },
    ].filter(Boolean);
  };

  const denied = integrationsQ.error?.status === 403;

  let empty = null;
  if (integrationsQ.status === 'loading') empty = <Skeleton variant="cards" count={3} />;
  else if (integrationsQ.status === 'error')
    empty = (
      <EmptyState
        tone="error"
        title={denied ? 'Only project admins manage integrations' : integrationsQ.error?.message ?? 'Could not load integrations.'}
        onRetry={denied ? undefined : integrationsQ.reload}
      />
    );
  else empty = <EmptyState icon="plug" title="No integrations match" text="Try another search or category." />;

  const header = (
    <View className="gap-[14px] mb-[12px]">
      <PageHead
        title="Integrations"
        sub="Connect code, chat and import sources to this project. Each one links its items to issues."
      />
      <IntegrationsTabs pid={projectId} active="integrations" />
      <View className="flex-row items-center gap-[8px] border border-border rounded-[12px] bg-surface px-[12px]">
        <Icon name="search" size={16} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search integrations"
          accessibilityLabel="Search integrations"
          autoCorrect={false}
          autoCapitalize="none"
          className="flex-1 py-[10px] text-[15px] text-foreground"
          placeholderTextColorClassName="accent-muted"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[8px]">
        {CATEGORY_CHIPS.map((c) => (
          <Chip key={c} pressed={cat === c} count={counts[c]} onPress={() => setCat(c)}>
            {c === 'all' ? 'All' : c}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={integrationsQ.status === 'success' ? visible : []}
        keyExtractor={(e) => e.key}
        contentContainerClassName="p-[16px] pb-[40px]"
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View className="h-[12px]" />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        refreshControl={<RefreshControl refreshing={false} onRefresh={integrationsQ.reload} />}
        renderItem={({ item: e }) => (
          <IntegrationCard
            cardKey={e.key}
            item={e.item}
            integration={e.integration}
            query={query.trim()}
            canManage={canManage}
            busy={busyKey === e.key}
            onPrimary={() => onPrimary(e)}
            menuItems={canManage ? menuFor(e) : null}
          />
        )}
      />

      {formFor ? (
        <IntegrationFormModal
          key={`${formFor.provider}-${formFor.integration ? idOf(formFor.integration) : 'new'}`}
          open
          onClose={() => setFormFor(null)}
          pid={projectId}
          provider={formFor.provider}
          integration={formFor.integration}
          onSaved={upsert}
        />
      ) : null}
    </View>
  );
}
