// feat(screens/dashboards/DashboardsPage): list a project's dashboards, create one and choose the default.
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import FormModal from "@/components/ui/FormModal";
import Illustration from "@/components/ui/Illustration";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useProject } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { usePaged } from "@/utils/usePaged";
import { listDashboards, createDashboard, updateDashboard, deleteDashboard } from "@/libs/api/reports";

const keyOf = (row) => row.id ?? row._id;

export default function DashboardsPage() {
  const router = useRouter();
  const { projectId, can } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const list = usePaged((p) => listDashboards(projectId, p), {});
  const [creating, setCreating] = useState(false);
  const canCreate = can("dashboard.create");
  const ready = list.status === "success";

  const openDashboard = (id) => router.push(`/p/${projectId}/dashboards/${id}`);

  const create = async (v) => {
    await createDashboard(projectId, { name: v.name.trim(), description: v.description.trim() });
    toast.success("Dashboard saved");
    list.reload();
  };

  const makeDefault = async (d) => {
    try {
      await updateDashboard(projectId, keyOf(d), { isDefault: true });
      toast.success("Dashboard saved");
      list.setItems((prev) => prev.map((x) => ({ ...x, isDefault: keyOf(x) === keyOf(d) })));
    } catch (err) {
      if (err?.status !== 422) toast.error("Could not update the dashboard");
    }
  };

  const remove = async (d) => {
    const ok = await confirm({
      title: "Delete this dashboard?",
      text: `${d.name} and its widgets are removed for everyone in the project.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteDashboard(projectId, keyOf(d));
      toast.success("Dashboard deleted");
      list.setItems((prev) => prev.filter((x) => keyOf(x) !== keyOf(d)));
    } catch (err) {
      if (err?.status !== 422) toast.error("Could not delete the dashboard");
    }
  };

  const newButton = canCreate ? (
    <Button variant="ember" icon="plus" onPress={() => setCreating(true)}>
      New dashboard
    </Button>
  ) : null;

  const renderCard = ({ item: d }) => {
    const id = keyOf(d);
    const isOwner = String(d.ownerId) === String(user?.id);
    const canManage = isOwner || can("issue.delete");
    const widgetCount = (d.widgets ?? []).length;
    const items = [
      { id: "open", label: "Open", icon: "arrow", onSelect: () => openDashboard(id) },
      canManage && !d.isDefault && { id: "default", label: "Make default", icon: "pin", onSelect: () => makeDefault(d) },
      canManage && "separator",
      canManage && { id: "delete", label: "Delete", icon: "trash", danger: true, onSelect: () => remove(d) },
    ].filter(Boolean);
    return (
      <View className="bg-surface border border-border rounded-card p-[18px] gap-[12px]">
        <Pressable
          className="flex-row items-start gap-[12px]"
          onPress={() => openDashboard(id)}
          accessibilityRole="link"
          accessibilityLabel={d.name}
        >
          <View className="size-[38px] rounded-[12px] border border-border bg-surface-2 items-center justify-center">
            <Icon name="dashboard" size={18} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-foreground text-[16px] leading-[20px] font-display" numberOfLines={1}>
              {d.name}
            </Text>
            {d.description ? (
              <Text className="text-muted text-[12.5px]" numberOfLines={2}>
                {d.description}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <View className="flex-row flex-wrap items-center justify-between gap-[10px] pt-[12px] border-t border-border">
          <View className="flex-row items-center gap-[10px]">
            <Text className="text-muted text-[12.5px] font-semibold">
              {widgetCount === 1 ? "1 widget" : `${widgetCount} widgets`}
            </Text>
            {d.isDefault ? (
              <Badge tone="iris" icon="pin">
                Default
              </Badge>
            ) : null}
          </View>
          {items.length > 0 ? (
            <Dropdown
              label={`${d.name} actions`}
              items={items}
              trigger={(t) => (
                <Button iconOnly variant="ghost" size="sm" icon="more" accessibilityLabel={`${d.name} actions`} {...t} />
              )}
            />
          ) : null}
        </View>
      </View>
    );
  };

  const header = (
    <View className="gap-[12px] mb-[4px]">
      <PageHead
        title="Dashboards"
        sub="Arrange report widgets into boards for this project."
        actions={
          <Button variant="soft" icon="analytics" onPress={() => router.push(`/p/${projectId}/reports`)}>
            Reports
          </Button>
        }
      />
      {newButton ? <View className="flex-row justify-end">{newButton}</View> : null}
      {list.status === "loading" ? <Skeleton variant="cards" count={3} /> : null}
      {list.status === "error" ? (
        <View className="bg-surface border border-border rounded-card p-[16px]">
          <EmptyState tone="error" title="Could not load dashboards" onRetry={list.reload} />
        </View>
      ) : null}
      {ready && list.items.length === 0 ? (
        <View className="bg-surface border border-border rounded-card p-[16px] items-center">
          <Illustration name="team" alt="" className="w-[180px]" />
          <EmptyState
            icon="dashboard"
            title="No dashboards yet"
            text="Dashboards collect report widgets for the whole team."
            action={newButton}
          />
        </View>
      ) : null}
    </View>
  );

  const footer =
    ready && list.hasMore ? (
      <View className="items-center mt-[16px]">
        <Button variant="soft" size="sm" onPress={list.loadMore} disabled={list.loadingMore}>
          Show more
        </Button>
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={ready ? list.items : []}
        keyExtractor={(d) => String(keyOf(d))}
        renderItem={renderCard}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        contentContainerClassName="p-[16px] gap-[12px] pb-[32px]"
        refreshing={false}
        onRefresh={list.reload}
      />

      <FormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New dashboard"
        description="Name the board. You add widgets on the next screen."
        submitLabel="Create dashboard"
        initialValues={{ name: "", description: "" }}
        onSubmit={create}
        fields={({ values, set, errors }) => (
          <>
            <Input
              label="Name"
              value={values.name}
              onChangeText={(t) => set("name", t)}
              error={errors.name}
              hint="Shown in the dashboard list. Up to 120 characters."
              required
              maxLength={120}
            />
            <Input
              as="textarea"
              label="Description"
              value={values.description}
              onChangeText={(t) => set("description", t)}
              error={errors.description}
              hint="Optional. Tell the team what this board tracks."
              maxLength={1000}
            />
          </>
        )}
      />
    </View>
  );
}
