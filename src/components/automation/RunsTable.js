// feat(screens/automation/components/RunsTable): list automation runs with their rule, item, result and time, and open one on tap.
import { Platform, Text } from 'react-native';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { relativeTime } from '@/utils/format';

const RESULT = {
  success: { tone: 'spruce', label: 'Success' },
  failed: { tone: 'ember', label: 'Failed' },
  skipped: { tone: 'plain', label: 'Skipped' },
};

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

// Extra props (ListHeaderComponent, scrollEnabled, ...) pass through to DataTable's list.
export default function RunsTable({
  rows = [],
  status = 'success',
  error,
  onRetry,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onOpen,
  ruleNames = {},
  showRule = true,
  label = 'Automation runs',
  ...rest
}) {
  const data = rows.map(withId);

  const columns = [
    ...(showRule
      ? [
          {
            key: 'rule',
            label: 'Rule',
            render: (row) => (
              <Text className="font-semibold text-foreground" numberOfLines={1}>
                {ruleNames[String(row.ruleId)] ?? 'Rule'}
              </Text>
            ),
          },
        ]
      : []),
    {
      key: 'item',
      label: 'Item',
      render: (row) => (
        <Text style={{ fontFamily: MONO }} className="text-[12.5px] text-muted">
          {row.itemKey ?? (row.itemId ? `#${String(row.itemId).slice(-6)}` : 'No item')}
        </Text>
      ),
    },
    {
      key: 'result',
      label: 'Result',
      render: (row) => {
        const meta = RESULT[row.status] ?? RESULT.skipped;
        return (
          <Badge tone={meta.tone} variant="status" label={`Result: ${meta.label}`}>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <Text className="text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          {row.durationMs != null ? `${row.durationMs} ms` : '—'}
        </Text>
      ),
    },
    {
      key: 'at',
      label: 'When',
      render: (row) => <Text className="text-muted">{row.at ? relativeTime(row.at) : '—'}</Text>,
    },
  ];

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={data}
      rowKey="id"
      status={status}
      error={error}
      onRetry={onRetry}
      empty={{ icon: 'runs', title: 'No runs yet', text: 'Runs appear here when a rule fires.' }}
      onRowClick={onOpen}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      loadingMore={loadingMore}
      {...rest}
    />
  );
}
