// feat(screens/risks/RisksPage): keep a project risk register with a probability by impact matrix.
import { useState } from 'react';
import { LayoutAnimation, ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteRisk, listRisks } from '@/libs/api/planning';
import { EMPTY } from '@/metadata/empty';
import { usePaged } from '@/utils/usePaged';
import RiskFormModal from '@/components/risks/RiskFormModal';
import RiskMatrix, { riskTone } from '@/components/risks/RiskMatrix';

const withIds = (res) => ({ ...res, data: (res.data ?? []).map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchRisks = ({ pid, ...p }) => listRisks(pid, p).then(withIds);

const SCORE_BADGE = { ok: 'spruce', warn: 'saffron', bad: 'ember' };
const STATUS_LABEL = { open: 'Open', mitigating: 'Mitigating', accepted: 'Accepted', closed: 'Closed' };
const STATUS_TONE = { open: 'ember', mitigating: 'saffron', accepted: 'iris', closed: 'spruce' };

export default function RisksPage() {
  const { projectId, can, members } = useProject();
  const toast = useToast();
  const canEdit = can('risk.edit');
  const risks = usePaged(fetchRisks, { pid: projectId });
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ open: false, target: null });
  const [deleting, setDeleting] = useState(null);

  const visible = selected
    ? risks.items.filter((r) => r.probability === selected.p && r.impact === selected.i)
    : risks.items;

  // The web FLIP animation becomes a native layout animation on the filtered register.
  const pickCell = (cell) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(cell);
  };

  const confirmDelete = async () => {
    try {
      await deleteRisk(projectId, deleting.id);
      toast.success('Risk deleted');
      setDeleting(null);
      risks.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Risk',
      render: (row) => (
        <View className="gap-[2px] min-w-0">
          <Text className="font-semibold text-foreground" numberOfLines={1}>
            {row.title}
          </Text>
          {row.category ? <Text className="text-muted text-[12.5px]">{row.category}</Text> : null}
        </View>
      ),
    },
    { key: 'probability', label: 'Probability', align: 'center', render: (row) => <Text className="text-foreground">{row.probability}</Text> },
    { key: 'impact', label: 'Impact', align: 'center', render: (row) => <Text className="text-foreground">{row.impact}</Text> },
    {
      key: 'score',
      label: 'Score',
      align: 'center',
      render: (row) => {
        const score = (row.probability ?? 0) * (row.impact ?? 0);
        return (
          <Badge variant="count" tone={SCORE_BADGE[riskTone(score)]} label={`Score ${score}`}>
            {score}
          </Badge>
        );
      },
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (row) =>
        row.ownerName ? (
          <View className="flex-row items-center gap-2 min-w-0">
            <Avatar name={row.ownerName} size="xs" id={row.ownerId} />
            <Text className="text-foreground" numberOfLines={1}>
              {row.ownerName}
            </Text>
          </View>
        ) : (
          <Text className="text-faint">No owner</Text>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant="status" tone={STATUS_TONE[row.status] ?? 'plain'}>
          {STATUS_LABEL[row.status] ?? 'Open'}
        </Badge>
      ),
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setForm({ open: true, target: row }) },
        'separator',
        { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setDeleting(row) },
      ]
    : undefined;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 pb-12">
        <PageHead
          title="Risks"
          sub="Every risk the project carries, placed by how likely it is and how hard it would hit."
          actions={
            canEdit ? (
              <Button variant="ember" icon="plus" onPress={() => setForm({ open: true, target: null })}>
                New risk
              </Button>
            ) : null
          }
        />

        <View className="bg-surface border border-border rounded-card p-[18px] gap-3.5 mb-gap" accessibilityLabel="Risk matrix">
          <View className="flex-row items-center gap-2.5 flex-wrap">
            <Text className="text-foreground text-[17px] font-display" style={{ letterSpacing: -0.25 }}>
              Probability by impact
            </Text>
            <Text className="text-muted text-[13px]">
              {selected ? `Showing probability ${selected.p}, impact ${selected.i}.` : 'Select a cell to filter the register.'}
            </Text>
            {selected ? (
              <View className="ml-auto">
                <Button variant="ghost" size="sm" icon="close" onPress={() => pickCell(null)}>
                  Clear filter
                </Button>
              </View>
            ) : null}
          </View>
          <RiskMatrix risks={risks.items} selected={selected} onSelect={pickCell} />
        </View>

        <DataTable
          label="Risk register"
          columns={columns}
          rows={visible}
          status={risks.status}
          error={risks.error}
          onRetry={risks.reload}
          empty={{
            ...EMPTY.risks,
            action: canEdit ? (
              <Button variant="ember" size="sm" icon="plus" onPress={() => setForm({ open: true, target: null })}>
                New risk
              </Button>
            ) : null,
          }}
          onRowClick={canEdit ? (row) => setForm({ open: true, target: row }) : undefined}
          rowMenu={rowMenu}
          hasMore={risks.hasMore}
          onLoadMore={risks.loadMore}
          loadingMore={risks.loadingMore}
        />
      </ScrollView>

      {form.open ? (
        <RiskFormModal
          open
          onClose={() => setForm({ open: false, target: null })}
          projectId={projectId}
          risk={form.target}
          members={members ?? []}
          onSaved={() => {
            setForm({ open: false, target: null });
            risks.reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete risk?"
        text={`"${deleting?.title ?? ''}" is removed from the register. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}
