// Footwear checkout backend: Express + Paystack (Node 18+)
// Run: npm i express dotenv && node server.js
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const SECRET = process.env.PAYSTACK_SECRET_KEY;       // sk_test_... never expose to frontend
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ---- Server-side catalog: prices are NEVER taken from the client ----
const PRODUCTS = {
"nike-air-force-1-07": { name: "Air Force 1 '07", price: 120000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-air-force-1-triple-black": { name: "Air Force 1 Triple Black", price: 128000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-dunk-low-navy": { name: "Dunk Low Navy", price: 110000, sizes: [39, 40, 41, 42, 43, 44] },
"air-jordan-1-retro-high": { name: "Air Jordan 1 Retro High", price: 180000, sizes: [40, 41, 42, 43, 44] },
"adidas-forum-low-cream": { name: "Forum Low Cream", price: 135000, sizes: [39, 40, 41, 42, 43, 44] },
"new-balance-990-grey-runner": { name: "990 Grey Runner", price: 195000, sizes: [39, 40, 41, 42, 43, 44] },
"new-balance-9060-white-silver": { name: "9060 White Silver", price: 225000, sizes: [39, 40, 41, 42, 43, 44] },
"adidas-campus-green": { name: "Campus Green", price: 145000, sizes: [39, 40, 41, 42, 43, 44] },
"adidas-ultraboost-core-black": { name: "Ultraboost Core Black", price: 210000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-court-vision-pink": { name: "Court Vision Pink", price: 115000, sizes: [39, 40, 41, 42, 43, 44] },
"vans-old-skool-brown": { name: "Old Skool Brown", price: 98000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-pegasus-blue-runner": { name: "Pegasus Blue Runner", price: 175000, sizes: [39, 40, 41, 42, 43, 44] },
"air-jordan-1-burgundy": { name: "Air Jordan 1 Burgundy", price: 190000, sizes: [40, 41, 42, 43, 44] },
"air-jordan-4-white-cement": { name: "Air Jordan 4 White Cement", price: 245000, sizes: [40, 41, 42, 43, 44] },
"puma-rs-x-orange": { name: "RS-X Orange", price: 155000, sizes: [39, 40, 41, 42, 43, 44] },
"new-balance-9060-sandstone": { name: "9060 Sandstone", price: 220000, sizes: [39, 40, 41, 42, 43, 44] },
"vans-old-skool-black-gum": { name: "Old Skool Black Gum", price: 105000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-dunk-low-university-blue": { name: "Dunk Low University Blue", price: 145000, sizes: [39, 40, 41, 42, 43, 44] },
"salomon-trail-utility-olive": { name: "Trail Utility Olive", price: 205000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-court-legacy-white": { name: "Court Legacy White", price: 108000, sizes: [39, 40, 41, 42, 43, 44] },
"adidas-gazelle-purple": { name: "Gazelle Purple", price: 138000, sizes: [39, 40, 41, 42, 43, 44] },
"adidas-ultraboost-triple-black": { name: "Ultraboost Triple Black", price: 215000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-dunk-low-yellow": { name: "Dunk Low Yellow", price: 142000, sizes: [39, 40, 41, 42, 43, 44] },
"puma-classic-leather-brown": { name: "Classic Leather Brown", price: 125000, sizes: [39, 40, 41, 42, 43, 44] },
"nike-dunk-low-mint": { name: "Dunk Low Mint", price: 140000, sizes: [39, 40, 41, 42, 43, 44] },
"air-jordan-3-black-cement": { name: "Air Jordan 3 Black Cement", price: 235000, sizes: [40, 41, 42, 43, 44] },
"air-jordan-4-white-grey": { name: "Air Jordan 4 White Grey", price: 250000, sizes: [40, 41, 42, 43, 44] },
"nike-air-max-blue-runner": { name: "Air Max Blue Runner", price: 185000, sizes: [39, 40, 41, 42, 43, 44] },
"puma-rs-x-black-white": { name: "RS-X Black White", price: 160000, sizes: [39, 40, 41, 42, 43, 44] },
"air-jordan-1-high-green": { name: "Air Jordan 1 High Green", price: 185000, sizes: [40, 41, 42, 43, 44] }
};
const SHIPPING = { standard: 2500, express: 5500, pickup: 0 };
const FREE_SHIPPING_OVER = 100000;
const COUPONS = { WELCOME10: 0.10 };

// Swap this Map for PostgreSQL (orders, order_items, payments tables) in production
const orders = new Map();

function priceOrder({ items, shipping, coupon }) {
  if (!Array.isArray(items) || !items.length) throw new Error('Cart is empty');
  let subtotal = 0;
  const lines = items.map(i => {
    const p = PRODUCTS[i.id];
    const qty = parseInt(i.qty, 10);
    if (!p || !p.sizes.includes(Number(i.size)) || !(qty >= 1 && qty <= 10)) throw new Error('Invalid cart item');
    subtotal += p.price * qty;
    return { id: i.id, name: p.name, size: Number(i.size), qty, unit: p.price };
  });
  const discount = Math.round(subtotal * (COUPONS[(coupon || '').toUpperCase()] || 0));
  const shipFee = subtotal - discount >= FREE_SHIPPING_OVER ? 0 : (SHIPPING[shipping] ?? SHIPPING.standard);
  return { lines, subtotal, discount, shipFee, total: subtotal - discount + shipFee };
}

// ---- Webhook (must use raw body, registered BEFORE express.json) ----
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = crypto.createHmac('sha512', SECRET).update(req.body).digest('hex');
  if (sig !== req.headers['x-paystack-signature']) return res.sendStatus(401);
  const event = JSON.parse(req.body);
  if (event.event === 'charge.success') markPaid(event.data.reference, event.data.amount);
  res.sendStatus(200); // always ack quickly
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Idempotent: safe to call from both webhook and verify
function markPaid(ref, amountKobo) {
  const o = orders.get(ref);
  if (!o || o.status === 'paid') return o;
  if (amountKobo !== o.total * 100) { o.status = 'flagged'; return o; } // amount mismatch = fraud flag
  o.status = 'paid';
  o.paidAt = new Date().toISOString();
  console.log(`[AUDIT] paid ${ref} NGN ${o.total}`); // TODO: send email/SMS, decrement stock
  return o;
}

// 1) Initialize payment
app.post('/api/checkout/initialize', async (req, res) => {
  try {
    const { items, shipping, coupon, customer } = req.body;
    if (!/^\S+@\S+\.\S+$/.test(customer?.email || '') || !customer?.name || !customer?.address)
      return res.status(400).json({ error: 'Complete your contact and delivery details' });

    const priced = priceOrder({ items, shipping, coupon });
    const reference = 'ORD-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
    orders.set(reference, { ...priced, customer, shipping, status: 'pending', createdAt: Date.now() });

    const r = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        amount: priced.total * 100, // kobo
        currency: 'NGN',
        reference,
        callback_url: `${BASE_URL}/?reference=${reference}`,
        channels: ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money'],
        metadata: { name: customer.name, phone: customer.phone },
      }),
    });
    const data = await r.json();
    if (!data.status) return res.status(502).json({ error: 'Payment provider error' });
    res.json({ url: data.data.authorization_url, reference });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// 2) Verify after redirect (never trust the client's "success")
app.get('/api/checkout/verify/:ref', async (req, res) => {
  const o = orders.get(req.params.ref);
  if (!o) return res.status(404).json({ error: 'Order not found' });
  if (o.status !== 'paid') {
    const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(req.params.ref)}`, {
      headers: { Authorization: `Bearer ${SECRET}` },
    });
    const d = await r.json();
    if (d.status && d.data.status === 'success') markPaid(req.params.ref, d.data.amount);
  }
  res.json({ reference: req.params.ref, status: o.status, total: o.total, items: o.lines });
});

// Live price quote for the order summary
app.post('/api/checkout/quote', (req, res) => {
  try { res.json(priceOrder(req.body)); } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(3000, () => console.log('Checkout running on :3000'));
