/** Minimal adapter shape implemented by the browser Storage interface. */
export interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

/** Provisional cart line. Replace/adapt this at integration to match the shared app type. */
export interface ProvisionalCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/** Checkout progress must contain only non-sensitive application data. */
export type CheckoutProgress = Record<string, unknown>;

/** A local mock summary; it is not evidence of a paid or verified transaction. */
export interface MockOrderSummary {
  orderId: string;
  createdAt: string;
  total: number;
  [field: string]: unknown;
  kind: "mock-local";
}
