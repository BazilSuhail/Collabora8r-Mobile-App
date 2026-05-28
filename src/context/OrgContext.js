import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { listOrgs } from '@/libs/api/orgs';
import * as storage from '@/libs/storage';
import { can as canFor } from '@/utils/permissions';
import { useResource } from '@/utils/useResource';
import { useAuth } from './AuthContext';

const OrgContext = createContext(null);

const ORG_KEY = 'c8r.org';
const EMPTY = [];

// The org list carries the caller's role on each org, so no extra member lookup is needed.
export function OrgProvider({ children }) {
  const { status: authStatus } = useAuth();
  const signedIn = authStatus === 'authenticated';
  const [storedId, setStoredId] = useState(null);

  // AsyncStorage is async: the stored selection arrives after the first render.
  useEffect(() => {
    let alive = true;
    storage.get(ORG_KEY).then((id) => {
      if (alive && id) setStoredId((cur) => cur ?? String(id));
    });
    return () => {
      alive = false;
    };
  }, []);

  const orgsRes = useResource(
    () => (signedIn ? listOrgs({ limit: 100 }) : Promise.resolve({ data: EMPTY, meta: null })),
    [signedIn],
  );

  const orgs = useMemo(() => orgsRes.data ?? EMPTY, [orgsRes.data]);
  const org = orgs.find((o) => o.id === storedId) ?? orgs[0] ?? null;
  const orgId = org?.id ?? null;
  const role = org?.role ?? null;

  const setOrgId = useCallback((id) => {
    storage.set(ORG_KEY, id);
    setStoredId(id);
  }, []);

  const can = useCallback((action) => canFor(role, action, 'org'), [role]);

  const value = useMemo(
    () => ({
      orgs,
      org,
      orgId,
      setOrgId,
      role,
      can,
      reload: orgsRes.reload,
      status: orgsRes.status,
      error: orgsRes.error,
    }),
    [orgs, org, orgId, setOrgId, role, can, orgsRes.reload, orgsRes.status, orgsRes.error],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const value = useContext(OrgContext);
  if (!value) throw new Error('useOrg must be used inside OrgProvider');
  return value;
}
