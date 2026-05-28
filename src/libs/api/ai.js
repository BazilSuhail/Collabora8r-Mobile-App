import { api } from "../axios.js";

export const createDraft = (body) => api.post("/ai/drafts", body);
export const listDrafts = (params) => api.get("/ai/drafts", { params });
export const getDraft = (draftId) => api.get(`/ai/drafts/${draftId}`);
export const acceptDraft = (draftId, body = {}) => api.post(`/ai/drafts/${draftId}/accept`, body);
export const discardDraft = (draftId) => api.post(`/ai/drafts/${draftId}/discard`);
export const usage = () => api.get("/ai/usage");
