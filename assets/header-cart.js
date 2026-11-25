(function () {
  function update() {
    const count = window.StepForgeStore ? window.StepForgeStore.getCount() : 0;
    document.querySelectorAll('[data-cart-count]').forEach(node => { node.textContent = count; });
    const productCount = document.getElementById('cartCount');
    if (productCount) productCount.textContent = count;
    const homeCount = document.getElementById('homeCartCount');
    if (homeCount) homeCount.textContent = count;
    const cartLink = document.querySelector('.sf-cart');
    if (cartLink) cartLink.setAttribute('aria-label', `Cart, ${count} items`);
  }
  document.addEventListener('DOMContentLoaded', update);
  window.addEventListener('stepforge:cartchange', update);
  window.addEventListener('storage', event => { if (event.key === 'stepforge:cart') update(); });
  update();
})();
