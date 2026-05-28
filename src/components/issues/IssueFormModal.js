import { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "@/context/ToastContext";
import { createIssue, updateIssue } from "@/libs/api/issues";
import { paths } from "@/routes/paths";
import JerryButton from "@/components/ai/JerryButton";
import FormModal from "@/components/ui/FormModal";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import IssueForm, { defaultValues, issueToValues, toIssueBody } from "./IssueForm";
import { idOf, useIssueOptions } from "./IssueSelects";

// Create or edit an issue in a full-screen form sheet. Edit sends the loaded version (optimistic lock).
// 422 field errors and 409 conflicts are shown by FormModal; a 409 also reloads the caller's issue
// through onReload and keeps the draft.
export default function IssueFormModal({ open, onClose, projectId, issue = null, defaults = null, onSaved, onReload }) {
  const toast = useToast();
  const router = useRouter();
  const edit = Boolean(issue);
  const options = useIssueOptions(projectId, open);
  const initialValues = useMemo(
    () => (issue ? issueToValues(issue) : defaultValues(defaults ?? {})),
    [issue, defaults],
  );

  const submit = async (values) => {
    const body = toIssueBody(values, edit);
    try {
      if (edit) {
        const res = await updateIssue(projectId, idOf(issue), { ...body, version: issue.version });
        toast.success("Saved");
        onSaved?.(res.data);
        return;
      }
      const res = await createIssue(projectId, body);
      const created = res.data;
      toast.success(`Created ${created.key}`, {
        action: { label: "Open", onClick: () => router.push(paths.issue(projectId, created.key)) },
      });
      onSaved?.(created);
    } catch (err) {
      if (err?.status === 409) {
        onReload?.();
        toast.warning("Changed by someone else. Reloaded.");
      }
      throw err;
    }
  };

  const fields = ({ values, set, errors }) => {
    if (options.status === "loading") {
      return (
        <View className="w-full">
          <Skeleton variant="cards" count={2} />
        </View>
      );
    }
    if (options.status === "error") {
      return (
        <View className="w-full">
          <EmptyState
            tone="error"
            title="Could not load the form options"
            text={options.error?.message}
            onRetry={options.reload}
          />
        </View>
      );
    }
    // Jerry only fills the create form. Only values Jerry returned are written; status is never set.
    const applyJerry = (out) => {
      if (!out) return;
      if (typeof out.title === "string" && out.title.trim()) set("title", out.title);
      if (typeof out.description === "string" && out.description.trim()) set("description", out.description);
      if (out.priority) {
        const wanted = String(out.priority).toLowerCase();
        const match = options.options.priorities.find((p) => String(p.name ?? "").toLowerCase() === wanted);
        if (match) set("priorityId", idOf(match));
      }
      if (out.typeName) {
        const wanted = String(out.typeName).toLowerCase();
        const match = options.options.types.find((t) => String(t.name ?? "").toLowerCase() === wanted);
        if (match) set("typeId", idOf(match));
      }
      if (Array.isArray(out.labels) && out.labels.length > 0) {
        const merged = [...new Set([...(values.labels ?? []), ...out.labels.map(String)])];
        set("labels", merged);
      }
      if (typeof out.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(out.dueDate) && !Number.isNaN(Date.parse(out.dueDate))) {
        set("dueDate", out.dueDate);
      }
      if (typeof out.storyPoints === "number" && Number.isFinite(out.storyPoints)) set("storyPoints", out.storyPoints);
    };

    return (
      <>
        {!edit && projectId ? (
          <View className="w-full">
            <JerryButton mode="issue" projectId={projectId} onApply={applyJerry} />
          </View>
        ) : null}
        <IssueForm
          values={values}
          set={set}
          errors={errors}
          options={options.options}
          projectId={projectId}
          edit={edit}
        />
      </>
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title={edit ? `Edit ${issue.key}` : "New issue"}
      description={edit ? "Changes save against the version you loaded." : "Only the summary is required. The rest can be filled in later."}
      submitLabel={edit ? "Save" : "Create issue"}
      initialValues={initialValues}
      onSubmit={submit}
      onReload={edit ? onReload : undefined}
      fields={fields}
    />
  );
}
