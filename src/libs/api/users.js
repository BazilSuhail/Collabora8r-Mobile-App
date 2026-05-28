import { api } from "../axios.js";

export const getMe = () => api.get("/users/me");
export const updateMe = (body) => api.patch("/users/me", body);
export const searchUsers = (q) => api.get("/users/search", { params: { q } });

export const getPrefs = () => api.get("/users/me/notification-prefs");
export const putPrefs = (body) => api.put("/users/me/notification-prefs", body);

export const listTokens = () => api.get("/users/me/api-tokens");
export const createToken = (body) => api.post("/users/me/api-tokens", body);
export const revokeToken = (tokenId) => api.delete(`/users/me/api-tokens/${tokenId}`);

export const listSessions = () => api.get("/users/me/sessions");
export const revokeSession = (sessionId) => api.delete(`/users/me/sessions/${sessionId}`);
