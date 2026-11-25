// STEP FORGE — ORDER CONFIRMATION
// This page reads the order saved by the checkout page in localStorage.
// Expected storage key: "stepForgeOrder"



const confirmationContent = document.getElementById("confirmation-content");
const paymentState = document.getElementById("payment-state");

const money = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);

const showText = (id, value, fallback = "—") => {
  const element = document.getElementById(id);
  if (element) element.textContent = value ? String(value) : fallback;
};

function showPaymentMessage(title, message) {
  paymentState.hidden = false;
  confirmationContent.hidden = true;
  showText("status-title", title);
  showText("status-message", message);
}

function renderItems(items) {
  const container = document.getElementById("ordered-items");
  container.replaceChildren();

  items.forEach((item) => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;

    const row = document.createElement("article");
    row.className = "product-row";

    if (item.image) {
      const image = document.createElement("img");
      image.className = "product-image";
      image.src = item.image;
      image.alt = item.name ? `${item.name} product image` : "Ordered shoe";
      image.onerror = () => {
        const placeholder = document.createElement("div");
        placeholder.className = "product-placeholder";
        placeholder.textContent = "👟";
        image.replaceWith(placeholder);
      };
      row.appendChild(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "product-placeholder";
      placeholder.textContent = "👟";
      row.appendChild(placeholder);
    }

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = item.name || "Sneaker";
    info.appendChild(name);

    const brand = document.createElement("p");
    brand.textContent = `Brand: ${item.brand || "—"}`;
    info.appendChild(brand);

    if (item.size !== undefined && item.size !== null && item.size !== "") {
      const size = document.createElement("p");
      size.textContent = `Size: ${item.size}`;
      info.appendChild(size);
    }

    const quantityText = document.createElement("p");
    quantityText.textContent = `Quantity: ${quantity}`;
    info.appendChild(quantityText);

    const priceText = document.createElement("strong");
    priceText.className = "product-price";
    priceText.textContent = money(price * quantity);

    row.append(info, priceText);
    container.appendChild(row);
  });
}

function displayOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    showPaymentMessage(
      "We couldn't find your order items",
      "Your order information appears incomplete. Please return to the store or contact the Step Forge team for assistance."
    );
    return;
  }

  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
  }, 0);

  const deliveryFee = Number(order.deliveryFee) || 0;
  const total = order.total !== undefined
    ? Number(order.total)
    : subtotal + deliveryFee;

  showText("order-number", order.orderNumber);
  showText("order-date", order.orderDate);
  showText("subtotal", money(subtotal));
  showText("delivery-fee", money(deliveryFee));
  showText("total", money(total));
  showText("payment-method", order.paymentMethod);
  showText("customer-name", order.customerName);
  showText("customer-phone", order.phone);
  showText("delivery-address", order.address);
  showText("delivery-date", order.deliveryDate, "To be confirmed");

  renderItems(items);

  paymentState.hidden = true;
  confirmationContent.hidden = false;
}

function loadOrder() {
  document.getElementById("footer-year").textContent = new Date().getFullYear();

  let order;
  try {
    order = window.StepForgeStore.getOrder();
  } catch (error) {
    console.error("Could not read the saved Step Forge order:", error);
    showPaymentMessage(
      "We couldn't load your order",
      "There was a problem reading your order details. Please return to the store or contact the Step Forge team."
    );
    return;
  }

  if (!order) {
    showPaymentMessage(
      "No order found yet",
      "Your order details will appear here after checkout has been completed. You can return to the store to continue shopping."
    );
    return;
  }

  // This is a demo project. The checkout page should set paymentStatus to "paid"
  // only after its simulated payment step reports success.
  if (String(order.paymentStatus).toLowerCase() !== "paid") {
    showPaymentMessage(
      "Your payment has not been confirmed",
      "We haven't received a successful payment confirmation for this order. Please return to checkout and try again."
    );
    return;
  }

  displayOrder(order);
}

document.getElementById("print-order").addEventListener("click", () => {
  window.print();
});

loadOrder();


