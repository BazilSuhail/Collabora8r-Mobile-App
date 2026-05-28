// Non-sensitive key/value storage (replaces localStorage). Values are JSON encoded.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const get = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
};

export const set = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is a convenience. Ignore write failures.
  }
};

export const remove = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export default { get, set, remove };
