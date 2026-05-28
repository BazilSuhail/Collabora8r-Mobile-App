// feat(app/(app)/orgs/[orgId]/settings): let org admins rename the organization, manage groups and archive it.
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import GroupFormModal from "@/components/orgs/GroupFormModal";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { archiveOrg, createGroup, deleteGroup, getOrg, listGroups, updateGroup, updateOrg } from "@/libs/api/orgs";
import { paths } from "@/routes/paths";
import { can } from "@/utils/permissions";
import { useMutation } from "@/utils/useMutation";
import { usePaged } from "@/utils/usePaged";
import { useResource } from "@/utils/useResource";

const CARD = "rounded-2xl bg-surface border border-border";

const TABS = [
  { value: "general", label: "General" },
  { value: "groups", label: "Groups" },
];

export default function OrgSettingsPage() {
  const { orgId } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { reload: reloadOrgs } = useOrg();

  const detail = useResource(() => getOrg(orgId), [orgId]);
  const org = detail.data;
  const isAdmin = can(org?.role ?? null, "org.admin", "org");
  const isOwner = can(org?.role ?? null, "org.delete", "org");
  const ready = detail.status === "success" && isAdmin;

  const [tab, setTab] = useState("general");
  const [form, setForm] = useState({ name: "", description: "" });
  const [groupModal, setGroupModal] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (org) setForm({ name: org.name ?? "", description: org.description ?? "" });
  }, [org]);

  const groups = usePaged((p) => listGroups(orgId, p), { orgId });

  const save = useMutation((body) => updateOrg(orgId, body), { success: "Saved", error: (e) => e.message });
  const removeGroup = useMutation((id) => deleteGroup(orgId, id), { success: "Group deleted", error: (e) => e.message });
  const archive = useMutation(() => archiveOrg(orgId), { success: "Organization archived", error: (e) => e.message });

  const dirty = Boolean(org) && (form.name !== (org.name ?? "") || form.description !== (org.description ?? ""));
  const fieldErrors = save.fieldErrors ?? {};

  const onSave = async () => {
    const res = await save.run({ name: form.name.trim(), description: form.description.trim() });
    if (res) {
      detail.reload();
      reloadOrgs();
    }
  };

  const saveGroup = async (values) => {
    const body = { name: values.name.trim(), description: values.description?.trim() ?? "" };
    if (groupModal?.group) await updateGroup(orgId, groupModal.group.id, body);
    else await createGroup(orgId, body);
    toast.success("Group saved");
    groups.reload();
  };

  const confirmRemoveGroup = async () => {
    const ok = await removeGroup.run(removing.id);
    if (ok) groups.reload();
  };

  const confirmArchive = async () => {
    const ok = await archive.run();
    if (ok) {
      reloadOrgs();
      router.replace(paths.orgs());
    }
  };

  // On phone the table renders as a card list: name and description, member count as a sub-line.
  const groupColumns = [
    {
      key: "name",
      label: "Group",
      render: (g) => (
        <View className="min-w-0">
          <Text numberOfLines={1} className="font-semibold text-foreground">
            {g.name}
          </Text>
          {g.description ? (
            <Text numberOfLines={1} className="text-xs text-muted">
              {g.description}
            </Text>
          ) : null}
        </View>
      ),
    },
    {
      key: "members",
      label: "Members",
      render: (g) => <Text className="text-muted">{g.memberCount ?? g.memberIds?.length ?? 0}</Text>,
    },
  ];

  const groupMenu = (g) => [
    { id: "edit", label: "Edit", icon: "edit", onSelect: () => setGroupModal({ group: g }) },
    { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setRemoving(g) },
  ];

  const forbidden = detail.status === "error" && detail.error?.status === 403;
  const notAdmin = detail.status === "success" && !isAdmin;

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-8 gap-4" keyboardShouldPersistTaps="handled">
        <PageHead
          title="Organization settings"
          sub={org?.name ?? "Loading organization"}
          back={{ to: paths.orgs(), label: "Organizations" }}
        />

        {detail.status === "loading" ? (
          <View className={`${CARD} p-6`}>
            <Skeleton variant="feed" count={3} />
          </View>
        ) : null}

        {detail.status === "error" && !forbidden ? (
          <View className={`${CARD} p-6`}>
            <EmptyState
              tone="error"
              icon="alert"
              title="Could not load the organization"
              text={detail.error?.message}
              onRetry={detail.reload}
            />
          </View>
        ) : null}

        {forbidden || notAdmin ? (
          <View className={`${CARD} p-6`}>
            <EmptyState
              icon="lock"
              title="Only admins can change organization settings"
              text="Ask an organization admin if you need a change."
            />
          </View>
        ) : null}

        {ready ? (
          <View className="gap-4">
            <SegmentedControl
              as="tabs"
              label="Organization settings sections"
              value={tab}
              onChange={setTab}
              options={TABS}
            />

            {tab === "general" ? (
              <View className={`${CARD} p-5`}>
                <View className="mb-3.5 flex-row flex-wrap items-center gap-2">
                  <Icon name="edit" />
                  <Text className="text-lg font-semibold text-foreground" accessibilityRole="header">
                    Details
                  </Text>
                  {dirty ? <Badge tone="saffron">Unsaved changes</Badge> : null}
                </View>
                <View className="gap-4">
                  <Input
                    label="Name"
                    value={form.name}
                    onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                    error={fieldErrors.name}
                    hint="Shown to every member."
                  />
                  <Input
                    as="textarea"
                    multiline
                    label="Description"
                    value={form.description}
                    onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                    error={fieldErrors.description}
                    hint="Optional. A short summary of what the organization does."
                  />
                  <View className="flex-row flex-wrap items-center justify-end gap-2.5">
                    <Button
                      variant="ghost"
                      disabled={!dirty || save.pending}
                      onPress={() => setForm({ name: org.name ?? "", description: org.description ?? "" })}
                    >
                      Reset
                    </Button>
                    <Button variant="ember" loading={save.pending} disabled={!dirty || save.pending} onPress={onSave}>
                      Save
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <View className={`${CARD} overflow-hidden`}>
                <View className="flex-row flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-3">
                  <View className="flex-row items-center gap-2">
                    <Icon name="users" />
                    <Text className="text-lg font-semibold text-foreground" accessibilityRole="header">
                      Groups
                    </Text>
                  </View>
                  <Button variant="ember" icon="plus" onPress={() => setGroupModal({ group: null })}>
                    New group
                  </Button>
                </View>
                <DataTable
                  label="Groups"
                  columns={groupColumns}
                  rows={(groups.items ?? []).map((g) => ({ ...g, id: String(g.id ?? g._id) }))}
                  rowKey="id"
                  status={groups.status}
                  error={groups.error}
                  onRetry={groups.reload}
                  empty={{ icon: "users", title: "No groups yet", text: "Groups collect members so you can manage them together." }}
                  rowMenu={groupMenu}
                  hasMore={groups.hasMore}
                  onLoadMore={groups.loadMore}
                  loadingMore={groups.loadingMore}
                />
              </View>
            )}

            {isOwner ? (
              <View className={`${CARD} border-danger p-5`}>
                <View className="flex-row items-center gap-2">
                  <Icon name="archive" />
                  <Text className="text-lg font-semibold text-foreground" accessibilityRole="header">
                    Archive organization
                  </Text>
                </View>
                <Text className="mt-1.5 text-sm text-muted">Archiving removes this organization from everyone's list.</Text>
                <View className="mt-4 flex-row justify-end">
                  <Button variant="danger" onPress={() => setArchiving(true)}>
                    Archive organization
                  </Button>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <GroupFormModal
        open={Boolean(groupModal)}
        onClose={() => setGroupModal(null)}
        group={groupModal?.group ?? null}
        onSubmit={saveGroup}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Delete group?"
        text={removing ? `${removing.name} is removed. Its members stay in the organization.` : ""}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmRemoveGroup}
      />

      <ConfirmDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        title="Archive organization?"
        text="This removes the organization from every member's list."
        confirmLabel="Archive"
        tone="danger"
        onConfirm={confirmArchive}
      />
    </KeyboardAvoidingView>
  );
}
