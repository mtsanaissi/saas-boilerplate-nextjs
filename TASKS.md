# Tasks Log

This file tracks high-level work items for this repo and complements GitHub Issues and the Project board.

- Each entry corresponds to a single GitHub Issue (`#123`).
- Keep entries sorted with the most recently created tasks at the top.
- Update `Status` and `Completed` when work is finished.
- Use concise, user-facing titles (not internal notes).

Format (one line per task):

- `[STATUS] YYYY-MM-DD (Completed: YYYY-MM-DD|-) #123 – Short, user-facing title`

Examples:

- `[PENDING] 2025-12-03 (Completed: -) #45 – Implement subscription persistence in Stripe webhook`
- `[DONE] 2025-12-04 (Completed: 2025-12-04) #45 – Implement subscription persistence in Stripe webhook`

---

- [PENDING] 2025-12-03 (Completed: -) #TBD – Introduce an i18n library with /:locale routing and a typed message catalog, and move existing text (home hero, auth, plans, alerts) into locale message files
- [PENDING] 2025-12-03 (Completed: -) #TBD – Implement locale detection (cookie, URL prefix, Accept-Language) and a language switcher in the navbar that updates the active locale
- [PENDING] 2025-12-03 (Completed: -) #TBD – Localize pricing and future date/time displays using locale-aware Intl formatting for the active language
- [PENDING] 2025-12-03 (Completed: -) #TBD – Prepare a pattern for localized transactional emails and Supabase auth templates aligned with the in-app i18n messages
- [PENDING] 2025-12-03 (Completed: -) #TBD – Update layout and pages for accessibility landmarks, including header/nav/main/footer roles, a skip-to-content link, and consistent heading hierarchy
- [PENDING] 2025-12-03 (Completed: -) #TBD – Improve focus indicators, color contrast, and Tailwind/DaisyUI theme tokens to meet WCAG AA, including dark mode and prefers-reduced-motion handling
- [PENDING] 2025-12-03 (Completed: -) #TBD – Enhance form and alert accessibility with aria-invalid, aria-describedby, role=alert/status, aria-live regions, and clear button vs link semantics
- [PENDING] 2025-12-03 (Completed: -) #TBD – Replace direct decodeURIComponent/error-string rendering with error-code to t(\"errors.*\") mapping so all user-visible messages are fully localizable
