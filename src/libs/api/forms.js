import { api } from "../axios.js";

const F = (pid) => `/projects/${pid}/forms`;

export const listForms = (pid, params) => api.get(F(pid), { params });
export const createForm = (pid, body) => api.post(F(pid), body);
export const getForm = (pid, formId) => api.get(`${F(pid)}/${formId}`);
export const updateForm = (pid, formId, body) => api.patch(`${F(pid)}/${formId}`, body);
export const deleteForm = (pid, formId) => api.delete(`${F(pid)}/${formId}`);
export const listSubmissions = (pid, formId, params) =>
  api.get(`${F(pid)}/${formId}/submissions`, { params });

export const getPublicForm = (publicKey) => api.get(`/public/forms/${publicKey}`);
export const submitPublicForm = (publicKey, body) =>
  api.post(`/public/forms/${publicKey}/submit`, body);
