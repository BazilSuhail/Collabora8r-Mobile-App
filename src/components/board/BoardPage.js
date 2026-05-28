// feat(screens/board/BoardPage): show a project's board as status columns and move issues between them.
// Mobile: one column at a time with a column switcher. Drag and drop is replaced by "Move to <column>"
// in each card's menu and by a long-press sheet.
import { useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import FilterChip from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import Illustration from '@/components/ui/Illustration';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useShell } from '@/context/ShellContext';
import { useToast } from '@/context/ToastContext';
import { getBoardIssues, listBoards, rankIssue } from '@/libs/api/boards';
import { transitionIssue } from '@/libs/api/issues';
import { emptyCopy } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { useResource } from '@/utils/useResource';
import BoardColumn from '@/components/board/BoardColumn';
import BoardSettingsModal from '@/components/board/BoardSettingsModal';

const idOf = (x) => String(x.id ?? x._id);
const withId = (x) => ({ ...x, id: idOf(x) });

const normalizeBoard = (data) =>
  data
    ? {
        ...data,
        columns: (data.columns ?? []).map((c) => ({
          ...c,
          id: String(c.id ?? c._id),
          statusIds: (c.statusIds ?? []).map(String),
          items: (c.items ?? []).map(withId),
        })),
      }
    : null;

const locate = (data, id) => {
  for (const col of data?.columns ?? []) {
    const index = col.items.findIndex((x) => x.id === id);
    if (index >= 0) return { col, index, item: col.items[index] };
  }
  return null;
};

// Takes the card out of its column and puts it into the target column at index (index counts the other cards).
const applyMove = (data, id, toColId, index, status) => {
  let moved = null;
  const columns = data.columns.map((c) => {
    const found = c.items.find((x) => x.id === id);
    if (found) moved = found;
    return { ...c, items: c.items.filter((x) => x.id !== id) };
  });
  if (!moved) return data;
  const next = { ...moved, statusId: status.id, statusName: status.name, statusCategory: status.category };
  return {
    ...data,
    columns: columns.map((c) => {
      if (c.id !== toColId) return c;
      const items = [...c.items];
      items.splice(index, 0, next);
      return { ...c, items };
    }),
  };
};

