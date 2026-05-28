// feat(screens/timesheet/TimesheetPage): show logged time per issue and day for a chosen person and week.
// The 9-column web table becomes a horizontally scrolling table with a pinned-width issue column.
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import LogWorkModal from '@/components/issues/LogWorkModal';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/ui/Illustration';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { getTimesheet } from '@/libs/api/issues';
import { searchUsers } from '@/libs/api/users';
import { formatDuration } from '@/utils/format';
import { useResource } from '@/utils/useResource';

const DAY_MS = 86400000;
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

const ISSUE_W = 190;
const DAY_W = 64;
const TOTAL_W = 76;

const CARD = 'bg-surface border border-border rounded-card';

const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const startOfWeek = (date) =>
  addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -((date.getDay() + 6) % 7));
const localDay = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const isoDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const personOption = (u) => ({ value: u.id ?? u._id, label: u.displayName ?? u.email ?? 'User' });

async function loadTimesheet(pid, params) {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    const res = await getTimesheet(pid, { limit: PAGE_LIMIT, ...params, ...(cursor ? { cursor } : {}) });
    items.push(...(res.data ?? []));
    cursor = res.meta?.nextCursor ?? null;
    pages += 1;
  } while (cursor && pages < MAX_PAGES);
  return { data: items, meta: { capped: Boolean(cursor) } };
}

