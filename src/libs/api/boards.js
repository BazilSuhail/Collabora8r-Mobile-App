import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;

export const listBoards = (pid, params) => api.get(`${P(pid)}/boards`, { params });
export const createBoard = (pid, body) => api.post(`${P(pid)}/boards`, body);
export const getBoard = (pid, boardId) => api.get(`${P(pid)}/boards/${boardId}`);
export const updateBoard = (pid, boardId, body) => api.patch(`${P(pid)}/boards/${boardId}`, body);
export const deleteBoard = (pid, boardId) => api.delete(`${P(pid)}/boards/${boardId}`);
export const getBoardIssues = (pid, boardId, params) =>
  api.get(`${P(pid)}/boards/${boardId}/issues`, { params });
export const getBacklog = (pid, params) => api.get(`${P(pid)}/backlog`, { params });
export const rankIssue = (pid, issueId, body) =>
  api.patch(`${P(pid)}/issues/${issueId}/rank`, body);

export const listSprints = (pid, params) => api.get(`${P(pid)}/sprints`, { params });
export const createSprint = (pid, body) => api.post(`${P(pid)}/sprints`, body);
export const getSprint = (pid, sprintId) => api.get(`${P(pid)}/sprints/${sprintId}`);
export const updateSprint = (pid, sprintId, body) =>
  api.patch(`${P(pid)}/sprints/${sprintId}`, body);
export const startSprint = (pid, sprintId, body = {}) =>
  api.post(`${P(pid)}/sprints/${sprintId}/start`, body);
export const completeSprint = (pid, sprintId, body = {}) =>
  api.post(`${P(pid)}/sprints/${sprintId}/complete`, body);
export const deleteSprint = (pid, sprintId) => api.delete(`${P(pid)}/sprints/${sprintId}`);

export const listReleases = (pid, params) => api.get(`${P(pid)}/releases`, { params });
export const createRelease = (pid, body) => api.post(`${P(pid)}/releases`, body);
export const getRelease = (pid, releaseId) => api.get(`${P(pid)}/releases/${releaseId}`);
export const updateRelease = (pid, releaseId, body) =>
  api.patch(`${P(pid)}/releases/${releaseId}`, body);
export const shipRelease = (pid, releaseId) => api.post(`${P(pid)}/releases/${releaseId}/ship`);
export const deleteRelease = (pid, releaseId) => api.delete(`${P(pid)}/releases/${releaseId}`);
