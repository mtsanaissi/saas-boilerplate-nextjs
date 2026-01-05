# Testing Guide

This repo favors small, high-signal tests. Avoid heavy mocking that only replays your own implementation details.

## Principles

- Test behavior, not implementation. Prefer input/output and side effects over internal calls.
- Mock only at system boundaries (Stripe API, Supabase SDK network calls), not the business rules.
- If the test is all mocks, it is usually low value.
- Use real Supabase locally for DB + RPC behavior whenever possible.

## Test Layers (preferred)

1. **Unit tests** (pure logic)
   - For functions without I/O (e.g., plan/limits helpers).
   - No mocking required.

2. **Integration tests** (DB + RPC + server actions)
   - Use local Supabase to validate RLS, RPCs, and schema behavior.
   - Only mock external APIs (Stripe, email delivery).

3. **Contract tests** (webhooks / payload parsing)
   - Validate mapping from Stripe events to DB writes.
   - Use recorded fixtures or minimal examples.

4. **Minimal E2E smoke**
   - One or two flows: signup -> login -> basic action.

## What must be tested

- Auth flows and rate limits that gate access.
- Billing and Stripe webhook updates.
- Usage consumption and limit enforcement.
- Security-sensitive flows (session revocation, account deletion).

## When to avoid mocks

- Do not mock Supabase DB writes when testing RLS, RPCs, or usage/billing state.
- Do not mock Next.js server actions just to test redirects; prefer testing the branching logic directly or via integration.

## Running tests

```bash
pnpm test
```

For integration tests, ensure local Supabase is running and env vars are configured (see README).
