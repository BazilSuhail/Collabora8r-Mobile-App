// feat(screens/forms/components/SubmissionsDrawer): panel that lists a form's submissions with their answers and created issues.
import { Text, View } from "react-native";
import SideModal from "@/components/ui/SideModal";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { listSubmissions } from "@/libs/api/forms";
import { formatDateTime } from "@/utils/format";
import { usePaged } from "@/utils/usePaged";

const fetchSubmissions = ({ pid, formId, ...p }) => listSubmissions(pid, formId, p);

const answerText = (value) => (Array.isArray(value) ? value.join(", ") : value === true ? "Yes" : String(value));

function SubmissionsBody({ projectId, form }) {
  const subs = usePaged(fetchSubmissions, { pid: projectId, formId: form.id ?? form._id });
  const fields = form.fields ?? [];

  if (subs.status === "loading") return <Skeleton variant="cards" count={3} />;

  if (subs.status === "error") {
    return <EmptyState tone="error" title="Submissions did not load" text="Try again in a moment." onRetry={subs.reload} />;
  }

  if (!subs.items.length) {
    return <EmptyState icon="inbox" title="No submissions yet" text="Answers from the public link appear here." />;
  }

  return (
    <View className="gap-[12px]">
      <View className="gap-[10px]">
        {subs.items.map((s) => {
          const answers = s.answers ?? {};
          return (
            <View key={s.id ?? s._id} className="gap-[8px] rounded-[15px] border border-border bg-surface p-[14px]">
              <View className="flex-row items-center gap-[8px] flex-wrap">
                <Text className="font-semibold text-foreground">{s.submitterName || "Anonymous"}</Text>
                <Text className="text-muted text-[12.5px]">{formatDateTime(s.submittedAt ?? s.createdAt)}</Text>
                <View className="ml-auto">
                  <Badge variant="status" tone={s.itemId ? "spruce" : "plain"}>
                    {s.itemId ? "Issue created" : "No issue"}
                  </Badge>
                </View>
              </View>
              <View className="gap-[6px]">
                {fields
                  .filter((f) => answers[f.id] !== undefined && answers[f.id] !== "")
                  .map((f) => (
                    <View key={f.id} className="flex-row gap-[10px]">
                      <Text className="w-[140px] text-muted font-semibold text-[13.5px]">{f.label}</Text>
                      <Text className="flex-1 min-w-0 text-foreground text-[13.5px]">{answerText(answers[f.id])}</Text>
                    </View>
                  ))}
              </View>
            </View>
          );
        })}
      </View>
      {subs.hasMore ? (
        <Button variant="soft" size="sm" onPress={subs.loadMore} loading={subs.loadingMore} disabled={subs.loadingMore}>
          Show more
        </Button>
      ) : null}
    </View>
  );
}

export default function SubmissionsDrawer({ open, onClose, projectId, form }) {
  return (
    <SideModal open={open} onClose={onClose} title="Submissions" subtitle={form?.name}>
      {open && form ? <SubmissionsBody projectId={projectId} form={form} /> : null}
    </SideModal>
  );
}
