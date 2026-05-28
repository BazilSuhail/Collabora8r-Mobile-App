import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;

export const listOrgProjects = (orgId, params) => api.get(`/orgs/${orgId}/projects`, { params });
export const createOrgProject = (orgId, body) => api.post(`/orgs/${orgId}/projects`, body);
export const listPersonalProjects = () => api.get("/projects/personal");
export const createPersonalProject = (body) => api.post("/projects/personal", body);

export const getProject = (pid) => api.get(P(pid));
export const updateProject = (pid, body) => api.patch(P(pid), body);
// The server's DELETE on a project archives it.
export const archiveProject = (pid) => api.delete(P(pid));

export const listProjectMembers = (pid, params) => api.get(`${P(pid)}/members`, { params });
export const addProjectMember = (pid, body) => api.post(`${P(pid)}/members`, body);
export const updateProjectMember = (pid, userId, body) =>
  api.patch(`${P(pid)}/members/${userId}`, body);
export const removeProjectMember = (pid, userId) => api.delete(`${P(pid)}/members/${userId}`);

export const listProjectInvites = (pid, params) => api.get(`${P(pid)}/invites`, { params });
export const createProjectInvite = (pid, body) => api.post(`${P(pid)}/invites`, body);
export const revokeProjectInvite = (pid, inviteId) =>
  api.delete(`${P(pid)}/invites/${inviteId}`);
export const acceptProjectInvite = (token) => api.post("/projects/invites/accept", { token });

export const listProjectJoinRequests = (pid, params) =>
  api.get(`${P(pid)}/join-requests`, { params });
export const requestProjectJoin = (pid, body) => api.post(`${P(pid)}/join-requests`, body);
export const decideProjectJoin = (pid, requestId, body) =>
  api.post(`${P(pid)}/join-requests/${requestId}/decide`, body);

export const listRoles = (pid, params) => api.get(`${P(pid)}/roles`, { params });
export const createRole = (pid, body) => api.post(`${P(pid)}/roles`, body);
export const getRole = (pid, roleId) => api.get(`${P(pid)}/roles/${roleId}`);
export const updateRole = (pid, roleId, body) => api.patch(`${P(pid)}/roles/${roleId}`, body);
export const deleteRole = (pid, roleId) => api.delete(`${P(pid)}/roles/${roleId}`);

export const listActivity = (pid, params) => api.get(`${P(pid)}/activity`, { params });
export const listProjectAudit = (pid, params) => api.get(`${P(pid)}/audit`, { params });
