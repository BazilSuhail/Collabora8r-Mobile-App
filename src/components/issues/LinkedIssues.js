import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import LinkPickerModal from "./LinkPickerModal";
import { deleteLink, listLinks } from "@/libs/api/issues";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { paths } from "@/routes/paths";

const idOf = (item) => String(item?.id ?? item?._id);

const TYPE_LABEL = {
  blocks: "Blocks",
  isBlockedBy: "Is blocked by",
  relates: "Relates to",
  duplicates: "Duplicates",
  isDuplicatedBy: "Is duplicated by",
  clones: "Clones",
};

// Links from this issue to others in the project. Unlinking asks first.
export default function LinkedIssues({ pid, issueId, canEdit = false }) {
  const router = useRouter();
  const links = useResource(() => listLinks(pid, issueId), [pid, issueId]);
  const items = Array.isArray(links.data) ? links.data : [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);

  const remove = useMutation(
    async (linkId) => {
      await deleteLink(pid, issueId, linkId);
      return true;
    },
    { success: "Unlinked", error: (err) => err.message || "Could not remove this link" },
  );

  const confirmRemove = async () => {
    const done = await remove.run(pendingRemove);
    if (done) {
      setPendingRemove(null);
      links.reload();
    }
  };

  let list;
  if (links.status === "loading") {
    list = <Skeleton variant="feed" count={2} />;
  } else if (links.status === "error") {
    list = <EmptyState tone="error" title="Links did not load" text={links.error?.message} onRetry={links.reload} />;
  } else if (!items.length) {
    list = <EmptyState icon="issueLink" title="No linked issues" text="Link related or blocking work to this issue." />;
  } else {
    list = (
      <View accessibilityLabel="Linked issues" className="gap-[8px]">
        {items.map((link) => {
          const id = idOf(link);
          return (
            <View
              key={id}
              className="flex-row flex-wrap items-center gap-[10px] rounded-[12px] border border-border bg-surface px-[12px] py-[8px]"
            >
              <Badge variant="badge" tone="plain">
                {TYPE_LABEL[link.type] ?? link.type}
              </Badge>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push(paths.issue(pid, link.key))}
                className="min-w-0 flex-1 active:opacity-70"
              >
                <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
                  <Text className="text-muted" style={{ fontVariant: ["tabular-nums"] }}>
                    {link.key}{" "}
                  </Text>
                  {link.title}
                </Text>
              </Pressable>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="unlink"
                  aria-label={`Remove link to ${link.key}`}
                  onClick={() => setPendingRemove(id)}
                >
                  Remove
                </Button>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View className="gap-[12px]">
      <View className="flex-row items-center justify-between gap-[10px]">
        <Text accessibilityRole="header" className="text-[14px] font-semibold text-foreground">
          Linked issues
        </Text>
        {canEdit ? (
          <Button variant="soft" size="sm" icon="issueLink" onClick={() => setPickerOpen(true)}>
            Link issue
          </Button>
        ) : null}
      </View>
      {list}
      <LinkPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pid={pid}
        issueId={issueId}
        onLinked={links.reload}
      />
      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        title="Remove this link?"
        text="The two issues stay as they are. Only the link goes."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      />
    </View>
  );
}
