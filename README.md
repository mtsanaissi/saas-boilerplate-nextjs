# SaaS Boilerplate (Next.js 16 + Tailwind 4 + Supabase)

## Tech Stack

- **Framework:** Next.js 16 (App Router, React Compiler enabled)
- **Styling:** Tailwind CSS v4 + DaisyUI v5
- **Database & Auth:** Supabase (Local Docker + Cloud)
- **Payments:** Stripe (Subscriptions via Checkout)
- **Package Manager:** pnpm

## Getting Started

### 1. Prerequisites

Ensure you have Docker Desktop running (WSL2 Backend).

```bash
pnpm install
```

### 2. Configure environment variables

The app expects the following variables (for local development put them in `.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_ALLOW_UNVERIFIED` (optional, dev-only)
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_API_HOST` (optional, for local Stripe mock)
- `STRIPE_API_PORT` (optional, for local Stripe mock)
- `STRIPE_API_PROTOCOL` (optional, for local Stripe mock)
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)

### 3. Run the dev server

```bash
pnpm dev
```

Then open `http://localhost:3000` to access:

- `/auth/register` – email/password sign up
- `/auth/login` – sign in
- `/dashboard` – example protected page (requires auth)
- `/plans` – Free, Starter and Pro plans with Stripe Checkout

### 4. Configure Stripe webhooks

To keep subscription status in sync, configure a Stripe webhook that points to:

- `/api/stripe/webhook`

The handler is implemented with `runtime = "nodejs"` to use the official Stripe SDK. For local development, you can use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Inside the webhook handler, you can extend the existing skeleton to store subscription state in your database based on events like `checkout.session.completed` and `customer.subscription.*`.

### 5. Local Stripe mock (no account required)

If you want to run the app locally without a real Stripe account, you can use a local Stripe emulator and dummy keys.

Option A: Stripe official mock (recommended)

```bash
docker run --rm -p 12111:12111 -p 12112:12112 stripe/stripe-mock
```

Set these env vars:

```bash
STRIPE_SECRET_KEY=sk_test_mock
STRIPE_WEBHOOK_ALLOW_UNVERIFIED=true
STRIPE_API_HOST=localhost
STRIPE_API_PORT=12111
STRIPE_API_PROTOCOL=http
```

Option B: localstripe (unofficial)

```bash
pip install localstripe
localstripe listen --port 8420
```

Set these env vars:

```bash
STRIPE_SECRET_KEY=sk_test_mock
STRIPE_WEBHOOK_ALLOW_UNVERIFIED=true
STRIPE_API_HOST=localhost
STRIPE_API_PORT=8420
STRIPE_API_PROTOCOL=http
```

To trigger the webhook locally without Stripe, send a fake event:

```bash
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{\n    \"id\": \"evt_test_1\",\n    \"type\": \"customer.subscription.created\",\n    \"created\": 1735536000,\n    \"data\": {\n      \"object\": {\n        \"id\": \"sub_test_1\",\n        \"status\": \"active\",\n        \"customer\": \"cus_test_1\",\n        \"metadata\": { \"supabase_user_id\": \"<YOUR_USER_ID>\" },\n        \"cancel_at_period_end\": false,\n        \"current_period_end\": 1738214400,\n        \"items\": { \"data\": [ { \"price\": { \"id\": \"price_test_starter\" } } ] }\n      }\n    }\n  }'
```

Note: These emulators don't fully implement Stripe Checkout UI. Use them to exercise server-side flows and webhooks.
