(function () {
  const catalog = Object.fromEntries(window.StepForgeProducts.map(product => [String(product.id), product]));
  const host = document.getElementById('cartItems');
  let items = [];
  const money = value => '₦' + Number(value || 0).toLocaleString('en-NG');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function load() {
    items = window.StepForgeStore.getItems().map(item => ({ ...catalog[item.productId], ...item, id: Number(item.productId), img: item.image || catalog[item.productId]?.img, size: item.size || 'US 8' })).filter(item => item.name);
  }
  function save() {
    window.StepForgeStore.clear();
    items.forEach(item => window.StepForgeStore.add({ productId: String(item.id), name: item.name, brand: item.brand, type: item.type, price: item.price, image: item.img, size: item.size, quantity: item.quantity }));
    render();
  }
  function render() {
    load();
    const count = window.StepForgeStore.getCount();
    document.getElementById('cartSubtitle').textContent = count + (count === 1 ? ' item' : ' items') + ' in your cart';
    if (!items.length) host.innerHTML = '<div class="empty-cart"><h2>Your cart is empty</h2><p>Find your next pair in the StepForge collection.</p><a class="back-link" href="stepforge-30-products-responsive%203.html">Shop sneakers</a></div>';
    else host.innerHTML = items.map((item, index) => `<article class="cart-item" data-index="${index}"><div class="item-image"><img src="${item.img || ''}" alt="${escapeHtml(item.brand)} ${escapeHtml(item.name)}"></div><div><div class="item-brand">${escapeHtml(item.brand)} · ${escapeHtml(item.type)}</div><h2 class="item-name">${escapeHtml(item.name)}</h2><div class="item-controls"><select class="size-select" data-action="size" aria-label="Select size for ${escapeHtml(item.name)}">${['US 6','US 7','US 8','US 9','US 10','US 11','US 12'].map(size => `<option value="${size}" ${item.size === size ? 'selected' : ''}>${size}</option>`).join('')}</select><div class="quantity"><button data-action="decrease" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="increase" aria-label="Increase quantity">+</button></div><button class="remove" data-action="remove">Remove</button></div></div><div class="item-price">${money(item.price * item.quantity)}</div></article>`).join('');
    const total = window.StepForgeStore.getTotal();
    document.getElementById('subtotal').textContent = money(total);
    document.getElementById('total').textContent = money(total);
  }
  host.addEventListener('click', event => {
    const control = event.target.closest('[data-action]'); if (!control) return;
    const item = items[Number(control.closest('.cart-item').dataset.index)]; if (!item) return;
    if (control.dataset.action === 'increase') item.quantity = Math.min(10, item.quantity + 1);
    if (control.dataset.action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
    if (control.dataset.action === 'remove') items = items.filter(line => line !== item);
    save();
  });
  host.addEventListener('change', event => {
    if (event.target.dataset.action !== 'size') return;
    const item = items[Number(event.target.closest('.cart-item').dataset.index)]; if (item) { item.size = event.target.value; save(); }
  });
  document.getElementById('checkout').addEventListener('click', () => { if (window.StepForgeStore.getCount()) location.href = 'StepForge%20Checkout%20Preview.html'; });
  window.addEventListener('stepforge:cartchange', render);
  render();
})();

