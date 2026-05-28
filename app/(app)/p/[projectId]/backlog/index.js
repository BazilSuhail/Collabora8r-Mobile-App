// feat(screens/backlog/BacklogPage): plan sprints by ranking backlog issues and moving them into, starting and completing sprints.
// Mobile: pointer drag and GSAP flies are replaced by the row menu ("Move up", "Move down", "Move to ...").
import { useRef, useState } from 'react';
import { AccessibilityInfo, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Dropdown from '@/components/ui/Dropdown';
import SprintFormModal from '@/components/sprints/SprintFormModal';
import { useProject } from '@/context/ProjectContext';
import { useShell } from '@/context/ShellContext';
import { useToast } from '@/context/ToastContext';
import { deleteSprint, getBacklog, listBoards, listSprints, rankIssue, startSprint } from '@/libs/api/boards';
import { listIssues } from '@/libs/api/issues';
import { emptyCopy } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { formatDate } from '@/utils/format';
import { useResource } from '@/utils/useResource';
import CompleteSprintModal from '@/components/backlog/CompleteSprintModal';
import SprintPanel from '@/components/backlog/SprintPanel';

const BACKLOG = 'backlog';
const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });
const stateOrder = (a, b) => (a.state === 'active' ? 0 : 1) - (b.state === 'active' ? 0 : 1);

const listOf = (data, panelId) => (panelId === BACKLOG ? data.backlog : (data.sprintIssues[panelId] ?? []));
const withList = (data, panelId, list) =>
  panelId === BACKLOG
    ? { ...data, backlog: list }
    : { ...data, sprintIssues: { ...data.sprintIssues, [panelId]: list } };
const panelOf = (data, id) => {
  if (data.backlog.some((i) => i.id === id)) return BACKLOG;
  return data.sprints.find((s) => (data.sprintIssues[s.id] ?? []).some((i) => i.id === id))?.id ?? null;
};

const sprintMeta = (sprint, count) => {
  const dates =
    sprint.startDate && sprint.endDate
      ? `${formatDate(sprint.startDate)} to ${formatDate(sprint.endDate)}`
      : 'No dates set';
  return `${dates} · ${count} ${count === 1 ? 'issue' : 'issues'}`;
};

