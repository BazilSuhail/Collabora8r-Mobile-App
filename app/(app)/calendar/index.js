// feat(app/(app)/calendar/index): show the user's issue due dates and the current project's sprints and releases on a month calendar.
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { ProjectIssueSideModal } from '@/components/issues/IssueSideModal';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useShell } from '@/context/ShellContext';
import { listReleases, listSprints } from '@/libs/api/boards';
import { myIssues } from '@/libs/api/myWork';
import * as storage from '@/libs/storage';
import { useResource } from '@/utils/useResource';
import AgendaList from '@/components/calendar/AgendaList';
import MonthGrid, { KIND, TONE_BG, dayKey } from '@/components/calendar/MonthGrid';

const PAGE_LIMIT = 100;
// Review workaround (K.7): the API has no due-date range filter, so the calendar reads at most
// five pages of 100 issues and filters by dueDate on the client.
const MAX_ISSUE_PAGES = 5;
const PROJECT_KEY = 'c8r.project';
const idOf = (item) => item?.id ?? item?._id ?? null;

async function loadDueIssues() {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await myIssues({ limit: PAGE_LIMIT, ...(cursor ? { cursor } : {}) });
    items.push(...(res.data ?? []));
    cursor = res.meta?.nextCursor ?? null;
    pages += 1;
  } while (cursor && pages < MAX_ISSUE_PAGES);
  return { data: items, meta: { capped: Boolean(cursor) } };
}

async function loadProjectPlan(pid) {
  if (!pid) return { data: { sprints: [], releases: [] } };
  const [sprints, releases] = await Promise.all([listSprints(pid, { limit: 100 }), listReleases(pid, { limit: 100 })]);
  return { data: { sprints: sprints.data ?? [], releases: releases.data ?? [] } };
}