// Bottom sheet listing the columns an issue can move to.
function MoveSheet({ issue, columns, currentColId, onMove, onClose }) {
  return (
    <Modal visible={Boolean(issue)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-backdrop" onPress={onClose} accessibilityLabel="Close" />
      <View className="bg-background rounded-t-3xl px-4 pt-4 pb-8 gap-1 border-t border-border">
        <Text className="text-base font-bold text-foreground mb-2">{issue ? `Move ${issue.key}` : ''}</Text>
        {columns.map((col) => {
          const current = col.id === currentColId;
          return (
            <Pressable
              key={col.id}
              disabled={current}
              accessibilityRole="button"
              accessibilityState={{ selected: current }}
              onPress={() => onMove(col)}
              className={`flex-row items-center gap-3 py-3 px-3 rounded-xl active:bg-surface ${current ? 'opacity-50' : ''}`}
            >
              <Icon name={current ? 'check' : 'kanban'} size={16} />
              <Text className="text-[15px] text-foreground">{col.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

export default function BoardPage() {
  const { boardId: routeBoardId } = useLocalSearchParams();
  const router = useRouter();
  const { projectId, statuses, can } = useProject();
  const { user } = useAuth();
  const { openCreateIssue } = useShell();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const [bugsOnly, setBugsOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeColId, setActiveColId] = useState(null);
  const [moving, setMoving] = useState(null);

  const boards = useResource(async () => {
    const res = await listBoards(projectId);
    return { data: (res.data ?? []).map(withId), meta: res.meta };
  }, [projectId]);
  const boardList = boards.data ?? [];
  const activeBoard =
    boardList.find((b) => b.id === routeBoardId) ?? boardList.find((b) => b.isDefault) ?? boardList[0] ?? null;
  const activeId = activeBoard?.id ?? null;

  const assigneeId = mine && user ? idOf(user) : null;
  const detail = useResource(async () => {
    if (!activeId) return { data: null, meta: null };
    const res = await getBoardIssues(projectId, activeId, assigneeId ? { assigneeId } : {});
    return { data: normalizeBoard(res.data), meta: res.meta };
  }, [projectId, activeId, assigneeId]);

  // Handlers read the latest board through this ref.
  const dataRef = useRef(null);
  dataRef.current = detail.data;
  const ready = detail.status === 'success';
  const canMove = can('issue.rank');

  const columns = detail.data?.columns ?? [];
  const activeCol = columns.find((c) => c.id === activeColId) ?? columns[0] ?? null;
  const firstStatusId = columns[0]?.statusIds?.[0] ?? null;
  const categoryOf = (col) => statuses.find((s) => idOf(s) === col.statusIds[0])?.category ?? 'todo';
  const needle = search.trim().toLowerCase();
  const visibleItems = (col) =>
    col.items.filter(
      (i) =>
        (!needle || `${i.key} ${i.title}`.toLowerCase().includes(needle)) &&
        (!bugsOnly || /bug/i.test(i.typeName ?? '')),
    );

  const announce = (message) => AccessibilityInfo.announceForAccessibility?.(message);

  const statusMeta = (statusId) => {
    const s = statuses.find((x) => idOf(x) === String(statusId));
    return { id: String(statusId), name: s?.name ?? '', category: s?.category ?? 'todo' };
  };

  // Optimistic move, then transition (when the status changes) and rank. Returns false after reverting.
  const persistMove = async (id, toColId, index) => {
    const snapshot = dataRef.current;
    const found = locate(snapshot, id);
    const toCol = snapshot?.columns.find((c) => c.id === toColId);
    if (!found || !toCol) return false;
    const others = toCol.items.filter((x) => x.id !== id);
    const beforeId = others[index - 1]?.id ?? null;
    const afterId = others[index]?.id ?? null;
    const sameStatus = toCol.statusIds.includes(found.item.statusId);
    const target = sameStatus
      ? { id: found.item.statusId, name: found.item.statusName, category: found.item.statusCategory }
      : statusMeta(toCol.statusIds[0]);
    detail.setData((d) => applyMove(d, id, toColId, index, target));
    if (!sameStatus) {
      try {
        await transitionIssue(projectId, id, { toStatus: target.id });
      } catch {
        detail.setData(snapshot);
        toast.error(`Could not move ${found.item.key}`);
        return false;
      }
    }
    try {
      await rankIssue(projectId, id, { beforeId, afterId });
      return true;
    } catch {
      toast.error(`Could not move ${found.item.key}`);
      detail.reload();
      return false;
    }
  };

  // Moves the issue to the end of the target column.
  const moveTo = async (id, toCol) => {
    const from = locate(dataRef.current, id);
    if (!from || from.col.id === toCol.id) return;
    const index = toCol.items.filter((x) => x.id !== id).length;
    announce(`Moving ${from.item.key} to ${toCol.name}`);
    const ok = await persistMove(id, toCol.id, index);
    if (ok) announce(`${from.item.key} moved to ${toCol.name}`);
  };

  const openIssue = (issue) => router.push(paths.issue(projectId, issue.key));

  const menuFor = (issue) => {
    const items = [{ id: 'open', label: 'Open', icon: 'external', onSelect: () => openIssue(issue) }];
    if (!canMove) return items;
    const from = locate(dataRef.current, issue.id);
    const others = columns.filter((c) => c.id !== from?.col.id);
    if (others.length) items.push('separator');
    others.forEach((c) =>
      items.push({ id: `to-${c.id}`, label: `Move to ${c.name}`, icon: 'kanban', onSelect: () => moveTo(issue.id, c) }),
    );
    return items;
  };

  if (boards.status === 'error') {
    return (
      <View className="flex-1 bg-background p-4">
        <EmptyState tone="error" title="Could not load the boards" onRetry={boards.reload} />
      </View>
    );
  }
  if (boards.status === 'success' && !activeBoard) {
    return (
      <View className="flex-1 bg-background p-4 items-center gap-2">
        <Illustration name="empty" alt="" className="w-[180px]" />
        <EmptyState icon="kanban" title="No board yet" text="Ask a project lead to create a board for this project." />
      </View>
    );
  }

  let body;
  if (detail.status === 'error') {
    body = <EmptyState tone="error" title="Could not load this board" onRetry={detail.reload} />;
  } else if (!ready) {
    body = (
      <View accessibilityLabel="Loading" className="gap-2.5 rounded-card border border-border bg-surface p-3">
        <View className="h-3.5 w-1/2 rounded-xl bg-well" />
        {[0, 1, 2].map((r) => (
          <View key={r} className="h-[84px] rounded-card bg-well" />
        ))}
      </View>
    );
  } else if (columns.length === 0) {
    body = (
      <EmptyState
        {...emptyCopy('pipeline')}
        action={
          can('board.manage') ? (
            <Button variant="soft" size="sm" onClick={() => setSettingsOpen(true)}>
              Set up columns
            </Button>
          ) : undefined
        }
      />
    );
  } else {
    body = (
      <View className="gap-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {columns.map((col) => {
            const selected = col.id === activeCol?.id;
            return (
              <Pressable
                key={col.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setActiveColId(col.id)}
                className={`flex-row items-center gap-1.5 px-3 h-9 rounded-full border ${selected ? 'bg-accent border-accent' : 'bg-surface border-border'}`}
              >
                <Text className={`text-[13px] font-semibold ${selected ? 'text-on-accent' : 'text-foreground'}`}>{col.name}</Text>
                <Text className={`text-[11px] font-bold ${selected ? 'text-on-accent' : 'text-muted'}`}>{col.items.length}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {activeCol ? (
          <BoardColumn
            key={activeCol.id}
            id={activeCol.id}
            name={activeCol.name}
            category={categoryOf(activeCol)}
            wipLimit={activeCol.wipLimit}
            count={activeCol.items.length}
            items={visibleItems(activeCol)}
            onOpen={openIssue}
            onLongPress={canMove ? (issue) => setMoving(issue) : undefined}
            menuFor={menuFor}
          />
        ) : null}
      </View>
    );
  }

  const movingFrom = moving ? locate(detail.data, moving.id) : null;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-4 gap-4 pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={detail.status === 'loading' && !!detail.data} onRefresh={detail.reload} />}
      >
        <PageHead
          title="Board"
          sub="Tap an issue to open it. Long-press or use its menu to move it to another column."
          actions={
            <>
              {boardList.length > 1 ? (
                <Select
                  variant="button"
                  size="sm"
                  label="Board"
                  value={activeId}
                  options={boardList.map((b) => ({ value: b.id, label: b.name }))}
                  onChange={(v) => v && router.replace(paths.board(projectId, v))}
                />
              ) : null}
              {can('board.manage') && activeBoard ? (
                <Button variant="ghost" icon="settings" onClick={() => setSettingsOpen(true)}>
                  Board settings
                </Button>
              ) : null}
              {can('issue.create') ? (
                <Button variant="ember" icon="plus" onClick={() => openCreateIssue({ statusId: firstStatusId })}>
                  New issue
                </Button>
              ) : null}
            </>
          }
        />

        <View className="gap-2">
          <Input
            variant="search"
            label="Search this board"
            hideLabel
            placeholder="Search this board"
            value={search}
            onChangeText={setSearch}
          />
          <View className="flex-row flex-wrap gap-2">
            <FilterChip pressed={mine} icon="user" onClick={() => setMine((v) => !v)}>
              My issues
            </FilterChip>
            <FilterChip pressed={bugsOnly} icon="bug" onClick={() => setBugsOnly((v) => !v)}>
              Bugs only
            </FilterChip>
          </View>
        </View>

        {body}
      </ScrollView>

      <MoveSheet
        issue={moving}
        columns={columns}
        currentColId={movingFrom?.col.id ?? null}
        onClose={() => setMoving(null)}
        onMove={(col) => {
          const issue = moving;
          setMoving(null);
          if (issue) moveTo(issue.id, col);
        }}
      />

      <BoardSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
        board={activeBoard}
        statuses={statuses}
        onSaved={() => {
          boards.reload();
          detail.reload();
        }}
      />
    </>
  );
}
