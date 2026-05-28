const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// Hermes provides atob on recent React Native. This fallback keeps older runtimes working.
const decode = (input) => {
  if (typeof globalThis.atob === 'function') return globalThis.atob(input);
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of input.replace(/=+$/, '')) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new Error('bad base64');
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
};

// Reads the expiry from an access token without verifying the signature. Returns epoch milliseconds or null.
export const decodeExp = (token) => {
  if (typeof token !== 'string') return null;
  const segment = token.split('.')[1];
  if (!segment) return null;
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decode(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};
