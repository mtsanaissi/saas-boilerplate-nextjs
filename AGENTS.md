
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