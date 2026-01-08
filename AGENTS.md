# AI Development Guidelines

## Persona & Task Handling

- Act as a Senior Architect and Senior Developer.
- Do not make behavior-changing or user-visible assumptions during code implementations. Ask complementary questions before making changes whenever needed.
- Alert the user when prompted to do something considered bad practice or too different from established conventions for this project type and tech stack.

## Architecture Principles

1.  **Server First:** Default to React Server Components (RSC). Only use `'use client'` when interactivity (hooks, event listeners) is strictly required.
2.  **Modular:** Place components in `src/components/features/<FeatureName>` if they are domain-specific. Generic UI goes in `src/components/ui`.
3.  **Tailwind v4:** Use the new CSS-first config. Do not look for `tailwind.config.js`. Define theme variables in `globals.css`.
4.  **Supabase SSR:** Use `src/lib/supabase/server.ts` for data fetching in RSCs. Use `src/lib/supabase/client.ts` for event listeners in Client Components.

## Code Style

- **Naming:** PascalCase for components, camelCase for functions/vars.
- **Imports:** Use absolute imports `@/` (e.g., `@/components/ui/button`).
- **Types:** strict TypeScript. No `any`. Define interfaces in `src/types`.

## Environment

- **Runtime:** Node.js (via `fnm` in WSL).
- **Package Manager:** `pnpm`. Do not use npm or yarn.

## Next.js 16 Routing Note

- **Do NOT add `middleware.ts`** at the project root or under `src/app`. This project uses the Next.js 16+ `proxy.ts` pattern instead.
- All request/session interception should go through `src/proxy.ts` (which delegates to Supabase helpers). If you need to adjust middleware-like behavior, update that file rather than creating traditional middleware.

## Task Tracking

- Source of truth: `tasks/tasks.json` (edit tasks here).
- Read-only view: `TASKS.md` (generated; do not edit by hand). Regenerate via `pnpm tasks:md`.
- After editing `tasks/tasks.json`, always run `pnpm tasks:fmt` to format, `pnpm tasks:check` to validate it and `pnpm tasks:md` to update `TASKS.md`.
- Prefer updating `tasks/tasks.json` over adding inline `TODO` comments in code.

## Observability & Logging

- Use **strategic, surgical logging** only; avoid noisy logs in hot paths.
- Prefer the structured logger in `src/lib/observability/logger.ts`.
- Logging levels: `debug`, `info`, `warn`, `error`. Use `info` for key events, `warn` for recoverable issues, `error` for failures.
- **Environment switch:** set `LOG_LEVEL=debug|info|warn|error` (default: `info`) to gate verbose logging. Use `logDebug` only when the additional detail is needed.

## Testing

- Follow `TESTING.md` for the testing strategy and mock boundaries.
- Avoid heavy mocking that only verifies your own implementation details.
