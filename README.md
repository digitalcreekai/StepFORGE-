# Stepforge Local Storage utilities

A TypeScript module for persisting non-sensitive Stepforge shopping state in browser `localStorage`. It contains no pages, components, styling, or product catalog. Browser storage is resolved only when a function is called, so importing the module during Next.js server rendering is safe.

## Structure

```text
src/
  lib/storage/
    localStorage.ts          Generic guarded JSON storage operations
    storageKeys.ts           Namespaced Stepforge keys
    cartStorage.ts           Cart line operations and subtotal
    wishlistStorage.ts       Wishlist product ID operations
    recentlyViewedStorage.ts Recently viewed product ID history
    checkoutStorage.ts       Non-sensitive checkout progress
    orderStorage.ts          Explicitly mock, locally saved order summaries
    index.ts                 Public exports
  types/storage.ts           Storage adapter and provisional domain types
tests/storage.test.ts        Node built-in test suite
```

## Use

Import only in code paths that run in the browser when the user interacts with the app. These functions do not require a component or React hook.

```ts
import { addCartItem, getCartItems, getCartSubtotal } from "./src/lib/storage/index.ts";

addCartItem({ productId: "shoe-1", name: "Example shoe", price: 80, quantity: 1 });
const lines = getCartItems();
const subtotal = getCartSubtotal();
```

Boolean-returning writes report whether the operation succeeded. Reads use safe defaults when storage is missing, corrupt, unavailable, or inaccessible. Cart prices are assumed to use one currency and the subtotal does not include discounts, tax, delivery, or server validation.

## API

### Generic operations (`localStorage.ts`)

- `getBrowserStorage()` returns the browser storage adapter or `null` when unavailable or called during SSR.
- `isStorageAvailable()` probes write and remove access.
- `getStoredValue<T>(key, fallback)` parses JSON and returns the fallback for missing or malformed data; malformed entries are removed.
- `setStoredValue<T>(key, value)` serializes and saves JSON.
- `updateStoredValue<T>(key, fallback, updater)` reads, transforms, and saves a value.
- `removeStoredValue(key)` removes one key.
- `clearStepforgeStorage()` removes keys beginning with the owned `stepforge:` prefix and preserves unrelated site keys.

### Cart (`cartStorage.ts`)

- `getCartItems()` reads valid provisional cart lines, defaulting to `[]`.
- `saveCartItems(items)` validates and saves the full cart.
- `addCartItem(item)` adds a line or adds its quantity to an existing matching `productId`.
- `updateCartItemQuantity(productId, quantity)` sets a positive integer quantity.
- `removeCartItem(productId)` removes a matching line.
- `clearCart()` saves an empty cart.
- `getCartSubtotal()` sums `price * quantity` for valid lines.

### Wishlist and history

- `getWishlistItems()`, `addWishlistItem(productId)`, `removeWishlistItem(productId)`, and `clearWishlist()` manage unique product IDs.
- `getRecentlyViewedProducts()`, `recordViewedProduct(productId, maxItems = 10)`, and `clearRecentlyViewedProducts()` manage unique IDs, newest first, with a configurable limit.

### Checkout and orders

- `saveCheckoutProgress(progress)` and `getCheckoutProgress<T>()` persist/retrieve non-sensitive progress; save rejects objects containing sensitive-looking field names such as `password`, `token`, `cardNumber`, or `cvv`.
- `clearCheckoutProgress()` removes saved progress.
- `saveMockOrder(summary)`, `getMockOrders()`, `getMockOrderById(orderId)`, and `clearMockOrders()` manage local mock summaries. Saved orders receive `kind: "mock-local"`; they are not verified transactions.

Keys are exported from `STORAGE_KEYS`: `cart`, `wishlist`, `recentlyViewed`, `checkoutProgress`, and `mockOrders`.

## Testing

Requires Node.js 22.6 or later with built-in TypeScript type stripping (the provided commands were run with Node 24). No packages are installed.

```sh
npm test
```

The suite uses Node's built-in test runner and a memory-backed `StorageLike` adapter. It covers generic persistence, invalid JSON, cart and wishlist operations, recent-history ordering and limits, checkout filtering, mock orders, unrelated-key preservation, blocked storage, and missing `window`.

## Integration notes

The cart interface in `types/storage.ts` is explicitly provisional: `{ productId, name, price, quantity, image? }`. Replace or map it to the team's canonical cart line type when available; do not create another product catalog. The wishlist and history store product IDs only. Confirm the real product ID type, currency representation, cart quantity rules, checkout fields, and order lifecycle with the feature developers.

The checkout key filter is a defensive guard, not a complete security boundary. Do not pass credentials or payment data to it. Keep authoritative order totals and payment status on the server. `mock-local` orders are local UI/test records only.

The generic functions accept a key argument, while `clearStepforgeStorage()` deletes only the namespaced `stepforge:` keys. Keep application keys within that namespace. Consider introducing an explicit schema version or migration once the team confirms data contracts and any existing deployed key format.
