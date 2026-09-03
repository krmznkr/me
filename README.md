# me

A single, quiet homepage for the `krmznkr` identity: a full-stack software
engineer building in the open. It places an interactive 3D Hyperion in a
cinematic star field and links out to open-source work.

Live at [`me.krmznkr.com`](https://me.krmznkr.com).

## Design

A monochrome deep-space portrait rendered with **Three.js**: the Hyperion model
drifts through a sparse star field under cold, directional light and a layer of
film grain. See [`src/scripts/hyperion.ts`](src/scripts/hyperion.ts).

- **A subject, not a demo.** The ship occupies the page's negative space and
  leaves the identity, description, and links in a quiet high-contrast band.
- **Tactile but restrained.** Pointer movement creates subtle parallax, dragging
  rotates the ship, and a small control pauses its automatic drift.
- **Authored for every aspect ratio.** Camera, model scale, and composition
  change between portrait and landscape rather than simply shrinking.
- **Progressive enhancement.** The semantic content is built into the initial
  HTML. The 3D module loads separately, fades in only after the model is ready,
  pauses while hidden, and respects `prefers-reduced-motion`.
- **Bounded rendering cost.** Device pixel ratio is capped more aggressively on
  small screens while preserving high-quality output on desktop.

Built with [Astro](https://astro.build), [Three.js](https://threejs.org), Geist
(sans) for the name and sentence, and Geist Mono for the small labels.

## Develop

```sh
pnpm install
pnpm dev
```

## Build

```sh
pnpm build
```

Production is deployed as the `me` Cloudflare Worker (static assets) at
`https://me.krmznkr.com`. Pushes to `main` deploy automatically via the Deploy
GitHub Actions workflow. The build publishes a Sentry release and source maps
before wrangler deploys with the `CLOUDFLARE_API_TOKEN` repository secret.

## Observability

Sentry handles production errors, sampled traces, releases, and source maps.
PostHog provides privacy-first page traffic in the shared EU `krmznkr apps`
project, separated with `app=me`. CLI credentials live in 1Password; no personal
API token belongs in the repository. See
[`docs/observability.md`](docs/observability.md) for runtime controls,
verification commands, and token-rotation runbooks.

## Documentation

- [`docs/README.md`](docs/README.md) — documentation map and ownership.
- [`docs/architecture.md`](docs/architecture.md) — page composition, 3D
  renderer, runtime boundaries, deployment, observability, and failure
  behavior.
- [`docs/development.md`](docs/development.md) — toolchain, change map, visual
  verification, privacy boundary, and delivery.
- [`docs/observability.md`](docs/observability.md) — telemetry controls,
  release verification, and credential rotation.
- [`docs/roadmap.md`](docs/roadmap.md) — visual, accessibility, performance,
  and deployment-assurance gaps.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — checks and contribution guardrails.

## License

MIT
