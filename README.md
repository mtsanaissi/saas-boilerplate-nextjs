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
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
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
