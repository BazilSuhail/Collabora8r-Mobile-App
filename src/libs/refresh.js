// Token rotation. One refresh runs at a time (single flight). The web client also serialised
// rotation across browser tabs; a mobile app has one JS runtime, so the in-process promise is enough.
// Also covers the proactive renewal timer and the boot refresh.
import axios from 'axios';
import { API_BASE } from '@/config/api';
import { decodeExp } from '@/utils/jwt';
import { clearTokens, getAccessToken, onAccessChange, setAccessToken } from './tokenStore.js';

export { API_BASE };

const LEAD_MS = 60 * 1000;
const MIN_DELAY_MS = 30 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

// Requests that never trigger a refresh on 401. Logout is excluded because its body carries
// the refresh token, which a retry would send after rotation (a reuse that revokes the session).
const EXCLUDED = /\/auth\/(login|register|refresh|change-password|logout)$/;

export const isExcludedPath = (url = '') => EXCLUDED.test(url.split('?')[0]);

export const isFresh = (token) => {
  const exp = decodeExp(token);
  return exp !== null && exp - LEAD_MS > Date.now();
};

const endHandlers = new Set();

export const onSessionEnd = (handler) => {
  endHandlers.add(handler);
  return () => {
    endHandlers.delete(handler);
  };
};

const notifyEnd = (reason) => endHandlers.forEach((handler) => handler(reason));

let timer = null;
const cancelTimer = () => {
  clearTimeout(timer);
  timer = null;
};

export const endSession = (reason) => {
  cancelTimer();
  clearTokens();
  notifyEnd(reason);
};

const sessionLost = (reason) => {
  endSession(reason);
  const error = new Error('Session ended');
  error.sessionEnded = true;
  error.reason = reason;
  return error;
};

export const saveTokens = (tokens) => {
  setAccessToken(tokens.accessToken);
};

// The native networking layer (NSURLSession / OkHttp cookie jar) stores the httpOnly refresh
// cookie and sends it with withCredentials, just like the browser.
const requestRotation = async () => {
  try {
    const res = await axios.post(`${API_BASE}/auth/refresh`, null, {
      timeout: REQUEST_TIMEOUT_MS,
      withCredentials: true,
    });
    return res.data.data.tokens;
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403 || status === 422) throw sessionLost('expired');
    throw error;
  }
};

const rotate = async (staleToken) => {
  const current = getAccessToken();
  if (current && current !== staleToken && isFresh(current)) return current;
  const tokens = await requestRotation();
  saveTokens(tokens);
  return tokens.accessToken;
};

// Single flight: concurrent callers share one promise.
let inFlight = null;

export const refreshTokens = (staleToken = null) => {
  if (!inFlight) {
    inFlight = rotate(staleToken).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

// Schedules renewal from the JWT exp, 60 seconds early. expiresIn is ignored.
const scheduleProactive = (token) => {
  cancelTimer();
  const exp = decodeExp(token);
  if (exp === null) return;
  const delay = Math.max(MIN_DELAY_MS, exp - LEAD_MS - Date.now());
  timer = setTimeout(() => {
    timer = null;
    // A failed renewal is not fatal. The next request that gets a 401 refreshes again.
    refreshTokens(getAccessToken()).catch(() => {});
  }, delay);
};

onAccessChange(scheduleProactive);

const startBoot = async () => {
  const current = getAccessToken();
  if (isFresh(current)) return true;
  // The cookie is invisible to JS, so the refresh call itself decides whether a session exists.
  try {
    await refreshTokens(current);
    return true;
  } catch {
    return false;
  }
};

// Memoised at module level, so a double effect run rotates the token only once.
let boot = null;

export const bootOnce = () => {
  if (!boot) boot = startBoot();
  return boot;
};
