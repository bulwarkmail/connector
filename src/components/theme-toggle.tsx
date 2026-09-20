"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "./icons";

/**
 * Light and dark, as on bulwarkmail.org and extensions.bulwarkmail.org.
 *
 * The choice is written to `localStorage.theme` and read back by the inline
 * script in layout.tsx before the first paint, so there is no flash. Like the
 * instance list, it never leaves the browser - it is a preference this device
 * holds, not something this site knows about anyone.
 */

const KEY = "theme";

function read(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* blocked or private window */
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // A change in another tab should move this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== KEY) return;
    apply(read());
    for (const l of listeners) l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function apply(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle() {
  // `false` on the server: the button renders the same either way, and the
  // icon only settles once the DOM is there to read the class off.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const theme = useSyncExternalStore(subscribe, () => (mounted ? read() : "light"), () => "light");
  const dark = mounted && theme === "dark";

  const toggle = () => {
    const next = dark ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* the page still changes, the choice just will not survive a reload */
    }
    for (const l of listeners) l();
  };

  return (
    <button
      type="button"
      className="bw-iconbtn"
      onClick={toggle}
      aria-label="Switch between light and dark"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
