// feat(app/(app)/board/index): cross-project board showing only issues, with projects you can reorder or open.
// Mobile: HTML5 drag is replaced by the up/down buttons for projects and a "Move to <status>" menu for issues.
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Illustration from '@/components/ui/Illustration';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { getBoardIssues, listBoardProjects, saveBoardOrder } from '@/libs/api/boardhub';
import { transitionIssue } from '@/libs/api/issues';
import { paths } from '@/routes/paths';
import { userAvatarSrc } from '@/utils/media';
import { priorityIcon, priorityTone, statusTone } from '@/utils/issueVisuals';
import { useMutation } from '@/utils/useMutation';
import { useResource } from '@/utils/useResource';

const SORT_OPTIONS = [
  { value: 'rank', label: 'Rank' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
  { value: 'updated', label: 'Recently updated' },
];

// Ascending, with missing values last.
const cmpAsc = (a, b) => {
  const aMissing = a === null || a === undefined;
  const bMissing = b === null || b === undefined;
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  return a < b ? -1 : a > b ? 1 : 0;
};

const stamp = (value) => {
  if (!value) return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
};

const SORTERS = {
  rank: (a, b) => cmpAsc(a.rank ?? null, b.rank ?? null),
  priority: (a, b) => cmpAsc(a.priority?.rank ?? null, b.priority?.rank ?? null),
  due: (a, b) => cmpAsc(stamp(a.dueDate), stamp(b.dueDate)),
  updated: (a, b) => cmpAsc(stamp(b.updatedAt), stamp(a.updatedAt)),
};

const sortIssues = (items, key) => [...items].sort(SORTERS[key] ?? SORTERS.rank);

const normalizeBoard = (data) =>
  data
    ? {
        project: data.project,
        statuses: (data.statuses ?? []).map((s) => ({ ...s, id: String(s.id) })),
        issues: (data.issues ?? []).map((i) => ({ ...i, id: String(i.id), statusId: String(i.statusId) })),
      }
    : null;

const formatDue = (value) => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? '' : new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function IssueCard({ issue, onOpen, menu }) {
  const { priority, assignee } = issue;
  const overdue = Boolean(issue.dueDate) && issue.statusCategory !== 'done' && Date.parse(issue.dueDate) < Date.now();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${issue.key} ${issue.title}`}
      onPress={onOpen}
      className="gap-2 rounded-card border border-border bg-background p-3 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs font-semibold text-muted">{issue.key}</Text>
        <View className="flex-row items-center gap-1">
          {priority ? (
            <Badge tone={priorityTone(priority.rank)} icon={priorityIcon(priority.rank)}>
              {priority.name}
            </Badge>
          ) : null}
          {menu.length ? (
            <Dropdown
              label={`Actions for ${issue.key}`}
              items={menu}
              trigger={(p) => <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`Actions for ${issue.key}`} {...p} />}
            />
          ) : null}
        </View>
      </View>
      <Text className="text-sm font-semibold leading-[1.35] text-foreground">{issue.title}</Text>
      <View className="flex-row items-center justify-between gap-2">
        <Text className={`text-xs ${overdue ? 'text-danger' : 'text-muted'}`}>{issue.dueDate ? formatDue(issue.dueDate) : ''}</Text>
        {assignee ? (
          <Avatar
            name={assignee.name}
            src={userAvatarSrc({ avatarKey: assignee.avatarKey, avatarUrl: assignee.avatarUrl })}
            id={assignee.id}
            size="xs"
          />
        ) : (
          <Text className="text-xs text-muted">Unassigned</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function BoardHubPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);
  const [sortKey, setSortKey] = useState('rank');
  const [activeStatusId, setActiveStatusId] = useState(null);

  const projects = useResource(async () => {
    const res = await listBoardProjects();
    return { data: res.data ?? [] };
  }, []);
  const list = projects.data ?? [];

  const board = useResource(async () => {
    if (!selectedId) return { data: null };
    const res = await getBoardIssues(selectedId);
    return { data: normalizeBoard(res.data) };
  }, [selectedId]);
  const data = board.data;
  const statuses = data?.statuses ?? [];
  const issues = data?.issues ?? [];
  const columns = statuses.map((status) => ({
    status,
    items: sortIssues(
      issues.filter((i) => i.statusId === status.id),
      sortKey,
    ),
  }));
  const activeColumn = columns.find((c) => c.status.id === activeStatusId) ?? columns[0] ?? null;

  const reorder = useMutation(
    async (ids) => {
      await saveBoardOrder(ids);
      return true;
    },
    { error: 'Could not save the project order' },
  );

  // Same mechanism as BoardPage: transitionIssue with the target status, reverted on failure.
  const transition = useMutation(
    async (projectId, issueId, toStatus) => {
      await transitionIssue(projectId, issueId, { toStatus });
      return true;
    },
    { success: 'Issue moved', error: 'Could not move the issue' },
  );

  const openBoard = (id) => {
    setSelectedId(id);
    setActiveStatusId(null);
  };

  const commitOrder = async (ids) => {
    const snapshot = projects.data;
    if (!snapshot) return;
    projects.setData(ids.map((id) => snapshot.find((p) => p.id === id)).filter(Boolean));
    const ok = await reorder.run(ids);
    if (!ok) projects.setData(snapshot);
  };

  const dropProjectOn = (dragId, targetId) => {
    const ids = list.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    commitOrder(next);
  };

  const moveProject = (id, delta) => {
    const ids = list.map((p) => p.id);
    const from = ids.indexOf(id);
    const target = ids[from + delta];
    if (target === undefined) return;
    dropProjectOn(id, target);
  };

  const moveIssue = async (issueId, toStatusId) => {
    const snapshot = board.data;
    const issue = snapshot?.issues.find((i) => i.id === issueId);
    const status = snapshot?.statuses.find((s) => s.id === toStatusId);
    if (!issue || !status || issue.statusId === status.id) return;
    board.setData((d) => ({
      ...d,
      issues: d.issues.map((i) => (i.id === issueId ? { ...i, statusId: status.id, statusCategory: status.category } : i)),
    }));
    const ok = await transition.run(selectedId, issueId, status.id);
    if (!ok) board.setData(snapshot);
  };

  const menuFor = (issue) => [
    { id: 'open', label: 'Open', icon: 'external', onSelect: () => router.push(paths.issue(selectedId, issue.key)) },
    'separator',
    ...statuses
      .filter((s) => s.id !== issue.statusId)
      .map((s) => ({ id: `to-${s.id}`, label: `Move to ${s.name}`, icon: 'kanban', onSelect: () => moveIssue(issue.id, s.id) })),
  ];

  const selectedName = list.find((p) => p.id === selectedId)?.name ?? 'Board';

  let body;
  if (board.status === 'error') {
    body = (
      <View className="rounded-card border border-border bg-surface p-4">
        <EmptyState tone="error" title="Could not load this board" onRetry={board.reload} />
      </View>
    );
  } else if (board.status === 'loading' || !data) {
    body = <Skeleton variant="cards" count={3} />;
  } else if (!issues.length || !statuses.length) {
    body = (
      <View className="rounded-card border border-border bg-surface p-4">
        <EmptyState icon="kanban" title="No issues in this project" text="Issues created here will show up on this board." />
      </View>
    );
  } else {
    body = (
      <View className="gap-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {columns.map(({ status, items }) => {
            const selected = status.id === activeColumn?.status.id;
            return (
              <Pressable
                key={status.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`${status.name}, ${items.length} issues`}
                onPress={() => setActiveStatusId(status.id)}
                className={`flex-row items-center gap-1.5 px-3 h-9 rounded-full border ${selected ? 'border-accent bg-surface' : 'border-border bg-surface'}`}
              >
                <Badge variant="dot" tone={statusTone(status.category)} />
                <Text className="text-[13px] font-semibold text-foreground">{status.name}</Text>
                <Text className="text-[11px] font-bold text-muted">{items.length}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {activeColumn ? (
          <View
            accessibilityLabel={`${activeColumn.status.name}, ${activeColumn.items.length} issues`}
            className="min-h-[240px] gap-2.5 rounded-card border border-border bg-surface p-2.5"
          >
            <View className="flex-row items-center justify-between gap-2 px-1">
              <View className="flex-row min-w-0 items-center gap-2">
                <Badge variant="dot" tone={statusTone(activeColumn.status.category)} />
                <Text numberOfLines={1} className="text-[13px] font-semibold text-foreground">
                  {activeColumn.status.name}
                </Text>
              </View>
              <Badge variant="count" tone="plain" label={`${activeColumn.items.length} issues`}>
                {activeColumn.items.length}
              </Badge>
            </View>
            {activeColumn.items.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onOpen={() => router.push(paths.issue(selectedId, issue.key))}
                menu={menuFor(issue)}
              />
            ))}
            {activeColumn.items.length === 0 ? (
              <Text className="text-center text-[12.5px] text-muted py-6">No issues in this status</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            projects.reload();
            if (selectedId) board.reload();
          }}
        />
      }
    >
      <PageHead
        title="Board"
        sub="Issues from every project you can see, in one place. Reorder projects with the arrows, or open one to see its board."
      />

      <Select
        label="Project"
        size="sm"
        placeholder="Choose a project"
        value={selectedId}
        options={list.map((p) => ({ value: p.id, label: p.name }))}
        onChange={(v) => v && openBoard(v)}
      />

      {selectedId ? (
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="flex-row min-w-0 flex-shrink items-center gap-2">
              <Icon name="kanban" size={16} />
              <Text numberOfLines={1} className="text-[15px] font-semibold text-foreground flex-shrink">
                {selectedName}
              </Text>
            </View>
            <Button variant="ghost" size="sm" icon="folder" onClick={() => setSelectedId(null)}>
              All projects
            </Button>
          </View>
          <Select label="Sort issues" size="sm" value={sortKey} options={SORT_OPTIONS} onChange={(v) => v && setSortKey(v)} />
          {body}
        </View>
      ) : (
        <View className="gap-2.5" accessibilityLabel="Projects">
          <View className="flex-row items-center gap-2">
            <Icon name="folder" size={16} />
            <Text accessibilityRole="header" className="text-[15px] font-semibold text-foreground">
              Projects
            </Text>
          </View>
          {projects.status === 'loading' ? <Skeleton variant="cards" count={4} /> : null}
          {projects.status === 'error' ? (
            <View className="rounded-card border border-border bg-surface p-4">
              <EmptyState tone="error" title="Could not load the projects" onRetry={projects.reload} />
            </View>
          ) : null}
          {projects.status === 'success' && list.length === 0 ? (
            <View className="rounded-card border border-border bg-surface p-4 items-center">
              <Illustration name="team" alt="" className="w-[140px]" />
              <EmptyState icon="project" title="No projects yet" text="Projects you join will appear here." />
            </View>
          ) : null}
          {projects.status === 'success' && list.length > 0
            ? list.map((p, i) => {
                const counts = p.counts ?? {};
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => openBoard(p.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${p.name}`}
                    className="gap-2 rounded-card border border-border bg-surface p-3 active:opacity-80"
                  >
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                          {p.name}
                        </Text>
                        <Text numberOfLines={1} className="text-xs text-muted">
                          {p.key} · {p.orgName}
                        </Text>
                      </View>
                      <View className="flex-row gap-0.5">
                        <Button
                          iconOnly
                          variant="ghost"
                          size="sm"
                          icon="up"
                          aria-label={`Move ${p.name} up`}
                          disabled={i === 0}
                          onClick={() => moveProject(p.id, -1)}
                        />
                        <Button
                          iconOnly
                          variant="ghost"
                          size="sm"
                          icon="down"
                          aria-label={`Move ${p.name} down`}
                          disabled={i === list.length - 1}
                          onClick={() => moveProject(p.id, 1)}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between gap-2">
                      <View className="flex-row flex-wrap gap-1.5">
                        <Badge variant="count" tone="plain" label={`${counts.todo ?? 0} to do`}>
                          {counts.todo ?? 0}
                        </Badge>
                        <Badge variant="count" tone="iris" label={`${counts.inProgress ?? 0} in progress`}>
                          {counts.inProgress ?? 0}
                        </Badge>
                        <Badge variant="count" tone="spruce" label={`${counts.done ?? 0} done`}>
                          {counts.done ?? 0}
                        </Badge>
                      </View>
                      <Button size="sm" variant="soft" onClick={() => openBoard(p.id)}>
                        Open
                      </Button>
                    </View>
                  </Pressable>
                );
              })
            : null}
        </View>
      )}
    </ScrollView>
  );
}
