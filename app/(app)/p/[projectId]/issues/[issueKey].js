// feat(screens/issues/IssueDetailPage): show one issue in full and edit its fields, comments, attachments, links, time and approvals.
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import SegmentedControl from '@/components/ui/SegmentedControl';
import CommentStream from '@/components/issues/CommentStream';
import { IssueHistory } from '@/components/issues/HistoryList';
import WorklogList from '@/components/issues/WorklogList';
import LogWorkModal from '@/components/issues/LogWorkModal';
import AttachmentStrip from '@/components/issues/AttachmentStrip';
import LinkedIssues from '@/components/issues/LinkedIssues';
import ApprovalsCard from '@/components/issues/ApprovalsCard';
import ExternalLinksCard from '@/components/issues/ExternalLinksCard';
import MarkdownEditor from '@/components/wiki/MarkdownEditor';
import MarkdownView from '@/components/wiki/MarkdownView';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { listReleases, listSprints } from '@/libs/api/boards';
import { deleteIssue, getIssueByKey, listChildren, listWorklogs, transitionIssue, updateIssue } from '@/libs/api/issues';
import { searchUsers } from '@/libs/api/users';
import { formatDuration, parseDuration } from '@/utils/format';
import { priorityTone, statusTone, typeIcon } from '@/utils/issueVisuals';
import { useResource } from '@/utils/useResource';
import { usePaged } from '@/utils/usePaged';
import { SelectField, SheetButton, TextField, confirmThen } from '@/components/issues/sheets';

const TABS = [
  { value: 'comments', label: 'Comments' },
  { value: 'history', label: 'History' },
  { value: 'work', label: 'Work log' },
];

