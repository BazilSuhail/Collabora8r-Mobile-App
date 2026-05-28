// feat(app/(app)/orgs/[orgId]/members): manage organization members, roles, pending invites and join requests.
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import PageHead from "@/components/layout/PageHead";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Illustration from "@/components/ui/Illustration";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import MemberList from "@/components/members/MemberList";
import MemberFormModal from "@/components/members/MemberFormModal";
import InviteList from "@/components/members/InviteList";
import JoinRequestList from "@/components/members/JoinRequestList";
import SecretRevealModal from "@/components/shared/SecretRevealModal";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import {
  createOrgInvite,
  decideOrgJoin,
  listOrgInvites,
  listOrgJoinRequests,
  listOrgMembers,
  removeOrgMember,
  revokeOrgInvite,
  updateOrgMember,
} from "@/libs/api/orgs";
import { listOrgProjects } from "@/libs/api/projects";
import { paths } from "@/routes/paths";
import { emptyCopy } from "@/metadata/empty";
import { can } from "@/utils/permissions";
import { useMutation } from "@/utils/useMutation";
import { usePaged } from "@/utils/usePaged";
import { useResource } from "@/utils/useResource";

const CARD = "rounded-2xl bg-surface border border-border";

// The server answers 409 when the last owner would be demoted or removed.
const lastOwnerError = (err) => (err.status === 409 ? "An org needs at least one owner" : err.message);

const adminTabs = [
  { value: "members", label: "Members" },
  { value: "invites", label: "Invites" },
  { value: "requests", label: "Requests" },
];

function MembersTab({ orgId, role, isAdmin, selfId }) {
  const router = useRouter();
  const { reload: reloadOrgs } = useOrg();
  const members = usePaged((p) => listOrgMembers(orgId, p), { orgId });
  const [removing, setRemoving] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const changeRole = useMutation((userId, next) => updateOrgMember(orgId, userId, { role: next }), {
    success: "Role updated",
    error: lastOwnerError,
  });
  const removeMember = useMutation((userId) => removeOrgMember(orgId, userId), {
    success: "Member removed",
    error: lastOwnerError,
  });
  const leaveOrg = useMutation((userId) => removeOrgMember(orgId, userId), {
    success: "You left the organization",
    error: lastOwnerError,
  });

  const onRoleChange = async (member, next) => {
    const ok = await changeRole.run(member.userId, next);
    if (ok) members.setItems((prev) => prev.map((m) => (m.userId === member.userId ? { ...m, role: next } : m)));
  };

  const confirmRemove = async () => {
    const ok = await removeMember.run(removing.userId);
    if (ok) members.setItems((prev) => prev.filter((m) => m.userId !== removing.userId));
  };

  const confirmLeave = async () => {
    const ok = await leaveOrg.run(selfId);
    if (ok) {
      reloadOrgs();
      router.replace(paths.orgs());
    }
  };

  return (
    <>
      <View className={`${CARD} overflow-hidden`}>
        <MemberList
          scope="org"
          members={members.items}
          status={members.status}
          error={members.error}
          onRetry={members.reload}
          roles={role === "owner" ? undefined : ["admin", "member", "guest", "viewer"]}
          canManage={isAdmin}
          selfId={selfId}
          onRoleChange={onRoleChange}
          onRemove={setRemoving}
          onLeave={() => setLeaving(true)}
          empty={emptyCopy("org-members")}
          hasMore={members.hasMore}
          onLoadMore={members.loadMore}
          loadingMore={members.loadingMore}
        />
      </View>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Remove member?"
        text={removing ? `${removing.userName || "This person"} loses access to this organization.` : ""}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={leaving}
        onClose={() => setLeaving(false)}
        title="Leave organization?"
        text="You lose access to this organization until an admin invites you again."
        confirmLabel="Leave"
        tone="danger"
        onConfirm={confirmLeave}
      />
    </>
  );
}

