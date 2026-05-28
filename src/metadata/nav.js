import { paths } from "@/routes/paths";

// requires: minimum project role to see the entry (null = any signed-in user).
// project: true = only shown when a project is selected; `to` receives the project id.
export const MAIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", to: () => paths.dashboard(), requires: null },
  { id: "my-work", label: "My work", icon: "tasks", to: () => paths.myWork(), requires: null },
  { id: "calendar", label: "Calendar", icon: "calendar", to: () => paths.calendar(), requires: null },
  { id: "notifications", label: "Notifications", icon: "bell", to: () => paths.notifications(), requires: null },
  { id: "projects", label: "Projects", icon: "project", to: () => paths.projects(), requires: null },
  { id: "board-hub", label: "Board", icon: "kanban", to: () => paths.boardHub(), requires: null },
];

export const PROJECT_NAV = [
  { id: "overview", label: "Overview", icon: "home", to: (pid) => paths.project(pid), requires: "viewer" },
  { id: "issues", label: "Issues", icon: "task", to: (pid) => paths.issues(pid), requires: "viewer" },
  { id: "board", label: "Board", icon: "kanban", to: (pid) => paths.board(pid), requires: "viewer" },
  { id: "backlog", label: "Backlog", icon: "backlog", to: (pid) => paths.backlog(pid), requires: "viewer" },
  { id: "releases", label: "Releases", icon: "release", to: (pid) => paths.releases(pid), requires: "viewer" },
  { id: "timesheet", label: "Timesheet", icon: "timesheet", to: (pid) => paths.timesheet(pid), requires: "viewer" },
  { id: "wiki", label: "Wiki", icon: "wiki", to: (pid) => paths.wiki(pid), requires: "viewer" },
  { id: "reports", label: "Reports", icon: "analytics", to: (pid) => paths.reports(pid), requires: "viewer" },
  { id: "dashboards", label: "Dashboards", icon: "dashboard", to: (pid) => paths.dashboards(pid), requires: "viewer" },
  { id: "goals", label: "Goals", icon: "goal", to: (pid) => paths.goals(pid), requires: "viewer" },
  { id: "desk", label: "Service desk", icon: "servicedesk", to: (pid) => paths.desk(pid), requires: "viewer" },
  { id: "forms", label: "Forms", icon: "form", to: (pid) => paths.forms(pid), requires: "viewer" },
  { id: "tests", label: "Tests", icon: "test", to: (pid) => paths.tests(pid), requires: "viewer" },
  { id: "risks", label: "Risks", icon: "risk", to: (pid) => paths.risks(pid), requires: "viewer" },
  { id: "budget", label: "Budget", icon: "budget", to: (pid) => paths.budget(pid), requires: "viewer" },
  { id: "cat", label: "Translation", icon: "translate", to: (pid) => paths.cat(pid), requires: "viewer" },
  { id: "automation", label: "Automation", icon: "automation", to: (pid) => paths.automation(pid), requires: "admin" },
  { id: "integrations", label: "Integrations", icon: "plug", to: (pid) => paths.integrations(pid), requires: "admin" },
  { id: "project-settings", label: "Project settings", icon: "gear", to: (pid) => paths.projectSettings(pid), requires: "lead" },
];

export const SETTINGS_NAV = [
  { id: "settings", label: "Settings", icon: "settings", to: () => paths.settings(), requires: null },
  { id: "organization", label: "Organization", icon: "building", to: () => paths.orgs(), requires: null },
  { id: "ai", label: "AI drafts", icon: "sparkle", to: () => paths.ai(), requires: null },
  { id: "help", label: "Help", icon: "help", to: () => paths.help(), requires: null },
];

// Bottom tab bar (small screens). `to` null opens the More sheet.
export const BOTTOM_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "home", to: () => paths.dashboard(), project: false },
  { id: "issues", label: "Issues", icon: "task", to: (pid) => paths.issues(pid), project: true },
  { id: "board-hub", label: "Board", icon: "kanban", to: () => paths.boardHub(), project: false },
  { id: "my-work", label: "My work", icon: "tasks", to: () => paths.myWork(), project: false },
  { id: "more", label: "More", icon: "menu", to: null, project: false },
];

export const NAV_GROUPS = [
  { id: "main", label: "Main menu", items: MAIN_NAV },
  { id: "project", label: "Project", items: PROJECT_NAV, project: true },
  { id: "settings", label: "Settings", items: SETTINGS_NAV },
];
