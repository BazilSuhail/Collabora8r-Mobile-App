import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import SideModal from "@/components/ui/SideModal";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import MarkdownView from "./MarkdownView";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { getVersion, listVersions, restoreVersion } from "@/libs/api/wiki";
import { relativeTime } from "@/utils/format";

const idOf = (item) => String(item?.id ?? item?._id);
const none = () => Promise.resolve({ data: null, meta: null });

// Page version history. Restoring a version asks for confirmation first.
export default function WikiHistoryDrawer({ open, onClose, pid, pageId, canRestore = false, onRestored }) {
  const [picked, setPicked] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const versions = useResource(
    () => (open ? listVersions(pid, pageId, { limit: 50 }) : none()),
    [open, pid, pageId],
  );
  const list = Array.isArray(versions.data) ? versions.data : [];
  const activeId = picked ?? (list[0] ? idOf(list[0]) : null);

  const detail = useResource(
    () => (open && activeId ? getVersion(pid, pageId, activeId) : none()),
    [open, activeId, pid, pageId],
  );

  const restore = useMutation(
    async () => {
      await restoreVersion(pid, pageId, activeId);
      return true;
    },
    { success: "Version restored", error: (err) => err.message || "Could not restore this version" },
  );

  const doRestore = async () => {
    const done = await restore.run();
    if (done) {
      setConfirmOpen(false);
      onRestored?.();
      onClose?.();
    }
  };

  let content;
  if (versions.status === "loading") {
    content = <Skeleton variant="feed" count={4} />;
  } else if (versions.status === "error") {
    content = (
      <EmptyState tone="error" title="History did not load" text={versions.error?.message} onRetry={versions.reload} />
    );
  } else if (!list.length) {
    content = <EmptyState icon="history" title="No earlier versions" text="Versions appear here after the first edit." />;
  } else {
    content = (
      <View className="gap-[16px]">
        <View accessibilityLabel="Versions" className="gap-[8px]">
          {list.map((version) => {
            const id = idOf(version);
            const selected = id === activeId;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setPicked(id)}
                className={`w-full rounded-[12px] border px-[12px] py-[10px] ${
                  selected ? "bg-background border-foreground/20" : "bg-surface border-border"
                }`}
              >
                <Text className="text-[14px] font-semibold text-foreground">
                  Version {version.versionNo}
                  {version.changeSummary ? ` · ${version.changeSummary}` : ""}
                </Text>
                <Text className="text-[12.5px] text-muted">
                  {version.authorName ?? "Unknown"}
                  {version.createdAt ? ` · ${relativeTime(version.createdAt)}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {detail.status === "loading" ? (
          <Skeleton variant="cards" count={1} />
        ) : detail.status === "error" ? (
          <EmptyState tone="error" title="This version did not load" text={detail.error?.message} onRetry={detail.reload} />
        ) : detail.data ? (
          <View accessibilityLabel="Version preview" className="gap-[12px] rounded-[12px] border border-border p-[14px]">
            <Text accessibilityRole="header" className="text-[17px] font-semibold text-foreground" style={{ letterSpacing: -0.25 }}>
              {detail.data.title}
            </Text>
            <MarkdownView text={detail.data.body} />
            {canRestore ? (
              <View className="items-start">
                <Button variant="soft" size="sm" icon="restore" onClick={() => setConfirmOpen(true)}>
                  Restore this version
                </Button>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <SideModal open={open} onClose={onClose} title="Page history" subtitle="Earlier versions of this page">
        {content}
      </SideModal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Restore this version?"
        text="The page content goes back to this version."
        confirmLabel="Restore"
        tone="default"
        onConfirm={doRestore}
      />
    </>
  );
}
