// Token storage. The access token lives in memory only. The refresh token is an httpOnly cookie
// set by the server, so JavaScript never sees it.
let accessToken = null;
const accessListeners = new Set();

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token ?? null;
  accessListeners.forEach((listener) => listener(accessToken));
};

export const onAccessChange = (listener) => {
  accessListeners.add(listener);
  return () => {
    accessListeners.delete(listener);
  };
};

export const clearTokens = () => {
  setAccessToken(null);
};
