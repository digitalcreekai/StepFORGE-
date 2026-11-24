import type { CheckoutProgress } from "../../types/storage.ts";
import { STORAGE_KEYS } from "./storageKeys.ts";
import { getStoredValue, removeStoredValue, setStoredValue } from "./localStorage.ts";

const SENSITIVE_FIELD = /password|passphrase|secret|token|authorization|card(number|holder)?|cvv|cvc|security.?code/i;

function containsSensitiveField(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsSensitiveField);
  return Object.entries(value).some(([key, child]) => SENSITIVE_FIELD.test(key) || containsSensitiveField(child));
}

/** Persists only non-sensitive progress. Sensitive-looking property names are rejected. */
export function saveCheckoutProgress(progress: CheckoutProgress): boolean {
  if (!progress || typeof progress !== "object" || containsSensitiveField(progress)) return false;
  return setStoredValue(STORAGE_KEYS.checkoutProgress, progress);
}

export function getCheckoutProgress<T extends CheckoutProgress = CheckoutProgress>(): T | null {
  return getStoredValue<T | null>(STORAGE_KEYS.checkoutProgress, null);
}

export function clearCheckoutProgress(): boolean {
  return removeStoredValue(STORAGE_KEYS.checkoutProgress);
}
