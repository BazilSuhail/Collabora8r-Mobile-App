import { useState } from "react";
import { Text, View } from "react-native";
import { useToast } from "@/context/ToastContext";
import { decideApproval, listApprovals, requestApproval } from "@/libs/api/servicedesk";
import { searchUsers } from "@/libs/api/users";
import { useResource } from "@/utils/useResource";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormModal from "@/components/ui/FormModal";
import { Icon } from "@/components/ui/Icon";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";

const TONE = { pending: "saffron", approved: "spruce", rejected: "ember" };
const LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const personOption = (u) => ({ value: u.id ?? u._id, label: u.displayName ?? u.email ?? "User" });

// Approvals on one issue. Lists, requests and decides through libs/api only.
export default function ApprovalsCard({ projectId, issueId, can = false }) {
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const approvals = useResource(() => listApprovals(projectId, issueId), [projectId, issueId]);
  const items = approvals.data ?? [];

  const decide = async (approval, decision) => {
    try {
      await decideApproval(projectId, approval.id ?? approval._id, { decision });
      toast.success(decision === "approved" ? "Approved" : "Rejected");
      approvals.reload();
    } catch {
      toast.error("Could not record the decision");
    }
  };

  return (
    <View className="rounded-[15px] border border-border bg-surface p-[18px] gap-[12px]">
      <View className="flex-row items-center justify-between gap-[12px] min-h-[32px]">
        <View className="flex-row items-center gap-[8px] min-w-0 flex-1">
          <Icon name="approval" size={16} className="text-faint" />
          <Text accessibilityRole="header" numberOfLines={1} className="shrink text-[16px] font-semibold tracking-tight text-foreground">
            Approvals
          </Text>
        </View>
        {can ? (
          <Button size="sm" variant="soft" icon="approval" onClick={() => setRequesting(true)}>
            Request approval
          </Button>
        ) : null}
      </View>

      {approvals.status === "loading" ? <Skeleton variant="feed" count={2} /> : null}
      {approvals.status === "error" ? (
        <EmptyState tone="error" title="Could not load approvals" onRetry={approvals.reload} />
      ) : null}
      {approvals.status === "success" && !items.length ? (
        <EmptyState icon="approval" title="No approvals requested" />
      ) : null}

      {approvals.status === "success" && items.length ? (
        <View className="gap-[8px]">
          {items.map((a) => {
            const id = a.id ?? a._id;
            const status = a.status ?? "pending";
            return (
              <View
                key={id}
                className="flex-row flex-wrap items-center gap-[10px] px-[12px] py-[10px] rounded-[14px] bg-surface-2 border border-border"
              >
                <View className="min-w-0 flex-1 gap-[2px]">
                  <Text numberOfLines={1} className="font-bold text-foreground">
                    {a.approver?.displayName ?? "Approver"}
                  </Text>
                  {a.comment ? (
                    <Text numberOfLines={1} className="text-muted text-[12px] font-semibold">
                      {a.comment}
                    </Text>
                  ) : null}
                </View>
                <Badge variant="status" tone={TONE[status] ?? "plain"}>
                  {LABEL[status] ?? status}
                </Badge>
                {can && status === "pending" ? (
                  <View className="flex-row gap-[6px]">
                    <Button size="sm" variant="ghost" icon="check" onClick={() => decide(a, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" icon="close" onClick={() => decide(a, "rejected")}>
                      Reject
                    </Button>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <FormModal
        open={requesting}
        onClose={() => setRequesting(false)}
        title="Request approval"
        description="Choose who must approve this issue."
        submitLabel="Request"
        initialValues={{ approverIds: [] }}
        onSubmit={async (values) => {
          await requestApproval(projectId, issueId, { approverIds: values.approverIds });
          toast.success("Approval requested");
          approvals.reload();
        }}
        fields={({ values, set }) => (
          <Select
            multiple
            searchable
            label="Approvers"
            hint="Each approver is asked to approve or reject this issue."
            value={values.approverIds}
            onChange={(next) => set("approverIds", next)}
            options={[]}
            loadOptions={(q) => searchUsers(q).then((res) => (res.data ?? []).map(personOption))}
            placeholder="Search people"
          />
        )}
      />
    </View>
  );
}
