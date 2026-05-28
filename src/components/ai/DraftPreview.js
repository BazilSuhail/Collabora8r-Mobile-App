import { View, Text } from "react-native";
import SideModal from "@/components/ui/SideModal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import MarkdownView from "@/components/wiki/MarkdownView";
import { useMutation } from "@/utils/useMutation";
import { acceptDraft, discardDraft } from "@/libs/api/ai";

const idOf = (item) => String(item?.id ?? item?._id);

const KIND_TITLE = {
  issueFromText: "Issue draft",
  subtasks: "Subtasks",
  summarize: "Summary",
  wikiOutline: "Wiki outline",
};

const ACCEPT_LABEL = {
  issueFromText: "Create issue",
  subtasks: "Create subtasks",
  summarize: "Keep summary",
  wikiOutline: "Use outline",
};

function Bullet({ children, marker = "•" }) {
  return (
    <View className="flex-row gap-[8px]">
      <Text className="text-[14px] text-muted">{marker}</Text>
      <View className="flex-1">{children}</View>
    </View>
  );
}

function Output({ output }) {
  if (!output) return null;
  if (output.kind === "issueFromText") {
    return (
      <View className="gap-[10px]">
        <Text className="text-[20px] font-bold text-foreground" style={{ letterSpacing: -0.4 }}>
          {output.title}
        </Text>
        <MarkdownView text={output.description ?? ""} />
      </View>
    );
  }
  if (output.kind === "subtasks") {
    return (
      <View className="gap-[12px]">
        {(output.items ?? []).map((item, index) => (
          <Bullet key={index} marker={`${index + 1}.`}>
            <Text className="font-semibold text-foreground">{item.title}</Text>
            {item.description ? <Text className="text-[14px] text-muted">{item.description}</Text> : null}
          </Bullet>
        ))}
      </View>
    );
  }
  if (output.kind === "summarize") {
    return (
      <View className="gap-[12px]">
        <Text className="text-[15px] leading-[24px] text-foreground">{output.summary}</Text>
        {output.highlights?.length ? (
          <View className="gap-[6px]">
            {output.highlights.map((item, index) => (
              <Bullet key={index}>
                <Text className="text-[14px] text-muted">{item}</Text>
              </Bullet>
            ))}
          </View>
        ) : null}
      </View>
    );
  }
  if (output.kind === "wikiOutline") {
    return (
      <View className="gap-[16px]">
        <Text className="text-[20px] font-bold text-foreground" style={{ letterSpacing: -0.4 }}>
          {output.title}
        </Text>
        {(output.sections ?? []).map((section, index) => (
          <View key={index} className="gap-[6px]">
            <Text className="font-bold text-foreground">{section.heading}</Text>
            <View className="gap-[4px]">
              {(section.points ?? []).map((point, n) => (
                <Bullet key={n}>
                  <Text className="text-[14px] text-muted">{point}</Text>
                </Bullet>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }
  return <Text className="text-muted">This draft has no preview.</Text>;
}

// Shows one AI draft. Accept calls the server (issue drafts create the issue); Discard drops it.
export default function DraftPreview({ open, onClose, draft, onAccepted, onDiscarded }) {
  const draftId = draft ? idOf(draft) : null;
  const status = draft?.status;

  const accept = useMutation(() => acceptDraft(draftId, {}), {
    success: (res) => (res?.data?.created?.key ? `Created ${res.data.created.key}` : "Draft accepted"),
    error: (err) => err.message || "Could not accept this draft",
  });
  const discard = useMutation(
    async () => {
      await discardDraft(draftId);
      return true;
    },
    { success: "Draft discarded", error: (err) => err.message || "Could not discard this draft" },
  );

  const doAccept = async () => {
    const res = await accept.run();
    if (res) onAccepted?.(res.data);
  };
  const doDiscard = async () => {
    const done = await discard.run();
    if (done) onDiscarded?.();
  };

  let body;
  if (!draft) {
    body = null;
  } else if (status === "pending") {
    body = (
      <View className="flex-row items-center gap-[10px]">
        <Spinner size="sm" />
        <Text className="text-muted">Still drafting. This can take a few seconds.</Text>
      </View>
    );
  } else if (status === "failed") {
    body = <EmptyState tone="error" title="This draft failed" text={draft.error ?? "Try again in a moment."} />;
  } else if (status === "ready") {
    body = <Output output={draft.output} />;
  } else {
    body = <EmptyState icon="aiDraft" title="This draft is closed" text={`It was already ${status}.`} />;
  }

  const footer =
    status === "ready" ? (
      <>
        <Button variant="ghost" loading={discard.pending} disabled={accept.pending} onClick={doDiscard}>
          Discard
        </Button>
        <Button variant="ember" loading={accept.pending} disabled={discard.pending} onClick={doAccept}>
          {ACCEPT_LABEL[draft.output?.kind] ?? "Accept"}
        </Button>
      </>
    ) : null;

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title="AI draft"
      subtitle={draft ? (KIND_TITLE[draft.output?.kind] ?? "Draft") : undefined}
      footer={footer}
    >
      {body}
    </SideModal>
  );
}
