# AI Development Guidelines

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
- After editing `tasks/tasks.json`, always run `pnpm tasks:fmt` to format and `pnpm tasks:check` to validate it.
- Prefer updating `tasks/tasks.json` over adding inline `TODO` comments in code.
