"use client";

import { useEffect, useState } from "react";
import type { ThemePreference } from "@/types/theme";
import {
  applyThemePreference,
  getStoredThemePreference,
  isThemePreference,
  onThemePreferenceChange,
  THEME_PREFERENCE_STORAGE_KEY,
} from "@/lib/theme/client";

export function ThemeProvider() {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    getStoredThemePreference(),
  );

  useEffect(() => {
    const unsubscribePreference = onThemePreferenceChange((nextPreference) => {
      setPreference(nextPreference);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_PREFERENCE_STORAGE_KEY) {
        return;
      }

      const nextPreference = isThemePreference(event.newValue)
        ? event.newValue
        : "system";
      setPreference(nextPreference);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      unsubscribePreference();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  return null;
}
