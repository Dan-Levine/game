# Match 3D

3D physics-based casual matching puzzle. Pull three matching objects from a
tumbling pile before your 7-slot tray fills up.

## Stack

- Babylon.js 7 (3D engine, picking, post-processing)
- Havok Physics WASM via `@babylonjs/havok`
- TypeScript + Vite
- Capacitor 6 (Android wrapper; iOS deferred)
- HTML/CSS HUD overlay
- Vitest (unit + integration) + Playwright (e2e)

## Quickstart

```bash
npm install
npm run dev          # http://localhost:5173
```

Add `?seed=foo` to the URL to lock the drop pattern (used by e2e).

## Scripts

| Script | What |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production Pages bundle (`dist/`) |
| `npm run build:e2e` | Same, but with `window.__game__` test hooks included |
| `npm run preview` | Preview last production build on `:4173` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:integration` | Vitest integration tests |
| `npm run test:e2e` | Playwright e2e tests (builds + previews) |
| `npm run test` | Full pyramid |
| `npm run cap:sync:android` | Sync web bundle into the Capacitor Android project |

## Deploy

- **Web → GitHub Pages**: pushed builds run `deploy-web.yml`. Tests gate the
  deploy job. Pages source must be set to "GitHub Actions" in repo settings.
- **Android APK**: `build-apk.yml` produces `app-debug-apk` artifact on every
  push to `main`. Sideload via `adb install`.

## Phase 1 status

Phase 1 is functional: pile drops, hold-pick-release commits to the tray,
3-of-a-kind clears with a slide-left animation. Asset GLBs are not yet
bundled — items render as tinted primitives until the Kenney Food Kit GLBs
are dropped into `public/assets/items/kitchen/`. Polish (silhouette, haptics,
audio) lands in Phase 2.
