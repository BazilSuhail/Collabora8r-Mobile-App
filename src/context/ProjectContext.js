import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { listConfig, listLabels, listWorkflows } from '@/libs/api/config';
import { getProject, listProjectMembers } from '@/libs/api/projects';
import { can as canFor, ORG_ROLE_ORDER, PROJECT_ROLE_ORDER } from '@/utils/permissions';
import { useResource } from '@/utils/useResource';
import * as storage from '@/libs/storage';
import { useAuth } from './AuthContext';
import { useOrg } from './OrgContext';

const ProjectContext = createContext(null);

const MEMBER_PAGE_LIMIT = 100;
const MEMBER_MAX_PAGES = 10;
const EMPTY = [];
const EMPTY_DETAIL = { statuses: EMPTY, types: EMPTY, priorities: EMPTY, resolutions: EMPTY, labels: EMPTY, members: EMPTY };

// Loads every member page (capped), so the caller can be found for their role.
const fetchMembers = async (projectId) => {
  const members = [];
  let cursor = null;
  for (let page = 0; page < MEMBER_MAX_PAGES; page += 1) {
    const res = await listProjectMembers(projectId, {
      limit: MEMBER_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    });
    members.push(...res.data);
    cursor = res.meta?.nextCursor ?? null;
    if (!cursor) break;
  }
  return members;
};

const rowsOf = (result) => (result.status === 'fulfilled' ? (result.value?.data ?? EMPTY) : EMPTY);

// Config reads can be denied to some roles. Each failed read becomes an empty list, not a broken page.
const loadDetail = async (projectId) => {
  const [workflows, types, priorities, resolutions, labels, members] = await Promise.allSettled([
    listWorkflows(projectId, { status: 'live', limit: 1 }),
    listConfig(projectId, 'issue-types', { limit: MEMBER_PAGE_LIMIT }),
    listConfig(projectId, 'priorities', { limit: MEMBER_PAGE_LIMIT }),
    listConfig(projectId, 'resolutions', { limit: MEMBER_PAGE_LIMIT }),
    listLabels(projectId, { limit: MEMBER_PAGE_LIMIT }),
    fetchMembers(projectId),
  ]);
  const live = rowsOf(workflows)[0];
  const statuses = [...(live?.statuses ?? EMPTY)].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    statuses,
    types: rowsOf(types),
    priorities: rowsOf(priorities),
    resolutions: rowsOf(resolutions),
    labels: rowsOf(labels),
    members: members.status === 'fulfilled' ? members.value : EMPTY,
  };
};

// Personal projects have no members: the owner is admin. Org owners and admins are admin.
// Open projects give org members viewer. A custom role id cannot be mapped client side, so it reads as guest.
const resolveRole = ({ project, members, userId, orgRole }) => {
  if (!project || !userId) return null;
  const membership = members.find((m) => m.userId === userId);
  if (membership) return PROJECT_ROLE_ORDER.includes(membership.role) ? membership.role : 'guest';
  if (!project.orgId) return project.ownerId === userId ? 'admin' : null;
  if (orgRole === 'owner' || orgRole === 'admin') return 'admin';
  if (project.visibility === 'open' && ORG_ROLE_ORDER.indexOf(orgRole) >= ORG_ROLE_ORDER.indexOf('member')) {
    return 'viewer';
  }
  return null;
};

export function ProjectProvider({ projectId, children }) {
  const { status: authStatus, user } = useAuth();
  const { orgs } = useOrg();
  const enabled = authStatus === 'authenticated' && Boolean(projectId);

  const projectRes = useResource(
    () => (enabled ? getProject(projectId) : Promise.resolve({ data: null, meta: null })),
    [enabled, projectId],
  );
  const detailRes = useResource(
    async () => ({ data: enabled ? await loadDetail(projectId) : EMPTY_DETAIL, meta: null }),
    [enabled, projectId],
  );

  const project = projectRes.data;
  const detail = detailRes.data ?? EMPTY_DETAIL;
  const orgRole = useMemo(
    () => (project?.orgId ? (orgs.find((o) => o.id === project.orgId)?.role ?? null) : null),
    [orgs, project],
  );
  const role = useMemo(
    () => resolveRole({ project, members: detail.members, userId: user?.id ?? null, orgRole }),
    [project, detail.members, user, orgRole],
  );

  const can = useCallback((action) => canFor(role, action, 'project'), [role]);

  useEffect(() => {
    if (!projectId) return;
    storage.set('c8r.project', projectId);
  }, [projectId]);

  const { reload: reloadProject } = projectRes;
  const { reload: reloadDetail } = detailRes;
  const reload = useCallback(() => {
    reloadProject();
    reloadDetail();
  }, [reloadProject, reloadDetail]);

  const value = useMemo(
    () => ({
      projectId,
      project,
      role,
      can,
      statuses: detail.statuses,
      types: detail.types,
      priorities: detail.priorities,
      resolutions: detail.resolutions,
      labels: detail.labels,
      members: detail.members,
      reload,
      status: projectRes.status,
      error: projectRes.error,
    }),
    [projectId, project, role, can, detail, reload, projectRes.status, projectRes.error],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const value = useContext(ProjectContext);
  if (!value) throw new Error('useProject must be used inside ProjectProvider');
  return value;
}
