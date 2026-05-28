import { api } from "../axios.js";

const S = (pid) => `/projects/${pid}/servicedesk`;

export const listCustomers = (pid, params) => api.get(`${S(pid)}/customers`, { params });
export const getCustomer = (pid, customerId) => api.get(`${S(pid)}/customers/${customerId}`);
export const createCustomer = (pid, body) => api.post(`${S(pid)}/customers`, body);
export const updateCustomer = (pid, customerId, body) =>
  api.patch(`${S(pid)}/customers/${customerId}`, body);
export const deleteCustomer = (pid, customerId) => api.delete(`${S(pid)}/customers/${customerId}`);

export const listRequestTypes = (pid, params) => api.get(`${S(pid)}/request-types`, { params });
export const getRequestType = (pid, requestTypeId) =>
  api.get(`${S(pid)}/request-types/${requestTypeId}`);
export const createRequestType = (pid, body) => api.post(`${S(pid)}/request-types`, body);
export const updateRequestType = (pid, requestTypeId, body) =>
  api.patch(`${S(pid)}/request-types/${requestTypeId}`, body);
export const deleteRequestType = (pid, requestTypeId) =>
  api.delete(`${S(pid)}/request-types/${requestTypeId}`);

export const listSlaPolicies = (pid, params) => api.get(`${S(pid)}/sla-policies`, { params });
export const getSlaPolicy = (pid, policyId) => api.get(`${S(pid)}/sla-policies/${policyId}`);
export const createSlaPolicy = (pid, body) => api.post(`${S(pid)}/sla-policies`, body);
export const updateSlaPolicy = (pid, policyId, body) =>
  api.patch(`${S(pid)}/sla-policies/${policyId}`, body);
export const deleteSlaPolicy = (pid, policyId) => api.delete(`${S(pid)}/sla-policies/${policyId}`);

export const listSlaTimers = (pid, params) => api.get(`${S(pid)}/sla-timers`, { params });
export const pauseTimer = (pid, timerId) => api.post(`${S(pid)}/sla-timers/${timerId}/pause`);
export const resumeTimer = (pid, timerId) => api.post(`${S(pid)}/sla-timers/${timerId}/resume`);

export const listApprovals = (pid, issueId, params) =>
  api.get(`${S(pid)}/issues/${issueId}/approvals`, { params });
export const requestApproval = (pid, issueId, body) =>
  api.post(`${S(pid)}/issues/${issueId}/approvals`, body);
export const decideApproval = (pid, approvalId, body) =>
  api.post(`${S(pid)}/approvals/${approvalId}/decide`, body);
