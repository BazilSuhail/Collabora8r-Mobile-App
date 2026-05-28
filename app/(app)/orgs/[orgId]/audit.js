// feat(app/(app)/orgs/[orgId]/audit): let org admins review and filter the organization audit log.
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import AuditTable from "@/components/audit/AuditTable";
import AuditDetailDrawer from "@/components/audit/AuditDetailDrawer";
import PeoplePicker from "@/components/members/PeoplePicker";
import EmptyState from "@/components/ui/EmptyState";
import Illustration from "@/components/ui/Illustration";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { useOrg } from "@/context/OrgContext";
import { listOrgAudit } from "@/libs/api/orgs";
import { paths } from "@/routes/paths";
import { emptyCopy } from "@/metadata/empty";
import { can } from "@/utils/permissions";
import { usePaged } from "@/utils/usePaged";

const CARD = "rounded-2xl bg-surface border border-border";

// Action names the org services write to the audit log.
const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "org.updated", label: "Organization updated" },
  { value: "org.deleted", label: "Organization archived" },
  { value: "member.added", label: "Member added" },
  { value: "member.removed", label: "Member removed" },
  { value: "role.changed", label: "Role changed" },
];

export default function OrgAuditPage() {
  const { orgId } = useLocalSearchParams();
  const { orgs, status: orgStatus } = useOrg();
  const [action, setAction] = useState("");
  const [actorId, setActorId] = useState(null);
  const [selected, setSelected] = useState(null);

  const role = (orgs ?? []).find((o) => o.id === orgId)?.role ?? null;
  const isAdmin = can(role, "org.admin", "org");
  const ready = orgStatus === "success";

  const entries = usePaged((p) => listOrgAudit(orgId, p), {
    orgId,
    action: action || undefined,
    actorId: actorId || undefined,
  });

  const forbidden = entries.status === "error" && entries.error?.status === 403;

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-8 gap-4" keyboardShouldPersistTaps="handled">
        <PageHead
          title="Audit log"
          sub="Changes to this organization, newest first."
          back={{ to: paths.orgs(), label: "Organizations" }}
        />

        {!ready ? (
          <View className={`${CARD} p-5`}>
            <Skeleton variant="feed" count={6} />
          </View>
        ) : null}

        {ready && !isAdmin ? (
          <View className={`${CARD} p-5 gap-4 items-center`}>
            <Illustration name="security" alt="" className="w-44" />
            <EmptyState
              icon="lock"
              title="Only admins can review the audit log"
              text="Ask an organization admin for a copy of an entry."
            />
          </View>
        ) : null}

        {ready && isAdmin ? (
          <View className="gap-4">
            <View className="gap-2.5">
              <Select label="Action" hideLabel value={action} onChange={setAction} options={ACTION_OPTIONS} />
              <PeoplePicker label="Actor" hideLabel placeholder="Any actor" value={actorId} onChange={setActorId} />
            </View>

            {forbidden ? (
              <View className={`${CARD} p-6`}>
                <EmptyState icon="lock" title="Only admins can review the audit log" />
              </View>
            ) : (
              <View className={`${CARD} overflow-hidden`}>
                <AuditTable
                  entries={entries.items}
                  status={entries.status}
                  error={entries.error}
                  onRetry={entries.reload}
                  hasMore={entries.hasMore}
                  onLoadMore={entries.loadMore}
                  loadingMore={entries.loadingMore}
                  onRowClick={setSelected}
                  empty={emptyCopy("org-audit")}
                />
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      <AuditDetailDrawer open={Boolean(selected)} onClose={() => setSelected(null)} entry={selected} />
    </View>
  );
}
