// Empty-state copy per Page view. Pages fall back to EMPTY_DEFAULT.

export const EMPTY_DEFAULT = {
  icon: "inbox",
  title: "Nothing here yet",
  text: "Items will show up here once they exist.",
};

export const EMPTY = {
  dashboard: { icon: "home", title: "Your dashboard is empty", text: "Pick a project to see its activity and goals." },
  "my-work": { icon: "tasks", title: "Nothing assigned to you", text: "Issues assigned to you or reported by you appear here." },
  calendar: { icon: "calendar", title: "Nothing due this month", text: "Due dates, sprints and releases for this month appear here." },
  notifications: { icon: "bell", title: "No notifications", text: "Mentions, assignments and updates show up here." },
  ai: { icon: "sparkle", title: "No drafts yet", text: "No drafts yet. Use the AI button in an issue or wiki page." },
  help: { icon: "help", title: "No matching help", text: "Try a different search term." },
  orgs: { icon: "building", title: "No organizations yet", text: "Create an organization or ask an admin to invite you." },
  "org-members": { icon: "users", title: "No members", text: "Invite people to this organization by email." },
  "org-audit": { icon: "list", title: "No audit entries", text: "Changes to this organization are recorded here." },
  projects: { icon: "project", title: "No projects yet", text: "Create a project to start tracking issues." },
  "project-overview": { icon: "project", title: "No activity yet", text: "Activity from this project appears here." },
  issues: { icon: "task", title: "No issues match", text: "Clear the filters or create the first issue." },
  pipeline: { icon: "kanban", title: "This board has no columns", text: "Set up columns from the board settings." },
  backlog: { icon: "backlog", title: "The backlog is empty", text: "Create issues and plan them into sprints." },
  releases: { icon: "release", title: "No releases yet", text: "Create a release to group the issues you ship." },
  timesheet: { icon: "timesheet", title: "No time logged", text: "Log work on an issue to see it here." },
  wiki: { icon: "wiki", title: "No wiki pages yet", text: "Write the first page for this project." },
  reports: { icon: "analytics", title: "No report data yet", text: "Reports fill in as issues move through the workflow." },
  dashboards: { icon: "dashboard", title: "No dashboards yet", text: "Create a dashboard to pin your reports together." },
  goals: { icon: "goal", title: "No goals yet", text: "Set a goal and record progress against it." },
  automation: { icon: "automation", title: "No automation rules", text: "Rules run when issues change." },
  webhooks: { icon: "plug", title: "No webhooks", text: "Add a webhook to send project events to another system." },
  desk: { icon: "servicedesk", title: "The queue is clear", text: "New service requests appear here." },
  forms: { icon: "form", title: "No forms yet", text: "Build an intake form to collect requests from outside the team." },
  tests: { icon: "test", title: "No test cases yet", text: "Add test cases to plan a test run." },
  risks: { icon: "risk", title: "No risks logged", text: "Add a risk to see it on the matrix." },
  budget: { icon: "budget", title: "No budget lines", text: "Add a budget line to track planned and actual cost." },
  cat: { icon: "translate", title: "No entries yet", text: "Add an entry to start the translation memory." },
  "project-members": { icon: "users", title: "No people yet", text: "Add org members to this project." },
  roles: { icon: "shield", title: "No custom roles", text: "System roles apply until you create a custom role." },
  workflows: { icon: "flow", title: "No workflows", text: "Create a workflow to define the statuses an issue moves through." },
  fields: { icon: "list", title: "No custom fields", text: "Add a field to capture extra information on issues." },
  labels: { icon: "hash", title: "No labels yet", text: "Labels group related issues across the project." },
  "project-audit": { icon: "list", title: "No audit entries", text: "Changes to this project are recorded here." },
  "notification-prefs": { icon: "bell", title: "No notification kinds", text: "Notification preferences are unavailable right now." },
};

export const emptyCopy = (view) => EMPTY[view] ?? EMPTY_DEFAULT;
