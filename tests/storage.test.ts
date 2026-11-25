import test from "node:test";
import assert from "node:assert/strict";
import type { StorageLike } from "../src/types/storage.ts";
import {
  addCartItem, addWishlistItem, clearCart, clearMockOrders, clearRecentlyViewedProducts,
  clearStepforgeStorage, clearWishlist, getCartItems, getCartSubtotal, getCheckoutProgress,
  getMockOrderById, getMockOrders, getRecentlyViewedProducts, getStoredValue, getWishlistItems,
  isStorageAvailable, recordViewedProduct, removeCartItem, removeStoredValue, removeWishlistItem,
  saveCartItems, saveCheckoutProgress, saveMockOrder, setStoredValue, updateCartItemQuantity,
  updateStoredValue,
} from "../src/lib/storage/index.ts";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  blocked = false;
  get length() { return this.values.size; }
  getItem(key: string) { if (this.blocked) throw new Error("blocked"); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.blocked) throw new Error("blocked"); this.values.set(key, value); }
  removeItem(key: string) { if (this.blocked) throw new Error("blocked"); this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  seed(key: string, value: string) { this.values.set(key, value); }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });

const item = (productId: string, quantity = 1) => ({ productId, name: `Product ${productId}`, price: 12.5, quantity });

test("generic storage saves, reads, updates, removes, and uses fallback", () => {
  assert.equal(setStoredValue("stepforge:test", { n: 1 }), true);
  assert.deepEqual(getStoredValue("stepforge:test", null), { n: 1 });
  assert.equal(updateStoredValue("stepforge:test", { n: 0 }, (v) => ({ n: v.n + 1 })), true);
  assert.deepEqual(getStoredValue("stepforge:test", null), { n: 2 });
  assert.equal(removeStoredValue("stepforge:test"), true);
  assert.deepEqual(getStoredValue("stepforge:test", "fallback"), "fallback");
});

test("corrupt JSON safely falls back and removes only the malformed entry", () => {
  storage.seed("stepforge:bad", "{");
  assert.deepEqual(getStoredValue("stepforge:bad", []), []);
  assert.equal(storage.getItem("stepforge:bad"), null);
});

test("cart handles empty state, duplicate products, quantity changes, subtotal and clearing", () => {
  clearCart();
  assert.deepEqual(getCartItems(), []);
  assert.equal(addCartItem(item("shoe")), true);
  assert.equal(addCartItem(item("shoe", 2)), true);
  assert.equal(addCartItem(item("sock")), true);
  assert.equal(getCartItems().length, 2);
  assert.equal(getCartItems()[0].quantity, 3);
  assert.equal(updateCartItemQuantity("shoe", 4), true);
  assert.equal(updateCartItemQuantity("shoe", 0), false);
  assert.equal(getCartSubtotal(), 62.5);
  assert.equal(removeCartItem("sock"), true);
  assert.deepEqual(getCartItems().map((line) => line.productId), ["shoe"]);
  assert.equal(clearCart(), true);
  assert.deepEqual(getCartItems(), []);
  assert.equal(saveCartItems([{ ...item("bad"), price: -2 }]), false);
});

test("wishlist prevents duplicates and supports remove and clear", () => {
  clearWishlist();
  assert.equal(addWishlistItem("shoe"), true);
  assert.equal(addWishlistItem("shoe"), true);
  assert.deepEqual(getWishlistItems(), ["shoe"]);
  assert.equal(removeWishlistItem("shoe"), true);
  assert.equal(clearWishlist(), true);
  assert.deepEqual(getWishlistItems(), []);
});

test("recently viewed products move to front, deduplicate and respect a limit", () => {
  clearRecentlyViewedProducts();
  recordViewedProduct("a", 3); recordViewedProduct("b", 3); recordViewedProduct("c", 3);
  recordViewedProduct("a", 3); recordViewedProduct("d", 3);
  assert.deepEqual(getRecentlyViewedProducts(), ["d", "a", "c"]);
  assert.equal(recordViewedProduct("x", -1), false);
});

test("checkout progress is persisted only when it has no sensitive-looking fields", () => {
  assert.equal(saveCheckoutProgress({ step: "shipping", email: "shopper@example.test" }), true);
  assert.deepEqual(getCheckoutProgress(), { step: "shipping", email: "shopper@example.test" });
  assert.equal(saveCheckoutProgress({ payment: { cardNumber: "4111111111111111" } }), false);
  assert.equal(saveCheckoutProgress({ token: "secret" }), false);
});

test("mock orders are marked, retrievable by id, and clearable", () => {
  clearMockOrders();
  assert.equal(saveMockOrder({ orderId: "mock-1", createdAt: "2026-01-01T00:00:00Z", total: 25 }), true);
  assert.equal(getMockOrderById("mock-1")?.kind, "mock-local");
  assert.equal(getMockOrders().length, 1);
  assert.equal(getMockOrderById("missing"), null);
  assert.equal(clearMockOrders(), true);
  assert.deepEqual(getMockOrders(), []);
});

test("availability check and owned-key clearing preserve unrelated keys", () => {
  storage.seed("other-app:keep", "yes");
  assert.equal(isStorageAvailable(), true);
  assert.equal(clearStepforgeStorage(), true);
  assert.equal(storage.getItem("other-app:keep"), "yes");
});

test("unavailable storage returns fallbacks and fails writes safely", () => {
  storage.blocked = true;
  assert.equal(isStorageAvailable(), false);
  assert.deepEqual(getStoredValue("stepforge:unavailable", [1]), [1]);
  assert.equal(setStoredValue("stepforge:unavailable", [1]), false);
  assert.equal(removeStoredValue("stepforge:unavailable"), false);
  storage.blocked = false;
});

test("module operations are safe when browser window is absent", () => {
  const original = globalThis.window;
  Reflect.deleteProperty(globalThis, "window");
  assert.equal(isStorageAvailable(), false);
  assert.deepEqual(getStoredValue("stepforge:ssr", "safe"), "safe");
  assert.equal(setStoredValue("stepforge:ssr", "value"), false);
  Object.defineProperty(globalThis, "window", { configurable: true, value: original });
});
