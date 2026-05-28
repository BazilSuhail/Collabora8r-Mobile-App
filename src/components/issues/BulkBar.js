// feat(screens/issues/components/BulkBar): bulk status, assignee, sprint and delete for the selected issues.
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { listSprints } from '@/libs/api/boards';
import { bulkUpdate, deleteIssue, transitionIssue } from '@/libs/api/issues';
import { searchUsers } from '@/libs/api/users';
import { useResource } from '@/utils/useResource';
import { OptionSheet, confirmAlert } from '@/components/issues/sheets';

const NO_SPRINT = '__backlog';
const plural = (n) => (n === 1 ? 'issue' : 'issues');

function BarButton({ icon, label, onPress, disabled, danger }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`flex-row items-center gap-[6px] rounded-[10px] px-[12px] py-[8px] border ${
        danger ? 'border-danger' : 'border-border'
      } ${disabled ? 'opacity-50' : 'active:opacity-70'}`}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      <Text className={`text-[13px] font-semibold ${danger ? 'text-danger' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

// Bulk writes carry no version (only issue PATCH does). Status moves go through transition, one call per issue.
export default function BulkBar({ ids, onClear, onChanged }) {
  const { projectId, statuses, can } = useProject();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null);
  const count = ids.length;

  const sprintOptions = [
    { value: NO_SPRINT, label: 'Backlog' },
    ...(sprints.data ?? [])
      .filter((s) => s.state !== 'closed')
      .map((s) => ({ value: String(s.id ?? s._id), label: s.name })),
  ];

  const applyPatch = async (patch) => {
    setBusy(true);
    try {
      await bulkUpdate(projectId, { issueIds: ids, patch });
      toast.success(`${count} ${plural(count)} updated`);
      onChanged();
    } catch (err) {
      if (err.status === 409) {
        toast.warning('Changed by someone else. Reloaded.');
        onChanged();
      } else {
        toast.error(err.message ?? 'Could not update the issues');
      }
    } finally {
      setBusy(false);
    }
  };

  const applyStatus = async (statusId) => {
    if (!statusId) return;
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => transitionIssue(projectId, id, { toStatus: statusId })));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (count - failed) toast.success(`${count - failed} ${plural(count - failed)} updated`);
    if (failed) toast.error(`${failed} ${plural(failed)} could not be moved`);
    setBusy(false);
    onChanged();
  };

  const removeAll = async () => {
    const ok = await confirmAlert({
      title: `Delete ${count} ${plural(count)}?`,
      text: 'Deleted issues cannot be restored.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => deleteIssue(projectId, id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (count - failed) toast.success(`Deleted ${count - failed} ${plural(count - failed)}`);
    if (failed) toast.error(`${failed} ${plural(failed)} could not be deleted`);
    setBusy(false);
    onChanged();
  };

  const loadUsers = async (q) => {
    const res = await searchUsers(q);
    return (res.data ?? []).map((u) => ({ value: String(u.id ?? u._id), label: u.displayName }));
  };

  return (
    <View
      accessibilityLabel="Bulk actions"
      className="absolute left-0 right-0 bottom-0 bg-surface border-t border-border pt-[10px] px-[12px] gap-[8px]"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View className="flex-row items-center gap-[8px]">
        <Icon name="check" size={16} />
        <Text className="flex-1 text-[14px] font-bold text-foreground">{count} selected</Text>
        {busy ? <ActivityIndicator size="small" /> : null}
        <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear selection">
          <Icon name="close" size={18} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[8px]">
        <BarButton icon="stProgress" label="Status" disabled={busy} onPress={() => setSheet('status')} />
        <BarButton icon="user" label="Assignee" disabled={busy} onPress={() => setSheet('assignee')} />
        <BarButton label="Unassign" disabled={busy} onPress={() => applyPatch({ assigneeId: null })} />
        <BarButton icon="sprint" label="Sprint" disabled={busy} onPress={() => setSheet('sprint')} />
        {can('issue.delete') ? <BarButton icon="trash" label="Delete" danger disabled={busy} onPress={removeAll} /> : null}
      </ScrollView>

      <OptionSheet
        open={sheet === 'status'}
        onClose={() => setSheet(null)}
        title="Set status"
        options={statuses.map((s) => ({ value: String(s.id ?? s._id), label: s.name }))}
        value={null}
        onChange={applyStatus}
      />
      <OptionSheet
        open={sheet === 'assignee'}
        onClose={() => setSheet(null)}
        title="Set assignee"
        value={null}
        loadOptions={loadUsers}
        onChange={(assigneeId) => assigneeId && applyPatch({ assigneeId })}
      />
      <OptionSheet
        open={sheet === 'sprint'}
        onClose={() => setSheet(null)}
        title="Move to sprint"
        options={sprintOptions}
        value={null}
        onChange={(v) => v && applyPatch({ sprintId: v === NO_SPRINT ? null : v })}
      />
    </View>
  );
}
