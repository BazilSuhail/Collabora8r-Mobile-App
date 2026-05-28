// feat(app/(app)/projects/index): list organization and personal projects and create new ones.
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Illustration from "@/components/ui/Illustration";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import ProjectFormModal from "@/components/projects/ProjectFormModal";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { createOrgProject, createPersonalProject, listOrgProjects, listPersonalProjects } from "@/libs/api/projects";
import { paths } from "@/routes/paths";
import { emptyCopy } from "@/metadata/empty";
import { can } from "@/utils/permissions";
import { usePaged } from "@/utils/usePaged";
import { useResource } from "@/utils/useResource";

const CARD = "rounded-2xl bg-surface border border-border p-5";

const SCOPES = [
  { value: "org", label: "Organization" },
  { value: "personal", label: "Personal" },
];

const VISIBILITY_LABEL = { private: "Private", request: "Request to join", open: "Open" };
const noRows = () => Promise.resolve({ data: [], meta: null });
const pid = (p) => String(p.id ?? p._id);

function ProjectCard({ project }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(paths.project(pid(project)))}
      className={`${CARD} gap-3 active:opacity-80`}
    >
      <View className="flex-row items-start justify-between gap-2.5">
        <Badge tone="plain">{project.key}</Badge>
        <Badge tone="plain">{VISIBILITY_LABEL[project.visibility] ?? project.visibility}</Badge>
      </View>
      <Text numberOfLines={1} className="text-[17px] font-bold tracking-tight text-foreground">
        {project.name}
      </Text>
      {project.description ? (
        <Text numberOfLines={2} className="text-[13.5px] text-muted">
          {project.description}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2 pt-1">
        {project.leadName ? (
          <>
            <Avatar name={project.leadName} src={project.leadAvatar} size="xs" />
            <Text numberOfLines={1} className="flex-1 text-[12.5px] text-muted">
              Lead: {project.leadName}
            </Text>
          </>
        ) : (
          <Text className="text-[12.5px] text-muted">No lead set</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const { orgId, org, status: orgStatus, orgs } = useOrg();
  const [scope, setScope] = useState("org");
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const orgRole = (orgs ?? []).find((o) => o.id === orgId)?.role ?? org?.role ?? null;
  const canCreateInOrg = Boolean(orgId) && can(orgRole, "project.create", "org");

  const orgProjects = usePaged((p) => (orgId ? listOrgProjects(orgId, p) : noRows()), { orgId });
  const personal = useResource(() => listPersonalProjects(), []);

  const active =
    scope === "org"
      ? orgProjects
      : {
          status: personal.status,
          error: personal.error,
          reload: personal.reload,
          items: personal.data ?? [],
          hasMore: false,
          loadMore: () => {},
          loadingMore: false,
        };
  const listStatus = scope === "org" && orgStatus !== "success" ? "loading" : active.status;
  const items = active.items ?? [];

  const createProject = async (values) => {
    const body = {
      name: values.name.trim(),
      key: values.key.trim(),
      description: values.description?.trim() || undefined,
      visibility: values.visibility,
      themeKey: values.themeKey ?? null,
    };
    if (!values.personal && !orgId) throw new Error("Pick an organization before creating a project in it.");
    const { data: project } = values.personal ? await createPersonalProject(body) : await createOrgProject(orgId, body);
    toast.success("Project created");
    router.push(paths.board(pid(project)));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await active.reload();
    } finally {
      setRefreshing(false);
    }
  };

  const orgEmpty = scope === "org" && !orgId && orgStatus === "success";
  const showList = !orgEmpty && listStatus === "success";

  const header = (
    <View className="pt-4">
      <PageHead
        title="Projects"
        sub="Organization and personal projects you can open."
        actions={
          scope === "org" && !canCreateInOrg ? null : (
            <Button variant="ember" icon="plus" onPress={() => setCreating(true)}>
              New project
            </Button>
          )
        }
      />
      <View className="mb-4">
        <SegmentedControl as="buttons" label="Project scope" value={scope} onChange={setScope} options={SCOPES} />
      </View>
    </View>
  );

  let emptyBody = null;
  if (orgEmpty) {
    emptyBody = (
      <View className={CARD}>
        <EmptyState
          icon="building"
          title="Pick an organization"
          text="Organization projects belong to an organization."
          action={
            <Button variant="soft" onPress={() => router.push(paths.orgs())}>
              Go to organizations
            </Button>
          }
        />
      </View>
    );
  } else if (listStatus === "loading") {
    emptyBody = <Skeleton variant="cards" count={3} cols={1} />;
  } else if (listStatus === "error") {
    emptyBody = (
      <View className={CARD}>
        <EmptyState
          tone="error"
          icon="alert"
          title="Could not load projects"
          text={active.error?.message}
          onRetry={active.reload}
        />
      </View>
    );
  } else {
    const copy = emptyCopy("projects");
    emptyBody = (
      <View className={CARD}>
        <View className="items-center gap-3">
          <Illustration name="empty" alt="" className="w-44" />
        </View>
        <EmptyState
          icon={copy.icon}
          title={copy.title}
          text={copy.text}
          action={
            scope === "personal" || canCreateInOrg ? (
              <Button variant="ember" icon="plus" onPress={() => setCreating(true)}>
                New project
              </Button>
            ) : null
          }
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        data={showList ? items : []}
        keyExtractor={pid}
        renderItem={({ item }) => <ProjectCard project={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyBody}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (showList && active.hasMore && !active.loadingMore) active.loadMore();
        }}
        ListFooterComponent={active.loadingMore ? <ActivityIndicator className="my-4" /> : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} allowPersonal onSubmit={createProject} />
    </View>
  );
}
