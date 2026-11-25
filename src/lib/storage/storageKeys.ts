const PREFIX = "stepforge:";

export const STORAGE_KEYS = {
  cart: `${PREFIX}cart`,
  wishlist: `${PREFIX}wishlist`,
  recentlyViewed: `${PREFIX}recently-viewed`,
  checkoutProgress: `${PREFIX}checkout-progress`,
  mockOrders: `${PREFIX}mock-orders`,
} as const;

/** Key prefix owned by this module; never clear the browser's entire origin storage. */
export const STEP_FORGE_STORAGE_PREFIX = PREFIX;
