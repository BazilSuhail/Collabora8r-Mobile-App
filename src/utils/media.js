// Preset avatars and project themes are bundled in assets/avatars and assets/themes.
// The server stores only the file name (for example "3.jpg"). The client maps it to a bundled image.
// Mobile: avatarPath/themePath return an <Image source> value (a require() id), not a URL string.
export const AVATAR_KEYS = Array.from({ length: 12 }, (_, i) => `${i + 1}.jpg`);
export const THEME_KEYS = Array.from({ length: 7 }, (_, i) => `${i + 1}.jpg`);

// Metro needs static require() calls.
const AVATARS = {
  "1.jpg": require("../../assets/avatars/1.jpg"),
  "2.jpg": require("../../assets/avatars/2.jpg"),
  "3.jpg": require("../../assets/avatars/3.jpg"),
  "4.jpg": require("../../assets/avatars/4.jpg"),
  "5.jpg": require("../../assets/avatars/5.jpg"),
  "6.jpg": require("../../assets/avatars/6.jpg"),
  "7.jpg": require("../../assets/avatars/7.jpg"),
  "8.jpg": require("../../assets/avatars/8.jpg"),
  "9.jpg": require("../../assets/avatars/9.jpg"),
  "10.jpg": require("../../assets/avatars/10.jpg"),
  "11.jpg": require("../../assets/avatars/11.jpg"),
  "12.jpg": require("../../assets/avatars/12.jpg"),
};

const THEMES = {
  "1.jpg": require("../../assets/themes/1.jpg"),
  "2.jpg": require("../../assets/themes/2.jpg"),
  "3.jpg": require("../../assets/themes/3.jpg"),
  "4.jpg": require("../../assets/themes/4.jpg"),
  "5.jpg": require("../../assets/themes/5.jpg"),
  "6.jpg": require("../../assets/themes/6.jpg"),
  "7.jpg": require("../../assets/themes/7.jpg"),
};

const isKey = (key, list) => typeof key === "string" && list.includes(key);

export const avatarPath = (key) => (isKey(key, AVATAR_KEYS) ? AVATARS[key] : null);
export const themePath = (key) => (isKey(key, THEME_KEYS) ? THEMES[key] : null);

// Preset avatar first, then an uploaded URL ({ uri }), then null (the initials fallback).
// The result can be passed straight to <Image source={...} />.
export const userAvatarSrc = (user) =>
  avatarPath(user?.avatarKey) ?? (user?.avatarUrl ? { uri: user.avatarUrl } : null);
