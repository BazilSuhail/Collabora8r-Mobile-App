import { api } from "../axios.js";

export const listNotifications = (params) => api.get("/notifications", { params });
export const unreadCount = (params = {}) => api.get("/notifications/unread-count", { params });
export const markRead = (notificationId) => api.post(`/notifications/${notificationId}/read`);
export const markAllRead = (body = {}) => api.post("/notifications/read-all", body);
