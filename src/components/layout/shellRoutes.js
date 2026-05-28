// Route helpers shared by the mobile shell (tab bar, header, More sheet).
// Ported from the internal helpers of the client's layout/Layout.jsx and layout/Sidebar.jsx.
import { NAV_GROUPS } from '@/metadata/nav';
import { PROJECT_ROLE_ORDER } from '@/utils/permissions';

export const PROJECT_KEY = 'c8r.project';

export const VIEW_BY_ROUTE = {
  dashboard: 'dashboard',
  'my-work': 'my-work',
  board: 'board-hub',
  calendar: 'calendar',
  notifications: 'notifications',
  ai: 'ai',
  help: 'help',
  settings: 'profile',
  orgs: 'orgs',
  projects: 'projects',
};

export const VIEW_BY_PROJECT_SEGMENT = {
  issues: 'issues',
  board: 'pipeline',
  backlog: 'backlog',
  releases: 'releases',
  timesheet: 'timesheet',
  wiki: 'wiki',
  reports: 'reports',
  dashboards: 'dashboards',
  goals: 'goals',
  automation: 'automation',
  integrations: 'integrations',
  desk: 'desk',
  forms: 'forms',
  tests: 'tests',
  risks: 'risks',
  budget: 'budget',
  cat: 'cat',
  settings: 'project-settings',
};

// Top-level routes that act as tab roots (no back button in the header).
export const ROOT_ROUTES = ['/dashboard', '/my-work', '/board', '/calendar', '/notifications', '/ai', '/help', '/settings', '/orgs', '/projects'];

export const projectIdFromPath = (pathname = '') => {
  const match = /^\/p\/([^/]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

export const viewFor = (pathname = '') => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'p') return VIEW_BY_PROJECT_SEGMENT[parts[2]] ?? 'project-overview';
  if (parts[0] === 'settings' && parts[1]) {
    return { profile: 'profile', notifications: 'notification-prefs', security: 'security', appearance: 'appearance' }[parts[1]] ?? 'profile';
  }
  if (parts[0] === 'orgs' && parts[2]) return `org-${parts[2]}`;
  return VIEW_BY_ROUTE[parts[0]] ?? null;
};

const rank = (role) => PROJECT_ROLE_ORDER.indexOf(role);
export const allowed = (item, role) => !item.requires || (role && rank(role) >= rank(item.requires));

// Grouped, role-filtered nav. Project group only with a project id.
export function buildNavGroups({ pid, role }) {
  return NAV_GROUPS.filter((g) => !g.project || pid)
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => allowed(item, role)).map((item) => ({ ...item, href: item.to(pid) })),
    }))
    .filter((g) => g.items.length > 0);
}

// The active item is the one with the longest matching href.
export function activeIdFor(items, pathname) {
  let activeId = null;
  let best = -1;
  items.forEach((item) => {
    if (!item.href) return;
    const hit = pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (hit && item.href.length > best) {
      best = item.href.length;
      activeId = item.id;
    }
  });
  return activeId;
}