const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });
const dateValue = (iso) => (iso ? String(iso).slice(0, 10) : '');
const textOf = (description) => (typeof description === 'string' ? description : description?.text ?? '');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function Card({ title, icon, right, children }) {
  return (
    <View className="bg-surface border border-border rounded-[16px] p-[16px] gap-[12px]">
      {title ? (
        <View className="flex-row items-center justify-between gap-[10px]">
          <View className="flex-row items-center gap-[8px]">
            {icon ? <Icon name={icon} size={16} /> : null}
            <Text className="text-foreground text-[15px] font-bold">{title}</Text>
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

function TopBar({ title, onBack, onDelete }) {
  return (
    <View className="flex-row items-center gap-[8px] px-[12px] py-[8px] border-b border-border bg-background">
      <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to issues" className="flex-row items-center gap-[4px] py-[4px] pr-[8px]">
        <Icon name="chevL" size={18} />
        <Text className="text-foreground font-semibold text-[14px]">Issues</Text>
      </Pressable>
      <Text numberOfLines={1} className="flex-1 text-center text-muted font-bold text-[14px]">
        {title}
      </Text>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${title}`} className="p-[4px]">
          <Icon name="trash" size={19} />
        </Pressable>
      ) : (
        <View className="w-[27px]" />
      )}
    </View>
  );
}

export default function IssueDetailPage() {
  const { issueKey } = useLocalSearchParams();
  const router = useRouter();
  const { projectId, statuses, priorities, labels, can } = useProject();
  const toast = useToast();
  const [tab, setTab] = useState('comments');
  const [logging, setLogging] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [checkDraft, setCheckDraft] = useState('');
  const [pointsDraft, setPointsDraft] = useState(null);
  const [estimateDraft, setEstimateDraft] = useState(null);
  const [dueDraft, setDueDraft] = useState(null);
  const [worklogTick, setWorklogTick] = useState(0);

  const key = String(issueKey ?? '');
  const issuesPath = `/p/${encodeURIComponent(String(projectId))}/issues`;
  const issuePath = (k) => `${issuesPath}/${encodeURIComponent(String(k))}`;

  const issueRes = useResource(() => getIssueByKey(projectId, key), [projectId, key]);
  const issue = useMemo(() => (issueRes.data ? withId(issueRes.data) : null), [issueRes.data]);
  const issueId = issue?.id ?? null;
  const canEdit = can('issue.edit');

  const children = useResource(
    () => (issueId ? listChildren(projectId, issueId) : Promise.resolve({ data: [], meta: null })),
    [projectId, issueId],
  );
  const sprints = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const releases = useResource(() => listReleases(projectId, { limit: 100 }), [projectId]);

  // Every field save sends the version read last. A 409 reloads and keeps the local draft.
  const save = async (patch, message = 'Saved') => {
    if (!issue) return false;
    try {
      const res = await updateIssue(projectId, issue.id, { ...patch, version: issue.version });
      issueRes.setData(res.data);
      toast.success(message);
      return true;
    } catch (err) {
      if (err.status === 409) {
        toast.warning('Changed by someone else. Reloaded.');
        issueRes.reload();
        return false;
      }
      toast.error(err.errors?.[0]?.message ?? err.message ?? 'Could not save');
      return false;
    }
  };

  // Status moves go through transition, which takes no version.
  const changeStatus = async (statusId) => {
    try {
      await transitionIssue(projectId, issue.id, { toStatus: statusId });
      const name = statuses.find((s) => idOf(s) === statusId)?.name ?? 'the new status';
      toast.success(`Moved to ${name}`);
      issueRes.reload();
    } catch (err) {
      toast.error(err.message ?? 'Could not move the issue');
    }
  };

  const commitTitle = async () => {
    const next = titleDraft.trim();
    if (!next) return;
    if (next === issue.title || (await save({ title: next }, 'Title saved'))) setEditingTitle(false);
  };

  const commitDescription = async () => {
    if (await save({ description: descDraft }, 'Description saved')) setEditingDesc(false);
  };

  const checklist = issue?.checklist ?? [];
  const saveChecklist = (items) =>
    save(
      { checklist: items.map((c) => ({ ...(c.id ? { id: String(c.id) } : {}), text: c.text, done: Boolean(c.done) })) },
      'Checklist saved',
    );

  const addChecklistItem = async () => {
    const text = checkDraft.trim();
    if (!text) return;
    if (await saveChecklist([...checklist, { text, done: false }])) setCheckDraft('');
  };

  const commitEstimate = async () => {
    if (estimateDraft === null) return;
    const seconds = parseDuration(estimateDraft);
    const value = Number.isFinite(seconds) ? seconds : null;
    setEstimateDraft(null);
    if (value !== (issue.estimateSec ?? null)) await save({ estimateSec: value });
  };

  const commitPoints = async () => {
    if (pointsDraft === null) return;
    const value = pointsDraft === '' ? null : Number(pointsDraft);
    setPointsDraft(null);
    if (value !== null && !Number.isFinite(value)) return;
    if (value !== (issue.storyPoints ?? null)) await save({ storyPoints: value });
  };

  // Due date is stored as UTC midnight. Empty clears it.
  const commitDue = async () => {
    if (dueDraft === null) return;
    const text = dueDraft.trim();
    setDueDraft(null);
    if (text === dateValue(issue.dueDate)) return;
    if (text && !DATE_RE.test(text)) {
      toast.error('Use the format YYYY-MM-DD');
      return;
    }
    await save({ dueDate: text ? new Date(`${text}T00:00:00.000Z`).toISOString() : null });
  };

  const loadUsers = async (text) => {
    const res = await searchUsers(text);
    return (res.data ?? []).map((u) => ({ value: idOf(u), label: u.displayName }));
  };

  const askDelete = () =>
    confirmThen(
      { title: `Delete ${issue.key}?`, text: 'Deleted issues cannot be restored.', confirmLabel: 'Delete', tone: 'danger' },
      async () => {
        try {
          await deleteIssue(projectId, issue.id);
          toast.success(`Deleted ${issue.key}`);
          router.replace(issuesPath);
        } catch (err) {
          toast.error(err.message ?? 'Could not delete the issue');
        }
      },
    );

  const backToIssues = () => (router.canGoBack() ? router.back() : router.replace(issuesPath));

  if (issueRes.status === 'error') {
    const notFound = issueRes.error?.status === 404;
    return (
      <View className="flex-1 bg-background p-[16px] justify-center">
        <TopBar title={key} onBack={backToIssues} />
        {notFound ? (
          <EmptyState
            icon="task"
            title="Issue not found"
            text="It may have been deleted, or the key is wrong."
            action={
              <Button variant="ghost" size="sm" icon="chevL" onClick={backToIssues} onPress={backToIssues}>
                Back to issues
              </Button>
            }
          />
        ) : (
          <EmptyState tone="error" title="Could not load this issue" onRetry={issueRes.reload} />
        )}
      </View>
    );
  }

  if (!issue) {
    return (
      <View className="flex-1 bg-background p-[16px] gap-[12px]" accessibilityLabel="Loading">
        <TopBar title={key} onBack={backToIssues} />
        {[60, 90, 40, 75].map((w, i) => (
          <View key={i} className="h-[18px] rounded-[10px] bg-surface" style={{ width: `${w}%` }} />
        ))}
        {[0, 1, 2].map((i) => (
          <View key={`b${i}`} className="h-[90px] rounded-[16px] bg-surface" />
        ))}
      </View>
    );
  }

  const statusOptions = statuses.map((s) => ({ value: idOf(s), label: s.name }));
  const priorityOptions = priorities.map((p) => ({ value: idOf(p), label: p.name }));
  const sprintOptions = [
    { value: '', label: 'No sprint' },
    ...(sprints.data ?? []).filter((s) => s.state !== 'closed').map((s) => ({ value: idOf(s), label: s.name })),
  ];
  const releaseOptions = (releases.data ?? []).map((r) => ({ value: idOf(r), label: r.name }));
  const labelOptions = labels.map((l) => ({ value: l.name, label: l.name }));
  const description = textOf(issue.description);
  const assigneeName = issue.assigneeUser?.displayName ?? issue.assignee?.displayName ?? issue.assigneeName;

  return (
    <View className="flex-1 bg-background">
      <TopBar title={issue.key} onBack={backToIssues} onDelete={can('issue.delete') ? askDelete : undefined} />
      <ScrollView
        contentContainerClassName="p-[16px] pb-[48px] gap-[14px]"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={false} onRefresh={issueRes.reload} />}
      >
        {/* Title */}
        <View className="gap-[8px]">
          {editingTitle ? (
            <View className="gap-[8px]">
              <TextField
                label="Title"
                hint="Tap Save title to keep the change."
                value={titleDraft}
                maxLength={255}
                onChangeText={setTitleDraft}
                autoFocus
                multiline
              />
              <View className="flex-row gap-[8px]">
                <SheetButton variant="ember" label="Save title" onPress={commitTitle} />
                <SheetButton label="Cancel" onPress={() => setEditingTitle(false)} />
              </View>
            </View>
          ) : (
            <>
              <Text className="text-foreground text-[22px] font-bold">{issue.title}</Text>
              <View className="flex-row flex-wrap items-center gap-[10px]">
                <Text className="text-muted font-bold" style={{ fontVariant: ['tabular-nums'] }}>
                  {issue.key}
                </Text>
                <Badge variant="status" tone={statusTone(issue.statusCategory)}>
                  {issue.statusName}
                </Badge>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="pen"
                    onClick={() => {
                      setTitleDraft(issue.title);
                      setEditingTitle(true);
                    }}
                    onPress={() => {
                      setTitleDraft(issue.title);
                      setEditingTitle(true);
                    }}
                  >
                    Edit title
                  </Button>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* Fields */}
        <Card title="Details" icon="gear">
          <SelectField
            label="Status"
            value={String(issue.statusId ?? '')}
            options={statusOptions}
            disabled={!canEdit}
            onChange={(v) => v && v !== String(issue.statusId) && changeStatus(v)}
          />
          <SelectField
            label="Assignee"
            placeholder="Unassigned"
            value={issue.assigneeId ? String(issue.assigneeId) : null}
            valueLabel={issue.assigneeId ? assigneeName ?? 'Assigned' : undefined}
            loadOptions={loadUsers}
            clearLabel="Unassigned"
            disabled={!canEdit}
            onChange={(v) => save({ assigneeId: v || null })}
          />
          <SelectField
            label="Priority"
            placeholder="No priority"
            value={issue.priorityId ? String(issue.priorityId) : null}
            options={priorityOptions}
            clearLabel="No priority"
            disabled={!canEdit}
            onChange={(v) => save({ priorityId: v || null })}
          />
          <SelectField
            label="Sprint"
            value={issue.sprintId ? String(issue.sprintId) : ''}
            options={sprintOptions}
            disabled={!canEdit}
            onChange={(v) => save({ sprintId: v || null })}
          />
          <SelectField
            label="Releases"
            hint="Every release this work ships in."
            placeholder="No release"
            multiple
            value={(issue.releaseIds ?? []).map(String)}
            options={releaseOptions}
            disabled={!canEdit}
            onChange={(v) => save({ releaseIds: v })}
          />
          <SelectField
            label="Labels"
            hint="Pick one or more labels."
            placeholder="No labels"
            multiple
            value={issue.labels ?? []}
            options={labelOptions}
            disabled={!canEdit}
            onChange={(v) => save({ labels: v })}
          />
          <TextField
            label="Due date"
            hint="YYYY-MM-DD. Leave empty to clear."
            placeholder="YYYY-MM-DD"
            value={dueDraft ?? dateValue(issue.dueDate)}
            editable={canEdit}
            keyboardType="numbers-and-punctuation"
            onChangeText={setDueDraft}
            onEndEditing={commitDue}
            returnKeyType="done"
          />
          <TextField
            label="Estimate"
            hint="For example 1h 30m"
            value={estimateDraft ?? (issue.estimateSec ? formatDuration(issue.estimateSec) : '')}
            editable={canEdit}
            onChangeText={setEstimateDraft}
            onEndEditing={commitEstimate}
            returnKeyType="done"
          />
          <TextField
            label="Story points"
            hint="Half steps such as 0.5 are fine."
            keyboardType="decimal-pad"
            value={pointsDraft ?? String(issue.storyPoints ?? '')}
            editable={canEdit}
            onChangeText={setPointsDraft}
            onEndEditing={commitPoints}
            returnKeyType="done"
          />
          <View className="gap-[4px]">
            <Text className="text-muted text-[12.5px] font-semibold">Type</Text>
            <View className="flex-row items-center gap-[8px]">
              <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} size={16} />
              <Text className="text-foreground text-[14px]">{issue.typeName}</Text>
            </View>
          </View>
          {issue.priorityName ? (
            <View className="flex-row">
              <Badge variant="badge" tone={priorityTone(issue.priorityRank)}>
                {issue.priorityName}
              </Badge>
            </View>
          ) : null}
        </Card>

        {/* Description */}
        <Card
          title="Description"
          icon="note"
          right={
            canEdit && !editingDesc ? (
              <Button
                variant="ghost"
                size="sm"
                icon="pen"
                onClick={() => {
                  setDescDraft(description);
                  setEditingDesc(true);
                }}
                onPress={() => {
                  setDescDraft(description);
                  setEditingDesc(true);
                }}
              >
                Edit
              </Button>
            ) : null
          }
        >
          {editingDesc ? (
            <>
              <MarkdownEditor value={descDraft} onChange={setDescDraft} />
              <View className="flex-row justify-end gap-[10px]">
                <SheetButton label="Cancel" onPress={() => setEditingDesc(false)} />
                <SheetButton variant="ember" label="Save description" onPress={commitDescription} />
              </View>
            </>
          ) : description ? (
            <MarkdownView text={description} />
          ) : (
            <Text className="text-muted text-[13.5px]">No description yet.</Text>
          )}
        </Card>

        {/* Checklist */}
        <Card title="Checklist" icon="checklist">
          {checklist.length === 0 ? (
            <EmptyState icon="checklist" title="No checklist items" text="Add steps below to track progress." />
          ) : null}
          <View className="gap-[4px]">
            {checklist.map((item, index) => (
              <View key={item.id ?? index} className="flex-row items-center gap-[10px] min-w-0">
                <Pressable
                  disabled={!canEdit}
                  onPress={() => saveChecklist(checklist.map((c, i) => (i === index ? { ...c, done: !c.done } : c)))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(item.done), disabled: !canEdit }}
                  accessibilityLabel={`Mark ${item.text} as done`}
                  hitSlop={8}
                  className={`w-[22px] h-[22px] rounded-[6px] border items-center justify-center ${
                    item.done ? 'bg-spruce border-spruce' : 'border-border'
                  }`}
                >
                  {item.done ? <Icon name="check" size={14} cls="text-on-spruce" /> : null}
                </Pressable>
                <Text className={`flex-1 min-w-0 text-[14px] ${item.done ? 'text-muted line-through' : 'text-foreground'}`}>
                  {item.text}
                </Text>
                {canEdit ? (
                  <Pressable
                    onPress={() => saveChecklist(checklist.filter((_, i) => i !== index))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.text}`}
                    className="p-[6px]"
                  >
                    <Icon name="close" size={16} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          {canEdit ? (
            <View className="flex-row items-end gap-[8px]">
              <TextField
                className="flex-1"
                placeholder="Add an item"
                accessibilityLabel="New checklist item"
                value={checkDraft}
                maxLength={500}
                onChangeText={setCheckDraft}
                onSubmitEditing={addChecklistItem}
                returnKeyType="done"
              />
              <SheetButton label="Add" onPress={addChecklistItem} />
            </View>
          ) : null}
        </Card>

        {/* Child issues */}
        {children.status === 'success' && (children.data ?? []).length > 0 ? (
          <Card title="Child issues" icon="subtask">
            <View className="gap-[2px]">
              {children.data.map((child) => (
                <Pressable
                  key={idOf(child)}
                  onPress={() => router.push(issuePath(child.key))}
                  accessibilityRole="link"
                  className="flex-row items-center gap-[10px] rounded-[10px] py-[9px] px-[6px] active:opacity-60"
                >
                  <Icon name={typeIcon({ icon: child.typeIcon, name: child.typeName, hierarchy: child.hierarchy })} size={15} />
                  <Text className="text-muted text-[12.5px] font-bold">{child.key}</Text>
                  <Text numberOfLines={1} className="flex-1 min-w-0 text-foreground text-[14px] font-semibold">
                    {child.title}
                  </Text>
                  <Badge variant="status" tone={statusTone(child.statusCategory)}>
                    {child.statusName}
                  </Badge>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        <AttachmentStrip pid={projectId} issueId={issue.id} canUpload={can('attachment.edit')} canDelete={can('attachment.edit')} />
        <LinkedIssues pid={projectId} issueId={issue.id} canEdit={can('link.edit')} />
        <ApprovalsCard projectId={projectId} issueId={issue.id} can={canEdit} />
        <ExternalLinksCard projectId={projectId} issueId={issue.id} can={can('link.edit')} />

        {/* Activity */}
        <View className="gap-[12px]">
          <SegmentedControl label="Activity" value={tab} onChange={setTab} options={TABS} />
          <View className="bg-surface border border-border rounded-[16px] p-[16px]">
            {tab === 'comments' ? (
              <CommentStream
                pid={projectId}
                issueId={issue.id}
                canComment={can('comment.create')}
                canInternal={canEdit}
                canModerate={can('issue.delete')}
              />
            ) : null}
            {tab === 'history' ? <IssueHistory projectId={projectId} issueId={issue.id} /> : null}
            {tab === 'work' ? (
              <View className="gap-[12px]">
                {can('worklog.edit') ? (
                  <View className="flex-row justify-end">
                    <Button variant="soft" size="sm" icon="plus" onClick={() => setLogging(true)} onPress={() => setLogging(true)}>
                      Log work
                    </Button>
                  </View>
                ) : null}
                <IssueWorklogs projectId={projectId} issueId={issue.id} reloadKey={worklogTick} />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <LogWorkModal
        open={logging}
        onClose={() => setLogging(false)}
        projectId={projectId}
        issueId={issue.id}
        onSaved={() => {
          issueRes.reload();
          setWorklogTick((t) => t + 1);
        }}
      />
    </View>
  );
}

function IssueWorklogs({ projectId, issueId, reloadKey }) {
  const w = usePaged((p) => listWorklogs(projectId, issueId, p), { projectId, issueId, reloadKey });
  return (
    <WorklogList
      items={w.items}
      status={w.status}
      onRetry={w.reload}
      hasMore={w.hasMore}
      loadingMore={w.loadingMore}
      onLoadMore={w.loadMore}
      showIssue={false}
    />
  );
}
