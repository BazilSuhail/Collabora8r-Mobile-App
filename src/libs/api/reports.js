import { api } from "../axios.js";

const R = (pid) => `/projects/${pid}/reports`;
const D = (pid) => `/projects/${pid}/dashboards`;
const G = (pid) => `/projects/${pid}/goals`;

export const summary = (pid) => api.get(`${R(pid)}/summary`);
export const createdVsResolved = (pid, params) =>
  api.get(`${R(pid)}/created-vs-resolved`, { params });
export const burndown = (pid, sprintId) =>
  api.get(`${R(pid)}/burndown`, { params: { sprintId } });
export const velocity = (pid) => api.get(`${R(pid)}/velocity`);
export const timeSpent = (pid, params) => api.get(`${R(pid)}/time-spent`, { params });
export const workload = (pid) => api.get(`${R(pid)}/workload`);

export const listDashboards = (pid, params) => api.get(D(pid), { params });
export const createDashboard = (pid, body) => api.post(D(pid), body);
export const getDashboard = (pid, dashboardId) => api.get(`${D(pid)}/${dashboardId}`);
export const updateDashboard = (pid, dashboardId, body) =>
  api.patch(`${D(pid)}/${dashboardId}`, body);
export const deleteDashboard = (pid, dashboardId) => api.delete(`${D(pid)}/${dashboardId}`);

export const listGoals = (pid, params) => api.get(G(pid), { params });
export const createGoal = (pid, body) => api.post(G(pid), body);
export const getGoal = (pid, goalId) => api.get(`${G(pid)}/${goalId}`);
export const updateGoal = (pid, goalId, body) => api.patch(`${G(pid)}/${goalId}`, body);
export const deleteGoal = (pid, goalId) => api.delete(`${G(pid)}/${goalId}`);
export const recordProgress = (pid, goalId, body) => api.post(`${G(pid)}/${goalId}/progress`, body);
