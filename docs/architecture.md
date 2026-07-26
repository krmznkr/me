# Architecture

`me` is a static Astro site with one page and a small client-side character-art
renderer. Astro produces the document shell, metadata, styles, and link content
at build time; the browser runs the moon animation and production-only
observability integrations.

## System context

```mermaid
flowchart LR
  visitor["Browser"]
  edge["Cloudflare Worker<br/>static asset binding"]
  html["Prebuilt Astro HTML + CSS"]
  nocturne["Nocturne canvas renderer"]
  sentry["Sentry EU"]
  posthog["PostHog EU"]
  external["GitHub · Julian · Life"]

  visitor -->|"HTTPS"| edge --> html
  html --> nocturne
  visitor -->|"explicit link clicks"| external
  visitor -. errors and sampled traces .-> sentry
  visitor -. page traffic + static destination labels .-> posthog

  classDef client fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:2px
  classDef edgeNode fill:#ede9fe,stroke:#7c3aed,color:#3b0764
  classDef externalNode fill:#fef3c7,stroke:#d97706,color:#78350f
  class visitor client
  class edge,html,nocturne edgeNode
  class sentry,posthog,external externalNode
```

There is no API, server-side rendering at request time, database,
authentication, or user-generated content. The Cloudflare Worker serves only
the contents of `dist/`.

## Page composition

```mermaid
flowchart TD
  page["src/pages/index.astro"]
  metadata["SEO / Open Graph metadata"]
  content["Semantic HTML<br/>header, intro, links, footer"]
  styles["Inlined page CSS"]
  boot["Client boot script"]
  sentry["Initialize Sentry in production"]
  posthog["Lazy-load PostHog in production"]
  canvas["startNocturne(canvas)"]
  reveal["Add ready class after two frames"]

  page --> metadata
  page --> content
  page --> styles
  page --> boot
  boot --> sentry
  boot --> posthog
  boot --> canvas
  boot --> reveal
```

The meaningful text and links are present in the initial HTML. JavaScript adds
the decorative canvas, telemetry, outbound-link events, and staggered reveal;
the content does not depend on those enhancements.

## Nocturne render pipeline

```mermaid
flowchart TD
  start["startNocturne"]
  wait["Wait for document fonts"]
  size["Measure viewport, DPR,<br/>glyph cell, rows, and columns"]
  compose["Choose moon position/radius<br/>for portrait or landscape"]
  stars["Seed deterministic stars<br/>outside moon and text band"]
  motion{"Reduced motion?"}
  frame["~34 fps animation loop"]
  sample["For every glyph cell:<br/>sphere normal + light + noise + glow"]
  glyph["Map luminance to<br/>glyph density and grayscale"]
  paint["Paint moon and stars"]
  static["Render one static frame"]

  start --> wait --> size --> compose --> stars --> motion
  motion -->|"yes"| static
  motion -->|"no"| frame --> sample --> glyph --> paint --> frame
```

### Geometry and lifecycle

- Canvas backing dimensions are device-pixel-ratio aware, capped at DPR 2.
- Moon geometry is calculated in CSS pixels, so the subject stays circular even
  though monospace cells are taller than they are wide.
- The random star field uses a fixed seed, making recomposition deterministic
  for the same grid dimensions.
- A debounced resize rebuilds the grid, moon composition, and star field.
- Animation pauses while the document is hidden and resumes when visible.
- A `prefers-reduced-motion` change switches between the loop and a static
  frame.
- The returned cleanup function removes listeners and cancels the frame, even
  though the current one-page lifecycle never needs to call it.

## Build and deployment

```mermaid
flowchart LR
  change["Pull request / push"]
  ci["CI<br/>pnpm install → astro check → build"]
  main["Push to main"]
  astro["Astro static build<br/>compressed HTML + inlined styles"]
  sentry["Sentry release<br/>hidden source maps uploaded<br/>maps removed from dist"]
  wrangler["Wrangler deploy"]
  worker["me Worker<br/>me.krmznkr.com"]

  change --> ci
  ci --> main --> astro --> sentry --> wrangler --> worker
```

The `site` value in `astro.config.mjs` supplies canonical URL generation.
`workers_dev` is disabled, so the site is exposed only at its custom domain.
The shared platform Terraform redirects `krmznkr.com` to that domain.

### Configuration and secrets

| Value | Purpose | Exposure |
| --- | --- | --- |
| `SENTRY_AUTH_TOKEN` | Release creation and source-map upload | GitHub Actions build only |
| `SENTRY_RELEASE` | Commit-SHA release name | Build-time metadata |
| `CLOUDFLARE_API_TOKEN` | Wrangler authentication | GitHub Actions only |
| Sentry DSN | Browser ingestion | Public identifier in bundle |
| PostHog project token | Browser ingestion | Public identifier in bundle |

Local builds normally receive none of the secret build variables, so they
generate no Sentry release and no source maps.

## Observability boundary

Sentry initializes only in production and captures browser errors and sampled
traces; session replay is disabled. PostHog uses its slim browser build with
persistence, identification, autocapture, recording, heatmaps, surveys, and
feature flags disabled. Current and referrer URLs are reduced to origin plus
pathname.

The only custom event is `outbound_link_clicked`. It sends one static
`destination` label (`github`, `julian`, `life`, or `source`) from an explicitly
tagged anchor; it does not send link text or URL as a custom property. See
[`observability.md`](observability.md) for the complete controls and runbooks.

## Failure behavior

| Failure | Result |
| --- | --- |
| JavaScript disabled or canvas unavailable | All text and links remain; the decorative scene is absent |
| Web font load fails | Canvas measures and renders with its monospace fallback |
| Reduced motion requested | One static character-art frame |
| Tab hidden | Animation frame loop pauses |
| Sentry/PostHog unavailable | Page and canvas continue |
| Deploy workflow fails | Previous Cloudflare Worker deployment remains active |

## Where to change things

| Change | Primary files |
| --- | --- |
| Copy, links, metadata, layout, styling | `src/pages/index.astro` |
| Moon, star, noise, motion, and responsive composition | `src/scripts/nocturne.ts` |
| Error/performance monitoring | `src/scripts/sentry.ts` |
| Traffic and outbound-link analytics | `src/scripts/posthog.ts` |
| Build output and source maps | `astro.config.mjs` |
| Custom-domain deployment | `wrangler.jsonc`, `.github/workflows/deploy.yml` |
