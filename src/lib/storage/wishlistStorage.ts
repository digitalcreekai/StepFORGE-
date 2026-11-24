import { STORAGE_KEYS } from "./storageKeys.ts";
import { getStoredValue, setStoredValue } from "./localStorage.ts";

function validIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))] : [];
}

export function getWishlistItems(): string[] {
  return validIds(getStoredValue<unknown>(STORAGE_KEYS.wishlist, []));
}

export function addWishlistItem(productId: string): boolean {
  if (!productId) return false;
  const items = getWishlistItems();
  if (!items.includes(productId)) items.push(productId);
  return setStoredValue(STORAGE_KEYS.wishlist, items);
}

export function removeWishlistItem(productId: string): boolean {
  return setStoredValue(STORAGE_KEYS.wishlist, getWishlistItems().filter((id) => id !== productId));
}

export function clearWishlist(): boolean {
  return setStoredValue(STORAGE_KEYS.wishlist, []);
}
