import type { ProvisionalCartItem } from "../../types/storage.ts";
import { STORAGE_KEYS } from "./storageKeys.ts";
import { getStoredValue, setStoredValue } from "./localStorage.ts";

function isCartItem(value: unknown): value is ProvisionalCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ProvisionalCartItem>;
  return typeof item.productId === "string" && item.productId.length > 0
    && typeof item.name === "string" && Number.isFinite(item.price) && (item.price as number) >= 0
    && Number.isInteger(item.quantity) && (item.quantity as number) > 0
    && (item.image === undefined || typeof item.image === "string");
}

export function getCartItems(): ProvisionalCartItem[] {
  const value = getStoredValue<unknown>(STORAGE_KEYS.cart, []);
  return Array.isArray(value) ? value.filter(isCartItem) : [];
}

export function saveCartItems(items: ProvisionalCartItem[]): boolean {
  if (!Array.isArray(items) || !items.every(isCartItem)) return false;
  return setStoredValue(STORAGE_KEYS.cart, items);
}

/** Add a new line or increase the existing product line quantity. */
export function addCartItem(item: ProvisionalCartItem): boolean {
  if (!isCartItem(item)) return false;
  const items = getCartItems();
  const existing = items.find((line) => line.productId === item.productId);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  return saveCartItems(items);
}

export function updateCartItemQuantity(productId: string, quantity: number): boolean {
  if (!Number.isInteger(quantity) || quantity <= 0) return false;
  const items = getCartItems();
  const item = items.find((line) => line.productId === productId);
  if (!item) return false;
  item.quantity = quantity;
  return saveCartItems(items);
}

export function removeCartItem(productId: string): boolean {
  return saveCartItems(getCartItems().filter((item) => item.productId !== productId));
}

export function clearCart(): boolean {
  return saveCartItems([]);
}

export function getCartSubtotal(): number {
  return getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
