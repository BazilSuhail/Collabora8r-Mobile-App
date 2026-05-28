import axios from "axios";
import { api } from "../axios.js";
import { API_BASE } from "../refresh.js";

export const health = () => api.get("/health");
export const ready = () => api.get("/ready");

// body: { email, password, displayName? }
export const register = (body) => api.post("/auth/register", body);
// body: { email, password }
export const login = (body) => api.post("/auth/login", body);

// No body: the refresh token is an httpOnly cookie. Bare axios on purpose: the instance's 401
// handler must not re-enter the refresh path. Resolves to { data, meta } like every other api function.
export const refresh = async () => {
  const res = await axios.post(`${API_BASE}/auth/refresh`, null, {
    timeout: 15000,
    withCredentials: true,
  });
  return { data: res.data?.data ?? null, meta: res.data?.meta };
};

// No body: the server reads and clears the refresh cookie.
export const logout = () => api.post("/auth/logout");
export const logoutAll = () => api.post("/auth/logout-all");
export const me = () => api.get("/auth/me");
// body: { currentPassword, newPassword }
export const changePassword = (body) => api.post("/auth/change-password", body);
