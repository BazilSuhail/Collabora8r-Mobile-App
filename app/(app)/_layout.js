// Signed-in shell: bottom tabs + header + More sheet.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useShell } from '@/context/ShellContext';
import { useAuth } from '@/context/AuthContext';
import { useOrg } from '@/context/OrgContext';
import { useTheme } from '@/utils/store';
import { useResource } from '@/utils/useResource';
import { ORG_ROLE_ORDER, PROJECT_ROLE_ORDER } from '@/utils/permissions';
import { pageMeta } from '@/metadata/pages';
import { getProject, listProjectMembers } from '@/libs/api/projects';
import { listGoals } from '@/libs/api/reports';
import { myIssues } from '@/libs/api/myWork';
import storage from '@/libs/storage';
import { paths } from '@/routes/paths';
import Finder from '@/components/Finder';
import IssueFormModal from '@/components/issues/IssueFormModal';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import BottomSheet from '@/components/layout/BottomSheet';
import { PROJECT_KEY, ROOT_ROUTES, projectIdFromPath, viewFor } from '@/components/layout/shellRoutes';
import { useThemeColors } from '@/components/layout/useThemeColors';

const NONE = { data: [], meta: null };

// Role without paging every member. Order: a role the server put on the project payload,
// then the owner/org rules from ProjectContext.resolveRole. Returns undefined when only a
// membership lookup can tell (the More sheet then loads one member page, lazily).
const roleFromProject = (project, userId, orgRole) => {
  if (!project || !userId) return null;
  const direct = project.myRole ?? project.role ?? project.membership?.role ?? null;
  if (direct) return PROJECT_ROLE_ORDER.includes(direct) ? direct : 'guest';
  if (!project.orgId) return project.ownerId === userId ? 'admin' : null;
  if (orgRole === 'owner' || orgRole === 'admin') return 'admin';
  return undefined;
};

const fallbackRole = (project, orgRole) =>
  project?.visibility === 'open' && ORG_ROLE_ORDER.indexOf(orgRole) >= ORG_ROLE_ORDER.indexOf('member') ? 'viewer' : null;

