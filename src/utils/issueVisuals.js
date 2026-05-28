import { hasGlyph } from "@/components/ui/Icon";

const HIERARCHY_ICON = {
  epic: "epic",
  story: "story",
  task: "task",
  subtask: "subtask",
};

const PRIORITY_ICON = {
  1: "prioHighest",
  2: "prioHigh",
  3: "prioMedium",
  4: "down",
  5: "prioLowest",
};

const STATUS_ICON = {
  todo: "stTodo",
  inprogress: "stProgress",
  done: "stDone",
};

const STATUS_TONE = {
  todo: "plain",
  inprogress: "iris",
  done: "spruce",
};

// A server icon string wins only when it is a GLYPHS key (E.1). Seeded
// values are empty strings, so the data mapping below is the usual path.
export function typeIcon(type) {
  if (hasGlyph(type?.icon)) return type.icon;
  if (String(type?.name ?? "").toLowerCase().includes("bug")) return "bug";
  return HIERARCHY_ICON[type?.hierarchy] ?? "task";
}

export function priorityIcon(rank, serverIcon) {
  if (hasGlyph(serverIcon)) return serverIcon;
  return PRIORITY_ICON[rank] ?? PRIORITY_ICON[3];
}

export function priorityTone(rank) {
  if (rank <= 2) return "ember";
  if (rank === 3) return "saffron";
  return "plain";
}

export function statusTone(category) {
  return STATUS_TONE[category] ?? "plain";
}

export function statusIcon(category) {
  return STATUS_ICON[category] ?? STATUS_ICON.todo;
}
