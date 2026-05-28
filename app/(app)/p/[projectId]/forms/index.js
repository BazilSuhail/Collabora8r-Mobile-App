// feat(screens/forms/FormsPage): list a project's intake forms, share their public links and review submissions.
// The web DataTable becomes a card list; each card's row menu is a Dropdown action sheet.
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import PageHead from "@/components/layout/PageHead";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useProject } from "@/context/ProjectContext";
import { useToast } from "@/context/ToastContext";
import { deleteForm, listForms } from "@/libs/api/forms";
import { EMPTY } from "@/metadata/empty";
import { paths } from "@/routes/paths";
import { usePaged } from "@/utils/usePaged";
import SubmissionsDrawer from "@/components/forms/SubmissionsDrawer";

// The public form lives on the web app; its origin comes from config instead of window.location.
const WEB_ORIGIN = (process.env.EXPO_PUBLIC_WEB_URL ?? "").replace(/\/$/, "");

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchForms = ({ pid, ...p }) => listForms(pid, p).then(withIds);
const publicUrl = (token) => `${WEB_ORIGIN}/f/${token}`;

export default function FormsPage() {
  const router = useRouter();
  const { projectId, can } = useProject();
  const toast = useToast();
  const forms = usePaged(fetchForms, { pid: projectId });
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsFor, setSubsFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const canManage = can("form.manage");
  const canReview = can("issue.edit");
  const ready = forms.status === "success";

  const copyLink = async (form) => {
    if (!form.publicToken) return;
    try {
      await Clipboard.setStringAsync(publicUrl(form.publicToken));
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteForm(projectId, deleting.id);
      toast.success("Form deleted");
      setDeleting(null);
      forms.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const openSubmissions = (form) => {
    setSubsFor(form);
    setSubsOpen(true);
  };

  const rowMenu = (row) => [
    ...(canManage ? [{ id: "edit", label: "Edit", icon: "edit", onSelect: () => router.push(paths.form(projectId, row.id)) }] : []),
    ...(canReview ? [{ id: "subs", label: "Submissions", icon: "documents", onSelect: () => openSubmissions(row) }] : []),
    ...(row.publicToken ? [{ id: "copy", label: "Copy link", icon: "link", onSelect: () => copyLink(row) }] : []),
    ...(canManage ? ["separator", { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleting(row) }] : []),
  ];

  const newFormButton = (size) =>
    canManage ? (
      <Button variant="ember" size={size} icon="plus" onPress={() => router.push(paths.formNew(projectId))}>
        New form
      </Button>
    ) : null;

  const renderRow = ({ item: row }) => {
    const menu = rowMenu(row);
    return (
      <View className="bg-surface border border-border rounded-card p-[16px] gap-[10px]">
        <View className="flex-row items-center gap-[10px]">
          <Pressable
            className="flex-1 min-w-0"
            disabled={!canManage}
            onPress={() => router.push(paths.form(projectId, row.id))}
            accessibilityRole={canManage ? "link" : undefined}
          >
            <Text className="font-semibold text-foreground text-[14px]" numberOfLines={1}>
              {row.name}
            </Text>
          </Pressable>
          <Badge variant="status" tone={row.isPublic ? "spruce" : "plain"}>
            {row.isPublic ? "Active" : "Paused"}
          </Badge>
          {menu.length ? (
            <Dropdown
              label={`${row.name} actions`}
              items={menu}
              trigger={(t) => (
                <Button iconOnly variant="ghost" size="sm" icon="more" accessibilityLabel={`${row.name} actions`} {...t} />
              )}
            />
          ) : null}
        </View>
        <View className="flex-row items-center gap-[8px]">
          {row.publicToken ? (
            <>
              <Text className="flex-1 text-muted text-[14px]" numberOfLines={1}>
                /f/{row.publicToken}
              </Text>
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                icon="share"
                accessibilityLabel={`Copy public link for ${row.name}`}
                onPress={() => copyLink(row)}
              />
            </>
          ) : (
            <Text className="flex-1 text-faint text-[14px]">No link</Text>
          )}
          <Text className="text-muted text-[12.5px] font-semibold">
            {row.submissionCount ?? 0} {(row.submissionCount ?? 0) === 1 ? "submission" : "submissions"}
          </Text>
        </View>
      </View>
    );
  };

  const header = (
    <View className="gap-[12px] mb-[4px]">
      <PageHead title="Forms" sub="Intake forms turn outside requests into project issues." actions={newFormButton()} />
      {forms.status === "loading" ? <Skeleton variant="cards" count={3} /> : null}
      {forms.status === "error" ? (
        <View className="bg-surface border border-border rounded-card p-[16px]">
          <EmptyState tone="error" title="Could not load forms" onRetry={forms.reload} />
        </View>
      ) : null}
      {ready && forms.items.length === 0 ? (
        <View className="bg-surface border border-border rounded-card p-[16px]">
          <EmptyState {...(EMPTY?.forms ?? { icon: "form", title: "No forms yet" })} action={newFormButton("sm")} />
        </View>
      ) : null}
    </View>
  );

  const footer =
    ready && forms.hasMore ? (
      <View className="items-center mt-[16px]">
        <Button variant="soft" size="sm" onPress={forms.loadMore} loading={forms.loadingMore} disabled={forms.loadingMore}>
          Show more
        </Button>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={ready ? forms.items : []}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerClassName="p-[16px] gap-[12px] pb-[32px]"
        refreshing={false}
        onRefresh={forms.reload}
      />
      <SubmissionsDrawer open={subsOpen} onClose={() => setSubsOpen(false)} projectId={projectId} form={subsFor} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete form?"
        text={`"${deleting?.name ?? ""}" and its public link stop working.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}
