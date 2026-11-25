import { STORAGE_KEYS } from "./storageKeys.ts";
import { getStoredValue, setStoredValue } from "./localStorage.ts";

function validIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string" && id.length > 0) : [];
}

export function getRecentlyViewedProducts(): string[] {
  return validIds(getStoredValue<unknown>(STORAGE_KEYS.recentlyViewed, []));
}

export function recordViewedProduct(productId: string, maxItems = 10): boolean {
  if (!productId || !Number.isInteger(maxItems) || maxItems < 0) return false;
  const items = getRecentlyViewedProducts().filter((id) => id !== productId);
  if (maxItems > 0) items.unshift(productId);
  return setStoredValue(STORAGE_KEYS.recentlyViewed, items.slice(0, maxItems));
}

export function clearRecentlyViewedProducts(): boolean {
  return setStoredValue(STORAGE_KEYS.recentlyViewed, []);
}
