# me

Personal homepage with project links and an interactive 3D Hyperion model.

Live at [`me.krmznkr.com`](https://me.krmznkr.com).

Built with [Astro](https://astro.build), [StyleX](https://stylexjs.com), and
[Three.js](https://threejs.org). Text and links work without JavaScript.

## Develop

```sh
pnpm install
pnpm dev
```

## Build

```sh
pnpm build
pnpm check
pnpm test
```

The `me` Cloudflare Worker serves [the homepage](https://me.krmznkr.com) and
redirects [the root domain](https://krmznkr.com/) to it with HTTP 301, preserving
the path and query. Pushes to `main` deploy automatically via the Deploy
GitHub Actions workflow. The build publishes a Sentry release and source maps
before wrangler deploys with the `CLOUDFLARE_API_TOKEN` repository secret.

## Observability

Sentry handles production errors, sampled traces, releases, and source maps.
PostHog records page traffic in the shared EU `krmznkr apps`
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
