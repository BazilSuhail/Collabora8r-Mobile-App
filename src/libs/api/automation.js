import { api } from "../axios.js";

const A = (pid) => `/projects/${pid}/automation`;
const H = (pid) => `/projects/${pid}/webhooks`;
const N = (pid) => `/projects/${pid}/integrations`;

export const listRules = (pid, params) => api.get(`${A(pid)}/rules`, { params });
export const createRule = (pid, body) => api.post(`${A(pid)}/rules`, body);
export const getRule = (pid, ruleId) => api.get(`${A(pid)}/rules/${ruleId}`);
export const updateRule = (pid, ruleId, body) => api.patch(`${A(pid)}/rules/${ruleId}`, body);
export const deleteRule = (pid, ruleId) => api.delete(`${A(pid)}/rules/${ruleId}`);
export const toggleRule = (pid, ruleId) => api.post(`${A(pid)}/rules/${ruleId}/toggle`);
export const runRule = (pid, ruleId, body = {}) => api.post(`${A(pid)}/rules/${ruleId}/run`, body);
export const listRuleRuns = (pid, ruleId, params) =>
  api.get(`${A(pid)}/rules/${ruleId}/runs`, { params });
export const listRuns = (pid, params) => api.get(`${A(pid)}/runs`, { params });

export const listWebhooks = (pid, params) => api.get(H(pid), { params });
export const createWebhook = (pid, body) => api.post(H(pid), body);
export const getWebhook = (pid, webhookId) => api.get(`${H(pid)}/${webhookId}`);
export const updateWebhook = (pid, webhookId, body) => api.patch(`${H(pid)}/${webhookId}`, body);
export const deleteWebhook = (pid, webhookId) => api.delete(`${H(pid)}/${webhookId}`);
export const testWebhook = (pid, webhookId) => api.post(`${H(pid)}/${webhookId}/test`);
export const listDeliveries = (pid, webhookId, params) =>
  api.get(`${H(pid)}/${webhookId}/deliveries`, { params });
export const redeliver = (pid, webhookId, deliveryId) =>
  api.post(`${H(pid)}/${webhookId}/deliveries/${deliveryId}/redeliver`);

export const listIntegrations = (pid, params) => api.get(N(pid), { params });
export const createIntegration = (pid, body) => api.post(N(pid), body);
export const getIntegration = (pid, integrationId) => api.get(`${N(pid)}/${integrationId}`);
export const updateIntegration = (pid, integrationId, body) =>
  api.patch(`${N(pid)}/${integrationId}`, body);
export const deleteIntegration = (pid, integrationId) => api.delete(`${N(pid)}/${integrationId}`);
export const connectIntegration = (pid, integrationId) =>
  api.post(`${N(pid)}/${integrationId}/connect`);
export const disconnectIntegration = (pid, integrationId) =>
  api.post(`${N(pid)}/${integrationId}/disconnect`);
export const listExternalLinks = (pid, integrationId, params) =>
  api.get(`${N(pid)}/${integrationId}/links`, { params });
export const createExternalLink = (pid, integrationId, body) =>
  api.post(`${N(pid)}/${integrationId}/links`, body);
export const deleteExternalLink = (pid, integrationId, linkId) =>
  api.delete(`${N(pid)}/${integrationId}/links/${linkId}`);
