// feat(screens/backlog/components/SprintPanel): one panel of the backlog page, a sprint or the backlog, with its ranked issue rows.
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { paths } from '@/routes/paths';
import { priorityIcon, priorityTone, statusTone, typeIcon } from '@/utils/issueVisuals';

const assigneeOf = (issue) => issue.assigneeUser ?? issue.assignee ?? null;

// A ranked row. On touch there is no drag handle; the row menu holds "Move up/down" and "Move to" actions.
function IssueRow({ issue, panelId, rowProps, last }) {
  const router = useRouter();
  const { pid, menuFor } = rowProps;
  const assignee = assigneeOf(issue);
  const menu = menuFor(issue, panelId);
  return (
    <View
      className={`flex-row items-center gap-2.5 min-w-0 py-2.5 px-3 ${last ? '' : 'border-b border-border'}`}
    >
      <Icon name={typeIcon({ icon: issue.typeIcon, name: issue.typeName, hierarchy: issue.hierarchy })} size={16} />
      <Text className="text-muted text-xs font-bold">{issue.key}</Text>
      <Pressable
        className="flex-1 min-w-0"
        accessibilityRole="link"
        onPress={() => router.push(paths.issue(pid, issue.key))}
      >
        <Text numberOfLines={1} className="text-[13.5px] font-semibold text-foreground">
          {issue.title}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-1">
          <Badge variant="status" tone={statusTone(issue.statusCategory)}>
            {issue.statusName}
          </Badge>
          <Badge variant="badge" tone={priorityTone(issue.priorityRank)} icon={priorityIcon(issue.priorityRank, issue.priorityIcon)}>
            {issue.priorityName ?? 'None'}
          </Badge>
        </View>
      </Pressable>
      {assignee ? <Avatar name={assignee.displayName ?? 'User'} src={assignee.avatar} size="xs" /> : null}
      {menu.length ? (
        <Dropdown
          label={`Actions for ${issue.key}`}
          items={menu}
          trigger={(p) => (
            <Button variant="ghost" size="sm" iconOnly icon="more" aria-label={`Actions for ${issue.key}`} {...p} />
          )}
        />
      ) : null}
    </View>
  );
}

function RowSkeleton() {
  return (
    <View accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center gap-2.5 py-3 px-3 border-b border-border">
          <View className="w-7 h-3 rounded-xl bg-well" />
          <View className="flex-1 h-3 rounded-xl bg-well" />
          <View className="w-[90px] h-3 rounded-xl bg-well" />
        </View>
      ))}
    </View>
  );
}

export default function SprintPanel({
  panelId,
  title,
  meta,
  actions,
  issues,
  status,
  onRetry,
  emptyTitle,
  emptyText,
  dropActive,
  rowProps,
}) {
  return (
    <View
      className={`rounded-card border bg-surface overflow-hidden ${dropActive ? 'border-accent' : 'border-border'}`}
      accessibilityLabel={title}
    >
      <View className="flex-row flex-wrap items-center gap-2.5 px-4 py-3.5 border-b border-border">
        <Text accessibilityRole="header" className="text-[15px] font-bold text-foreground">
          {title}
        </Text>
        <Text className="text-muted text-[12.5px] flex-shrink">{meta}</Text>
        {actions ? <View className="ml-auto flex-row items-center gap-2">{actions}</View> : null}
      </View>

      {status === 'loading' ? <RowSkeleton /> : null}
      {status === 'error' ? <EmptyState tone="error" title="Could not load these issues" onRetry={onRetry} /> : null}
      {status === 'success' && issues.length === 0 ? (
        <EmptyState icon="backlog" title={emptyTitle} text={emptyText} />
      ) : null}
      {status === 'success' && issues.length > 0 ? (
        <View accessibilityLabel={`${title} issues`}>
          {issues.map((issue, i) => (
            <IssueRow key={issue.id} issue={issue} panelId={panelId} rowProps={rowProps} last={i === issues.length - 1} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
