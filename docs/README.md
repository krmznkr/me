# Documentation index

`me` is a small static Astro site. The documentation stays intentionally
compact while still covering the character-art renderer, privacy boundary,
deployment, maintenance workflow, and known gaps.

```mermaid
flowchart LR
  readme["README<br/>design + quick start"]
  dev["Development<br/>content, canvas, checks"]
  architecture["Architecture<br/>render and delivery flows"]
  observability["Observability<br/>minimal telemetry"]
  roadmap["Roadmap<br/>quality gaps"]

  readme --> dev
  readme --> architecture
  architecture --> observability
  architecture --> roadmap

  classDef entry fill:#dbeafe,stroke:#2563eb,color:#172554,stroke-width:2px
  classDef howto fill:#dcfce7,stroke:#16a34a,color:#14532d
  classDef explain fill:#ede9fe,stroke:#7c3aed,color:#3b0764
  classDef action fill:#fef3c7,stroke:#d97706,color:#78350f
  class readme entry
  class dev howto
  class architecture,observability explain
  class roadmap action
```

| Document | Use it when |
| --- | --- |
| [`../README.md`](../README.md) | You need the design intent, quick start, or deployment summary |
| [`development.md`](development.md) | You are changing copy, links, rendering, metadata, or build configuration |
| [`architecture.md`](architecture.md) | You need page composition, the Nocturne pipeline, delivery, or failure behavior |
| [`observability.md`](observability.md) | You are verifying minimized Sentry/PostHog behavior or rotating release credentials |
| [`roadmap.md`](roadmap.md) | You need the current quality and maintenance gaps |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | You are preparing a change |
| [`../SECURITY.md`](../SECURITY.md) | You need to report a vulnerability privately |
