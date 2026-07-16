# me

A single, quiet homepage for the `krmznkr` identity: a full-stack software
engineer based in Berlin. It renders a monochrome, ordered-dithered pixel-art
fog field on an HTML canvas and links out to open-source work.

Live at [`me.krmznkr.com`](https://me.krmznkr.com).

## Design

- **Monochrome pixel art.** The background is computed at a low resolution,
  passed through an 8×8 Bayer matrix so a few gray levels read as a flowing
  gradient, then blitted to the screen with smoothing disabled so every pixel
  stays crisp. See [`src/scripts/dither-field.ts`](src/scripts/dither-field.ts).
- **Every aspect ratio.** The canvas is DPR-aware and re-tiles on resize; the
  layout is fluid from tall phones to ultrawide displays.
- **Calm by default.** The greeting types itself out, but respects
  `prefers-reduced-motion` and pauses when the tab is hidden. With JavaScript
  off, the full text is still present in the HTML.

Built with [Astro](https://astro.build) and Geist Mono. Ships almost no
JavaScript — just the canvas engine and the typewriter.

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
GitHub Actions workflow (wrangler, using the `CLOUDFLARE_API_TOKEN` repository
secret).

## License

MIT
