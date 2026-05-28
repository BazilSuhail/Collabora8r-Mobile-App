import { api } from "../axios.js";

const W = (pid) => `/projects/${pid}/wiki`;

export const listSpaces = (pid, params) => api.get(`${W(pid)}/spaces`, { params });
export const createSpace = (pid, body) => api.post(`${W(pid)}/spaces`, body);
export const updateSpace = (pid, spaceId, body) => api.patch(`${W(pid)}/spaces/${spaceId}`, body);
export const deleteSpace = (pid, spaceId) => api.delete(`${W(pid)}/spaces/${spaceId}`);

export const listPages = (pid, params) => api.get(`${W(pid)}/pages`, { params });
export const getPage = (pid, pageId) => api.get(`${W(pid)}/pages/${pageId}`);
export const createPage = (pid, body) => api.post(`${W(pid)}/pages`, body);
// body carries version (optimistic locking) when the caller has one.
export const updatePage = (pid, pageId, body) => api.patch(`${W(pid)}/pages/${pageId}`, body);
export const deletePage = (pid, pageId) => api.delete(`${W(pid)}/pages/${pageId}`);

export const listVersions = (pid, pageId, params) =>
  api.get(`${W(pid)}/pages/${pageId}/versions`, { params });
export const getVersion = (pid, pageId, versionId) =>
  api.get(`${W(pid)}/pages/${pageId}/versions/${versionId}`);
export const restoreVersion = (pid, pageId, versionId) =>
  api.post(`${W(pid)}/pages/${pageId}/versions/${versionId}/restore`);
