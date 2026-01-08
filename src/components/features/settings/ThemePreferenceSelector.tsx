"use client";

import { useEffect, useId, useState } from "react";
import type { ChangeEvent } from "react";
import type { ThemePreference } from "@/types/theme";
import {
  getStoredThemePreference,
  isThemePreference,
  onThemePreferenceChange,
  setStoredThemePreference,
  THEME_PREFERENCE_STORAGE_KEY,
} from "@/lib/theme/client";

interface ThemePreferenceSelectorProps {
  label: string;
  helpText: string;
  options: {
    light: string;
    dark: string;
    system: string;
  };
}

export function ThemePreferenceSelector({
  label,
  helpText,
  options,
}: ThemePreferenceSelectorProps) {
  const selectId = useId();
  const helpId = `${selectId}-help`;
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

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextPreference = event.target.value;
    if (!isThemePreference(nextPreference)) {
      return;
    }

    setPreference(nextPreference);
    setStoredThemePreference(nextPreference);
  };

  return (
    <div className="form-control">
      <label className="label" htmlFor={selectId}>
        <span className="label-text">{label}</span>
      </label>
      <select
        id={selectId}
        className="select select-bordered w-full"
        value={preference}
        onChange={handleChange}
        aria-describedby={helpId}
      >
        <option value="system">{options.system}</option>
        <option value="light">{options.light}</option>
        <option value="dark">{options.dark}</option>
      </select>
      <p id={helpId} className="mt-2 text-xs text-base-content/70">
        {helpText}
      </p>
    </div>
  );
}
