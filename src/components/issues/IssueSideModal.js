import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ProjectProvider, useProject } from "@/context/ProjectContext";
import { useToast } from "@/context/ToastContext";
import { getIssue, transitionIssue, updateIssue } from "@/libs/api/issues";
import { paths } from "@/routes/paths";
import { useResource } from "@/utils/useResource";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Skeleton from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";
import CommentStream from "./CommentStream";
import { IssueHistory } from "./HistoryList";
import IssueFields from "./IssueFields";
import { idOf, useIssueOptions } from "./IssueSelects";

const TABS = [
  { value: "comments", label: "Comments" },
  { value: "history", label: "History" },
];

// One issue panel for the whole app, shown as a full-screen sheet. Opening another issue while it is
// open swaps the content of this same sheet (the parent changes issueId, the panel refetches).
export default function IssueSideModal({ open, onClose, projectId, issueId, canEdit = false }) {
  const router = useRouter();
  const res = useResource(
    () => (open && projectId && issueId ? getIssue(projectId, issueId) : Promise.resolve({ data: null, meta: null })),
    [open, projectId, issueId],
  );
  const issue = res.data;

  const openFull = () => {
    onClose?.();
    router.push(paths.issue(projectId, issue.key));
  };

  return (
    <Modal
      visible={Boolean(open)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
        <View className="flex-row items-center gap-[10px] px-4 py-3 border-b border-border">
          <View className="flex-1 min-w-0">
            <Text accessibilityRole="header" numberOfLines={1} className="text-[18px] font-bold text-foreground">
              {issue?.key ?? "Issue"}
            </Text>
            {issue?.typeName ? (
              <Text numberOfLines={1} className="text-[12.5px] text-muted">
                {issue.typeName}
              </Text>
            ) : null}
          </View>
          {issue ? (
            <Button variant="soft" size="sm" icon="external" onClick={openFull}>
              Open full page
            </Button>
          ) : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            className="h-[36px] w-[36px] items-center justify-center rounded-full bg-surface"
          >
            <Icon name="close" size={18} />
          </Pressable>
        </View>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerClassName="p-4 gap-[16px] pb-10"
            keyboardShouldPersistTaps="handled"
          >
            {res.status === "loading" ? <Skeleton variant="cards" count={2} /> : null}
            {res.status === "error" ? (
              <EmptyState tone="error" title="Could not load this issue" text={res.error?.message} onRetry={res.reload} />
            ) : null}
            {res.status === "success" && issue ? (
              <SideBody
                key={idOf(issue)}
                issue={issue}
                projectId={projectId}
                canEdit={canEdit}
                setIssue={res.setData}
                reload={res.reload}
              />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// For screens outside a project route (dashboard, my work, calendar): loads the issue's project role and
// passes canEdit from the shared permission helper. No role yet (loading or none) means read only.
export function ProjectIssueSideModal(props) {
  return (
    <ProjectProvider projectId={props.projectId}>
      <RoleGatedModal {...props} />
    </ProjectProvider>
  );
}

function RoleGatedModal(props) {
  const { can } = useProject();
  return <IssueSideModal {...props} canEdit={can("issue.edit")} />;
}

// Body for one issue. Remounted per issue (key), so drafts and the open tab reset on swap.
function SideBody({ issue, projectId, canEdit, setIssue, reload }) {
  const toast = useToast();
  const options = useIssueOptions(projectId, true);
  const [tab, setTab] = useState("comments");
  const [titleDraft, setTitleDraft] = useState(issue.title ?? "");
  const [saveError, setSaveError] = useState(null);
  const id = idOf(issue);

  // Merges a server response into the loaded issue so the next PATCH carries the new version.
  const merge = (updated) => setIssue((cur) => ({ ...cur, ...updated }));

  const handleError = (err, fallback) => {
    if (err?.status === 409) {
      toast.warning("Changed by someone else. Reloaded.");
      reload();
      return;
    }
    setSaveError(err?.message ?? fallback);
  };

  const patchIssue = async (patch) => {
    setSaveError(null);
    try {
      const updated = await updateIssue(projectId, id, { ...patch, version: issue.version });
      merge(updated.data);
      toast.success("Saved");
    } catch (err) {
      handleError(err, "Could not save this change.");
    }
  };

  const moveTo = async (toStatus) => {
    const previous = issue.statusId;
    setSaveError(null);
    try {
      const moved = await transitionIssue(projectId, id, { toStatus });
      merge(moved.data);
      toast.success(`Moved to ${moved.data?.statusName ?? "new status"}`, {
        undo: async () => {
          try {
            const back = await transitionIssue(projectId, id, { toStatus: previous });
            merge(back.data);
          } catch {
            toast.error("Could not undo the move");
          }
        },
      });
    } catch (err) {
      handleError(err, "Could not move this issue.");
    }
  };

  const commitTitle = () => {
    const next = titleDraft.trim();
    if (!next) {
      setTitleDraft(issue.title ?? "");
      return;
    }
    if (next !== issue.title) patchIssue({ title: next });
  };

  return (
    <>
      <View className="gap-[6px]">
        <Input
          label="Summary"
          maxLength={255}
          hint={canEdit ? "Saves when you leave the field." : undefined}
          disabled={!canEdit}
          editable={canEdit}
          returnKeyType="done"
          value={titleDraft}
          onChangeText={setTitleDraft}
          onBlur={commitTitle}
        />
      </View>
      {saveError ? (
        <Text accessibilityRole="alert" className="text-danger text-[13px] font-semibold">
          {saveError}
        </Text>
      ) : null}
      {options.status === "loading" ? (
        <Skeleton variant="cards" count={1} />
      ) : (
        <IssueFields
          key={id}
          issue={issue}
          options={options.options}
          projectId={projectId}
          disabled={!canEdit}
          onPatch={patchIssue}
          onStatus={moveTo}
        />
      )}
      <SegmentedControl label="Activity" value={tab} onChange={setTab} options={TABS} size="sm" />
      {tab === "comments" ? (
        <CommentStream pid={projectId} issueId={id} canComment={canEdit} />
      ) : (
        <IssueHistory projectId={projectId} issueId={id} />
      )}
    </>
  );
}