// Signed-in shell: bottom tabs (BOTTOM_NAV), header, More sheet (NAV_GROUPS), Finder and the global
// create-issue modal. Replaces the client's Layout, Sidebar, Header and BottomSheet.
// ShellProvider is mounted by the root layout.
export default function Layout() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const colors = useThemeColors();
  const { status: authStatus, user, logout } = useAuth();
  const { orgs = [] } = useOrg();
  const { drawer, finderOpen, openFinder, closeFinder, createIssue, openCreateIssue, closeCreateIssue, unread } = useShell();
  const theme = useTheme();
  const signedIn = authStatus === 'authenticated';

  // The project in the URL, else the one remembered last (ProjectContext writes it).
  const [remembered, setRemembered] = useState(null);
  const urlPid = projectIdFromPath(pathname);
  useEffect(() => {
    if (urlPid) {
      setRemembered(urlPid);
      return;
    }
    let alive = true;
    storage.get(PROJECT_KEY).then((v) => alive && v && setRemembered(v)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [urlPid]);
  const pid = urlPid ?? remembered;

  const projectRes = useResource(
    () => (signedIn && pid ? getProject(pid) : Promise.resolve({ data: null, meta: null })),
    [signedIn, pid],
  );
  const project = projectRes.status === 'success' ? projectRes.data : null;
  const activePid = project ? pid : null;

  const orgRole = project?.orgId ? (orgs.find((o) => o.id === project.orgId)?.role ?? null) : null;
  const cheapRole = activePid ? roleFromProject(project, user?.id ?? null, orgRole) : null;

  // Membership lookup only when the cheap rules cannot decide, and only once the More sheet opens.
  const navOpen = Boolean(drawer?.open && !drawer?.name);
  const [memberRole, setMemberRole] = useState({ pid: null, role: undefined });
  useEffect(() => {
    if (!navOpen || cheapRole !== undefined || !activePid || memberRole.pid === activePid) return;
    let alive = true;
    listProjectMembers(activePid, { limit: 100 })
      .then((res) => {
        const hit = (res.data ?? []).find((m) => m.userId === user?.id);
        const role = hit ? (PROJECT_ROLE_ORDER.includes(hit.role) ? hit.role : 'guest') : fallbackRole(project, orgRole);
        if (alive) setMemberRole({ pid: activePid, role });
      })
      .catch(() => alive && setMemberRole({ pid: activePid, role: fallbackRole(project, orgRole) }));
    return () => {
      alive = false;
    };
  }, [navOpen, cheapRole, activePid, memberRole.pid, user?.id, project, orgRole]);
  const role =
    cheapRole !== undefined ? cheapRole : memberRole.pid === activePid && memberRole.role !== undefined ? memberRole.role : fallbackRole(project, orgRole);

  const goalsRes = useResource(() => (activePid ? listGoals(activePid, { limit: 5 }) : Promise.resolve(NONE)), [activePid]);
  const goal = (goalsRes.data ?? []).find((g) => g.status !== 'done') ?? null;

  const tasksRes = useResource(() => (signedIn ? myIssues({ limit: 50 }) : Promise.resolve(NONE)), [signedIn]);
  const taskCount = tasksRes.data?.length ?? 0;
  const badges = useMemo(
    () => ({ 'my-work': taskCount ? (tasksRes.meta?.nextCursor || taskCount > 9 ? '9+' : String(taskCount)) : '' }),
    [taskCount, tasksRes.meta],
  );

  const view = viewFor(pathname);
  const crumb = view ? pageMeta(view).crumb : '';

  const setOpen = drawer?.setOpen;
  const show = drawer?.show;
  const closeNav = useCallback(() => setOpen?.(false), [setOpen]);
  const toggleNav = () => (navOpen ? setOpen?.(false) : show?.(null));

  // Route change closes the More sheet.
  useEffect(() => {
    setOpen?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const signOut = () => logout();
  const isRoot = ROOT_ROUTES.includes(pathname);
  const canGoBack = !isRoot && router.canGoBack();

  const newItems = [
    { id: 'issue', label: 'Issue', icon: 'task', disabled: !activePid, onSelect: () => openCreateIssue({ projectId: activePid }) },
    { id: 'sprint', label: 'Sprint', icon: 'sprint', disabled: !activePid, href: activePid ? paths.backlog(activePid) : undefined },
    { id: 'wiki', label: 'Wiki page', icon: 'wiki', disabled: !activePid, href: activePid ? paths.wikiNew(activePid) : undefined },
    { id: 'project', label: 'Project', icon: 'project', href: paths.projects() },
  ];

  return (
    <>
      <Tabs
        backBehavior="history"
        tabBar={() => <BottomNav pathname={pathname} pid={activePid} badges={badges} drawerOpen={navOpen} onMore={toggleNav} />}
        screenOptions={{
          header: () => (
            <Header
              crumb={crumb}
              theme={theme}
              unread={unread}
              onBell={() => router.navigate(paths.notifications())}
              openSearch={openFinder}
              newItems={newItems}
              canGoBack={canGoBack}
              onBack={() => router.back()}
            />
          ),
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: { backgroundColor: colors['side-bg'] ?? colors.surface, borderTopColor: colors['side-line'] ?? colors.border },
        }}
      />

      <BottomSheet
        open={navOpen}
        onClose={closeNav}
        pathname={pathname}
        pid={activePid}
        project={project}
        orgId={project?.orgId ?? null}
        personal={Boolean(project && !project.orgId)}
        role={role}
        badges={badges}
        goal={goal}
        user={user}
        theme={theme}
        openSearch={openFinder}
        onSignOut={signOut}
      />

      <Finder open={finderOpen} onClose={closeFinder} pid={activePid} onNewIssue={() => openCreateIssue({ projectId: activePid })} />
      {createIssue ? (
        <IssueFormModal open onClose={closeCreateIssue} projectId={createIssue.projectId ?? activePid} defaults={createIssue} />
      ) : null}
    </>
  );
}
