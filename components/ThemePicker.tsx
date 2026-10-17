"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "system" | "light" | "dark";
const STORAGE_KEY = "typearena-theme";

function readTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

export function ThemePicker() {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      const saved = readTheme();
      if (selectRef.current) selectRef.current.value = saved;
      applyTheme(saved);
    };
    update();
    const frame = requestAnimationFrame(() => setReady(true));
    window.addEventListener("storage", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", update);
    };
  }, []);

  function changeTheme(next: Theme) {
    applyTheme(next);
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The visible choice still works for this visit when storage is disabled.
    }
  }

  return (
    <label className="theme-picker">
      <span>Theme</span>
      <select
        ref={selectRef}
        name="theme"
        aria-label="Theme"
        disabled={!ready}
        defaultValue="system"
        onChange={(event) => changeTheme(event.target.value as Theme)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
