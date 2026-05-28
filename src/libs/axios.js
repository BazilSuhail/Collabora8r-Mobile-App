import axios from 'axios';
import { OFFLINE_MESSAGE, toApiError } from './apiError.js';
import { API_BASE, isExcludedPath, refreshTokens } from './refresh.js';
import { getAccessToken } from './tokenStore.js';

export { setAccessToken } from './tokenStore.js';
export { onSessionEnd as onAuthFailure } from './refresh.js';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true,
});

// ToastProvider registers the handler. It receives { type: 'error' | 'warning' | 'info', kind, message }.
let errorToaster = () => {};

export const setErrorToaster = (fn) => {
  errorToaster = fn;
};

const notify = (type, kind, message) => errorToaster({ type, kind, message });

// Forms that show their own inline errors. They never toast 401, 403 or 429.
const AUTH_FORM = /\/auth\/(login|register|change-password)$/;

let aiNoticeShown = false;

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  config._sentToken = token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => ({ data: response.data?.data ?? null, meta: response.data?.meta }),
  async (error) => {
    if (axios.isCancel(error)) throw error;

    const config = error.config ?? {};
    const status = error.response?.status;
    const url = config.url ?? '';

    if (status === 401 && !config._retry && !isExcludedPath(url)) {
      config._retry = true;
      let token;
      try {
        token = await refreshTokens(config._sentToken ?? null);
      } catch (refreshError) {
        if (refreshError.sessionEnded) {
          if (refreshError.reason === 'expired') notify('error', 'lock', 'Your session ended. Sign in again.');
          throw toApiError(error);
        }
        if (!refreshError.response) notify('error', 'offline', OFFLINE_MESSAGE);
        throw toApiError(refreshError);
      }
      config.headers.Authorization = `Bearer ${token}`;
      return api.request(config);
    }

    const apiError = toApiError(error);
    if (!error.response) {
      notify('error', 'offline', OFFLINE_MESSAGE);
    } else if (status === 503 && url.includes('/ai/')) {
      if (!aiNoticeShown) {
        aiNoticeShown = true;
        notify('info', 'info', 'AI is not configured on this server.');
      }
    } else if (status >= 500) {
      notify('error', 'offline', OFFLINE_MESSAGE);
    } else if (status === 413) {
      notify('error', 'alert', 'That is too large');
    } else if (status === 429 && !AUTH_FORM.test(url)) {
      notify('warning', 'alert', apiError.message);
    } else if (status === 403 && !AUTH_FORM.test(url)) {
      notify('error', 'alert', 'You do not have access to that.');
    }
    // 401 and 422 never toast. Pages show them inline.
    throw apiError;
  },
);
