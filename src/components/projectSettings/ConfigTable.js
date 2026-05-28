// feat(screens/projectSettings/components/ConfigTable): list issue types, priorities, resolutions or custom fields with reorder, edit and delete actions.
import { Text, View } from 'react-native';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import { cn } from '@/utils/cn';

// Colour names stored on config rows map to these token backgrounds only.
export const SWATCH = {
  ember: 'bg-ember',
  iris: 'bg-iris',
  spruce: 'bg-spruce',
  saffron: 'bg-saffron',
  ink: 'bg-ink',
};

const orderKey = (seg) => (seg === 'priorities' ? 'rank' : 'sortOrder');

function Swatch({ color }) {
  return (
    <View className="flex-row items-center gap-2">
      <View accessible={false} className={cn('h-3 w-3 rounded', SWATCH[color] ?? 'bg-border')} />
      <Text className="text-[13px] text-muted">{color ? color : 'No colour'}</Text>
    </View>
  );
}

const detailFor = (seg, row) => {
  if (seg === 'issue-types') {
    return (
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Badge tone="iris">{row.hierarchy}</Badge>
        {row.isDefault ? <Badge tone="spruce">Default</Badge> : null}
      </View>
    );
  }
  if (seg === 'priorities') {
    return (
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Badge>{`Rank ${row.rank}`}</Badge>
        {row.isDefault ? <Badge tone="spruce">Default</Badge> : null}
      </View>
    );
  }
  if (seg === 'resolutions') {
    return row.countsAsDone ? <Badge tone="spruce">Counts as done</Badge> : <Badge>Still open</Badge>;
  }
  return (
    <View className="flex-row flex-wrap items-center gap-1.5">
      <Badge tone="iris">{row.fieldType}</Badge>
      {row.required ? <Badge tone="saffron">Required</Badge> : null}
    </View>
  );
};

const COLUMN_LABEL = {
  'issue-types': 'Issue type',
  priorities: 'Priority',
  resolutions: 'Resolution',
  'custom-fields': 'Custom field',
};

export default function ConfigTable({ seg, rows, status, error, onRetry, empty, canEdit, canDelete, onEdit, onDelete, onMove }) {
  const key = orderKey(seg);
  const sorted = [...rows].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
  const hasColor = seg === 'issue-types' || seg === 'priorities';

  const columns = [
    {
      key: 'order',
      label: 'Order',
      width: 96,
      render: (row) => {
        const index = sorted.findIndex((r) => r._id === row._id);
        return (
          <View className="flex-row items-center gap-0.5">
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="up"
              accessibilityLabel={`Move ${row.name} up`}
              disabled={!canEdit || index <= 0}
              onPress={() => onMove?.(row, -1)}
            />
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="down"
              accessibilityLabel={`Move ${row.name} down`}
              disabled={!canEdit || index >= sorted.length - 1}
              onPress={() => onMove?.(row, 1)}
            />
          </View>
        );
      },
    },
    {
      key: 'name',
      label: COLUMN_LABEL[seg] ?? 'Name',
      render: (row) => (
        <View className="gap-0.5">
          <Text className="font-semibold text-foreground">{row.name}</Text>
          {row.description ? <Text className="text-[13px] text-muted">{row.description}</Text> : null}
        </View>
      ),
    },
    {
      key: 'detail',
      label: 'Details',
      render: (row) => detailFor(seg, row),
    },
  ];

  if (hasColor) {
    columns.push({
      key: 'color',
      label: 'Colour',
      render: (row) => <Swatch color={row.color ?? ''} />,
    });
  }

  const rowMenu =
    canEdit || canDelete
      ? (row) => [
          ...(canEdit ? [{ id: 'edit', label: 'Edit', icon: 'pen', onSelect: () => onEdit?.(row) }] : []),
          ...(canDelete ? [{ id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => onDelete?.(row) }] : []),
        ]
      : undefined;

  return (
    <DataTable
      label={`${COLUMN_LABEL[seg] ?? 'Config'} list`}
      rowKey="_id"
      columns={columns}
      rows={sorted}
      status={status}
      error={error}
      onRetry={onRetry}
      empty={empty}
      rowMenu={rowMenu}
    />
  );
}
