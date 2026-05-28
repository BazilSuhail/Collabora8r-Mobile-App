import { paths } from "@/routes/paths";

// Static Finder entries. `to` is a path builder (no project id); `action` is handled by the Finder.
export const FINDER_STATIC = [
  { id: "page-dashboard", kind: "Page", label: "Dashboard", keywords: "home overview", to: () => paths.dashboard() },
  { id: "page-my-work", kind: "Page", label: "My work", keywords: "tasks assigned", to: () => paths.myWork() },
  { id: "page-calendar", kind: "Page", label: "Calendar", keywords: "due dates sprints releases", to: () => paths.calendar() },
  { id: "page-notifications", kind: "Page", label: "Notifications", keywords: "inbox unread mentions", to: () => paths.notifications() },
  { id: "page-projects", kind: "Page", label: "Projects", keywords: "workspace", to: () => paths.projects() },
  { id: "page-orgs", kind: "Page", label: "Organizations", keywords: "teams members", to: () => paths.orgs() },
  { id: "page-ai", kind: "Page", label: "AI drafts", keywords: "assistant generate", to: () => paths.ai() },
  { id: "page-help", kind: "Page", label: "Help", keywords: "guides faq support", to: () => paths.help() },
  { id: "page-profile", kind: "Page", label: "Profile settings", keywords: "name avatar timezone", to: () => paths.settingsProfile() },
  { id: "page-security", kind: "Page", label: "Security settings", keywords: "password sessions tokens", to: () => paths.settingsSecurity() },
  { id: "page-appearance", kind: "Page", label: "Appearance settings", keywords: "theme density", to: () => paths.settingsAppearance() },
  { id: "action-new-issue", kind: "Action", label: "New issue", keywords: "create add ticket", action: "new-issue" },
];
