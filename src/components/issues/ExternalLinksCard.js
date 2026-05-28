import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useToast } from "@/context/ToastContext";
import {
  createExternalLink,
  deleteExternalLink,
  listExternalLinks,
  listIntegrations,
} from "@/libs/api/automation";
import { useResource } from "@/utils/useResource";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import FormModal from "@/components/ui/FormModal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";

const TYPES = [
  { value: "commit", label: "Commit", icon: "commit" },
  { value: "pullRequest", label: "Pull request", icon: "pr" },
  { value: "build", label: "Build", icon: "build" },
  { value: "deploy", label: "Deploy", icon: "external" },
  { value: "message", label: "Message", icon: "chat" },
];
const TYPE_ICON = Object.fromEntries(TYPES.map((t) => [t.value, t.icon]));
const idOf = (item) => item?.id ?? item?._id ?? null;
const safeHref = (url) => (typeof url === "string" && /^https?:\/\//i.test(url) ? url : undefined);

// Linked items from connected integrations (commits, pull requests, builds) for one issue.
// The links list is loaded for every integration of the project; members without
// integration access pass can={false} and see the empty state instead.
export default function ExternalLinksCard({ projectId, issueId, can = false }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const linked = useResource(async () => {
    if (!can) return { data: { links: [], integrations: [] } };
    const res = await listIntegrations(projectId);
    const integrations = res.data ?? [];
    const lists = await Promise.all(integrations.map((i) => listExternalLinks(projectId, idOf(i), { issueId })));
    const links = lists.flatMap((r, index) =>
      (r.data ?? []).map((l) => ({
        ...l,
        integrationId: idOf(integrations[index]),
        provider: integrations[index].name ?? integrations[index].provider ?? "Integration",
      })),
    );
    return { data: { links, integrations } };
  }, [projectId, issueId, can]);

  const links = linked.data?.links ?? [];
  const integrations = linked.data?.integrations ?? [];

  const unlink = async (link) => {
    try {
      await deleteExternalLink(projectId, link.integrationId, idOf(link));
      toast.success("Unlinked");
      linked.reload();
    } catch {
      toast.error("Could not unlink");
    }
  };

  const open = (href) => {
    Linking.openURL(href).catch(() => toast.error("Could not open this link"));
  };

  return (
    <View className="rounded-[15px] border border-border bg-surface p-[18px] gap-[12px]">
      <View className="flex-row items-center justify-between gap-[12px] min-h-[32px]">
        <View className="flex-row items-center gap-[8px] min-w-0 flex-1">
          <Icon name="link" size={16} className="text-faint" />
          <Text accessibilityRole="header" numberOfLines={1} className="shrink text-[16px] font-semibold tracking-tight text-foreground">
            Linked items
          </Text>
        </View>
        {can ? (
          <Button size="sm" variant="soft" icon="link" disabled={!integrations.length} onClick={() => setAdding(true)}>
            Link item
          </Button>
        ) : null}
      </View>

      {linked.status === "loading" ? <Skeleton variant="feed" count={2} /> : null}
      {linked.status === "error" ? (
        <EmptyState tone="error" title="Could not load linked items" onRetry={linked.reload} />
      ) : null}
      {linked.status === "success" && !links.length ? (
        <EmptyState
          icon="link"
          title="Nothing linked yet"
          text={integrations.length ? undefined : "No integration is connected to this project."}
        />
      ) : null}

      {linked.status === "success" && links.length ? (
        <View className="gap-[8px]">
          {links.map((l) => {
            const href = safeHref(l.url);
            const label = l.title ?? l.externalId ?? "Linked item";
            return (
              <View
                key={idOf(l)}
                className="flex-row items-center gap-[10px] px-[12px] py-[10px] rounded-[14px] bg-surface-2 border border-border"
              >
                <View className="h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] border border-border bg-surface-2">
                  <Icon name={TYPE_ICON[l.externalType] ?? "external"} size={18} />
                </View>
                <View className="min-w-0 flex-1 gap-[2px]">
                  {href ? (
                    <Pressable accessibilityRole="link" onPress={() => open(href)}>
                      <Text numberOfLines={1} className="font-bold text-ember-t">
                        {label}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text numberOfLines={1} className="font-bold text-foreground">
                      {label}
                    </Text>
                  )}
                  <Text className="text-muted text-[12px] font-semibold">
                    {l.provider} · {TYPES.find((t) => t.value === l.externalType)?.label ?? "Item"}
                    {l.status ? ` · ${l.status}` : ""}
                  </Text>
                </View>
                {can ? (
                  <Button iconOnly variant="ghost" size="sm" icon="close" aria-label={`Unlink ${label}`} onClick={() => unlink(l)} />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}

      <FormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Link an item"
        submitLabel="Link"
        initialValues={{ integrationId: "", externalType: "commit", externalId: "", title: "", url: "" }}
        onSubmit={async (values) => {
          await createExternalLink(projectId, values.integrationId, {
            issueId,
            externalType: values.externalType,
            externalId: values.externalId.trim(),
            ...(values.title.trim() ? { title: values.title.trim() } : {}),
            ...(values.url.trim() ? { url: values.url.trim() } : {}),
          });
          toast.success("Linked");
          linked.reload();
        }}
        fields={({ values, set, errors }) => (
          <>
            <Select
              label="Integration"
              value={values.integrationId}
              onChange={(next) => set("integrationId", next)}
              options={integrations.map((i) => ({ value: idOf(i), label: i.name ?? i.provider ?? "Integration" }))}
              error={errors.integrationId}
              hint={integrations.length ? "Only connected integrations are listed." : undefined}
              required
            />
            <Select
              label="Type"
              value={values.externalType}
              onChange={(next) => set("externalType", next)}
              options={TYPES}
            />
            <Input
              label="External id"
              hint="The id in the provider, such as a commit SHA or PR number."
              autoCapitalize="none"
              value={values.externalId}
              onChangeText={(text) => set("externalId", text)}
              error={errors.externalId}
              required
            />
            <Input
              label="Title"
              hint="Optional. Shown instead of the id."
              value={values.title}
              onChangeText={(text) => set("title", text)}
              error={errors.title}
            />
            <Input
              label="Link"
              type="url"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              hint="Optional. Must start with http:// or https://."
              value={values.url}
              onChangeText={(text) => set("url", text)}
              error={errors.url}
            />
          </>
        )}
      />
    </View>
  );
}
