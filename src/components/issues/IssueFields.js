import { useState } from "react";
import { View } from "react-native";
import Input from "@/components/ui/Input";
import { formatDuration, parseDuration } from "@/utils/format";
import {
  AssigneeSelect,
  LabelSelect,
  PrioritySelect,
  ReleaseSelect,
  SprintSelect,
  StatusSelect,
} from "./IssueSelects";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Fact fields in the issue panel. Every change goes through onPatch or onStatus, which the
// parent (IssueSideModal) saves with the loaded version. Type is not editable after create.
// Mount with key={idOf(issue)} so the local drafts reset when the panel swaps issues.
// Text fields commit when the field loses focus or the keyboard's done key is pressed.
export default function IssueFields({ issue, options, projectId, disabled = false, onPatch, onStatus }) {
  const [estimate, setEstimate] = useState(() => (issue.estimateSec ? formatDuration(issue.estimateSec) : ""));
  const [estimateError, setEstimateError] = useState(null);
  const [points, setPoints] = useState(issue.storyPoints == null ? "" : String(issue.storyPoints));
  const [due, setDue] = useState(issue.dueDate ? String(issue.dueDate).slice(0, 10) : "");
  const [dueError, setDueError] = useState(null);

  const commitEstimate = () => {
    const raw = estimate.trim();
    if (!raw) {
      setEstimateError(null);
      if (issue.estimateSec) onPatch({ estimateSec: null });
      return;
    }
    const seconds = parseDuration(raw);
    if (seconds == null) {
      setEstimateError("Use a time like 1h 30m or 2d.");
      return;
    }
    setEstimateError(null);
    if (seconds !== issue.estimateSec) onPatch({ estimateSec: seconds });
  };

  const commitPoints = () => {
    const raw = String(points).trim();
    const next = raw === "" ? null : Number(raw);
    if (next !== null && Number.isNaN(next)) return;
    if (next !== (issue.storyPoints ?? null)) onPatch({ storyPoints: next });
  };

  const commitDue = () => {
    const raw = due.trim();
    const current = issue.dueDate ? String(issue.dueDate).slice(0, 10) : "";
    if (raw && (!DATE_RE.test(raw) || Number.isNaN(Date.parse(raw)))) {
      setDueError("Use a date like 2025-01-31.");
      return;
    }
    setDueError(null);
    if (raw !== current) onPatch({ dueDate: raw || null });
  };

  const assignee = issue.assigneeId
    ? { id: issue.assigneeId, name: issue.assignee?.name ?? "Assigned" }
    : null;

  return (
    <View className="gap-[14px]">
      <StatusSelect
        value={issue.statusId}
        statuses={options.statuses}
        onChange={(next) => next && next !== issue.statusId && onStatus(next)}
        disabled={disabled}
      />
      <AssigneeSelect
        value={issue.assigneeId ?? ""}
        current={assignee}
        disabled={disabled}
        onChange={(next) => next !== (issue.assigneeId ?? null) && onPatch({ assigneeId: next })}
      />
      <PrioritySelect
        value={issue.priorityId ?? ""}
        priorities={options.priorities}
        disabled={disabled}
        onChange={(next) => (next || null) !== (issue.priorityId ?? null) && onPatch({ priorityId: next || null })}
      />
      <SprintSelect
        projectId={projectId}
        value={issue.sprintId ?? ""}
        disabled={disabled}
        onChange={(next) => next !== (issue.sprintId ?? null) && onPatch({ sprintId: next })}
      />
      <ReleaseSelect
        projectId={projectId}
        value={issue.releaseIds ?? []}
        disabled={disabled}
        onChange={(next) => onPatch({ releaseIds: next })}
      />
      <LabelSelect
        value={issue.labels ?? []}
        labels={options.labels}
        disabled={disabled}
        onChange={(next) => onPatch({ labels: next })}
      />
      <Input
        type="date"
        label="Due date"
        hint="YYYY-MM-DD. Leave empty to clear."
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        returnKeyType="done"
        disabled={disabled}
        editable={!disabled}
        value={due}
        error={dueError ?? undefined}
        onChangeText={setDue}
        onBlur={commitDue}
      />
      <Input
        label="Estimate"
        hint="For example 1h 30m or 2d."
        autoCapitalize="none"
        returnKeyType="done"
        disabled={disabled}
        editable={!disabled}
        value={estimate}
        error={estimateError ?? undefined}
        onChangeText={setEstimate}
        onBlur={commitEstimate}
      />
      <Input
        type="number"
        keyboardType="decimal-pad"
        returnKeyType="done"
        label="Story points"
        hint="Half steps such as 0.5 are fine. Leave empty to clear."
        disabled={disabled}
        editable={!disabled}
        value={points}
        onChangeText={setPoints}
        onBlur={commitPoints}
      />
    </View>
  );
}
