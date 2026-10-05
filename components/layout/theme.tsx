"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
const KEY = "ps-theme";

/** Runs before paint (inlined in <head>) so the first frame has the right theme. */
export const themeScript = `(function(){try{var p=localStorage.getItem('${KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePreference) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const preference = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const mq = matchMedia("(prefers-color-scheme: dark)");
      const onSystem = () => {
        if (read() === "system") apply("system");
        cb();
      };
      mq.addEventListener("change", onSystem);
      return () => {
        listeners.delete(cb);
        mq.removeEventListener("change", onSystem);
      };
    },
    read,
    () => "system" as ThemePreference,
  );

  const setPreference = useCallback((pref: ThemePreference) => {
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      /* storage unavailable — still apply for this session */
    }
    apply(pref);
    listeners.forEach((l) => l());
  }, []);

  return { preference, setPreference };
}

export const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];
