import { listReleases, listSprints } from "@/libs/api/boards";
import { listConfig, listLabels, listWorkflows } from "@/libs/api/config";
import { searchUsers } from "@/libs/api/users";
import { priorityIcon, priorityTone, statusTone, typeIcon } from "@/utils/issueVisuals";
import { useResource } from "@/utils/useResource";
import Select from "@/components/ui/Select";

// Server records come back with _id; some responses carry id. Both are accepted.
export const idOf = (item) => item?.id ?? item?._id ?? null;
export const statusKey = (status) => status?.id ?? status?.key ?? null;

const EMPTY = Object.freeze({ statuses: [], types: [], priorities: [], labels: [] });

// Loads the project-level choices an issue form needs (live statuses, types, priorities, labels).
// Self-contained so the sheets can open from screens outside ProjectProvider (for example Dashboard).
export function useIssueOptions(projectId, enabled = true) {
  const res = useResource(async () => {
    if (!enabled || !projectId) return { data: EMPTY, meta: null };
    const [workflows, types, priorities, labels] = await Promise.all([
      listWorkflows(projectId, { status: "live", limit: 1 }),
      listConfig(projectId, "issue-types", { limit: 100 }),
      listConfig(projectId, "priorities", { limit: 100 }),
      listLabels(projectId, { limit: 100 }),
    ]);
    const live = workflows.data?.[0];
    const statuses = [...(live?.statuses ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return {
      data: {
        statuses,
        types: types.data ?? [],
        priorities: priorities.data ?? [],
        labels: labels.data ?? [],
      },
      meta: null,
    };
  }, [enabled, projectId]);
  return { status: res.status, error: res.error, reload: res.reload, options: res.data ?? EMPTY };
}

export function StatusSelect({ value, onChange, statuses = [], label = "Status", disabled = false }) {
  return (
    <Select
      label={label}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      options={statuses.map((s) => ({ value: statusKey(s), label: s.name, tone: statusTone(s.category) }))}
    />
  );
}

export function PrioritySelect({ value, onChange, priorities = [], label = "Priority", disabled = false, hint }) {
  return (
    <Select
      label={label}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      hint={hint}
      options={[
        { value: "", label: "No priority" },
        ...priorities.map((p) => ({
          value: idOf(p),
          label: p.name,
          icon: priorityIcon(p.rank, p.icon),
          tone: priorityTone(p.rank),
        })),
      ]}
    />
  );
}

export function TypeSelect({ value, onChange, types = [], label = "Type", disabled = false, className, hint }) {
  return (
    <Select
      label={label}
      className={className}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      hint={hint}
      options={types.map((t) => ({ value: idOf(t), label: t.name, icon: typeIcon(t) }))}
    />
  );
}

export function SprintSelect({ projectId, value, onChange, label = "Sprint", disabled = false, hint }) {
  const res = useResource(() => listSprints(projectId, { limit: 100 }), [projectId]);
  const sprints = Array.isArray(res.data) ? res.data : [];
  return (
    <Select
      label={label}
      value={value ?? ""}
      onChange={(next) => onChange(next || null)}
      disabled={disabled || res.status !== "success"}
      hint={hint}
      error={res.status === "error" ? "Could not load sprints" : undefined}
      options={[
        { value: "", label: "No sprint" },
        ...sprints.map((s) => ({ value: idOf(s), label: s.name, description: s.state })),
      ]}
    />
  );
}

export function ReleaseSelect({ projectId, value = [], onChange, label = "Releases", disabled = false, hint }) {
  const res = useResource(() => listReleases(projectId, { limit: 100 }), [projectId]);
  const releases = Array.isArray(res.data) ? res.data : [];
  return (
    <Select
      label={label}
      multiple
      value={value}
      onChange={onChange}
      disabled={disabled || res.status !== "success"}
      hint={hint}
      error={res.status === "error" ? "Could not load releases" : undefined}
      options={releases.map((r) => ({ value: idOf(r), label: r.name }))}
    />
  );
}

// Labels are stored by name, not id. The server expects names.
export function LabelSelect({ value = [], onChange, labels = [], label = "Labels", disabled = false, className, hint }) {
  return (
    <Select
      label={label}
      className={className}
      multiple
      searchable
      value={value}
      onChange={onChange}
      disabled={disabled}
      hint={hint}
      options={labels.map((l) => ({ value: l.name, label: l.name }))}
    />
  );
}

// Searches users through GET /users/search. The current assignee stays listed so the value always reads.
export function AssigneeSelect({ value, onChange, current = null, label = "Assignee", disabled = false, hint }) {
  const base = [{ value: "", label: "Unassigned" }];
  if (current?.id) base.push({ value: current.id, label: current.name ?? "Assigned" });
  return (
    <Select
      label={label}
      searchable
      placeholder="Unassigned"
      value={value ?? ""}
      onChange={(next) => onChange(next || null)}
      disabled={disabled}
      hint={hint}
      options={base}
      loadOptions={(q) =>
        searchUsers(q).then((res) => [
          { value: "", label: "Unassigned" },
          ...(res.data ?? []).map((u) => ({
            value: idOf(u),
            label: u.displayName ?? u.name ?? u.email ?? "User",
          })),
        ])
      }
    />
  );
}
