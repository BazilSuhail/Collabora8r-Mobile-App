import { Pressable, Text, View } from "react-native";
import { cn } from "@/utils/cn";
import { userAvatarSrc } from "@/utils/media";
import { priorityIcon, priorityTone, statusIcon, statusTone, typeIcon } from "@/utils/issueVisuals";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Highlight from "@/components/ui/Highlight";
import { Icon } from "@/components/ui/Icon";
import Skeleton from "@/components/ui/Skeleton";

const TONE_TEXT = {
  ember: "text-ember-t",
  saffron: "text-saffron-t",
  plain: "text-muted",
};

// Plain issue rows for panels, dashboards and detail children. Loading, error and empty states live here.
// rowMenu(issue) returns Dropdown items (shown as an action sheet). `drag` is accepted for API parity;
// on mobile, reordering is done through "Move to" items in rowMenu instead of a drag handle.
// Rows render as plain Views so the list can sit inside a parent ScrollView.
export default function IssueList({
  issues = [],
  status = "success",
  error,
  onRetry,
  onOpen,
  query = "",
  compact = false,
  drag = false,
  rowMenu,
  empty,
  className,
}) {
  if (status === "loading") return <Skeleton variant="feed" count={6} />;
  if (status === "error") {
    return <EmptyState tone="error" title="Could not load issues" text={error?.message} onRetry={onRetry} />;
  }
  if (!issues.length) {
    return (
      <EmptyState
        icon={empty?.icon ?? "inbox"}
        title={empty?.title ?? "No issues"}
        text={empty?.text}
        action={empty?.action}
      />
    );
  }

  return (
    <View accessibilityRole="list" className={cn("w-full", className)}>
      {issues.map((issue, index) => (
        <IssueRow
          key={issue.id ?? issue._id ?? issue.key}
          issue={issue}
          onOpen={onOpen}
          query={query}
          compact={compact}
          drag={drag}
          rowMenu={rowMenu}
          last={index === issues.length - 1}
        />
      ))}
    </View>
  );
}

function IssueRow({ issue, onOpen, query, compact, drag, rowMenu, last }) {
  const tone = typeof issue.priorityRank === "number" ? priorityTone(issue.priorityRank) : "plain";
  return (
    <View
      className={cn(
        "flex-row items-center gap-[12px] py-[10px] px-[12px]",
        last ? null : "border-b border-border",
      )}
    >
      {drag ? (
        <View className="shrink-0 opacity-60" accessibilityLabel={`Reorder ${issue.key} from the actions menu`}>
          <Icon name="drag" size={16} className="text-muted" />
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={() => onOpen?.(issue)}
        className="flex-1 min-w-0 flex-row items-center gap-[10px] active:opacity-70"
      >
        <Icon name={typeIcon({ name: issue.typeName, icon: issue.typeIcon })} size={16} className="text-muted" />
        <Text className="shrink-0 text-[12px] font-semibold text-muted" style={{ fontVariant: ["tabular-nums"] }}>
          {issue.key}
        </Text>
        <Text numberOfLines={1} className="min-w-0 flex-1 text-[14px] font-semibold text-foreground">
          <Highlight text={issue.title ?? ""} query={query} />
        </Text>
      </Pressable>
      {!compact && issue.statusName ? (
        <Badge variant="status" tone={statusTone(issue.statusCategory)} icon={statusIcon(issue.statusCategory)}>
          {issue.statusName}
        </Badge>
      ) : null}
      {typeof issue.priorityRank === "number" ? (
        <View className="shrink-0" accessibilityLabel={issue.priorityName ?? "Priority"}>
          <Icon name={priorityIcon(issue.priorityRank, issue.priorityIcon)} size={16} className={TONE_TEXT[tone]} />
        </View>
      ) : null}
      {!compact && issue.assignee?.name ? (
        <Avatar
          name={issue.assignee.name}
          src={userAvatarSrc({ avatarKey: issue.assignee.avatarKey, avatarUrl: issue.assignee.avatarUrl })}
          size="xs"
        />
      ) : null}
      {rowMenu ? (
        <Dropdown
          label={`Actions for ${issue.key}`}
          items={rowMenu(issue)}
          trigger={(triggerProps) => (
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon="more"
              aria-label={`Actions for ${issue.key}`}
              {...triggerProps}
            />
          )}
        />
      ) : null}
    </View>
  );
}