export default function BacklogPage() {
  const router = useRouter();
  const { projectId, can } = useProject();
  const toast = useToast();
  const { openCreateIssue } = useShell();
  const canRank = can('issue.rank');
  const canSprint = can('sprint.manage');
  const [sprintModal, setSprintModal] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [starting, setStarting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useResource(async () => {
    const [sprintRes, boardRes, backlogRes] = await Promise.all([
      listSprints(projectId, { limit: 100 }),
      listBoards(projectId),
      getBacklog(projectId, { limit: 100 }),
    ]);
    const open = (sprintRes.data ?? []).map(withId).filter((s) => s.state !== 'closed').sort(stateOrder);
    const perSprint = await Promise.all(open.map((s) => listIssues(projectId, { sprint: s.id, limit: 100 })));
    const sprintIssues = {};
    open.forEach((s, i) => {
      sprintIssues[s.id] = (perSprint[i].data ?? []).map(withId);
    });
    const boards = (boardRes.data ?? []).map(withId);
    const defaultBoard = boards.find((b) => b.isDefault) ?? boards[0] ?? null;
    return {
      data: {
        sprints: open,
        sprintIssues,
        backlog: (backlogRes.data ?? []).map(withId).filter((i) => !i.sprintId),
        cursor: backlogRes.meta?.nextCursor ?? null,
        boardId: defaultBoard?.id ?? null,
      },
      meta: null,
    };
  }, [projectId]);

  // Handlers read the latest lists through this ref.
  const dataRef = useRef(null);
  dataRef.current = load.data;
  const data = load.data;

  const announce = (message) => AccessibilityInfo.announceForAccessibility?.(message);

  // Moves one issue to panel at index (counted among the other rows). Optimistic, then rank. Reverts on failure.
  const relocate = async (id, toPanel, index) => {
    const snapshot = dataRef.current;
    const fromPanel = snapshot ? panelOf(snapshot, id) : null;
    if (!fromPanel) return false;
    const item = listOf(snapshot, fromPanel).find((i) => i.id === id);
    const others = listOf(snapshot, toPanel).filter((i) => i.id !== id);
    const beforeId = others[index - 1]?.id ?? null;
    const afterId = others[index]?.id ?? null;
    const moving = fromPanel !== toPanel;
    const sprintId = toPanel === BACKLOG ? null : toPanel;
    const removed = withList(snapshot, fromPanel, listOf(snapshot, fromPanel).filter((i) => i.id !== id));
    const next = withList(removed, toPanel, [...others.slice(0, index), { ...item, sprintId }, ...others.slice(index)]);
    load.setData(next);
    announce(`${item.key} moved`);
    try {
      await rankIssue(projectId, id, { beforeId, afterId, ...(moving ? { sprintId } : {}) });
      return true;
    } catch {
      load.setData(snapshot);
      toast.error(`Could not move ${item.key}`);
      return false;
    }
  };

  const relocateToEnd = (id, toPanel) => {
    const list = listOf(dataRef.current, toPanel).filter((i) => i.id !== id);
    return relocate(id, toPanel, list.length);
  };

  // Touch replacement for Alt+ArrowUp/ArrowDown.
  const step = (issue, panelId, delta) => {
    const list = listOf(dataRef.current, panelId);
    const idx = list.findIndex((i) => i.id === issue.id);
    const to = idx + delta;
    if (idx < 0 || to < 0 || to > list.length - 1) return;
    relocate(issue.id, panelId, to);
  };

  const loadMore = async () => {
    const cursor = dataRef.current?.cursor;
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getBacklog(projectId, { limit: 100, cursor });
      load.setData((d) => ({
        ...d,
        backlog: [...d.backlog, ...(res.data ?? []).map(withId).filter((i) => !i.sprintId)],
        cursor: res.meta?.nextCursor ?? null,
      }));
    } catch (err) {
      toast.error(err.message ?? 'Could not load more issues');
    } finally {
      setLoadingMore(false);
    }
  };

  const menuFor = (issue, panelId) => {
    const items = [{ id: 'open', label: 'Open', icon: 'external', onSelect: () => router.push(paths.issue(projectId, issue.key)) }];
    if (canRank) {
      const list = data ? listOf(data, panelId) : [];
      const idx = list.findIndex((i) => i.id === issue.id);
      items.push('separator');
      if (idx > 0) items.push({ id: 'up', label: 'Move up', icon: 'up', onSelect: () => step(issue, panelId, -1) });
      if (idx >= 0 && idx < list.length - 1) {
        items.push({ id: 'down', label: 'Move down', icon: 'down', onSelect: () => step(issue, panelId, 1) });
      }
      if (panelId !== BACKLOG) {
        items.push({ id: 'to-backlog', label: 'Move to backlog', icon: 'backlog', onSelect: () => relocateToEnd(issue.id, BACKLOG) });
      }
      (data?.sprints ?? [])
        .filter((s) => s.id !== panelId)
        .forEach((s) =>
          items.push({ id: `to-${s.id}`, label: `Move to ${s.name}`, icon: 'sprint', onSelect: () => relocateToEnd(issue.id, s.id) }),
        );
    }
    return items;
  };

  const rowProps = { pid: projectId, canRank, menuFor };

  const sprintActions = (sprint) => {
    if (!canSprint) return null;
    const items = [{ id: 'edit', label: 'Edit sprint', icon: 'pen', onSelect: () => setSprintModal({ sprint }) }];
    if (sprint.state === 'planned') items.push({ id: 'start', label: 'Start sprint', icon: 'play', onSelect: () => setStarting(sprint) });
    if (sprint.state === 'active') items.push({ id: 'complete', label: 'Complete sprint', icon: 'complete', onSelect: () => setCompleting(sprint) });
    if (sprint.state === 'planned') {
      items.push('separator', { id: 'delete', label: 'Delete sprint', icon: 'trash', danger: true, onSelect: () => setDeleting(sprint) });
    }
    return (
      <Dropdown
        label={`${sprint.name} actions`}
        items={items}
        trigger={(p) => <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`${sprint.name} actions`} {...p} />}
      />
    );
  };

  const startNow = async () => {
    try {
      await startSprint(projectId, starting.id);
      toast.success('Sprint started');
      load.reload();
    } catch (err) {
      toast.error(err.message ?? 'Could not start the sprint');
      throw err;
    }
  };

  const removeSprint = async () => {
    try {
      await deleteSprint(projectId, deleting.id);
      toast.success('Sprint deleted');
      load.reload();
    } catch (err) {
      toast.error(err.message ?? 'Could not delete the sprint');
      throw err;
    }
  };

  const sprints = data?.sprints ?? [];
  const backlogEmpty = emptyCopy('backlog');

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-4 gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={load.status === 'loading' && !!data} onRefresh={load.reload} />}
      >
        <PageHead
          title="Backlog"
          sub="Rank the backlog, then move issues into a sprint from their menu. Start and complete sprints from their menu."
          actions={
            <>
              {canSprint ? (
                <Button variant="soft" icon="plus" disabled={!data?.boardId} onClick={() => setSprintModal({ sprint: null })}>
                  Create sprint
                </Button>
              ) : null}
              {can('issue.create') ? (
                <Button variant="ember" icon="plus" onClick={() => openCreateIssue({})}>
                  New issue
                </Button>
              ) : null}
            </>
          }
        />

        {sprints.map((sprint) => (
          <SprintPanel
            key={sprint.id}
            panelId={sprint.id}
            title={sprint.name}
            meta={sprintMeta(sprint, (data.sprintIssues[sprint.id] ?? []).length)}
            actions={sprintActions(sprint)}
            issues={data?.sprintIssues[sprint.id] ?? []}
            status={load.status}
            error={load.error}
            onRetry={load.reload}
            emptyTitle={sprint.state === 'active' ? 'No issues in this sprint' : 'This sprint is empty'}
            emptyText="Move issues here from the backlog."
            dropActive={false}
            rowProps={rowProps}
          />
        ))}

        <SprintPanel
          panelId={BACKLOG}
          title="Backlog"
          meta={`${data?.backlog.length ?? 0} ${data?.backlog.length === 1 ? 'issue' : 'issues'}${data?.cursor ? ', more to load' : ''}`}
          actions={null}
          issues={data?.backlog ?? []}
          status={load.status}
          error={load.error}
          onRetry={load.reload}
          emptyTitle={backlogEmpty.title}
          emptyText={backlogEmpty.text}
          dropActive={false}
          rowProps={rowProps}
        />

        {data?.cursor ? (
          <View className="items-center">
            <Button variant="soft" size="sm" disabled={loadingMore} loading={loadingMore} onClick={loadMore}>
              Show more
            </Button>
          </View>
        ) : null}
      </ScrollView>

      <SprintFormModal
        open={Boolean(sprintModal)}
        onClose={() => setSprintModal(null)}
        projectId={projectId}
        boardId={sprintModal?.sprint?.boardId ?? data?.boardId ?? null}
        sprint={sprintModal?.sprint ?? null}
        onSaved={load.reload}
      />

      <CompleteSprintModal
        open={Boolean(completing)}
        onClose={() => setCompleting(null)}
        projectId={projectId}
        sprint={completing}
        targets={sprints.filter((s) => s.state === 'planned' && s.id !== completing?.id)}
        onDone={load.reload}
      />

      <ConfirmDialog
        open={Boolean(starting)}
        onClose={() => setStarting(null)}
        title={`Start ${starting?.name ?? 'sprint'}?`}
        text={
          starting
            ? `It runs ${starting.startDate ? formatDate(starting.startDate) : 'from today'} to ${starting.endDate ? formatDate(starting.endDate) : 'the end date set'}. Only one sprint can be active at a time.`
            : ''
        }
        confirmLabel="Start sprint"
        tone="default"
        onConfirm={startNow}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'sprint'}?`}
        text="Issues in the sprint move back to the backlog."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeSprint}
      />
    </>
  );
}
