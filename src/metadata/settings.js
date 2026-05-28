// Enum-like lists shared by settings pages. Values match the server (ORG_ROLES, PROJECT_ROLES, NOTIFICATION_KINDS, CHANNELS).

export const NOTIFICATION_CHANNELS = [
  { id: "inApp", label: "In app" },
  { id: "email", label: "Email" },
  { id: "push", label: "Push" },
  { id: "slack", label: "Slack" },
];

export const NOTIFICATION_KINDS = [
  { id: "mention", label: "Mentions", desc: "Someone mentions you in a comment or description." },
  { id: "assigned", label: "Assigned to you", desc: "An issue is assigned to you." },
  { id: "commented", label: "New comments", desc: "Someone comments on an issue you follow." },
  { id: "statusChanged", label: "Status changes", desc: "An issue you follow moves to another status." },
  { id: "dueSoon", label: "Due soon", desc: "An issue you own is due within the next day." },
  { id: "overdue", label: "Overdue", desc: "An issue you own passed its due date." },
  { id: "approval", label: "Approvals", desc: "An approval is requested from you or decided." },
  { id: "slaBreach", label: "SLA breaches", desc: "A service desk request is about to breach its SLA." },
  { id: "invite", label: "Invites", desc: "You are invited to an organization or project." },
  { id: "joinDecision", label: "Join requests", desc: "A join request you raised was decided." },
  { id: "achievement", label: "Milestones", desc: "A sprint, release or goal you work on reaches a milestone." },
  { id: "digest", label: "Weekly digest", desc: "A weekly summary of your open work and activity." },
];

export const ORG_ROLES = [
  { id: "owner", label: "Owner", desc: "Full control, including promoting other owners." },
  { id: "admin", label: "Admin", desc: "Manages settings, members and join requests." },
  { id: "member", label: "Member", desc: "Creates projects and joins org projects." },
  { id: "guest", label: "Guest", desc: "Sees the organization with limited access." },
  { id: "viewer", label: "Viewer", desc: "Read-only access to the organization." },
];

export const PROJECT_ROLES = [
  { id: "admin", label: "Admin", desc: "Everything in the project, including roles and workflows." },
  { id: "lead", label: "Lead", desc: "Manages boards, sprints, releases and config." },
  { id: "developer", label: "Developer", desc: "Edits, transitions and links issues." },
  { id: "reporter", label: "Reporter", desc: "Creates issues, comments and labels." },
  { id: "viewer", label: "Viewer", desc: "Reads the project, issues, wiki and reports." },
  { id: "guest", label: "Guest", desc: "Sees the project record and issues shared with them." },
];

export const TOKEN_SCOPES = [
  { id: "issues:read", label: "Read issues" },
  { id: "issues:write", label: "Write issues" },
  { id: "*", label: "All scopes" },
];

export const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "system", label: "Match system", icon: "mobile" },
];

export const DENSITY_OPTIONS = [
  { id: "comfortable", label: "Comfortable" },
  { id: "compact", label: "Compact" },
];

export const DEFAULT_DENSITY = "comfortable";
