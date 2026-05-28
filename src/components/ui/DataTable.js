import { isValidElement, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cn } from './cn';
import Button from './Button';
import Dropdown from './Dropdown';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import SortHeader from './SortHeader';
import { Icon } from './Icon';

const CARD = 'bg-surface border border-line rounded-card';

function Cell({ value, className }) {
  if (value == null || value === false) return <Text className={cn('text-faint', className)}>—</Text>;
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <Text className={cn('text-[13.5px] text-foreground font-sans', className)} numberOfLines={2}>
        {value}
      </Text>
    );
  }
  return value;
}

function Check({ checked, onPress, label, disabled }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      hitSlop={10}
      onPress={onPress}
      className={cn(
        'w-[20px] h-[20px] rounded-[7px] items-center justify-center border-[1.5px]',
        checked ? 'bg-ink border-ink' : 'bg-surface border-line-2',
        disabled && 'opacity-[0.45]',
      )}
    >
      {checked ? <Icon name="check" size={13} cls="text-on-ink" strokeWidth={3} /> : null}
    </Pressable>
  );
}

// Mobile "table": a card with a sort bar and one stacked row per item. The
// first column is the row title; the other columns show as label/value lines.
// Same props as the client DataTable. List-style extras (ListHeaderComponent,
// contentContainerClassName, onRefresh) make it a full-screen scroll view.
export default function DataTable({ ListHeaderComponent, contentContainerClassName, onRefresh, className, ...props }) {
  const [refreshing, setRefreshing] = useState(false);
  if (!ListHeaderComponent && !contentContainerClassName && !onRefresh) return <DataTableBody {...props} />;
  const Header = ListHeaderComponent;
  const header = Header == null ? null : isValidElement(Header) ? Header : <Header />;
  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <ScrollView
      className={cn('flex-1', className)}
      contentContainerClassName={cn('gap-[16px]', contentContainerClassName)}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} /> : undefined}
    >
      {header}
      <DataTableBody {...props} />
    </ScrollView>
  );
}

function DataTableBody({
  columns,
  rows = [],
  rowKey = 'id',
  status = 'success',
  error,
  onRetry,
  empty,
  sort,
  onSort,
  onRowClick,
  rowMenu,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  selectable = false,
  selected = [],
  onSelect,
  label,
}) {
  const keyOf = (row) => row[rowKey];
  const sortable = columns.filter((c) => c.sortable);
  const [primary, ...secondary] = columns;

  const toggleAll = (checked) => {
    if (!onSelect) return;
    onSelect(checked ? rows.map(keyOf) : []);
  };

  const toggleOne = (key, checked) => {
    if (!onSelect) return;
    onSelect(checked ? [...selected, key] : selected.filter((k) => k !== key));
  };

  if (status === 'error') {
    return (
      <View className={CARD}>
        <EmptyState tone="error" title={error?.message ?? 'Could not load these items.'} onRetry={onRetry} />
      </View>
    );
  }

  if (status === 'success' && rows.length === 0) {
    return (
      <View className={CARD}>
        <EmptyState
          icon={empty?.icon}
          title={empty?.title ?? 'Nothing here yet'}
          text={empty?.text}
          action={empty?.action}
        />
      </View>
    );
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(keyOf(r)));
  const showBar = selectable || sortable.length > 0;

  return (
    <View
      className={cn(CARD, 'overflow-hidden')}
      accessibilityLabel={label}
      accessibilityState={{ busy: status === 'loading' || loadingMore }}
    >
      {showBar ? (
        <View className="flex-row items-center gap-[12px] px-[16px] py-[10px] border-b border-line bg-surface-2">
          {selectable ? (
            <Check
              checked={allSelected}
              label="Select all rows"
              disabled={status === 'loading'}
              onPress={() => toggleAll(!allSelected)}
            />
          ) : null}
          {sortable.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-[16px] items-center">
              {sortable.map((col) => (
                <SortHeader key={col.key} label={col.label} sortKey={col.key} sort={sort} onSort={(k) => onSort?.(k)} />
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {status === 'loading' ? (
        <Skeleton variant="rows" count={6} cols={Math.min(3, columns.length)} />
      ) : (
        rows.map((row, ri) => {
          const key = keyOf(row);
          const isSel = selected.includes(key);
          const body = (
            <>
              {selectable ? (
                <Check checked={isSel} label="Select row" onPress={() => toggleOne(key, !isSel)} />
              ) : null}
              <View className="flex-1 min-w-0 gap-[6px]">
                {primary ? (
                  <Cell
                    value={primary.render ? primary.render(row) : row[primary.key]}
                    className="font-sans-bold text-[14.5px]"
                  />
                ) : null}
                {secondary.length ? (
                  <View className="flex-row flex-wrap gap-x-[16px] gap-y-[6px]">
                    {secondary.map((col) => (
                      <View key={col.key} className="gap-[2px] min-w-[90px] max-w-full">
                        {typeof col.label === 'string' && col.label ? (
                          <Text className="text-[11px] uppercase tracking-[0.6px] text-muted font-sans-bold">
                            {col.label}
                          </Text>
                        ) : null}
                        <Cell value={col.render ? col.render(row) : row[col.key]} />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
              {rowMenu ? (
                <Dropdown
                  label="Row actions"
                  items={rowMenu(row)}
                  trigger={(p) => <Button iconOnly variant="ghost" size="sm" icon="more" aria-label="Row actions" {...p} />}
                />
              ) : null}
            </>
          );
          const rowClass = cn(
            'flex-row items-start gap-[12px] px-[16px] py-[14px]',
            ri > 0 && 'border-t border-line',
            isSel && 'bg-well',
          );
          return onRowClick ? (
            <Pressable
              key={String(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectable ? isSel : undefined }}
              onPress={() => onRowClick(row)}
              onLongPress={selectable ? () => toggleOne(key, !isSel) : undefined}
              className={cn(rowClass, 'active:bg-surface-2')}
            >
              {body}
            </Pressable>
          ) : (
            <View key={String(key)} className={rowClass} accessibilityState={{ selected: selectable ? isSel : undefined }}>
              {body}
            </View>
          );
        })
      )}

      {hasMore ? (
        <View className="items-center py-[12px] border-t border-line">
          <Button variant="soft" size="sm" icon="down" loading={loadingMore} disabled={loadingMore} onClick={onLoadMore}>
            Show more
          </Button>
        </View>
      ) : null}
    </View>
  );
}
