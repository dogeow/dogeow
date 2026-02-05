<!--
This file is intended to guide AI coding agents (Copilot-style) working in the `dogeow` monorepo.
Keep it <~20-50 lines, action-oriented, and tied to concrete files/commands found in the repo.
-->

# Copilot / AI Agent Instructions — dogeow

Summary

- Frontend: Next.js (app router) + React 19. See `app/`, `components/`, `hooks/`, `stores/`, `lib/`.
- Backend: Laravel API lives in `dogeow-api/` (separate repo folder). Websockets use Reverb/Echo/Pusher.

Quick workflows

- Run local dev (frontend): `npm install` then `npm run dev` (root `package.json`).
- Build: `npm run build`.
- Typecheck: `npm run type-check`.
- Lint/format: `npm run lint` / `npm run format` (Prettier + ESLint + Husky hooks configured).
- Tests: `npm run test` (Vitest). CI style runs: `npm run test:ci` or `npm run test:coverage`.

Architecture & boundaries (what to know)

- UI & routing: `app/` uses Next.js app-router. `layout.tsx` and `page.tsx` are primary entry points.
- Component library: `components/` contains UI and feature subfolders (e.g. `components/ui`, `components/app`). Prefer existing components.
- State: `stores/` uses Zustand (with Immer); patterns: small per-domain stores (e.g. `authStore.ts`, `themeStore.ts`).
- Hooks & services: `hooks/` contains reusable hooks (e.g. `useChatWebSocket.ts`, `useAudioManager.ts`). `lib/` contains API clients, helpers and cross-cutting services.
- Assets & SW: static assets and service worker: `public/` (`public/sw.js`).

Integration & external deps

- Backend API: `dogeow-api/` — PHP/Laravel. To run backend locally you need a PHP environment (see `dogeow-api/README.md`).
- WebSockets: uses Laravel Reverb / Laravel Echo / Pusher; client code imports `laravel-echo` and `pusher-js`.
- Sentry for error tracking — search `Sentry` or `sentry` in repo for setup points.

Project-specific conventions (do this, not that)

- Avoid `any` anywhere. The repo aims for strict TS; do not add `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.
- Use Zod where forms or validation are required (see `components/novel-editor` and `lib/` patterns).
- Prefer React Hook Form for forms and use `@hookform/resolvers` for Zod integration.
- Use Zustand stores for app-level state; keep components pure and read from hooks.
- Files under `app/*` may include `__tests__` folders — follow existing testing style with Vitest+testing-library.

Tests & CI notes

- Vitest config: `vitest.config.ts` (local) and `vitest.config.ci.ts` (CI). Coverage uses `@vitest/coverage-v8`.
- Useful test scripts: `npm run test:changed`, `npm run test:related`, `npm run test:ui`.
- Coverage helpers and monitors are in `scripts/` (e.g. `check-coverage-v8.js`, `coverage-monitor.js`). When changing tests, update these scripts if you change coverage thresholds.

Files worth opening first (examples)

- `app/layout.tsx`, `app/page.tsx` — entry points for layout and global providers.
- `stores/*` — Zustand stores and patterns.
- `hooks/useChatWebSocket.ts` and `lib/websocket/*` — websocket patterns and message handling.
- `components/novel-editor/` and `components/ui/` — examples of complex UI and editor integration.
- `package.json` and `vitest.config*.ts` — scripts and test config.

When making changes

- Keep PRs small and focused. Run `npm run fix-all` locally before pushing.
- Run `npm run type-check` and `npm run lint` in pre-commit; CI will re-run `test:ci`.
- Respect existing component props and styles; prefer composition over changing public component APIs.

Edge cases & pitfalls

- Next.js 16 app-router conventions are used — avoid mixing old pages/next patterns.
- Some features rely on browser APIs (three.js, canvas); tests often mock DOM via jsdom or stub heavy modules.
- The repo contains helper scripts under `scripts/`—edit with care; tests/coverage tooling depends on them.

If you need more

- Ask for the specific area to inspect (e.g., state, WebSocket protocol, or deployment). Provide file/PR examples to update instructions.