// Local midnight of an ISO value, or null when it is missing or invalid.
function localDay(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const sameMonth = (date, month) => date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Builds the month's events: issues by dueDate, sprint start and end days, release days.
function buildEvents({ issues, sprints, releases, month, todayKey }) {
  const byDay = new Map();
  const add = (ev) => {
    const list = byDay.get(ev.day) ?? [];
    list.push(ev);
    byDay.set(ev.day, list);
  };

  for (const issue of issues) {
    const due = localDay(issue.dueDate);
    if (!due || !sameMonth(due, month)) continue;
    const day = dayKey(due);
    const done = issue.statusCategory === 'done';
    const kind = !done && day < todayKey ? 'overdue' : 'issue';
    add({
      id: `issue-${idOf(issue)}`,
      day,
      kind,
      tone: KIND[kind].tone,
      title: issue.summary ?? issue.title ?? issue.key,
      key: issue.key,
      done,
      issueRef: { id: idOf(issue), projectId: issue.projectId },
    });
  }

  for (const sprint of sprints) {
    const name = sprint.name ?? 'Sprint';
    const start = localDay(sprint.startDate);
    const end = localDay(sprint.endDate);
    if (start && sameMonth(start, month)) {
      add({ id: `sprint-start-${idOf(sprint)}`, day: dayKey(start), kind: 'sprint', tone: KIND.sprint.tone, title: `${name} starts` });
    }
    if (end && sameMonth(end, month)) {
      add({ id: `sprint-end-${idOf(sprint)}`, day: dayKey(end), kind: 'sprint', tone: KIND.sprint.tone, title: `${name} ends` });
    }
  }

  for (const release of releases) {
    const day = localDay(release.releaseDate);
    if (!day || !sameMonth(day, month)) continue;
    add({
      id: `release-${idOf(release)}`,
      day: dayKey(day),
      kind: 'release',
      tone: KIND.release.tone,
      title: release.name ?? 'Release',
    });
  }

  const counts = { issue: 0, overdue: 0, sprint: 0, release: 0 };
  for (const list of byDay.values()) for (const ev of list) counts[ev.kind] += 1;
  const days = Array.from(byDay.keys())
    .sort()
    .map((key) => ({ key, date: parseKey(key), events: byDay.get(key) }));
  return { byDay, days, counts };
}

function LoadingGrid() {
  return (
    <View className="flex-row flex-wrap" accessibilityLabel="Loading">
      {Array.from({ length: 35 }, (_, i) => (
        <View key={i} style={{ width: `${100 / 7}%` }} className="p-0.5">
          <View className="h-14 rounded-xl bg-well" />
        </View>
      ))}
    </View>
  );
}

export default function CalendarPage() {
  const { openCreateIssue } = useShell();
  const [pid, setPid] = useState(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  // Agenda first on a phone; the month grid is the compact view.
  const [view, setView] = useState('agenda');
  const [openIssue, setOpenIssue] = useState(null);

  useEffect(() => {
    let live = true;
    storage
      .get(PROJECT_KEY)
      .then((v) => live && setPid(v || null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const issues = useResource(loadDueIssues, []);
  const plan = useResource(() => loadProjectPlan(pid), [pid]);

  const now = new Date();
  const todayKey = dayKey(now);
  const ready = issues.status === 'success';

  const model = useMemo(
    () =>
      buildEvents({
        issues: issues.data ?? [],
        sprints: plan.data?.sprints ?? [],
        releases: plan.data?.releases ?? [],
        month,
        todayKey,
      }),
    [issues.data, plan.data, month, todayKey],
  );

  const shift = (delta) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const goToday = () => {
    const n = new Date();
    setMonth(new Date(n.getFullYear(), n.getMonth(), 1));
  };
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="p-4 gap-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={issues.status === 'loading' && !!issues.data}
            onRefresh={() => {
              issues.reload();
              plan.reload();
            }}
          />
        }
      >
        <PageHead
          title="Calendar"
          sub="Showing your issues. Sprints and releases come from the current project."
          actions={
            <Button variant="ember" icon="plus" onClick={() => openCreateIssue({})}>
              New issue
            </Button>
          }
        />

        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: 'agenda', label: 'Agenda' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <View className="flex-row items-center gap-1.5">
            <Button variant="ghost" iconOnly icon="chevL" aria-label="Previous month" onClick={() => shift(-1)} />
            <Button variant="ghost" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="ghost" iconOnly icon="chevR" aria-label="Next month" onClick={() => shift(1)} />
          </View>
        </View>

        <View className="rounded-card border border-border bg-surface p-3.5 gap-4">
          <View className="gap-2.5">
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="text-[22px] font-semibold text-foreground">
              {monthLabel}
            </Text>
            <View className="flex-row flex-wrap gap-1.5" accessibilityLabel="Event types">
              {Object.entries(KIND).map(([kind, meta]) => (
                <View key={kind} className="flex-row items-center gap-1.5 px-2.5 h-7 rounded-full border border-border bg-background">
                  <View className={`w-[9px] h-[9px] rounded-full ${TONE_BG[meta.tone]}`} />
                  <Text className="text-xs font-semibold text-foreground">{meta.label}</Text>
                  <Text className="text-[11.5px] font-bold text-muted">{model.counts[kind] ?? 0}</Text>
                </View>
              ))}
            </View>
          </View>

          {issues.status === 'success' && issues.meta?.capped ? (
            <Text className="text-muted text-[12.5px] font-semibold">
              Showing the first {PAGE_LIMIT * MAX_ISSUE_PAGES} of your issues. Some due dates may be missing.
            </Text>
          ) : null}
          {plan.status === 'error' ? (
            <Text accessibilityRole="alert" className="text-danger text-[13px] font-semibold">
              Could not load sprints and releases for this project.
            </Text>
          ) : null}

          {issues.status === 'loading' ? <LoadingGrid /> : null}
          {issues.status === 'error' ? <EmptyState tone="error" title="Could not load your issues" onRetry={issues.reload} /> : null}

          {ready && view === 'month' ? (
            <MonthGrid
              month={month}
              events={model.byDay}
              todayKey={todayKey}
              onOpen={(ev) => setOpenIssue(ev.issueRef)}
              label={monthLabel}
            />
          ) : null}
          {ready && view === 'agenda' ? (
            <AgendaList days={model.days} todayKey={todayKey} onOpen={(ev) => setOpenIssue(ev.issueRef)} />
          ) : null}
        </View>
      </ScrollView>

      {openIssue ? (
        <ProjectIssueSideModal
          open
          onClose={() => setOpenIssue(null)}
          projectId={openIssue.projectId}
          issueId={openIssue.id}
        />
      ) : null}
    </>
  );
}
