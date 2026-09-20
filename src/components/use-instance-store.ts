"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  EMPTY_STORE,
  STORAGE_KEY,
  forgetEverything,
  loadStore,
  saveStore,
  type Store,
} from "@/lib/instances";

/**
 * The instance list, as an external store.
 *
 * `localStorage` is exactly what `useSyncExternalStore` is for: state that
 * lives outside React, has no value during the prerender, and can change
 * without React doing it. Reading it in an effect would work too, but it
 * makes every page render once with an empty list and then again with the
 * real one - a visible flash of the first-run screen on every visit.
 *
 * Subscribing also gets cross-tab updates for free: remove an instance in one
 * tab and the others stop offering it.
 */

let cached: Store | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // `storage` fires in every *other* tab on this origin, which is where a
  // change we did not make can come from.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    cached = null;
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Must return the same object until something actually changes. */
function getSnapshot(): Store {
  if (cached === null) cached = loadStore();
  return cached;
}

/** There is no storage during the prerender, so the list starts empty. */
function getServerSnapshot(): Store {
  return EMPTY_STORE;
}

const subscribeToHydration = () => () => {};

export function useInstanceStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Distinguishes "nothing stored" from "not read yet", so a page can hold
  // its layout instead of flashing the first-run screen during hydration.
  const ready = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const update = useCallback((next: Store | ((current: Store) => Store)) => {
    const resolved = typeof next === "function" ? next(getSnapshot()) : next;
    cached = resolved;
    saveStore(resolved);
    emit();
  }, []);

  /**
   * Removes the key rather than storing an empty list.
   *
   * Its own function because `update(EMPTY_STORE)` would write `{"instances":
   * []}` straight back, leaving a record behind after someone pressed a
   * button that says everything is gone.
   */
  const clear = useCallback(() => {
    forgetEverything();
    cached = EMPTY_STORE;
    emit();
  }, []);

  return { store, ready, update, clear };
}
