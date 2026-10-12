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
| Tokens, layout, responsive and element states | `src/styles/home.stylex.ts` | Desktop, phone, hover, focus, and extracted production CSS |
| Reset, cross-element reveal and icon geometry | `src/styles/global.css` | No component-level declarations drift back into global CSS |
| Ship, stars, lighting, resize, reduced motion | `src/scripts/hyperion.ts`, `public/models/hyperion.glb` | Phone, desktop, ultrawide, hidden tab, reduced motion |
| Error/performance reporting | `src/scripts/sentry.ts` | Production-only initialization and data scrubbing |
| Page/outbound analytics | `src/scripts/posthog.ts` | No persistence, query strings, fragments, or dynamic link data |
| Build and source maps | `astro.config.mjs` | Local build creates no upload; CI release flow stays intact |
| Worker route/domain | `wrangler.jsonc` | Custom domain and static asset output |

## Visual verification

The 3D renderer is deliberately visual. Browser checks now capture review
screenshots without pixel baselines. At minimum, inspect:

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

## Repeatable browser and delivery workflow

Use a fresh sibling worktree for each change, with the public GitHub account
active. Keep the main checkout clean:

```sh
gh auth switch -u krmznkr
gh api user --jq .login
git fetch origin main
git worktree add -b feat/example ../me-feat-example origin/main
cd ../me-feat-example
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm review
pnpm build
```

On a newly provisioned Linux host, Playwright may need its documented browser
system dependencies: `pnpm exec playwright install --with-deps chromium`.
Keep Node 24.15.0 and pnpm 10.33.0 aligned with CI; `packageManager` and
`engines` record the versions. There is no OAuth or Cloudflare secret required
for local checks or visual review.

For a local built preview, run `pnpm build:preview && pnpm preview:browser`.
In T3 Code, open the collaborative browser with the environment port **4321**;
it uses the connected execution environment. The browser-only client needs
no VPN or local installation. The server binds loopback. If that client's
local-port forwarding is unavailable, use the PR preview URL below; do not
expose a private host port or put private artifacts into the public site.
`pnpm dev --host 127.0.0.1 --port 4321` remains useful for quick iteration.

`pnpm review` checks types and the Worker redirect, builds in preview mode,
and runs Chromium against the resulting static site. It captures phone,
laptop and ultrawide screenshots with reduced motion, plus no-JavaScript
fallbacks; it checks semantic links, model initialization, pause/resume,
horizontal overflow, uncaught errors and the absence of external telemetry
requests. The pause control is intentionally hidden on phones and under
reduced motion. Software-rendered test animation is limited to five frames
per second; this suite does not measure production animation performance. Generated reports live in ignored `playwright-report/` and
`test-results/`. Use `pnpm exec playwright show-report` to inspect locally;
CI uploads the report and images as a 14-day artifact linked from its run.
These are inspection artifacts, not pixel baselines or an accessibility audit.

For a non-draft PR from a repository-owner branch, **PR preview** uploads a
Cloudflare Worker version after its build and tests. It comments with the
immutable version URL, the reviewed commit SHA, and a moving `pr-N` alias.
Review the immutable URL: the alias can advance after another push. Version
upload does not assign production traffic or change custom-domain routes.
It explicitly enables version URLs while keeping the production workers.dev
route disabled. See [Cloudflare's version URL documentation](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/).

Previews are public and persist subject to Cloudflare's version/alias limits;
closing a PR does not revoke its URL. Never include private content. Fork,
dependency-bot, and non-owner PRs receive credential-free CI screenshots but
no Cloudflare credential or deployment. Avoid `pull_request_target` with
untrusted code. Preview mode disables Sentry and PostHog, does not upload
source maps, and retains the production canonical URL. Production builds
keep their existing minimized telemetry.

Commit, push, open the PR in the browser, and inspect the preview and report:

```sh
git push -u origin feat/example
gh pr create --fill
gh pr view --web
gh pr checks --watch
# Record the exact SHA inspected and the visual result in the PR.
gh pr view --json headRefOid --jq .headRefOid
scripts/merge-reviewed.sh <pr-number> <reviewed-head-sha>
```

`main` is protected: changes require a PR, an up-to-date branch, the `ci`
check (including browser review), and resolved conversations, including for
admins. Force pushes and branch deletion are disabled. This single-maintainer
repository does not require a second account’s approval; the recorded code
and visual review remain part of the delivery procedure.

The merge helper verifies the public identity, repository, PR state, unresolved
required reviews and checks, then pins squash merge to the inspected head.
A new push requires new review. CI remains authoritative; never bypass a red
check or a GitHub protection rule. Record manual results for normal motion,
keyboard focus, drag/pointer behavior, hide/show and resize in addition to the
automated reduced-motion and fallback screenshots.

After merge, watch **Deploy** for that merge SHA. It checks/builds again,
publishes the production Sentry release and source maps, deploys using only
this repository's existing public Cloudflare credential, and runs
`node scripts/smoke.mjs`. The smoke check verifies the custom domain, canonical
metadata, project links, security headers, model asset and root-domain redirect.
A failed smoke check means delivery needs investigation even if upload passed.

From the primary checkout, fetch and verify the final files on `origin/main`,
then remove `../me-feat-example` and its local branch. Leave blocked work intact.
