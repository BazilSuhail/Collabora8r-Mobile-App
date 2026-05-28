import { api } from "../axios.js";

// The server returns every org of the caller (with role) and ignores paging params.
export const listOrgs = (params) => api.get("/orgs", { params });
export const createOrg = (body) => api.post("/orgs", body);
export const getOrg = (orgId) => api.get(`/orgs/${orgId}`);
export const updateOrg = (orgId, body) => api.patch(`/orgs/${orgId}`, body);
// The server's DELETE on an org archives it.
export const archiveOrg = (orgId) => api.delete(`/orgs/${orgId}`);

export const listGroups = (orgId, params) => api.get(`/orgs/${orgId}/groups`, { params });
export const createGroup = (orgId, body) => api.post(`/orgs/${orgId}/groups`, body);
export const getGroup = (orgId, groupId) => api.get(`/orgs/${orgId}/groups/${groupId}`);
export const updateGroup = (orgId, groupId, body) =>
  api.patch(`/orgs/${orgId}/groups/${groupId}`, body);
export const deleteGroup = (orgId, groupId) => api.delete(`/orgs/${orgId}/groups/${groupId}`);

export const listOrgMembers = (orgId, params) => api.get(`/orgs/${orgId}/members`, { params });
export const updateOrgMember = (orgId, userId, body) =>
  api.patch(`/orgs/${orgId}/members/${userId}`, body);
export const removeOrgMember = (orgId, userId) => api.delete(`/orgs/${orgId}/members/${userId}`);

export const listOrgInvites = (orgId) => api.get(`/orgs/${orgId}/invites`);
export const createOrgInvite = (orgId, body) => api.post(`/orgs/${orgId}/invites`, body);
export const revokeOrgInvite = (orgId, inviteId) =>
  api.delete(`/orgs/${orgId}/invites/${inviteId}`);
export const acceptOrgInvite = (token) => api.post("/orgs/invites/accept", { token });

export const listOrgJoinRequests = (orgId, params) =>
  api.get(`/orgs/${orgId}/join-requests`, { params });
export const requestOrgJoin = (orgId, body) => api.post(`/orgs/${orgId}/join-requests`, body);
export const decideOrgJoin = (orgId, requestId, body) =>
  api.post(`/orgs/${orgId}/join-requests/${requestId}/decide`, body);

export const listOrgAudit = (orgId, params) => api.get(`/orgs/${orgId}/audit`, { params });
