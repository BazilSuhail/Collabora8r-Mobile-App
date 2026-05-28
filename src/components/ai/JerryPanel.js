import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import SideModal from "@/components/ui/SideModal";
import Button from "@/components/ui/Button";
import { createDraft, acceptDraft, discardDraft } from "@/libs/api/ai";
import { useMutation } from "@/utils/useMutation";
import { useToast } from "@/context/ToastContext";

// Set when the server answers 503 in this app session. Jerry buttons then hide.
let jerryUnavailable = false;
export const markJerryUnavailable = () => {
  jerryUnavailable = true;
};
export const isJerryUnavailable = () => jerryUnavailable;

const SUGGESTIONS = {
  issue: [
    "Login bug on Safari, high priority",
    "Weekly report task due Friday",
    "Refactor the billing module into smaller parts",
  ],
  search: ["my open bugs", "overdue tasks", "payment issues"],
};

const FIELD_ROWS = [
  ["Title", (o) => o.title],
  ["Priority", (o) => o.priority],
  ["Type", (o) => o.typeName],
  ["Labels", (o) => (Array.isArray(o.labels) ? o.labels.join(", ") : o.labels)],
  ["Due date", (o) => o.dueDate],
  ["Story points", (o) => o.storyPoints],
];

const idOf = (item) => String(item?.id ?? item?._id);

// Asks Jerry for an issue fill or an issue search, shows the reply, and applies it on request.
export default function JerryPanel({ open, onClose, mode, projectId, onApply }) {
  const toast = useToast();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const text = prompt.trim();
  const isIssue = mode === "issue";
  const output = draft?.output;
  const draftId = draft ? idOf(draft) : null;

  const ask = useMutation(async () => {
    let res;
    try {
      res = await createDraft({
        kind: isIssue ? "issueFill" : "findIssues",
        projectId,
        text,
      });
    } catch (err) {
      if (err.status === 503) {
        markJerryUnavailable();
        setUnavailable(true);
        toast.info("Jerry is not set up on this server.");
        return undefined;
      }
      if (err.status === 429) {
        toast.warning("Daily AI limit reached");
        return undefined;
      }
      throw err;
    }
    if (!res?.data?.output) throw new Error("Jerry could not answer. Try again.");
    return res.data;
  }, {});

  const apply = useMutation(
    async () => {
      await onApply?.(output);
      try {
        await acceptDraft(draftId, {});
      } catch {
        // The form is already filled, so a failed accept stays silent.
      }
      return true;
    },
    { error: (err) => err.message || "Could not use Jerry's answer" },
  );

  const doApply = async () => {
    const done = await apply.run();
    if (!done) return;
    setDraft(null);
    setPrompt("");
    onClose?.();
    toast.success(isIssue ? "Jerry filled the form" : "Jerry set the search");
  };

  const tryAgain = async () => {
    if (draftId) {
      try {
        await discardDraft(draftId);
      } catch {
        // Discarding is best effort; the result is cleared either way.
      }
    }
    setDraft(null);
  };

  const doAsk = async () => {
    setDraft(null);
    const data = await ask.run();
    if (data) setDraft(data);
  };

  const card =
    draft && output ? (
      <View className="gap-[12px] p-[16px] rounded-[15px] bg-background border border-border">
        <Text className="text-[15px] leading-[24px] text-foreground">{output.reply}</Text>
        {isIssue ? (
          <View className="gap-[6px]">
            {FIELD_ROWS.map(([label, read]) => {
              const value = read(output);
              if (value === undefined || value === null || value === "") return null;
              return (
                <View key={label} className="flex-row gap-[10px]">
                  <Text className="text-[14px] text-muted min-w-[104px]">{label}</Text>
                  <Text className="text-[14px] text-foreground font-semibold flex-1">{String(value)}</Text>
                </View>
              );
            })}
          </View>
        ) : output.query ? (
          <View className="flex-row flex-wrap items-center gap-[8px]">
            <Text className="text-[14px] text-muted">Search for</Text>
            <View className="rounded-full border border-border bg-surface px-[10px] py-[4px]">
              <Text className="text-[14px] font-bold text-foreground">{output.query}</Text>
            </View>
          </View>
        ) : null}
      </View>
    ) : null;

  const footer =
    draft && output ? (
      <>
        <Button variant="ghost" onClick={tryAgain}>
          Try again
        </Button>
        <Button variant="ember" loading={apply.pending} disabled={apply.pending} onClick={doApply}>
          Use this
        </Button>
      </>
    ) : null;

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="Jerry"
      subtitle={isIssue ? "Describe it in your own words and I will fill the form." : "Describe what you are looking for."}
      footer={footer}
    >
      {unavailable ? null : (
        <View className="gap-[16px]">
          <View className="gap-[10px]">
            <Text className="text-[13px] font-semibold text-foreground">What should I do?</Text>
            <TextInput
              accessibilityLabel="What should I do?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={prompt}
              onChangeText={setPrompt}
              className="min-h-[96px] rounded-[12px] border border-border bg-surface px-[14px] py-[10px] text-[15px] text-foreground"
            />
            <View className="flex-row flex-wrap gap-[8px]">
              {SUGGESTIONS[isIssue ? "issue" : "search"].map((chip) => (
                <Pressable
                  key={chip}
                  accessibilityRole="button"
                  onPress={() => setPrompt(chip)}
                  className="rounded-full border border-border bg-surface px-[12px] py-[6px] active:opacity-70"
                >
                  <Text className="text-[13px] text-foreground">{chip}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-[10px] items-start">
            <Button variant="ember" loading={ask.pending} disabled={!text || ask.pending} onClick={doAsk}>
              Ask Jerry
            </Button>
            {ask.pending ? <Text className="text-muted text-[14px]">Jerry is thinking...</Text> : null}
          </View>

          {ask.error ? (
            <Text accessibilityLiveRegion="assertive" className="text-[14px] text-danger">
              {ask.error.message || "Jerry could not answer. Try again."}
            </Text>
          ) : null}

          {card}
        </View>
      )}
    </SideModal>
  );
}
