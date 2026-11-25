/* StepForge shared browser cart. Uses one key and preserves unrelated local storage. */
(function (root) {
  'use strict';
  const KEY = 'stepforge:cart';
  const read = () => {
    try {
      const items = JSON.parse(root.localStorage.getItem(KEY) || '[]');
      return Array.isArray(items) ? items.filter(item => item && typeof item.productId === 'string' && Number.isFinite(Number(item.price)) && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0).map(item => ({ ...item, price: Number(item.price), quantity: Number(item.quantity) })) : [];
    } catch (_) { return []; }
  };
  const write = items => {
    try { root.localStorage.setItem(KEY, JSON.stringify(items)); }
    catch (_) { return false; }
    root.dispatchEvent(new CustomEvent('stepforge:cartchange', { detail: { items } }));
    return true;
  };
  const api = {
    key: KEY,
    getItems: read,
    add(item) {
      if (!item || !item.productId || !item.name || !Number.isFinite(Number(item.price)) || Number(item.price) < 0) return false;
      const items = read(), quantity = Math.max(1, Math.min(10, Math.floor(Number(item.quantity) || 1)));
      const found = items.find(line => line.productId === String(item.productId) && String(line.size || '') === String(item.size || ''));
      if (found) found.quantity = Math.min(10, found.quantity + quantity);
      else items.push({ ...item, productId: String(item.productId), price: Number(item.price), quantity });
      return write(items);
    },
    remove(productId, size) { return write(read().filter(item => !(item.productId === String(productId) && (size === undefined || String(item.size || '') === String(size))))); },
    updateQuantity(productId, quantity, size) {
      const items = read(), item = items.find(line => line.productId === String(productId) && (size === undefined || String(line.size || '') === String(size)));
      if (!item || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) return false;
      item.quantity = Math.min(10, Number(quantity)); return write(items);
    },
    getTotal() { return read().reduce((sum, item) => sum + item.price * item.quantity, 0); },
    getCount() { return read().reduce((sum, item) => sum + item.quantity, 0); },
    clear() { return write([]); },
    saveOrder(order) { try { root.localStorage.setItem('stepforge:order', JSON.stringify(order)); return true; } catch (_) { return false; } },
    getOrder() { try { return JSON.parse(root.localStorage.getItem('stepforge:order') || 'null'); } catch (_) { return null; } },
    // Compatibility adapter for the existing checkout page API.
    get() { return read().map(item => ({ id: item.productId, size: Number(String(item.size || '').replace(/[^0-9.]/g, '')) || 0, qty: item.quantity })); },
    set(lines) {
      if (!Array.isArray(lines)) return false;
      const old = read();
      return write(lines.map(line => { const existing = old.find(item => item.productId === String(line.id)); return existing ? { ...existing, size: `US ${line.size}`, quantity: Number(line.qty) || 1 } : null; }).filter(Boolean));
    },
    subscribe(callback) { root.addEventListener('stepforge:cartchange', callback); }
  };
  root.StepForgeStore = api;
  root.StepForgeCart = api;
})(window);