function InvitesTab({ orgId }) {
  const toast = useToast();
  const invites = useResource(() => listOrgInvites(orgId), [orgId]);
  const orgProjects = useResource(() => listOrgProjects(orgId, { limit: 100 }), [orgId]);
  const [inviting, setInviting] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [revoking, setRevoking] = useState(null);

  const revoke = useMutation((inviteId) => revokeOrgInvite(orgId, inviteId), {
    success: "Invite revoked",
    error: (err) => err.message,
  });

  const sendInvite = async (values) => {
    const { data } = await createOrgInvite(orgId, {
      email: values.email.trim(),
      role: values.role,
      projectIds: values.projectIds?.length ? values.projectIds : undefined,
    });
    toast.success("Invite sent");
    invites.setData((prev) => [data.invite, ...(prev ?? [])]);
    // No web origin on mobile: build an app deep link to the invite route.
    setReveal(Linking.createURL(paths.invite(data.token)));
  };

  const confirmRevoke = async () => {
    const ok = await revoke.run(revoking.id);
    if (ok) {
      invites.setData((prev) => (prev ?? []).map((i) => (i.id === revoking.id ? { ...i, status: "revoked" } : i)));
    }
  };

  return (
    <>
      <View className={`${CARD} overflow-hidden`}>
        <View className="flex-row flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-3">
          <View className="flex-row items-center gap-2">
            <Icon name="mail" />
            <Text className="text-lg font-semibold text-foreground" accessibilityRole="header">
              Invites
            </Text>
          </View>
          <Button variant="ember" icon="mail" disabled={invites.status !== "success"} onPress={() => setInviting(true)}>
            Invite people
          </Button>
        </View>
        <InviteList
          invites={invites.data ?? []}
          status={invites.status}
          error={invites.error}
          onRetry={invites.reload}
          canManage
          onRevoke={setRevoking}
          empty={{ icon: "mail", title: "No pending invites", text: "Invites appear here until they are accepted or revoked." }}
        />
      </View>

      <MemberFormModal
        open={inviting}
        onClose={() => setInviting(false)}
        mode="invite"
        scope="org"
        projects={orgProjects.data ?? []}
        onSubmit={sendInvite}
      />

      <SecretRevealModal
        open={Boolean(reveal)}
        onClose={() => setReveal(null)}
        title="Invite link"
        description="Copy this link now. It is shown once and cannot be opened from here again."
        value={reveal ?? ""}
        label="Invite link"
      />

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        title="Revoke invite?"
        text={revoking ? `The invite to ${revoking.email} stops working.` : ""}
        confirmLabel="Revoke"
        tone="danger"
        onConfirm={confirmRevoke}
      />
    </>
  );
}

function RequestsTab({ orgId }) {
  const toast = useToast();
  const requests = usePaged((p) => listOrgJoinRequests(orgId, p), { orgId, status: "pending" });
  const [deciding, setDeciding] = useState(null);

  const decide = async (values) => {
    const target = deciding.request;
    const body =
      values.decision === "approve"
        ? { decision: "approve", role: values.role }
        : { decision: "decline", declineReason: values.declineReason?.trim() || undefined };
    await decideOrgJoin(orgId, target.id, body);
    toast.success(values.decision === "approve" ? "Approved" : "Declined");
    requests.setItems((prev) => prev.filter((r) => r.id !== target.id));
  };

  return (
    <>
      <View className={`${CARD} overflow-hidden`}>
        <JoinRequestList
          requests={requests.items}
          status={requests.status}
          error={requests.error}
          onRetry={requests.reload}
          canDecide
          onDecide={(request, decision) => setDeciding({ request, decision })}
          empty={{ icon: "userCheck", title: "No pending requests", text: "People who ask to join appear here." }}
        />
      </View>

      <MemberFormModal
        open={Boolean(deciding)}
        onClose={() => setDeciding(null)}
        mode="decide"
        scope="org"
        decision={deciding?.decision}
        onSubmit={decide}
      />
    </>
  );
}

export default function OrgMembersPage() {
  const { orgId } = useLocalSearchParams();
  const { orgs, status: orgStatus } = useOrg();
  const { user } = useAuth();
  const [tab, setTab] = useState("members");

  const org = (orgs ?? []).find((o) => o.id === orgId) ?? null;
  const role = org?.role ?? null;
  const isAdmin = can(role, "org.admin", "org");
  const canList = can(role, "org.members.view", "org");
  const ready = orgStatus === "success";
  const current = isAdmin ? tab : "members";

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-4 pb-8 gap-4">
      <PageHead
        title="Members"
        sub={org ? `People and access in ${org.name}.` : "People and access in this organization."}
        back={{ to: paths.orgs(), label: "Organizations" }}
      />

      {!ready ? (
        <View className={`${CARD} p-6`}>
          <Skeleton variant="feed" count={6} />
        </View>
      ) : null}

      {ready && !canList ? (
        <View className={`${CARD} p-5 gap-4 items-center`}>
          <Illustration name="team" alt="" className="w-44" />
          <EmptyState
            icon="lock"
            title="Only organization members can see the member list"
            text="Ask an organization admin to add you."
          />
        </View>
      ) : null}

      {ready && canList ? (
        <View className="gap-4">
          {isAdmin ? (
            <SegmentedControl as="tabs" label="Member sections" value={current} onChange={setTab} options={adminTabs} />
          ) : null}
          {current === "members" ? (
            <MembersTab orgId={orgId} role={role} isAdmin={isAdmin} selfId={user?.id ?? null} />
          ) : null}
          {current === "invites" ? <InvitesTab orgId={orgId} /> : null}
          {current === "requests" ? <RequestsTab orgId={orgId} /> : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
