"use client";

import type { ResolvedTheme, ThemePreference } from "@/types/theme";

export const THEME_PREFERENCE_STORAGE_KEY = "theme-preference";
const THEME_PREFERENCE_EVENT = "theme-preference-change";

const themePreferences: ThemePreference[] = ["light", "dark", "system"];

export const isThemePreference = (
  value: string | null,
): value is ThemePreference =>
  value !== null && themePreferences.includes(value as ThemePreference);

export const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
};

const resolveSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const resolveThemePreference = (
  preference: ThemePreference,
): ResolvedTheme =>
  preference === "system" ? resolveSystemTheme() : preference;

export const applyThemePreference = (preference: ThemePreference) => {
  if (typeof document === "undefined") {
    return;
  }

  if (preference === "system") {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.removeProperty("color-scheme");
    return;
  }

  document.documentElement.setAttribute("data-theme", preference);
  document.documentElement.style.colorScheme = preference;
};

export const setStoredThemePreference = (preference: ThemePreference) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  window.dispatchEvent(
    new CustomEvent<ThemePreference>(THEME_PREFERENCE_EVENT, {
      detail: preference,
    }),
  );
};

export const onThemePreferenceChange = (
  handler: (preference: ThemePreference) => void,
) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ThemePreference>;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  };

  window.addEventListener(THEME_PREFERENCE_EVENT, listener);
  return () => window.removeEventListener(THEME_PREFERENCE_EVENT, listener);
};

export const onSystemThemeChange = (
  handler: (theme: ResolvedTheme) => void,
) => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = (event: MediaQueryListEvent) => {
    handler(event.matches ? "dark" : "light");
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", listener);
  } else {
    mediaQuery.addListener(listener);
  }

  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener("change", listener);
    } else {
      mediaQuery.removeListener(listener);
    }
  };
};
