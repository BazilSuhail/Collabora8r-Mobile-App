import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import CenterModal from "@/components/ui/CenterModal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { createLink, listIssues } from "@/libs/api/issues";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { cn } from "@/utils/cn";

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = () => Promise.resolve({ data: [], meta: null });

const LINK_TYPES = [
  { value: "relates", label: "Relates to" },
  { value: "blocks", label: "Blocks" },
  { value: "duplicates", label: "Duplicates" },
  { value: "clones", label: "Clones" },
];

// Pick another issue in this project and a link type. Search runs 250ms after typing stops.
export default function LinkPickerModal({ open, onClose, pid, issueId, onLinked }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [target, setTarget] = useState(null);
  const [type, setType] = useState("relates");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useResource(
    () => (open && debounced ? listIssues(pid, { q: debounced, limit: 10 }) : NONE()),
    [open, pid, debounced],
  );
  const candidates = (Array.isArray(results.data) ? results.data : []).filter((issue) => idOf(issue) !== String(issueId));

  const submit = useMutation(() => createLink(pid, issueId, { targetIssueId: idOf(target), type }), {
    success: "Linked",
    error: (err) => err.message || "Could not link this issue",
  });

  const link = async () => {
    if (!target) return;
    const res = await submit.run();
    if (res) {
      setTarget(null);
      setQuery("");
      onLinked?.();
      onClose();
    }
  };

  let found;
  if (!debounced) {
    found = <Text className="text-[14px] text-muted">Type a key or part of a title to find an issue.</Text>;
  } else if (results.status === "loading") {
    found = (
      <View className="gap-[8px]" accessibilityState={{ busy: true }}>
        {[0, 1, 2].map((n) => (
          <View key={n} className="h-[40px] rounded-[12px] bg-well" />
        ))}
      </View>
    );
  } else if (results.status === "error") {
    found = <EmptyState tone="error" title="Search did not work" text={results.error?.message} onRetry={results.reload} />;
  } else if (!candidates.length) {
    found = <EmptyState icon="search" title="No issues match" text="Try another key or word." />;
  } else {
    found = (
      <ScrollView
        accessibilityLabel="Matching issues"
        style={{ maxHeight: 240 }}
        contentContainerClassName="gap-[6px]"
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {candidates.map((issue) => {
          const id = idOf(issue);
          const selected = Boolean(target && idOf(target) === id);
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setTarget(issue)}
              className={cn(
                "w-full flex-row items-center gap-[10px] rounded-[12px] border px-[12px] py-[8px]",
                selected ? "border-line-2 bg-well" : "border-border",
              )}
            >
              <Text className="flex-none text-[12.5px] font-bold text-muted" style={{ fontVariant: ["tabular-nums"] }}>
                {issue.key}
              </Text>
              <Text numberOfLines={1} className="min-w-0 flex-1 text-[14px] font-semibold text-foreground">
                {issue.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <CenterModal
      open={open}
      onClose={onClose}
      title="Link an issue"
      description="Pick an issue in this project and say how it relates."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ember" loading={submit.pending} disabled={!target} onClick={link}>
            Link issue
          </Button>
        </>
      }
    >
      <View className="gap-[16px]">
        <Input
          variant="search"
          label="Search issues"
          hideLabel
          placeholder="Search by key or title"
          autoCapitalize="none"
          autoCorrect={false}
          value={query}
          onChangeText={setQuery}
        />
        {target ? (
          <View className="flex-row items-center gap-[8px] min-w-0">
            <Text className="shrink-0 text-[13px] font-semibold text-muted">Selected</Text>
            <Text numberOfLines={1} className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">
              {target.key} {target.title}
            </Text>
          </View>
        ) : null}
        {found}
        <Select
          label="Link type"
          hint="Describes how this issue relates to the one you pick."
          value={type}
          options={LINK_TYPES}
          onChange={setType}
        />
        {submit.fieldErrors?.targetIssueId ? (
          <Text accessibilityRole="alert" className="text-[13px] font-semibold text-danger">
            {submit.fieldErrors.targetIssueId}
          </Text>
        ) : null}
      </View>
    </CenterModal>
  );
}
