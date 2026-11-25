# Footwear Checkout (Paystack, Node/Express)

## Structure
```
server.js                 unchanged (all endpoints, Paystack logic, webhook, pricing)
public/index.html         checkout UI (cart, delivery, payment, result states)
public/assets/brand.css   StepForge tokens, header, footer, buttons, fields (share with every page)
public/assets/cart.js     shared cart store: StepForgeCart.add('sneaker-air', 42, 1)
public/assets/logo.png    logo mark
```
Product page "Add to cart" should call `StepForgeCart.add(id, size, qty)` using one of the 30 product ids in `server.js` `PRODUCTS`. Checkout displays the matching product name, unit price and line total. Prices are recalculated on the server.
Open `/?demo=1` to preview with a sample cart.

## Run
```
npm init -y && npm i express dotenv
cp .env.example .env     # add your Paystack TEST secret key
node server.js           # http://localhost:3000
```

## .env.example
```
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
BASE_URL=http://localhost:3000
```

## Webhook
Paystack Dashboard > Settings > API Keys & Webhooks > set URL to
`https://yourdomain.com/api/webhook` (use ngrok for local testing).

## Test
Card 4084 0840 8408 4081, any future expiry, CVV 408, PIN 0000, OTP 123456.

## Next steps
1. Replace the in-memory `orders` Map with PostgreSQL (orders, order_items, payments, refunds)
2. Add emails/SMS in `markPaid` (Resend, Termii)
3. Add inventory locking (10-minute hold per size) and stock decrement
4. Add rate limiting (express-rate-limit), helmet, and CSRF protection
5. Build the admin dashboard and refund endpoint
6. Go live: swap to sk_live key, enforce HTTPS
