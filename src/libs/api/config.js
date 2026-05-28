import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;

export const listWorkflows = (pid, params) => api.get(`${P(pid)}/workflows`, { params });
export const createWorkflow = (pid, body) => api.post(`${P(pid)}/workflows`, body);
export const getWorkflow = (pid, workflowId) => api.get(`${P(pid)}/workflows/${workflowId}`);
export const updateWorkflow = (pid, workflowId, body) =>
  api.patch(`${P(pid)}/workflows/${workflowId}`, body);
export const publishWorkflow = (pid, workflowId) =>
  api.post(`${P(pid)}/workflows/${workflowId}/publish`);
export const deleteWorkflow = (pid, workflowId) =>
  api.delete(`${P(pid)}/workflows/${workflowId}`);

// seg is one of: issue-types, priorities, resolutions, custom-fields.
export const listConfig = (pid, seg, params) => api.get(`${P(pid)}/${seg}`, { params });
export const getConfig = (pid, seg, id) => api.get(`${P(pid)}/${seg}/${id}`);
export const createConfig = (pid, seg, body) => api.post(`${P(pid)}/${seg}`, body);
export const updateConfig = (pid, seg, id, body) => api.patch(`${P(pid)}/${seg}/${id}`, body);
export const deleteConfig = (pid, seg, id) => api.delete(`${P(pid)}/${seg}/${id}`);

export const listLabels = (pid, params) => api.get(`${P(pid)}/labels`, { params });
export const getLabel = (pid, labelId) => api.get(`${P(pid)}/labels/${labelId}`);
export const createLabel = (pid, body) => api.post(`${P(pid)}/labels`, body);
export const updateLabel = (pid, labelId, body) => api.patch(`${P(pid)}/labels/${labelId}`, body);
export const deleteLabel = (pid, labelId) => api.delete(`${P(pid)}/labels/${labelId}`);

export const listComponents = (pid, params) => api.get(`${P(pid)}/components`, { params });
export const getComponent = (pid, componentId) =>
  api.get(`${P(pid)}/components/${componentId}`);
export const createComponent = (pid, body) => api.post(`${P(pid)}/components`, body);
export const updateComponent = (pid, componentId, body) =>
  api.patch(`${P(pid)}/components/${componentId}`, body);
export const deleteComponent = (pid, componentId) =>
  api.delete(`${P(pid)}/components/${componentId}`);
