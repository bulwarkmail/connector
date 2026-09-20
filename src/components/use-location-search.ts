"use client";

import { useSyncExternalStore } from "react";

/**
 * The query string, read from the address bar.
 *
 * The parameters of a connector link are deliberately never part of a request
 * to this origin - the page is a static file, and what it should open is
 * worked out here, in the browser, after that file has loaded. So they are
 * read from `window.location` rather than from a route prop.
 *
 * As an external store rather than an effect: the value exists before React
 * renders, so there is no reason to render once without it.
 */

const EMPTY = new URLSearchParams();

let cached: URLSearchParams | null = null;
let cachedFor: string | null = null;

function getSnapshot(): URLSearchParams {
  const search = window.location.search;
  // Must be referentially stable between renders, or React re-renders forever.
  if (cached === null || cachedFor !== search) {
    cached = new URLSearchParams(search);
    cachedFor = search;
  }
  return cached;
}

function getServerSnapshot(): URLSearchParams {
  return EMPTY;
}

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

export function useLocationSearch(): URLSearchParams {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
