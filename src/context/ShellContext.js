import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { unreadCount } from '@/libs/api/notifications';
import { useAuth } from './AuthContext';

const ShellContext = createContext(null);

const UNREAD_POLL_MS = 60 * 1000;

// The root layout mounts this provider. Shell state: side drawer, Finder, the global create-issue request, unread count.
export function ShellProvider({ children }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === 'authenticated';
  const [drawerState, setDrawerState] = useState({ open: false, name: null, props: null });
  const [finderOpen, setFinderOpen] = useState(false);
  const [createIssue, setCreateIssue] = useState(null);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await unreadCount();
      setUnread(res.data?.count ?? 0);
    } catch {
      // A failed poll keeps the last count. Network toasts still come from the axios layer.
    }
  }, []);

  // Polls every 60 seconds and when the app returns to the foreground. Only while signed in.
  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return undefined;
    }
    refreshUnread();
    const id = setInterval(refreshUnread, UNREAD_POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnread();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [signedIn, refreshUnread]);

  const drawer = useMemo(
    () => ({
      open: drawerState.open,
      name: drawerState.name,
      props: drawerState.props,
      show: (name, props = {}) => setDrawerState({ open: true, name, props }),
      setOpen: (next) => setDrawerState((s) => ({ ...s, open: Boolean(next) })),
    }),
    [drawerState],
  );

  const openFinder = useCallback(() => setFinderOpen(true), []);
  const closeFinder = useCallback(() => setFinderOpen(false), []);
  // A new object on every call, so the host modal re-opens even with the same options.
  const openCreateIssue = useCallback((opts = {}) => setCreateIssue({ ...opts }), []);
  const closeCreateIssue = useCallback(() => setCreateIssue(null), []);

  const value = useMemo(
    () => ({
      drawer,
      finderOpen,
      openFinder,
      closeFinder,
      createIssue,
      openCreateIssue,
      closeCreateIssue,
      unread,
      refreshUnread,
    }),
    [drawer, finderOpen, openFinder, closeFinder, createIssue, openCreateIssue, closeCreateIssue, unread, refreshUnread],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error('useShell must be used inside ShellProvider');
  return value;
}
