# Development

## Requirements and commands

Use the same toolchain as CI: Node.js 24 and pnpm 10.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Before proposing a change:

```sh
pnpm check
pnpm build
```

`pnpm check` runs Astro's type/content checks; `pnpm build` produces the static
site in `dist/`. There is no backend or local secret setup.

## What to edit

| Change | Primary file | Focused check |
| --- | --- | --- |
| Copy, links, metadata, semantic structure | `src/pages/index.astro` | View source with JavaScript disabled; run `pnpm check` |
| Ship, stars, lighting, resize, reduced motion | `src/scripts/hyperion.ts`, `public/models/hyperion.glb` | Phone, desktop, ultrawide, hidden tab, reduced motion |
| Error/performance reporting | `src/scripts/sentry.ts` | Production-only initialization and data scrubbing |
| Page/outbound analytics | `src/scripts/posthog.ts` | No persistence, query strings, fragments, or dynamic link data |
| Build and source maps | `astro.config.mjs` | Local build creates no upload; CI release flow stays intact |
| Worker route/domain | `wrangler.jsonc` | Custom domain and static asset output |

## Visual verification

The 3D renderer is deliberately visual and currently has no automated
snapshot suite. At minimum, inspect:

1. A narrow phone viewport in portrait.
2. A normal laptop viewport.
3. An ultrawide viewport.
4. Light/dark browser preferences if browser chrome or fallback UI changes.
5. `prefers-reduced-motion: reduce`.
6. A page load with JavaScript disabled.
7. Tab hide/show and a live resize.

Check that the ship retains readable depth, stays clear of the hero copy, fits
without horizontal overflow, and leaves every link as an ordinary semantic
anchor. Verify pointer parallax, drag rotation, and the pause control.

## Privacy boundary

The site contains public copy and links only. Never add credentials or private
data. Sentry and PostHog run only in production and are intentionally
minimized; changes must preserve the controls in
[`observability.md`](observability.md).

## Delivery

Pull requests and `main` run CI. Pushes to `main` also build a Sentry release,
upload hidden source maps, remove maps from `dist`, and deploy the static Worker.
See [`architecture.md`](architecture.md) for the flow.
