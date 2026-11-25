import type { StorageLike } from "../../types/storage.ts";
import { STEP_FORGE_STORAGE_PREFIX } from "./storageKeys.ts";

/** Resolve storage only when called, so importing this module during SSR is safe. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    // Access can throw in privacy-restricted or sandboxed browser contexts.
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  const probe = `${STEP_FORGE_STORAGE_PREFIX}availability-probe`;
  try {
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Read JSON, returning fallback for missing, malformed, or unavailable storage. */
export function getStoredValue<T>(key: string, fallback: T): T {
  const storage = getBrowserStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Remove only the corrupt value; callers still receive their safe fallback.
      storage.removeItem(key);
      return fallback;
    }
  } catch {
    return fallback;
  }
}

/** Save JSON. Returns false if serialization or browser storage fails. */
export function setStoredValue<T>(key: string, value: T): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return false;
    storage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

/** Read, transform, and save a value; the updater is not called when storage is unavailable. */
export function updateStoredValue<T>(key: string, fallback: T, updater: (current: T) => T): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  const current = getStoredValue(key, fallback);
  try {
    return setStoredValue(key, updater(current));
  } catch {
    return false;
  }
}

export function removeStoredValue(key: string): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Remove only keys with the Stepforge prefix, preserving unrelated site data. */
export function clearStepforgeStorage(): boolean {
  const storage = getBrowserStorage();
  if (!storage) return false;
  try {
    const ownedKeys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(STEP_FORGE_STORAGE_PREFIX)) ownedKeys.push(key);
    }
    for (const key of ownedKeys) storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
