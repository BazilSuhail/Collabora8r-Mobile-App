// Device preferences (theme, sidebar mini, drawer, density). Mobile port of the web localStorage hooks.
// Values persist through '@/libs/storage' (AsyncStorage). Every hook instance shares one in-memory store,
// so a change on the Appearance screen updates the whole app at once.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { Appearance, BackHandler, useColorScheme } from "react-native";
import { Uniwind } from "uniwind";
import * as storage from "@/libs/storage";

const KEYS = { theme: "hearth:theme", mini: "hearth:mini", density: "hearth:density" };

let state = { theme: "light", mini: false, drawer: false, density: "comfortable" };
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const update = (patch) => {
  state = { ...state, ...patch };
  emit();
};

const applyTheme = (pref) => {
  try {
    Uniwind.setTheme(pref === "system" ? "system" : pref);
  } catch {
    // Theme engine not ready. The next change applies it.
  }
};

// Load saved preferences once at startup.
// Memoised promise, so every caller waits for the same read (and gets the saved values).
let loading = null;
const readPreferences = async () => {
  const [theme, mini, density] = await Promise.all([
    storage.get(KEYS.theme),
    storage.get(KEYS.mini),
    storage.get(KEYS.density),
  ]);
  update({
    theme: ["light", "dark", "system"].includes(theme) ? theme : "light",
    mini: String(mini) === "1",
    density: density === "compact" ? "compact" : "comfortable",
  });
  applyTheme(state.theme);
  return state;
};
export const loadPreferences = () => {
  if (!loading) loading = readPreferences();
  return loading;
};
loadPreferences();

const useStore = (pick) => useSyncExternalStore(subscribe, () => pick(state));

export function useTheme() {
  const pref = useStore((s) => s.theme);
  const scheme = useColorScheme() ?? Appearance.getColorScheme() ?? "light";
  const resolved = pref === "system" ? (scheme === "dark" ? "dark" : "light") : pref;
  const setPref = useCallback((next) => {
    const value = typeof next === "function" ? next(state.theme) : next;
    update({ theme: value });
    applyTheme(value);
    storage.set(KEYS.theme, value);
  }, []);
  const toggle = useCallback(() => setPref(resolved === "dark" ? "light" : "dark"), [resolved, setPref]);
  return { pref, setPref, resolved, toggle };
}

export function useSidebar() {
  const mini = useStore((s) => s.mini);
  const setMini = useCallback((next) => {
    const value = Boolean(typeof next === "function" ? next(state.mini) : next);
    update({ mini: value });
    storage.set(KEYS.mini, value ? "1" : "0");
  }, []);
  return { mini, setMini, toggle: useCallback(() => setMini((m) => !m), [setMini]) };
}

export function useDrawer() {
  const open = useStore((s) => s.drawer);
  const setOpen = useCallback((next) => {
    update({ drawer: Boolean(typeof next === "function" ? next(state.drawer) : next) });
  }, []);
  // Android back closes the drawer (the web Escape key).
  useEffect(() => {
    if (!open) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open, setOpen]);
  return { open, setOpen, toggle: useCallback(() => setOpen((o) => !o), [setOpen]) };
}

export function useDensity() {
  const density = useStore((s) => s.density);
  const setDensity = useCallback((next) => {
    const value = next === "compact" ? "compact" : "comfortable";
    update({ density: value });
    storage.set(KEYS.density, value);
  }, []);
  return { density, setDensity };
}
