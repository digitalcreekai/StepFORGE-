import type { MockOrderSummary } from "../../types/storage.ts";
import { STORAGE_KEYS } from "./storageKeys.ts";
import { getStoredValue, setStoredValue } from "./localStorage.ts";

function isMockOrder(value: unknown): value is MockOrderSummary {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<MockOrderSummary>;
  return order.kind === "mock-local" && typeof order.orderId === "string"
    && typeof order.createdAt === "string" && Number.isFinite(order.total);
}

export function getMockOrders(): MockOrderSummary[] {
  const orders = getStoredValue<unknown>(STORAGE_KEYS.mockOrders, []);
  return Array.isArray(orders) ? orders.filter(isMockOrder) : [];
}

/** Saves a local mock summary and marks it explicitly as unverified mock data. */
export function saveMockOrder(summary: Omit<MockOrderSummary, "kind">): boolean {
  if (!summary || typeof summary.orderId !== "string" || !summary.orderId
    || typeof summary.createdAt !== "string" || !Number.isFinite(summary.total)) return false;
  const orders = getMockOrders().filter((order) => order.orderId !== summary.orderId);
  orders.unshift({ ...summary, kind: "mock-local" });
  return setStoredValue(STORAGE_KEYS.mockOrders, orders);
}

export function getMockOrderById(orderId: string): MockOrderSummary | null {
  return getMockOrders().find((order) => order.orderId === orderId) ?? null;
}

export function clearMockOrders(): boolean {
  return setStoredValue(STORAGE_KEYS.mockOrders, []);
}
