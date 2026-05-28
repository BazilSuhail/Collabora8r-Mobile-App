// feat(app/(app)/orgs/index): list the user's organizations, create a new one, or ask to join an existing one.
import { useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import EmptyState from "@/components/ui/EmptyState";
import Illustration from "@/components/ui/Illustration";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import OrgFormModal from "@/components/orgs/OrgFormModal";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { createOrg, requestOrgJoin } from "@/libs/api/orgs";
import { paths } from "@/routes/paths";
import { emptyCopy } from "@/metadata/empty";
import { can } from "@/utils/permissions";
import { useMutation } from "@/utils/useMutation";

const CARD = "rounded-2xl bg-surface border border-border p-5";

export default function OrgsPage() {
  const { orgs, orgId, status, error, reload, setOrgId } = useOrg();
  const toast = useToast();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joinTarget, setJoinTarget] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const ready = status === "success";
  const list = orgs ?? [];

  const join = useMutation((target) => requestOrgJoin(target, {}), {
    success: "Request sent",
    error: (err) => err.message,
  });

  const createSubmit = async (values) => {
    const { data: org } = await createOrg({
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
    });
    toast.success("Organization created");
    setOrgId(org.id);
    reload();
  };

  const submitJoin = async () => {
    const target = joinTarget.trim();
    if (!target) return;
    const sent = await join.run(target);
    if (sent) setJoinTarget("");
  };

  const openOrg = (id) => {
    setOrgId(id);
    router.push(paths.projects());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const renderOrg = ({ item: org }) => {
    const current = org.id === orgId;
    const isAdmin = can(org.role, "org.admin", "org");
    const canSeeMembers = can(org.role, "org.members.view", "org");
    const items = [
      {
        id: "open",
        label: current ? "Current organization" : "Make current",
        icon: "check",
        onSelect: () => setOrgId(org.id),
        disabled: current,
      },
      { id: "projects", label: "Projects", icon: "project", onSelect: () => router.push(paths.projects()) },
      ...(canSeeMembers
        ? [{ id: "members", label: "Members", icon: "users", onSelect: () => router.push(paths.orgMembers(org.id)) }]
        : []),
      ...(isAdmin
        ? [{ id: "settings", label: "Settings", icon: "settings", onSelect: () => router.push(paths.orgSettings(org.id)) }]
        : []),
      ...(isAdmin
        ? [{ id: "audit", label: "Audit log", icon: "audit", onSelect: () => router.push(paths.orgAudit(org.id)) }]
        : []),
    ];
    return (
      <View className={`${CARD} gap-3.5`}>
        <View className="flex-row items-start gap-3">
          <Avatar name={org.name} src={org.logoUrl} size="md" />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-[17px] font-bold tracking-tight text-foreground">
              {org.name}
            </Text>
            <Text numberOfLines={1} className="text-[12.5px] text-muted">
              {org.slug}
            </Text>
          </View>
          <Dropdown
            label={`Actions for ${org.name}`}
            items={items}
            trigger={(p) => (
              <Button iconOnly variant="ghost" size="sm" icon="more" accessibilityLabel={`Actions for ${org.name}`} {...p} />
            )}
          />
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {current ? <Badge tone="spruce">Current</Badge> : null}
          <Badge tone="plain">{org.role}</Badge>
        </View>
        <View className="flex-row justify-end">
          <Button variant="soft" size="sm" onPress={() => openOrg(org.id)}>
            Open
          </Button>
        </View>
      </View>
    );
  };

  const header = (
    <View className="pt-4 pb-1">
      <PageHead
        title="Organizations"
        sub="Switch between organizations, create one, or ask to join an existing one."
        actions={
          <Button variant="ember" icon="plus" onPress={() => setCreating(true)}>
            New organization
          </Button>
        }
      />
    </View>
  );

  let emptyBody = null;
  if (status === "loading") emptyBody = <Skeleton variant="cards" count={3} cols={1} />;
  else if (status === "error") {
    emptyBody = (
      <View className={CARD}>
        <EmptyState tone="error" icon="alert" title="Could not load organizations" text={error?.message} onRetry={reload} />
      </View>
    );
  } else if (ready) {
    const copy = emptyCopy("orgs");
    emptyBody = (
      <View className={CARD}>
        <View className="items-center gap-3">
          <Illustration name="team" alt="" className="w-44" />
        </View>
        <EmptyState
          icon={copy.icon}
          title={copy.title}
          text={copy.text}
          action={
            <Button variant="ember" icon="plus" onPress={() => setCreating(true)}>
              New organization
            </Button>
          }
        />
      </View>
    );
  }

  const footer = (
    <View className={`${CARD} mt-4 gap-3`}>
      <Input
        label="Request to join an organization"
        hint="Enter the organization's id or slug."
        value={joinTarget}
        onChangeText={setJoinTarget}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={submitJoin}
      />
      <Button variant="soft" loading={join.pending} disabled={!joinTarget.trim() || join.pending} onPress={submitJoin}>
        Request to join
      </Button>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <FlatList
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        data={ready ? list : []}
        keyExtractor={(o) => String(o.id)}
        renderItem={renderOrg}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyBody}
        ListFooterComponent={footer}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <OrgFormModal open={creating} onClose={() => setCreating(false)} onSubmit={createSubmit} />
    </View>
  );
}
