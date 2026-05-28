// feat(screens/board/components/BoardColumn): one board column with its status header, WIP limit and issue cards.
// Mobile: cards open on tap; long-press or the card menu offers "Move to <column>" in place of drag and drop.
import { Pressable, Text, View } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import { Icon } from '@/components/ui/Icon';
import { relativeTime } from '@/utils/format';
import { priorityIcon, priorityTone, statusTone, typeIcon } from '@/utils/issueVisuals';

const TONE_DOT = { plain: 'bg-faint', iris: 'bg-iris', spruce: 'bg-spruce' };

// One issue card. Open and move are wired by the page through onOpen and menu.
export function BoardCard({ issue, onOpen, onLongPress, menu }) {
  const assignee = issue.assigneeUser ?? issue.assignee ?? null;
  const checklist = issue.checklist ?? [];
  const checkDone = checklist.filter((c) => c.done).length;
  const attachments = issue.counts?.attachments ?? 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${issue.key} ${issue.title}, ${issue.statusName}`}
      accessibilityHint="Opens the issue. Long-press to move it."
      onPress={() => onOpen?.(issue)}
      onLongPress={onLongPress ? () => onLongPress(issue) : undefined}
      delayLongPress={280}
      className="gap-2 border border-border rounded-card p-3 pb-[11px] bg-pp-card active:opacity-80"
    >
      <View className="flex-row items-center gap-[7px] min-w-0">
        <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} size={16} cls="text-muted" />
        <Text className="text-muted text-[11.5px] font-bold">{issue.key}</Text>
        <View className="ml-auto flex-row items-center gap-1">
          <Badge
            variant="badge"
            tone={priorityTone(issue.priorityRank)}
            icon={priorityIcon(issue.priorityRank, issue.priorityIcon)}
            label={issue.priorityName ?? 'No priority'}
          />
          {menu?.length ? (
            <Dropdown
              label={`Actions for ${issue.key}`}
              items={menu}
              trigger={(p) => (
                <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`Actions for ${issue.key}`} {...p} />
              )}
            />
          ) : null}
        </View>
      </View>
      <Text numberOfLines={2} className="text-[13.5px] font-semibold leading-[1.3] text-foreground">
        {issue.title}
      </Text>
      <View className="flex-row flex-wrap items-center justify-between gap-1.5">
        <View className="flex-row items-center gap-2.5">
          {checklist.length ? (
            <View className="flex-row items-center gap-1">
              <Icon name="checklist" size={14} cls="text-faint" />
              <Text className="text-muted text-[11.5px] font-semibold">{`${checkDone}/${checklist.length}`}</Text>
            </View>
          ) : null}
          {attachments ? (
            <View className="flex-row items-center gap-1">
              <Icon name="attach" size={14} cls="text-faint" />
              <Text className="text-muted text-[11.5px] font-semibold">{attachments}</Text>
            </View>
          ) : null}
          <Text className="text-muted text-[11.5px] font-semibold">
            {relativeTime(issue.lastActivityAt ?? issue.updatedAt)}
          </Text>
        </View>
        {assignee ? (
          <Avatar name={assignee.displayName ?? 'User'} src={assignee.avatar} size="xs" />
        ) : (
          <Text className="text-faint text-[11.5px]">Unassigned</Text>
        )}
      </View>
    </Pressable>
  );
}

// count is the column's full size. items are the cards left after the page's search and quick filters.
// Mobile additions: onOpen(issue), onLongPress(issue), menuFor(issue) => Dropdown items.
export default function BoardColumn({ id, name, category, wipLimit, count, items, onOpen, onLongPress, menuFor }) {
  const tone = statusTone(category);
  const overLimit = Boolean(wipLimit) && count > wipLimit;
  return (
    <View className="rounded-card border border-pp-lane-rim bg-pp-lane pt-3 px-2 pb-4" accessibilityLabel={`${name} column`}>
      <View className="flex-row flex-wrap items-center gap-[7px] pb-2.5 px-1.5">
        <View className={`w-2.5 h-2.5 rounded-full ${TONE_DOT[tone] ?? TONE_DOT.plain}`} />
        <Text accessibilityRole="header" numberOfLines={1} className="text-sm font-bold text-foreground flex-shrink">
          {name}
        </Text>
        <View className="ml-auto bg-surface border border-border rounded-full min-w-[22px] h-5 px-1.5 items-center justify-center">
          <Text className="text-[11px] font-bold text-foreground">{count}</Text>
        </View>
        {wipLimit ? (
          <View className="basis-full pl-[17px]">
            {overLimit ? (
              <Badge variant="badge" tone="ember" label="Over the WIP limit">{`Over WIP limit ${wipLimit}`}</Badge>
            ) : (
              <Text className="text-xs text-muted">{`WIP limit ${wipLimit}`}</Text>
            )}
          </View>
        ) : null}
      </View>
      <View className="gap-2.5" accessibilityLabel={`${name} issues`} data-col={id}>
        {items.map((issue) => (
          <BoardCard
            key={issue.id}
            issue={issue}
            onOpen={onOpen}
            onLongPress={onLongPress}
            menu={menuFor ? menuFor(issue) : null}
          />
        ))}
        {items.length === 0 ? (
          <View className="items-center justify-center h-24 rounded-card border-[1.5px] border-dashed border-border-strong">
            <Text className="text-[12.5px] font-semibold text-muted">
              {count === 0 ? 'No issues in this column' : 'No issues match the filters'}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