// One row per issue, seven day cells Monday to Sunday.
function buildRows(worklogs, weekStart) {
  const rows = new Map();
  for (const w of worklogs) {
    const day = localDay(w.date);
    if (!day) continue;
    const index = Math.round((day - weekStart) / DAY_MS);
    if (index < 0 || index > 6) continue;
    const id = w.issueId ?? w.issue?.id ?? w.issue?._id ?? w.issueKey ?? 'unknown';
    if (!rows.has(id)) {
      rows.set(id, {
        id,
        key: w.issueKey ?? w.issue?.key ?? 'Issue',
        summary: w.issueSummary ?? w.issue?.summary ?? '',
        perDay: Array.from({ length: 7 }, () => 0),
        total: 0,
      });
    }
    const row = rows.get(id);
    row.perDay[index] += w.seconds ?? 0;
    row.total += w.seconds ?? 0;
  }
  return Array.from(rows.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function Cell({ width, today, bold, head, faint, align = 'right', children }) {
  return (
    <View style={{ width }} className={`px-3 ${head ? 'py-[10px]' : 'py-[11px]'} justify-center ${today ? 'bg-surface-2' : ''}`}>
      <Text
        className={`${head ? 'text-[12px] text-muted' : faint ? 'text-[13.5px] text-faint' : 'text-[13.5px] text-foreground'} ${bold ? 'font-bold' : ''} ${align === 'right' ? 'text-right' : ''}`}
        style={{ fontVariant: ['tabular-nums'] }}
        numberOfLines={2}
      >
        {children}
      </Text>
    </View>
  );
}

export default function TimesheetPage() {
  const { projectId, can } = useProject();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [userId, setUserId] = useState('');
  const [people, setPeople] = useState([]);
  const [logOpen, setLogOpen] = useState(false);

  const from = isoDay(weekStart);
  const to = isoDay(addDays(weekStart, 6));
  const timesheet = useResource(
    () => loadTimesheet(projectId, { from, to, ...(userId ? { userId } : {}) }),
    [projectId, from, to, userId],
  );

  const loadPeople = async (query) => {
    const res = await searchUsers(query);
    const list = (res.data ?? []).map(personOption);
    setPeople((prev) => [...prev, ...list.filter((o) => !prev.some((p) => p.value === o.value))]);
    return list;
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = isoDay(new Date());
  const rows = buildRows(timesheet.data ?? [], weekStart);
  const dayTotals = days.map((_, i) => rows.reduce((sum, r) => sum + r.perDay[i], 0));
  const grand = dayTotals.reduce((sum, s) => sum + s, 0);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${addDays(
    weekStart,
    6,
  ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const shift = (n) => setWeekStart((d) => addDays(d, n * 7));

  const showTable = timesheet.status === 'loading' || (timesheet.status === 'success' && rows.length);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={false} onRefresh={timesheet.reload} />}
      >
        <PageHead
          title="Timesheet"
          sub="Logged time per issue and day for the chosen person and week."
          actions={
            can('worklog.edit') ? (
              <Button variant="soft" icon="time" onClick={() => setLogOpen(true)}>
                Log work
              </Button>
            ) : null
          }
        />

        <View className="gap-3">
          <View className="flex-row items-center gap-[6px]">
            <Button variant="ghost" iconOnly icon="chevL" accessibilityLabel="Previous week" onClick={() => shift(-1)} />
            <Text className="flex-1 text-center font-bold text-foreground" numberOfLines={1}>
              {weekLabel}
            </Text>
            <Button variant="ghost" iconOnly icon="chevR" accessibilityLabel="Next week" onClick={() => shift(1)} />
          </View>
          <View className="flex-row items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              This week
            </Button>
            <View className="flex-1" />
            <Select
              variant="button"
              searchable
              label="Person"
              value={userId}
              onChange={setUserId}
              options={[{ value: '', label: 'Everyone' }, ...people]}
              loadOptions={loadPeople}
            />
          </View>
        </View>

        {timesheet.status === 'error' ? (
          <View className={`${CARD} p-5`}>
            <EmptyState tone="error" title="Could not load the timesheet" onRetry={timesheet.reload} />
          </View>
        ) : null}

        {timesheet.status === 'success' && !rows.length ? (
          <View className={`${CARD} p-5 items-center`}>
            <Illustration name="empty" alt="" className="w-[180px]" />
            <EmptyState
              icon="timesheet"
              title="No time logged this week"
              text="Pick another week or person, or log work on an issue."
            />
          </View>
        ) : null}

        {showTable ? (
          <View className={`${CARD} p-[10px]`}>
            {timesheet.status === 'loading' ? (
              <Skeleton variant="rows" count={5} cols={3} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                <View accessibilityLabel="Logged time for the selected week">
                  <View className="flex-row border-b border-border">
                    <Cell width={ISSUE_W} align="left" bold head>
                      Issue
                    </Cell>
                    {days.map((d) => {
                      const key = isoDay(d);
                      return (
                        <Cell key={key} width={DAY_W} today={key === todayKey} bold head>
                          {d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                        </Cell>
                      );
                    })}
                    <Cell width={TOTAL_W} bold head>
                      Total
                    </Cell>
                  </View>

                  {rows.map((row) => (
                    <View key={row.id} className="flex-row border-b border-border">
                      <View style={{ width: ISSUE_W }} className="px-3 py-[11px]">
                        <Text className="text-[13.5px] font-semibold text-foreground" numberOfLines={2}>
                          <Text className="text-muted">{row.key}  </Text>
                          {row.summary}
                        </Text>
                      </View>
                      {row.perDay.map((s, i) => {
                        const key = isoDay(days[i]);
                        return (
                          <Cell key={key} width={DAY_W} today={key === todayKey} faint={!s}>
                            {s ? formatDuration(s) : '–'}
                          </Cell>
                        );
                      })}
                      <Cell width={TOTAL_W} bold>
                        {formatDuration(row.total)}
                      </Cell>
                    </View>
                  ))}

                  <View className="flex-row">
                    <Cell width={ISSUE_W} align="left" bold>
                      Total
                    </Cell>
                    {dayTotals.map((s, i) => (
                      <Cell key={isoDay(days[i])} width={DAY_W} today={isoDay(days[i]) === todayKey} bold>
                        {s ? formatDuration(s) : '–'}
                      </Cell>
                    ))}
                    <Cell width={TOTAL_W} bold>
                      {formatDuration(grand)}
                    </Cell>
                  </View>
                </View>
              </ScrollView>
            )}
            {timesheet.meta?.capped ? (
              <Text className="mt-[10px] px-3 text-muted text-[12.5px] font-semibold">
                Showing the first {PAGE_LIMIT * MAX_PAGES} entries for this week.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {logOpen ? (
        <LogWorkModal open onClose={() => setLogOpen(false)} projectId={projectId} onSaved={() => timesheet.reload()} />
      ) : null}
    </View>
  );
}
