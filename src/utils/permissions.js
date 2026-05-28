// Role ladders and the minimum role per action. Source: the server README permissions table.
export const ORG_ROLE_ORDER = ['viewer', 'guest', 'member', 'admin', 'owner'];
export const PROJECT_ROLE_ORDER = ['guest', 'viewer', 'reporter', 'developer', 'lead', 'admin'];

const ORG_ACTIONS = {
  'org.view': 'guest',
  'org.members.view': 'member',
  'project.create': 'member',
  'org.admin': 'admin',
  'org.delete': 'owner',
};

const PROJECT_ACTIONS = {
  'project.view': 'viewer',
  'project.admin': 'admin',
  'issue.create': 'reporter',
  'issue.edit': 'developer',
  'issue.delete': 'lead',
  'issue.bulk': 'developer',
  'issue.rank': 'developer',
  'comment.create': 'reporter',
  'label.create': 'reporter',
  'label.delete': 'admin',
  'dashboard.create': 'reporter',
  'filter.create': 'reporter',
  'worklog.edit': 'developer',
  'link.edit': 'developer',
  'attachment.edit': 'developer',
  'wiki.page.edit': 'developer',
  'wiki.page.delete': 'lead',
  'wiki.space.manage': 'lead',
  'goal.progress': 'developer',
  'goal.manage': 'lead',
  'test.edit': 'developer',
  'risk.edit': 'developer',
  'budget.edit': 'developer',
  'cat.edit': 'developer',
  'board.manage': 'lead',
  'sprint.manage': 'lead',
  'release.manage': 'lead',
  'config.manage': 'lead',
  'config.delete': 'admin',
  'form.manage': 'lead',
  'role.manage': 'admin',
  'workflow.manage': 'admin',
  'member.manage': 'admin',
  'invite.manage': 'admin',
  'automation.manage': 'admin',
  'webhook.manage': 'admin',
  'integration.manage': 'admin',
  'audit.view': 'admin',
  'approval.decide': 'guest',
};

// Returns true when role meets the minimum for action. Unknown actions and unknown roles are denied.
export const can = (role, action, scope = 'project') => {
  const table = scope === 'org' ? ORG_ACTIONS : PROJECT_ACTIONS;
  const order = scope === 'org' ? ORG_ROLE_ORDER : PROJECT_ROLE_ORDER;
  const minimum = table[action];
  if (!minimum) return false;
  const have = order.indexOf(role);
  return have >= 0 && have >= order.indexOf(minimum);
};
